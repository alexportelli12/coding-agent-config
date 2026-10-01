import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cp, lstat, mkdir, mkdtemp, readFile, symlink, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { install } from "./install.mjs";
import { check } from "./check-config.mjs";
import { syncCodex } from "./generate-codex.mjs";

const checkout = fileURLToPath(new URL("../", import.meta.url));

function execute(command, args, cwd, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (data) => { output += data; });
    child.stderr.on("data", (data) => { output += data; });
    child.once("error", reject);
    child.once("close", (code) => resolve({ code, output }));
  });
}

test("shared setup is idempotent and exposes npm verification in an application", async (t) => {
  const home = await mkdtemp(path.join(os.tmpdir(), "coding-agent-install-"));
  t.after(() => rm(home, { recursive: true, force: true }));
  const options = { home, checkout, hookDirectory: path.join(home, "git-hooks") };
  assert.ok((await install(options)).created > 0);
  assert.equal((await install(options)).created, 0);
  await install({ ...options, check: true });
  const app = path.join(home, "app");
  // Install above creates only the parent, not an application repository.
  await mkdir(app);
  await writeFile(path.join(app, "package.json"), JSON.stringify({
    scripts: { verify: "verify-runner --check smoke smoke", smoke: "node -e \"process.stdout.write('ok')\"" },
  }));
  const bin = path.join(home, ".local/bin");
  const result = await execute(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "verify"], app, {
    ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}`,
  });
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /VERIFY PASSED - 1\/1/);
  assert.match(await readFile(path.join(home, ".claude/CLAUDE.md"), "utf8"), /senior engineering deputy/);
  assert.equal(await readFile(path.join(home, ".codex/AGENTS.md"), "utf8"), await readFile(path.join(checkout, "AGENTS.md"), "utf8"));
  assert.equal(await readFile(path.join(home, ".agents/skills/workflow-for-alex/SKILL.md"), "utf8"), await readFile(path.join(checkout, "skills/workflow-for-alex/SKILL.md"), "utf8"));
  assert.match(await readFile(path.join(home, ".codex/agents/code-reviewer.toml"), "utf8"), /sandbox_mode = "read-only"/);
  assert.match(await readFile(path.join(home, ".agents/skills/workflow-implement/SKILL.md"), "utf8"), /implementation-workspace prepare/);
  assert.match(await readFile(path.join(home, ".agents/skills/workflow-implement/agents/openai.yaml"), "utf8"), /allow_implicit_invocation: false/);
  assert.match(await readFile(path.join(home, "git-hooks/post-merge"), "utf8"), /--after-merge/);
});

test("setup removes only dangling links it created for retired agents and skills", async (t) => {
  const home = await mkdtemp(path.join(os.tmpdir(), "coding-agent-stale-"));
  t.after(() => rm(home, { recursive: true, force: true }));
  const options = { home, checkout, hookDirectory: path.join(home, "git-hooks") };
  await install(options);
  const retired = path.join(home, ".claude/agents/retired.md");
  const retiredSkill = path.join(home, ".claude/skills/retired");
  const foreign = path.join(home, ".claude/agents/mine.md");
  const retiredCodex = path.join(home, ".codex/agents/retired.toml");
  const retiredCommand = path.join(home, ".agents/skills/workflow-retired");
  const foreignCodex = path.join(home, ".agents/skills/mine");
  await symlink(path.join(checkout, "claude/agents/retired.md"), retired);
  await symlink(path.join(checkout, "skills/retired"), retiredSkill);
  await symlink(path.join(home, "elsewhere.md"), foreign);
  await symlink(path.join(checkout, "codex/agents/retired.toml"), retiredCodex);
  await symlink(path.join(checkout, "codex/skills/workflow-retired"), retiredCommand);
  await symlink(path.join(home, "elsewhere"), foreignCodex);

  await assert.rejects(install({ ...options, check: true }), /retired\.md \(stale\)/);
  assert.equal((await install(options)).removed, 4);
  await assert.rejects(lstat(retired), /ENOENT/);
  await assert.rejects(lstat(retiredSkill), /ENOENT/);
  assert.ok((await lstat(foreign)).isSymbolicLink());
  await assert.rejects(lstat(retiredCodex), /ENOENT/);
  await assert.rejects(lstat(retiredCommand), /ENOENT/);
  assert.ok((await lstat(foreignCodex)).isSymbolicLink());
  await install({ ...options, check: true });
});

test("setup refuses conflicts without changing unrelated configuration", async (t) => {
  const home = await mkdtemp(path.join(os.tmpdir(), "coding-agent-conflict-"));
  t.after(() => rm(home, { recursive: true, force: true }));
  await mkdir(path.join(home, ".claude"));
  await writeFile(path.join(home, ".claude/CLAUDE.md"), "personal instructions");
  const hookDirectory = path.join(home, "git-hooks");
  await mkdir(hookDirectory);
  await writeFile(path.join(hookDirectory, "post-merge"), "my existing hook");
  await assert.rejects(install({ home, checkout, hookDirectory }), /existing configuration differs/);
  assert.equal(await readFile(path.join(home, ".claude/CLAUDE.md"), "utf8"), "personal instructions");
  assert.equal(await readFile(path.join(hookDirectory, "post-merge"), "utf8"), "my existing hook");
  await assert.rejects(readFile(path.join(home, ".config/opencode/opencode.json")), /ENOENT/);
});

test("Codex setup respects a custom home and preserves personal settings", async (t) => {
  const home = await mkdtemp(path.join(os.tmpdir(), "coding-agent-codex-"));
  t.after(() => rm(home, { recursive: true, force: true }));
  const codex = path.join(home, "profile");
  await mkdir(codex);
  const settings = '[tui]\nscreen_reader_detection_done = true\n';
  await writeFile(path.join(codex, "config.toml"), settings);
  await install({ home, checkout, codex });
  await install({ home, checkout, codex, check: true });
  assert.equal(await readFile(path.join(codex, "config.toml"), "utf8"), settings);
  assert.match(await readFile(path.join(codex, "AGENTS.md"), "utf8"), /senior engineering deputy/);
  await assert.rejects(lstat(path.join(home, ".codex")), /ENOENT/);
});

test("Codex conflicts stop the whole installation before any writes", async (t) => {
  for (const relative of [".codex/AGENTS.md", ".codex/agents/code-reviewer.toml", ".agents/skills/workflow-implement"]) {
    const home = await mkdtemp(path.join(os.tmpdir(), "coding-agent-codex-conflict-"));
    t.after(() => rm(home, { recursive: true, force: true }));
    const destination = path.join(home, relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, "personal configuration");
    await assert.rejects(install({ home, checkout }), /existing configuration differs/);
    assert.equal(await readFile(destination, "utf8"), "personal configuration");
    await assert.rejects(lstat(path.join(home, ".claude/CLAUDE.md")), /ENOENT/);
  }
});

test("a fast-forward pull invokes the installed post-merge hook", async (t) => {
  const home = await mkdtemp(path.join(os.tmpdir(), "coding-agent-pull-"));
  t.after(() => rm(home, { recursive: true, force: true }));
  const remote = path.join(home, "remote.git");
  const seed = path.join(home, "seed");
  const control = path.join(home, "control");
  const git = async (cwd, ...args) => {
    const result = await execute("git", args, cwd);
    assert.equal(result.code, 0, result.output);
  };
  await git(home, "init", "--quiet", "--bare", "--initial-branch=main", remote);
  await git(home, "init", "--quiet", "--initial-branch=main", seed);
  await git(seed, "config", "user.name", "Install Test");
  await git(seed, "config", "user.email", "install@example.test");
  await mkdir(path.join(seed, "scripts"));
  await writeFile(path.join(seed, "scripts/install.mjs"), "import { writeFileSync } from 'node:fs'; writeFileSync(process.env.HOOK_LOG, 'installed');\n");
  await git(seed, "add", ".");
  await git(seed, "commit", "--quiet", "-m", "initial");
  await git(seed, "remote", "add", "origin", remote);
  await git(seed, "push", "--quiet", "origin", "main");
  await git(home, "clone", "--quiet", remote, control);
  await install({ home: path.join(home, "user"), checkout, hookDirectory: path.join(control, ".git/hooks") });
  await writeFile(path.join(seed, "update.txt"), "new workflow\n");
  await git(seed, "add", ".");
  await git(seed, "commit", "--quiet", "-m", "update");
  await git(seed, "push", "--quiet", "origin", "main");
  const log = path.join(home, "hook-ran");
  const result = await execute("git", ["pull", "--ff-only"], control, { ...process.env, HOOK_LOG: log });
  assert.equal(result.code, 0, result.output);
  assert.equal(await readFile(log, "utf8"), "installed");
});

test("configuration checks canonical prompts and generated adapters", async () => {
  await check(checkout);
});

test("Codex generation keeps command bodies canonical and detects drift", async (t) => {
  const base = await mkdtemp(path.join(os.tmpdir(), "coding-agent-codex-generation-"));
  t.after(() => rm(base, { recursive: true, force: true }));
  for (const directory of ["agent", "commands", "codex"]) {
    await cp(path.join(checkout, directory), path.join(base, directory), { recursive: true });
  }
  await syncCodex(base);
  const command = await readFile(path.join(base, "commands/implement.md"), "utf8");
  const wrapper = await readFile(path.join(base, "codex/skills/workflow-implement/SKILL.md"), "utf8");
  assert.ok(wrapper.endsWith(command.replace(/^---\n[\s\S]*?\n---\n/, "")));
  await writeFile(path.join(base, "agent/code-reviewer.md"), "Updated canonical review instructions\n");
  await assert.rejects(syncCodex(base), /code-reviewer.toml is stale/);
  await syncCodex(base, true);
  await syncCodex(base);
  await writeFile(path.join(base, "commands/implement.md"), command + "\nUpdated command requirement\n");
  await assert.rejects(syncCodex(base), /workflow-implement\/SKILL.md is stale/);
  await syncCodex(base, true);
  await writeFile(path.join(base, "codex/agents/retired.toml"), "name = \"retired\"\n");
  await assert.rejects(syncCodex(base), /unexpected generated Codex files/);
});
