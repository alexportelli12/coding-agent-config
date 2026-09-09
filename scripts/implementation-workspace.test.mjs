import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("./implementation-workspace.mjs", import.meta.url));

function run(command, args, { cwd, env, allowedExitCodes = [0] } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code) => {
      const result = { code, stdout, stderr };
      if (!allowedExitCodes.includes(code)) {
        reject(new Error(`${command} ${args.join(" ")} failed (${code})\n${stderr || stdout}`));
      } else {
        resolve(result);
      }
    });
  });
}

async function git(cwd, ...args) {
  return run("git", args, { cwd });
}

async function commit(cwd, filename, content, message) {
  await writeFile(path.join(cwd, filename), content);
  await git(cwd, "add", filename);
  await git(cwd, "commit", "--quiet", "-m", message);
  return (await git(cwd, "rev-parse", "HEAD")).stdout.trim();
}

async function createFixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "implementation-workspace-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const remote = path.join(root, "remote.git");
  const seed = path.join(root, "seed");
  const control = path.join(root, "control");
  const worktrees = path.join(root, "worktrees");

  await run("git", ["init", "--quiet", "--bare", remote]);
  await run("git", ["--git-dir", remote, "symbolic-ref", "HEAD", "refs/heads/trunk"]);
  await run("git", ["init", "--quiet", "--initial-branch=trunk", seed]);
  await git(seed, "config", "user.name", "Workspace Test");
  await git(seed, "config", "user.email", "workspace@example.test");
  await commit(seed, "README.md", "initial\n", "initial");
  await git(seed, "remote", "add", "origin", remote);
  await git(seed, "push", "--quiet", "--set-upstream", "origin", "trunk");
  await run("git", ["clone", "--quiet", remote, control]);
  await git(control, "config", "user.name", "Workspace Test");
  await git(control, "config", "user.email", "workspace@example.test");
  return { root, remote, seed, control, worktrees };
}

async function lifecycle(fixture, cwd, operation, options = {}, allowedExitCodes = [0]) {
  const args = [cli, operation];
  for (const [key, value] of Object.entries(options)) args.push(`--${key}`, value);
  const result = await run(process.execPath, args, {
    cwd,
    env: { OPENCODE_WORKTREE_ROOT: fixture.worktrees },
    allowedExitCodes,
  });
  return {
    ...result,
    json: result.code === 0 ? JSON.parse(result.stdout) : null,
  };
}

async function recordEvidence(fixture, prepared) {
  return lifecycle(
    fixture,
    prepared.json.worktreePath,
    "record-evidence",
    { session: prepared.json.sessionId },
  );
}

async function advanceRemote(fixture, filename = "upstream.txt") {
  const sha = await commit(fixture.seed, filename, `${Date.now()}\n`, `update ${filename}`);
  await git(fixture.seed, "push", "--quiet", "origin", "trunk");
  return sha;
}

test("prepares independent worktrees from an up-to-date custom default branch", async (t) => {
  const fixture = await createFixture(t);
  const [first, second] = await Promise.all([
    lifecycle(fixture, fixture.control, "prepare", { slug: "first change" }),
    lifecycle(fixture, fixture.control, "prepare", { slug: "second change" }),
  ]);

  assert.notEqual(first.json.sessionId, second.json.sessionId);
  assert.notEqual(first.json.branch, second.json.branch);
  assert.notEqual(first.json.worktreePath, second.json.worktreePath);
  assert.equal(first.json.defaultBranch, "trunk");
  assert.equal((await git(fixture.control, "branch", "--show-current")).stdout.trim(), "trunk");
  assert.equal((await git(first.json.worktreePath, "branch", "--show-current")).stdout.trim(), first.json.branch);
  assert.equal((await git(second.json.worktreePath, "branch", "--show-current")).stdout.trim(), second.json.branch);
});

test("fast-forwards a clean behind control branch before creating the worktree", async (t) => {
  const fixture = await createFixture(t);
  const latest = await advanceRemote(fixture);
  const prepared = await lifecycle(fixture, fixture.control, "prepare", { slug: "behind base" });

  assert.equal((await git(fixture.control, "rev-parse", "HEAD")).stdout.trim(), latest);
  assert.equal(prepared.json.baseSha, latest);
  assert.equal((await git(prepared.json.worktreePath, "rev-parse", "HEAD")).stdout.trim(), latest);
});

test("refuses diverged default-branch history without changing it", async (t) => {
  const fixture = await createFixture(t);
  await commit(fixture.control, "local.txt", "local\n", "local default work");
  const localSha = (await git(fixture.control, "rev-parse", "HEAD")).stdout.trim();
  await advanceRemote(fixture);

  const result = await lifecycle(
    fixture,
    fixture.control,
    "prepare",
    { slug: "unsafe base" },
    [2],
  );
  assert.match(result.stderr, /default branch is diverged/);
  assert.equal((await git(fixture.control, "rev-parse", "HEAD")).stdout.trim(), localSha);
});

test("refuses and preserves dirty control state", async (t) => {
  const fixture = await createFixture(t);
  const dirtyPath = path.join(fixture.control, "notes.txt");
  await writeFile(dirtyPath, "user work\n");

  const result = await lifecycle(
    fixture,
    fixture.control,
    "prepare",
    { slug: "dirty control" },
    [2],
  );
  assert.match(result.stderr, /control worktree contains uncommitted or untracked work/);
  assert.equal(await readFile(dirtyPath, "utf8"), "user work\n");
});

test("rebases session-owned unpublished commits when the default branch advances", async (t) => {
  const fixture = await createFixture(t);
  const prepared = await lifecycle(fixture, fixture.control, "prepare", { slug: "rebase feature" });
  const oldFeatureSha = await commit(prepared.json.worktreePath, "feature.txt", "feature\n", "feature");
  const latest = await advanceRemote(fixture);

  const synchronized = await lifecycle(
    fixture,
    prepared.json.worktreePath,
    "sync",
    { session: prepared.json.sessionId },
  );
  const newFeatureSha = (await git(prepared.json.worktreePath, "rev-parse", "HEAD")).stdout.trim();
  assert.equal(synchronized.json.strategy, "rebase");
  assert.equal(synchronized.json.requiresRevalidation, true);
  assert.notEqual(newFeatureSha, oldFeatureSha);
  await git(prepared.json.worktreePath, "merge-base", "--is-ancestor", latest, newFeatureSha);
  assert.equal(await readFile(path.join(prepared.json.worktreePath, "feature.txt"), "utf8"), "feature\n");
});

test("refuses synchronization from the wrong session and preserves both worktrees", async (t) => {
  const fixture = await createFixture(t);
  const first = await lifecycle(fixture, fixture.control, "prepare", { slug: "owner one" });
  const second = await lifecycle(fixture, fixture.control, "prepare", { slug: "owner two" });
  const secondHead = (await git(second.json.worktreePath, "rev-parse", "HEAD")).stdout.trim();

  const result = await lifecycle(
    fixture,
    second.json.worktreePath,
    "sync",
    { session: first.json.sessionId },
    [2],
  );
  assert.match(result.stderr, /session token does not own/);
  assert.equal((await git(first.json.worktreePath, "status", "--porcelain")).stdout, "");
  assert.equal((await git(second.json.worktreePath, "rev-parse", "HEAD")).stdout.trim(), secondHead);
});

test("refuses to rewrite a branch published outside the owning lifecycle", async (t) => {
  const fixture = await createFixture(t);
  const prepared = await lifecycle(fixture, fixture.control, "prepare", { slug: "external publish" });
  await commit(prepared.json.worktreePath, "feature.txt", "feature\n", "feature");
  await git(prepared.json.worktreePath, "push", "--quiet", "origin", prepared.json.branch);
  const featureHead = (await git(prepared.json.worktreePath, "rev-parse", "HEAD")).stdout.trim();
  await advanceRemote(fixture);

  const result = await lifecycle(
    fixture,
    prepared.json.worktreePath,
    "sync",
    { session: prepared.json.sessionId },
    [2],
  );
  assert.match(result.stderr, /published outside this session/);
  assert.equal((await git(prepared.json.worktreePath, "rev-parse", "HEAD")).stdout.trim(), featureHead);
});

test("refuses and preserves dirty implementation state during synchronization", async (t) => {
  const fixture = await createFixture(t);
  const prepared = await lifecycle(fixture, fixture.control, "prepare", { slug: "dirty feature" });
  const dirtyPath = path.join(prepared.json.worktreePath, "feature.txt");
  await writeFile(dirtyPath, "unfinished\n");
  await advanceRemote(fixture);

  const result = await lifecycle(
    fixture,
    prepared.json.worktreePath,
    "sync",
    { session: prepared.json.sessionId },
    [2],
  );
  assert.match(result.stderr, /implementation worktree contains uncommitted or untracked work/);
  assert.equal(await readFile(dirtyPath, "utf8"), "unfinished\n");
});

test("refuses rewritten upstream default-branch history", async (t) => {
  const fixture = await createFixture(t);
  const prepared = await lifecycle(fixture, fixture.control, "prepare", { slug: "rewritten upstream" });
  await commit(prepared.json.worktreePath, "feature.txt", "feature\n", "feature");
  await git(fixture.seed, "checkout", "--quiet", "--orphan", "replacement");
  await git(fixture.seed, "rm", "--quiet", "-rf", ".");
  await commit(fixture.seed, "replacement.txt", "replacement\n", "replacement root");
  await git(fixture.seed, "push", "--quiet", "--force", "origin", "HEAD:trunk");

  const featureHead = (await git(prepared.json.worktreePath, "rev-parse", "HEAD")).stdout.trim();
  const result = await lifecycle(
    fixture,
    prepared.json.worktreePath,
    "sync",
    { session: prepared.json.sessionId },
    [2],
  );
  assert.match(result.stderr, /default branch history was rewritten/);
  assert.equal((await git(prepared.json.worktreePath, "rev-parse", "HEAD")).stdout.trim(), featureHead);
});

test("aborts a conflicting synchronization and restores the implementation branch", async (t) => {
  const fixture = await createFixture(t);
  const prepared = await lifecycle(fixture, fixture.control, "prepare", { slug: "conflicting sync" });
  const featureHead = await commit(
    prepared.json.worktreePath,
    "README.md",
    "feature version\n",
    "change readme in feature",
  );
  await commit(fixture.seed, "README.md", "upstream version\n", "change readme upstream");
  await git(fixture.seed, "push", "--quiet", "origin", "trunk");

  const result = await lifecycle(
    fixture,
    prepared.json.worktreePath,
    "sync",
    { session: prepared.json.sessionId },
    [2],
  );
  assert.match(result.stderr, /operation was aborted/);
  assert.equal((await git(prepared.json.worktreePath, "rev-parse", "HEAD")).stdout.trim(), featureHead);
  assert.equal((await git(prepared.json.worktreePath, "status", "--porcelain")).stdout, "");
  assert.equal(await readFile(path.join(prepared.json.worktreePath, "README.md"), "utf8"), "feature version\n");
});

test("merges current default history into a workflow-published follow-up branch", async (t) => {
  const fixture = await createFixture(t);
  const prepared = await lifecycle(fixture, fixture.control, "prepare", { slug: "published followup" });
  await commit(prepared.json.worktreePath, "feature.txt", "feature\n", "feature");
  await recordEvidence(fixture, prepared);
  const published = await lifecycle(
    fixture,
    prepared.json.worktreePath,
    "publish",
    { session: prepared.json.sessionId },
  );
  assert.equal(published.json.published, true);
  const marked = await lifecycle(
    fixture,
    prepared.json.worktreePath,
    "mark-pr",
    { session: prepared.json.sessionId, url: "https://example.test/pull/1" },
  );
  assert.equal(marked.json.state, "pr-open");
  const worktreeList = (await git(fixture.control, "worktree", "list", "--porcelain")).stdout;
  assert.match(worktreeList, new RegExp(`worktree ${prepared.json.worktreePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  assert.match(worktreeList, /locked OpenCode implementation/);
  const latest = await advanceRemote(fixture);

  const synchronized = await lifecycle(
    fixture,
    prepared.json.worktreePath,
    "sync",
    { session: prepared.json.sessionId },
  );
  assert.equal(synchronized.json.strategy, "merge");
  assert.equal(synchronized.json.requiresRevalidation, true);
  await git(prepared.json.worktreePath, "merge-base", "--is-ancestor", latest, "HEAD");
  const parents = (await git(prepared.json.worktreePath, "show", "-s", "--format=%P", "HEAD"))
    .stdout.trim().split(" ");
  assert.equal(parents.length, 2);
});

test("publish stops before pushing when a final synchronization changes the tree", async (t) => {
  const fixture = await createFixture(t);
  const prepared = await lifecycle(fixture, fixture.control, "prepare", { slug: "publish guard" });
  await commit(prepared.json.worktreePath, "feature.txt", "feature\n", "feature");
  await recordEvidence(fixture, prepared);
  await advanceRemote(fixture);

  const result = await lifecycle(
    fixture,
    prepared.json.worktreePath,
    "publish",
    { session: prepared.json.sessionId },
  );
  assert.equal(result.json.published, false);
  assert.equal(result.json.requiresRevalidation, true);
  assert.equal(result.json.requiresEvidence, true);
  const retry = await lifecycle(
    fixture,
    prepared.json.worktreePath,
    "publish",
    { session: prepared.json.sessionId },
  );
  assert.equal(retry.json.published, false);
  assert.equal(retry.json.requiresEvidence, true);
  assert.notEqual(await run("git", ["--git-dir", fixture.remote, "show-ref", "--verify", `refs/heads/${prepared.json.branch}`], {
    allowedExitCodes: [0, 1, 128],
  }).then(({ code }) => code), 0);

  await recordEvidence(fixture, prepared);
  const published = await lifecycle(
    fixture,
    prepared.json.worktreePath,
    "publish",
    { session: prepared.json.sessionId },
  );
  assert.equal(published.json.published, true);
});

test("checks and publishes against a distinct configured push URL", async (t) => {
  const fixture = await createFixture(t);
  const fork = path.join(fixture.root, "fork.git");
  await run("git", ["init", "--quiet", "--bare", fork]);
  await git(fixture.control, "remote", "set-url", "--add", "--push", "origin", fork);
  const prepared = await lifecycle(fixture, fixture.control, "prepare", { slug: "triangular workflow" });
  await commit(prepared.json.worktreePath, "feature.txt", "feature\n", "feature");
  await recordEvidence(fixture, prepared);

  const published = await lifecycle(
    fixture,
    prepared.json.worktreePath,
    "publish",
    { session: prepared.json.sessionId },
  );
  assert.equal(published.json.published, true);
  assert.equal(await run("git", ["--git-dir", fork, "show-ref", "--verify", `refs/heads/${prepared.json.branch}`], {
    allowedExitCodes: [0, 1, 128],
  }).then(({ code }) => code), 0);
  assert.notEqual(await run("git", ["--git-dir", fixture.remote, "show-ref", "--verify", `refs/heads/${prepared.json.branch}`], {
    allowedExitCodes: [0, 1, 128],
  }).then(({ code }) => code), 0);
});

test("canonicalizes a relative remote for the external worktree", async (t) => {
  const fixture = await createFixture(t);
  await git(fixture.control, "remote", "set-url", "origin", "../remote.git");
  const prepared = await lifecycle(fixture, fixture.control, "prepare", { slug: "relative remote" });
  await commit(prepared.json.worktreePath, "feature.txt", "feature\n", "feature");
  await recordEvidence(fixture, prepared);

  const published = await lifecycle(
    fixture,
    prepared.json.worktreePath,
    "publish",
    { session: prepared.json.sessionId },
  );
  assert.equal(published.json.published, true);
  assert.equal(await run("git", ["--git-dir", fixture.remote, "show-ref", "--verify", `refs/heads/${prepared.json.branch}`], {
    allowedExitCodes: [0, 1, 128],
  }).then(({ code }) => code), 0);
});

test("redacts credentials and query values from remote failure diagnostics", async (t) => {
  const fixture = await createFixture(t);
  await git(
    fixture.control,
    "remote",
    "set-url",
    "origin",
    "https://user:secret@127.0.0.1:9/repository.git?token=hidden",
  );

  const result = await lifecycle(
    fixture,
    fixture.control,
    "prepare",
    { slug: "redacted remote" },
    [2],
  );
  assert.doesNotMatch(result.stderr, /secret|hidden/);
  assert.match(result.stderr, /redacted/);
});

test("retains pending ownership when the remote ref changes during publication", async (t) => {
  const fixture = await createFixture(t);
  const prepared = await lifecycle(fixture, fixture.control, "prepare", { slug: "ambiguous push" });
  const featureHead = await commit(prepared.json.worktreePath, "feature.txt", "feature\n", "feature");
  await recordEvidence(fixture, prepared);
  const hook = path.join(fixture.remote, "hooks", "post-receive");
  await writeFile(hook, `#!/bin/sh
while read old new ref; do
  case "$ref" in
    refs/heads/opencode/*)
      git update-ref "$ref" "$(git rev-parse refs/heads/trunk)" "$new"
      ;;
  esac
done
`);
  await chmod(hook, 0o755);

  const result = await lifecycle(
    fixture,
    prepared.json.worktreePath,
    "publish",
    { session: prepared.json.sessionId },
    [2],
  );
  assert.match(result.stderr, /publication outcome is ambiguous/);
  assert.equal((await git(prepared.json.worktreePath, "rev-parse", "HEAD")).stdout.trim(), featureHead);

  const retry = await lifecycle(
    fixture,
    prepared.json.worktreePath,
    "sync",
    { session: prepared.json.sessionId },
    [2],
  );
  assert.match(retry.stderr, /incomplete publication operation/);
});
