#!/usr/bin/env node
import { access, lstat, mkdir, readFile, readdir, readlink, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
export async function links({
  home = os.homedir(),
  opencode = path.join(home, ".config/opencode"),
  claude = path.join(home, ".claude"),
  bin = path.join(home, ".local/bin"),
  checkout = root,
} = {}) {
  const entries = [
    [path.join(opencode, "opencode.json"), path.join(checkout, "opencode.json")],
    [path.join(opencode, "AGENTS.md"), path.join(checkout, "AGENTS.md")],
    [path.join(opencode, "commands"), path.join(checkout, "commands")],
    [path.join(opencode, "skills"), path.join(checkout, "skills")],
    [path.join(opencode, "agent"), path.join(checkout, "agent")],
    [path.join(claude, "CLAUDE.md"), path.join(checkout, "AGENTS.md")],
    [path.join(claude, "commands"), path.join(checkout, "commands")],
  ];
  const skillNames = (await readdir(path.join(checkout, "skills"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name !== "synced")
    .map((entry) => entry.name);
  for (const name of skillNames) {
    try {
      await access(path.join(checkout, "skills", name, "SKILL.md"));
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    entries.push([path.join(claude, "skills", name), path.join(checkout, "skills", name)]);
  }
  for (const name of Object.keys(JSON.parse(await readFile(path.join(checkout, "claude/agents.json"), "utf8")))) {
    entries.push([path.join(claude, "agents", `${name}.md`), path.join(checkout, "claude", "agents", `${name}.md`)]);
  }
  for (const name of ["verify-runner", "implementation-workspace"]) {
    const executable = process.platform === "win32" ? `${name}.cmd` : name;
    entries.push([path.join(bin, executable), path.join(checkout, "scripts", executable)]);
  }
  return entries;
}

export async function install(options = {}) {
  const entries = await links(options);
  const pending = [];
  const conflicts = [];
  for (const [destination, source] of entries) {
    await access(source);
    try {
      const info = await lstat(destination);
      if (path.resolve(destination) === path.resolve(source)) continue;
      if (process.platform === "win32" && destination.endsWith(".cmd")) {
        if (await readFile(destination, "utf8") !== windowsWrapper(source)) conflicts.push(destination);
      } else if (!info.isSymbolicLink() || path.resolve(path.dirname(destination), await readlink(destination)) !== source) {
        conflicts.push(destination);
      }
    } catch (error) {
      if (error.code === "ENOENT") pending.push([destination, source]);
      else throw error;
    }
  }
  if (conflicts.length) throw new Error(`existing configuration differs; no changes made:\n${conflicts.join("\n")}`);
  if (options.check && pending.length) throw new Error(`setup incomplete:\n${pending.map(([destination]) => destination).join("\n")}`);
  if (!options.check) {
    for (const [destination, source] of pending) {
      await mkdir(path.dirname(destination), { recursive: true });
      if (process.platform === "win32" && destination.endsWith(".cmd")) {
        await writeFile(destination, windowsWrapper(source), { flag: "wx" });
      } else {
        await symlink(source, destination, process.platform === "win32" && !source.endsWith(".md") && !source.endsWith(".json") ? "junction" : undefined);
      }
    }
  }
  return { created: options.check ? 0 : pending.length, checked: entries.length };
}

function windowsWrapper(source) {
  // A symlinked .cmd sees the link's directory as %~dp0, not the script's.
  const moduleName = path.basename(source) === "verify-runner.cmd" ? "verify.mjs" : "implementation-workspace.mjs";
  return `@echo off\r\nnode "${path.join(path.dirname(source), moduleName)}" %*\r\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const bin = path.join(os.homedir(), ".local/bin");
    if (!(process.env.PATH || "").split(path.delimiter).some((entry) => path.resolve(entry) === bin)) {
      throw new Error(`${bin} is not on PATH; add it to your shell/CI environment before installing`);
    }
    const result = await install({ check: process.argv.includes("--check") });
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
