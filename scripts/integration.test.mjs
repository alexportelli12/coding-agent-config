import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { install } from "./install.mjs";
import { check } from "./check-config.mjs";

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
  const options = { home, checkout };
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
});

test("setup refuses conflicts without changing unrelated configuration", async (t) => {
  const home = await mkdtemp(path.join(os.tmpdir(), "coding-agent-conflict-"));
  t.after(() => rm(home, { recursive: true, force: true }));
  await mkdir(path.join(home, ".claude"));
  await writeFile(path.join(home, ".claude/CLAUDE.md"), "personal instructions");
  await assert.rejects(install({ home, checkout }), /existing configuration differs/);
  assert.equal(await readFile(path.join(home, ".claude/CLAUDE.md"), "utf8"), "personal instructions");
  await assert.rejects(readFile(path.join(home, ".config/opencode/opencode.json")), /ENOENT/);
});

test("configuration checks canonical prompts and generated adapters", async () => {
  await check(checkout);
});
