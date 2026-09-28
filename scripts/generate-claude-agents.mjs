#!/usr/bin/env node
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

export async function expectedAgents(base = root) {
  const metadata = JSON.parse(await readFile(path.join(base, "claude/agents.json"), "utf8"));
  const result = new Map();
  for (const [name, fields] of Object.entries(metadata)) {
    if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error(`invalid agent name: ${name}`);
    const body = await readFile(path.join(base, "agent", `${name}.md`), "utf8");
    if (body.startsWith("---")) throw new Error(`host frontmatter in shared agent: ${name}`);
    const header = ["---", `name: ${name}`];
    for (const [key, value] of Object.entries(fields)) {
      if (typeof value !== "string" || value.includes("\n")) throw new Error(`invalid ${name}.${key}`);
      header.push(`${key}: ${JSON.stringify(value)}`);
    }
    result.set(`${name}.md`, `${header.join("\n")}\n---\n\n${body}`);
  }
  return result;
}

export async function syncAgents(base = root, write = false) {
  const directory = path.join(base, "claude/agents");
  const expected = await expectedAgents(base);
  const actual = (await readdir(directory)).filter((name) => name.endsWith(".md"));
  const extra = actual.filter((name) => !expected.has(name));
  if (extra.length) throw new Error(`unexpected generated agents: ${extra.join(", ")}`);
  for (const [name, content] of expected) {
    const destination = path.join(directory, name);
    if (write) {
      await writeFile(destination, content);
    } else {
      const current = await readFile(destination, "utf8").catch((error) => {
        if (error.code === "ENOENT") return null;
        throw error;
      });
      if (current !== content) throw new Error(`${name} is stale; run npm run agents:generate`);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await syncAgents(root, process.argv[2] === "--write");
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
