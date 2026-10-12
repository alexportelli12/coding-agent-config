#!/usr/bin/env node
import assert from "node:assert/strict";
import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { syncAgents } from "./generate-claude-agents.mjs";
import { links } from "./install.mjs";
import { syncCodex } from "./generate-codex.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));

export async function check(base = root) {
  await syncAgents(base);
  await syncCodex(base);
  const config = JSON.parse(await readFile(path.join(base, "opencode.json"), "utf8"));
  const claude = JSON.parse(await readFile(path.join(base, "claude/agents.json"), "utf8"));
  const codex = JSON.parse(await readFile(path.join(base, "codex/agents.json"), "utf8"));
  assert.deepEqual(Object.keys(codex).sort(), Object.keys(claude).sort(), "each shared agent must have a Codex adapter");
  assert.equal(codex["code-reviewer"].sandbox_mode, "read-only");
  assert.deepEqual(
    (await readdir(path.join(base, "agent"))).filter((name) => name.endsWith(".md")).sort(),
    Object.keys(claude).map((name) => `${name}.md`).sort(),
    "each shared agent must have a Claude Code adapter",
  );
  assert.deepEqual(Object.keys(config.agent).filter((name) => name in claude).sort(), Object.keys(claude).sort());
  for (const name of Object.keys(claude)) {
    assert.equal(config.agent[name].prompt, `{file:./agent/${name}.md}`);
    assert.equal(config.agent[name].mode, "subagent");
    assert.equal(config.agent[name].description, claude[name].description);
    assert.equal(codex[name].description, claude[name].description);
    const body = await readFile(path.join(base, "agent", `${name}.md`), "utf8");
    assert.doesNotMatch(body, /(?:openai|opencode-go)\/[a-z0-9.-]+/i);
  }
  for (const name of await readdir(path.join(base, "commands"))) {
    if (!name.endsWith(".md")) continue;
    const text = await readFile(path.join(base, "commands", name), "utf8");
    assert.match(text, /^---\ndescription: [^\n]+\n---\n/);
    assert.match(text, /\$ARGUMENTS/, `command ${name} lost argument substitution`);
    assert.doesNotMatch(text, /(?:openai|opencode-go)\/[a-z0-9.-]+/i);
  }
  for (const name of await readdir(path.join(base, "skills"))) {
    const file = path.join(base, "skills", name, "SKILL.md");
    const text = await readFile(file, "utf8").catch((error) => {
      if (error.code === "ENOENT" || error.code === "ENOTDIR") return null;
      throw error;
    });
    if (text) {
      assert.doesNotMatch(text, /opencode\/autoinvoke/);
      assert.doesNotMatch(text, /(?:openai|opencode-go)\/[a-z0-9.-]+/i);
    }
  }
  const installation = await links({ checkout: base });
  assert.equal(new Set(installation.map(([destination]) => destination)).size, installation.length, "installation destinations must be unique");
  for (const [destination, source] of installation) {
    assert.ok(destination && source);
    await access(source);
  }
  if (process.platform !== "win32") {
    assert.ok((await stat(path.join(base, "scripts/implementation-workspace"))).mode & 0o111, "implementation-workspace is not executable");
  }
  const pkg = JSON.parse(await readFile(path.join(base, "package.json"), "utf8"));
  assert.equal(pkg.scripts.verify, "verifika --all", "npm run verify must run every Verifika check");
  assert.match(pkg.devDependencies?.verifika ?? "", /^\d+\.\d+\.\d+$/, "Verifika must be pinned to an exact version");
  const verifika = JSON.parse(await readFile(path.join(base, "verifika.config.json"), "utf8"));
  assert.ok((verifika.defaults?.concurrency ?? 1) === 1, "Verifika checks run sequentially until concurrency is shown to be safe");
  // A test file no check names would silently drop out of the delivery gate.
  const commands = Object.values(verifika.checks).map((entry) => entry.command);
  const tests = [
    ...(await readdir(path.join(base, "scripts"))).filter((name) => name.endsWith(".test.mjs")).map((name) => `scripts/${name}`),
    ...(await readdir(path.join(base, "skills/repo-context/tests"))).filter((name) => name.endsWith(".test.js")).map((name) => `skills/repo-context/tests/${name}`),
  ];
  for (const test of tests) {
    assert.ok(commands.some((command) => command.split(/\s+/).includes(test)), `${test} is not run by any Verifika check`);
  }
  assert.ok(!JSON.stringify(config).includes("verify-env"), "OpenCode must not own the shared PATH");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await check();
    process.stdout.write("Configuration integration passed\n");
  } catch (error) {
    process.stderr.write(`Configuration integration failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
