#!/usr/bin/env node

import { spawn } from "node:child_process";
import { constants as osConstants } from "node:os";
import { pathToFileURL } from "node:url";

const SIGNAL_EXIT_OFFSET = 128;
const npmExecutable = process.platform === "win32" ? "npm.cmd" : "npm";

export function parseChecks(args) {
  if (args.length === 0) {
    throw new Error("at least one --check <name> <npm-script> is required");
  }

  const checks = [];
  for (let index = 0; index < args.length; index += 3) {
    if (args[index] !== "--check") {
      throw new Error(`expected --check, received ${args[index] ?? "nothing"}`);
    }

    const name = args[index + 1];
    const script = args[index + 2];
    if (!name || !script) {
      throw new Error("each --check must include a name and npm script");
    }

    checks.push({ name, script });
  }

  return checks;
}

function signalExitCode(signal) {
  return SIGNAL_EXIT_OFFSET + (osConstants.signals[signal] ?? 1);
}

function executeCheck(check, options, setActiveChild) {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let settled = false;
    const child = spawn(npmExecutable, ["run", check.script], {
      cwd: options.cwd,
      env: options.env,
      stdio: ["inherit", "pipe", "pipe"],
    });
    setActiveChild(child);

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve({ stdout, stderr, ...result });
    };

    child.once("error", (error) => {
      finish({ error, code: null, signal: null, exitCode: 1 });
    });
    child.once("close", (code, signal) => {
      finish({
        code,
        signal,
        exitCode: signal ? signalExitCode(signal) : (code ?? 1),
      });
    });
  });
}

function writeCapturedOutput(label, value) {
  process.stderr.write(`${label}:\n`);
  process.stderr.write(value || "(empty)\n");
  if (value && !value.endsWith("\n")) process.stderr.write("\n");
}

function reportFailure(check, result, passed, total) {
  process.stderr.write(`✗ ${check.name}\n\n`);
  process.stderr.write(`VERIFY FAILED - ${passed}/${total} checks successful\n\n`);
  process.stderr.write(`Failed check: ${check.name}\n`);
  process.stderr.write(`Command: ${npmExecutable} run ${check.script}\n`);

  if (result.signal) {
    process.stderr.write(`Signal: ${result.signal}\n`);
  } else if (result.error) {
    process.stderr.write(`Spawn error: ${result.error.message}\n`);
  } else {
    process.stderr.write(`Exit code: ${result.code}\n`);
  }

  process.stderr.write("\n");
  writeCapturedOutput("Captured stdout", result.stdout);
  writeCapturedOutput("Captured stderr", result.stderr);
}

export async function runChecks(checks, options = {}) {
  const runOptions = {
    cwd: process.cwd(),
    env: process.env,
    ...options,
  };
  let activeChild = null;
  let interruptedSignal = null;
  const forwardSignal = (signal) => {
    interruptedSignal = signal;
    if (activeChild && !activeChild.killed) activeChild.kill(signal);
  };

  process.on("SIGINT", forwardSignal);
  process.on("SIGTERM", forwardSignal);
  process.on("SIGHUP", forwardSignal);

  try {
    let passed = 0;
    for (const check of checks) {
      if (interruptedSignal) {
        const result = {
          code: null,
          error: new Error(`verification interrupted by ${interruptedSignal}`),
          exitCode: signalExitCode(interruptedSignal),
          signal: interruptedSignal,
          stderr: "",
          stdout: "",
        };
        reportFailure(check, result, passed, checks.length);
        return result;
      }

      const result = await executeCheck(check, runOptions, (child) => {
        activeChild = child;
      });
      activeChild = null;
      if (result.exitCode !== 0 || result.error) {
        reportFailure(check, result, passed, checks.length);
        return result;
      }

      passed += 1;
      process.stdout.write(`✓ ${check.name}\n`);
    }

    process.stdout.write(`\nVERIFY PASSED - ${passed}/${checks.length} checks successful\n`);
    return { exitCode: 0, passed, total: checks.length };
  } finally {
    process.off("SIGINT", forwardSignal);
    process.off("SIGTERM", forwardSignal);
    process.off("SIGHUP", forwardSignal);
  }
}

export async function main(args = process.argv.slice(2)) {
  try {
    const checks = parseChecks(args);
    const result = await runChecks(checks);
    process.exitCode = result.exitCode;
  } catch (error) {
    process.stderr.write(`Verification runner error: ${error.message}\n`);
    process.stderr.write("Usage: verify-runner --check <name> <npm-script> [...]\n");
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
