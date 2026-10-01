#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { access, chmod, lstat, mkdir, readFile, readdir, readlink, symlink, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const postMergeHook = `#!/bin/sh
# coding-agent-config: managed by scripts/install.mjs
root="$(git rev-parse --show-toplevel)" || exit 0
exec node "$root/scripts/install.mjs" --after-merge
`;

function git(args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function installationWorktree() {
  const primary = git(["rev-parse", "--absolute-git-dir"]) ===
    git(["rev-parse", "--path-format=absolute", "--git-common-dir"]);
  return primary && git(["branch", "--show-current"]) === "main";
}

function hookDirectory() {
  let custom = "";
  try {
    custom = execFileSync("git", ["config", "--get", "core.hooksPath"], {
      cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch (error) {
    if (error.status !== 1) throw error;
  }
  if (custom) throw new Error("custom core.hooksPath is configured; integrate the post-merge hook deliberately");
  return path.join(git(["rev-parse", "--path-format=absolute", "--git-common-dir"]), "hooks");
}
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

// Claude Code links skills and agents one file at a time, so removing one from
// the checkout leaves a dangling link behind. Only links that point into this
// checkout are ours; anything else in these directories belongs to the user.
export async function staleLinks({
  home = os.homedir(),
  claude = path.join(home, ".claude"),
  checkout = root,
} = {}) {
  const owned = `${path.resolve(checkout)}${path.sep}`;
  const stale = [];
  for (const directory of [path.join(claude, "agents"), path.join(claude, "skills")]) {
    let names;
    try {
      names = await readdir(directory);
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    for (const name of names) {
      const link = path.join(directory, name);
      if (!(await lstat(link)).isSymbolicLink()) continue;
      const target = path.resolve(directory, await readlink(link));
      if (!target.startsWith(owned)) continue;
      try {
        await access(target);
      } catch (error) {
        if (error.code === "ENOENT") stale.push(link);
        else throw error;
      }
    }
  }
  return stale;
}

export async function install(options = {}) {
  const entries = await links(options);
  const stale = await staleLinks(options);
  const pending = [];
  const conflicts = [];
  const hook = options.hookDirectory ? path.join(options.hookDirectory, "post-merge") : null;
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
  if (hook) {
    try {
      const info = await lstat(hook);
      if (!info.isFile() || await readFile(hook, "utf8") !== postMergeHook) conflicts.push(hook);
      else if (!(info.mode & 0o111)) conflicts.push(hook);
    } catch (error) {
      if (error.code === "ENOENT") pending.push([hook, null]);
      else throw error;
    }
  }
  if (conflicts.length) throw new Error(`existing configuration differs; no changes made:\n${conflicts.join("\n")}`);
  if (options.check && (pending.length || stale.length)) {
    throw new Error(`setup incomplete:\n${[...pending.map(([destination]) => destination), ...stale.map((link) => `${link} (stale)`)].join("\n")}`);
  }
  if (!options.check) {
    for (const link of stale) await unlink(link);
    for (const [destination, source] of pending) {
      await mkdir(path.dirname(destination), { recursive: true });
      if (destination === hook) {
        await writeFile(destination, postMergeHook, { flag: "wx", mode: 0o755 });
        await chmod(destination, 0o755);
      } else if (process.platform === "win32" && destination.endsWith(".cmd")) {
        await writeFile(destination, windowsWrapper(source), { flag: "wx" });
      } else {
        await symlink(source, destination, process.platform === "win32" && !source.endsWith(".md") && !source.endsWith(".json") ? "junction" : undefined);
      }
    }
  }
  return { created: options.check ? 0 : pending.length, removed: options.check ? 0 : stale.length, checked: entries.length };
}

function windowsWrapper(source) {
  // A symlinked .cmd sees the link's directory as %~dp0, not the script's.
  const moduleName = path.basename(source) === "verify-runner.cmd" ? "verify.mjs" : "implementation-workspace.mjs";
  return `@echo off\r\nnode "${path.join(path.dirname(source), moduleName)}" %*\r\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (!installationWorktree()) {
      if (process.argv.includes("--after-merge")) process.exit(0);
      throw new Error("install only from the primary configuration checkout on main; never link an unmerged feature worktree");
    }
    const bin = path.join(os.homedir(), ".local/bin");
    if (!(process.env.PATH || "").split(path.delimiter).some((entry) => path.resolve(entry) === bin)) {
      throw new Error(`${bin} is not on PATH; add it to your shell/CI environment before installing`);
    }
    const result = await install({ check: process.argv.includes("--check"), hookDirectory: hookDirectory() });
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
