import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cp, lstat, mkdir, mkdtemp, readdir, readFile, symlink, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { install } from "./install.mjs";
import { check } from "./check-config.mjs";
import { syncCodex } from "./generate-codex.mjs";

const checkout = fileURLToPath(new URL("../", import.meta.url));
const verifikaCli = path.join(checkout, "node_modules/verifika/dist/cli.js");

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

test("shared setup is idempotent and installs the pinned Verifika skill", async (t) => {
  const home = await mkdtemp(path.join(os.tmpdir(), "coding-agent-install-"));
  t.after(() => rm(home, { recursive: true, force: true }));
  const options = { home, checkout, hookDirectory: path.join(home, "git-hooks") };
  assert.ok((await install(options)).created > 0);
  assert.equal((await install(options)).created, 0);
  await install({ ...options, check: true });
  const verifikaSkill = await readFile(path.join(checkout, "node_modules/verifika/skills/verifika/SKILL.md"), "utf8");
  assert.equal(await readFile(path.join(home, ".claude/skills/verifika/SKILL.md"), "utf8"), verifikaSkill);
  assert.equal(await readFile(path.join(home, ".agents/skills/verifika/SKILL.md"), "utf8"), verifikaSkill);
  assert.deepEqual(await readdir(path.join(home, ".local/bin")), [process.platform === "win32" ? "implementation-workspace.cmd" : "implementation-workspace"]);
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

test("setup retires verify-runner links it installed and keeps user-owned files", async (t) => {
  const home = await mkdtemp(path.join(os.tmpdir(), "coding-agent-retired-runner-"));
  t.after(() => rm(home, { recursive: true, force: true }));
  const options = { home, checkout, hookDirectory: path.join(home, "git-hooks") };
  const bin = path.join(home, ".local/bin");
  await mkdir(bin, { recursive: true });
  // What earlier versions installed: a POSIX link and a Windows wrapper.
  await symlink(path.join(checkout, "scripts/verify-runner"), path.join(bin, "verify-runner"));
  await writeFile(path.join(bin, "verify-runner.cmd"), `@echo off\r\nnode "${path.join(checkout, "scripts/verify.mjs")}" %*\r\n`);

  await assert.rejects(install({ ...options, check: true }), /verify-runner \(stale\)/);
  assert.equal((await install(options)).removed, 2);
  await assert.rejects(lstat(path.join(bin, "verify-runner")), /ENOENT/);
  await assert.rejects(lstat(path.join(bin, "verify-runner.cmd")), /ENOENT/);
  assert.equal((await install(options)).removed, 0);
  await install({ ...options, check: true });

  // Same names, but not ours: a personal script, an edited wrapper and a link elsewhere.
  await writeFile(path.join(bin, "verify-runner"), "#!/bin/sh\necho mine\n");
  await writeFile(path.join(bin, "verify-runner.cmd"), "@echo off\r\necho mine\r\n");
  await symlink(path.join(home, "elsewhere"), path.join(bin, "vfk"));
  // A personal link into the checkout is still the user's, even when dangling.
  await symlink(path.join(checkout, "node_modules/.bin/missing"), path.join(bin, "personal"));
  assert.equal((await install(options)).removed, 0);
  await install({ ...options, check: true });
  assert.ok((await lstat(path.join(bin, "personal"))).isSymbolicLink());
  assert.equal(await readFile(path.join(bin, "verify-runner"), "utf8"), "#!/bin/sh\necho mine\n");
  assert.equal(await readFile(path.join(bin, "verify-runner.cmd"), "utf8"), "@echo off\r\necho mine\r\n");
  assert.ok((await lstat(path.join(bin, "vfk"))).isSymbolicLink());
});

test("setup explains a missing Verifika install instead of linking a partial skill set", async (t) => {
  const base = await mkdtemp(path.join(os.tmpdir(), "coding-agent-no-modules-"));
  t.after(() => rm(base, { recursive: true, force: true }));
  for (const directory of ["agent", "claude", "codex", "commands", "scripts", "skills"]) {
    await cp(path.join(checkout, directory), path.join(base, directory), { recursive: true });
  }
  for (const file of ["AGENTS.md", "opencode.json"]) await cp(path.join(checkout, file), path.join(base, file));
  const home = path.join(base, "home");
  await assert.rejects(install({ home, checkout: base }), /node_modules.*missing; run npm ci/);
  await assert.rejects(lstat(home), /ENOENT/);
});

test("the repository verify script is Verifika's full run of every configured check", async () => {
  const pkg = JSON.parse(await readFile(path.join(checkout, "package.json"), "utf8"));
  assert.equal(pkg.scripts.verify, "verifika --all");
  const config = JSON.parse(await readFile(path.join(checkout, "verifika.config.json"), "utf8"));
  const result = await execute(process.execPath, [verifikaCli, "plan", "--all", "--mode", "json"], checkout);
  assert.equal(result.code, 0, result.output);
  const plan = JSON.parse(result.output);
  assert.deepEqual(plan.checks.filter((entry) => entry.selected).map((entry) => entry.name), Object.keys(config.checks));
  assert.deepEqual(plan.checks.find((entry) => entry.name === "integration").dependsOn, ["config"]);
});

test("Verifika reports passing and failing checks with persisted logs", async (t) => {
  const app = await mkdtemp(path.join(os.tmpdir(), "coding-agent-verifika-"));
  t.after(() => rm(app, { recursive: true, force: true }));
  const verifika = (...args) => execute(process.execPath, [verifikaCli, ...args, "--mode", "agent"], app);
  const configure = (checks) => writeFile(path.join(app, "verifika.config.json"), JSON.stringify({ version: 1, checks }));
  // Node keeps the commands portable across sh and cmd.exe.
  const node = (source) => `node -e "${source}"`;

  await configure({ smoke: { command: node("console.log('ok')") } });
  const passed = await verifika("--all");
  assert.equal(passed.code, 0, passed.output);
  assert.match(passed.output, /^PASS 1\/1 /);

  await configure({
    config: { command: node("console.error('generated agent is stale'); process.exit(3)") },
    integration: { command: node("console.log('ran')"), dependsOn: ["config"] },
  });
  const failed = await verifika("--all");
  assert.equal(failed.code, 1, failed.output);
  assert.match(failed.output, /^FAIL /);
  assert.match(failed.output, /config: exit 3/);
  assert.match(failed.output, /generated agent is stale/);
  assert.match(failed.output, /integration: dependency config did not pass/);
  assert.match(failed.output, /logs config/);
  const logs = await execute(process.execPath, [verifikaCli, "logs", "config"], app);
  assert.match(logs.output, /generated agent is stale/);
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

test("configuration rejects a verify gate that would skip tests", async (t) => {
  const base = await mkdtemp(path.join(os.tmpdir(), "coding-agent-gate-"));
  t.after(() => rm(base, { recursive: true, force: true }));
  for (const directory of ["agent", "claude", "codex", "commands", "scripts", "skills"]) {
    await cp(path.join(checkout, directory), path.join(base, directory), { recursive: true });
  }
  for (const file of ["AGENTS.md", "opencode.json", "package.json", "verifika.config.json"]) await cp(path.join(checkout, file), path.join(base, file));
  await symlink(path.join(checkout, "node_modules"), path.join(base, "node_modules"), process.platform === "win32" ? "junction" : undefined);
  await check(base);
  await writeFile(path.join(base, "scripts/retired.test.mjs"), "");
  await assert.rejects(check(base), /scripts\/retired\.test\.mjs is not run by any Verifika check/);
  await rm(path.join(base, "scripts/retired.test.mjs"));
  const pkg = JSON.parse(await readFile(path.join(base, "package.json"), "utf8"));
  await writeFile(path.join(base, "package.json"), JSON.stringify({ ...pkg, scripts: { ...pkg.scripts, verify: "verifika" } }));
  await assert.rejects(check(base), /npm run verify must run every Verifika check/);
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
