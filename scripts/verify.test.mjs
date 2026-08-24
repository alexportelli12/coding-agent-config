import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runChecks } from "./verify.mjs";

const runner = fileURLToPath(new URL("./verify.mjs", import.meta.url));

async function runRunner(root, checks) {
  const args = checks.flatMap(({ name, script }) => ["--check", name, script]);
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
const [mode, value] = process.argv.slice(2);
if (mode === "mark") {
  fs.writeFileSync("later-check-ran", value);
} else if (mode === "fail") {
  process.stdout.write("failure stdout\\n");
  process.stderr.write("failure stderr\\n");
  process.exitCode = 7;
} else {
  process.stdout.write("success stdout " + value + "\\n");
  process.stderr.write("success stderr " + value + "\\n");
}
`);
  await writeFile(
    path.join(root, "package.json"),
    JSON.stringify({
      private: true,
      scripts: {
        format: "node fixture.cjs success format",
        lint: "node fixture.cjs fail lint",
        test: "node fixture.cjs success test",
        "later-check": "node fixture.cjs mark later-check",
        "argument-check": "node fixture.cjs success argument",
      },
    }),
  );
  return { root };
}

test("runs every check sequentially and suppresses successful command output", async (t) => {
  const { root } = await createFixture(t);
  const result = await runRunner(root, [
    { name: "format", script: "format" },
    { name: "test", script: "test" },
  ]);

  assert.equal(result.code, 0);
  assert.match(result.stdout, /✓ format/);
  assert.match(result.stdout, /✓ test/);
  assert.match(result.stdout, /VERIFY PASSED - 2\/2 checks successful/);
  assert.doesNotMatch(result.stdout + result.stderr, /success stdout|success stderr/);
});

test("exposes failed diagnostics, preserves the exit code, and fails fast", async (t) => {
  const { root } = await createFixture(t);
  const result = await runRunner(root, [
    { name: "format", script: "format" },
    { name: "lint", script: "lint" },
    { name: "test", script: "later-check" },
  ]);

  assert.equal(result.code, 7);
  assert.match(result.stderr, /Failed check: lint/);
  assert.match(result.stderr, /Command: npm run lint/);
  assert.match(result.stderr, /Exit code: 7/);
  assert.match(result.stderr, /failure stdout/);
  assert.match(result.stderr, /failure stderr/);
  assert.doesNotMatch(result.stdout + result.stderr, /success stdout format/);
  assert.doesNotMatch(result.stdout + result.stderr, /later-check/);
  await assert.rejects(() => access(path.join(root, "later-check-ran")));
});

test("executes a repository-owned npm script by name", async (t) => {
  const { root } = await createFixture(t);
  const result = await runRunner(root, [
    { name: "argument check", script: "argument-check" },
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
      [{ name: "missing cwd", script: "missing" }],
      { cwd: path.join(root, "missing") },
    );
  } finally {
    process.stderr.write = originalWrite;
  }

  assert.equal(result.exitCode, 1);
  assert.match(output, /Failed check: missing cwd/);
  assert.match(output, /Spawn error:/);
});
