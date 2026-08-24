import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runChecks } from "./verify.mjs";

const runner = fileURLToPath(new URL("./verify.mjs", import.meta.url));

function shellQuote(value) {
  if (process.platform === "win32") {
    return `"${value.replaceAll('"', '\\"')}"`;
  }
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function commandFor(script, ...args) {
  return [process.execPath, script, ...args].map(shellQuote).join(" ");
}

async function runRunner(root, checks) {
  const args = checks.flatMap(({ name, command }) => ["--check", name, command]);
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [runner, ...args], {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("close", (code, signal) => resolve({ code, signal, stdout, stderr }));
  });
}

async function createFixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "verify-runner-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const fixture = path.join(root, "fixture.cjs");
  await writeFile(fixture, `
const fs = require("node:fs");
const [mode, value, marker] = process.argv.slice(2);
if (marker) fs.appendFileSync(marker, value + "\\n");
if (mode === "expect" && value !== "value with spaces") {
  process.stderr.write("argument was split\\n");
  process.exitCode = 8;
} else if (mode === "fail") {
  process.stdout.write("failure stdout\\n");
  process.stderr.write("failure stderr\\n");
  process.exitCode = 7;
} else {
  process.stdout.write("success stdout " + value + "\\n");
  process.stderr.write("success stderr " + value + "\\n");
}
`);
  return { root, fixture };
}

test("runs every check sequentially and suppresses successful command output", async (t) => {
  const { root, fixture } = await createFixture(t);
  const result = await runRunner(root, [
    { name: "format", command: commandFor(fixture, "success", "one") },
    { name: "test", command: commandFor(fixture, "success", "two") },
  ]);

  assert.equal(result.code, 0);
  assert.match(result.stdout, /✓ format/);
  assert.match(result.stdout, /✓ test/);
  assert.match(result.stdout, /VERIFY PASSED - 2\/2 checks successful/);
  assert.doesNotMatch(result.stdout + result.stderr, /success stdout|success stderr/);
});

test("exposes failed diagnostics, preserves the exit code, and fails fast", async (t) => {
  const { root, fixture } = await createFixture(t);
  const marker = path.join(root, "later-check-ran");
  const result = await runRunner(root, [
    { name: "format", command: commandFor(fixture, "success", "format") },
    { name: "lint", command: commandFor(fixture, "fail", "lint") },
    { name: "test", command: commandFor(fixture, "success", "test", marker) },
  ]);

  assert.equal(result.code, 7);
  assert.match(result.stderr, /Failed check: lint/);
  assert.match(result.stderr, /Command: /);
  assert.match(result.stderr, /Exit code: 7/);
  assert.match(result.stderr, /failure stdout/);
  assert.match(result.stderr, /failure stderr/);
  assert.doesNotMatch(result.stdout + result.stderr, /success stdout format/);
  assert.doesNotMatch(result.stdout + result.stderr, /success stdout test/);
  await assert.rejects(() => access(marker));
});

test("passes command arguments containing spaces as one command string", async (t) => {
  const { root, fixture } = await createFixture(t);
  const result = await runRunner(root, [
    { name: "argument check", command: commandFor(fixture, "expect", "value with spaces") },
  ]);

  assert.equal(result.code, 0);
  assert.match(result.stdout, /✓ argument check/);
  assert.doesNotMatch(result.stdout + result.stderr, /success stdout/);
});

test("reports process-spawn errors without throwing", async (t) => {
  const { root } = await createFixture(t);
  const originalWrite = process.stderr.write;
  let output = "";
  process.stderr.write = (chunk) => {
    output += chunk;
    return true;
  };

  let result;
  try {
    result = await runChecks(
      [{ name: "missing cwd", command: "node -e noop" }],
      { cwd: path.join(root, "missing") },
    );
  } finally {
    process.stderr.write = originalWrite;
  }

  assert.equal(result.exitCode, 1);
  assert.match(output, /Failed check: missing cwd/);
  assert.match(output, /Spawn error:/);
});
