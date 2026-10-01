#!/usr/bin/env node
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

export async function expectedCodex(base = root) {
  const result = new Map();
  const metadata = JSON.parse(await readFile(path.join(base, "codex/agents.json"), "utf8"));
  for (const [name, fields] of Object.entries(metadata)) {
    if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error(`invalid agent name: ${name}`);
    const body = await readFile(path.join(base, "agent", `${name}.md`), "utf8");
    if (body.startsWith("---")) throw new Error(`host frontmatter in shared agent: ${name}`);
    const lines = [`name = ${JSON.stringify(name)}`];
    for (const [key, value] of Object.entries(fields)) {
      if (!["description", "sandbox_mode", "model", "model_reasoning_effort"].includes(key) ||
          typeof value !== "string" || value.includes("\n")) throw new Error(`invalid ${name}.${key}`);
      lines.push(`${key} = ${JSON.stringify(value)}`);
    }
    // JSON string escaping is also valid for these TOML basic strings.
    lines.push(`developer_instructions = ${JSON.stringify(body)}`);
    result.set(`agents/${name}.toml`, `${lines.join("\n")}\n`);
  }
  for (const file of (await readdir(path.join(base, "commands"))).sort()) {
    if (!file.endsWith(".md")) continue;
    const text = await readFile(path.join(base, "commands", file), "utf8");
    const match = text.match(/^---\ndescription: ([^\n]+)\n---\n/);
    if (!match) throw new Error(`invalid command header: ${file}`);
    const name = `workflow-${file.slice(0, -3).replaceAll(".", "-")}`;
    if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error(`invalid command skill name: ${name}`);
    const body = text.slice(match[0].length);
    const binding = "In this Codex command adapter, `$ARGUMENTS` means the request supplied with\nthis skill invocation. If no request was supplied, treat it as empty.\n";
    result.set(`skills/${name}/SKILL.md`, `---\nname: ${name}\ndescription: ${JSON.stringify(match[1])}\n---\n\n${binding}${body}`);
    result.set(`skills/${name}/agents/openai.yaml`, "policy:\n  allow_implicit_invocation: false\n");
  }
  return result;
}

export async function syncCodex(base = root, write = false) {
  const directory = path.join(base, "codex");
  const expected = await expectedCodex(base);
  async function generatedFiles(relative) {
    const entries = await readdir(path.join(directory, relative), { withFileTypes: true }).catch((error) => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
    const files = [];
    for (const entry of entries) {
      const file = `${relative}/${entry.name}`;
      files.push(...(entry.isDirectory() ? await generatedFiles(file) : [file]));
    }
    return files;
  }
  const actual = [...await generatedFiles("agents"), ...await generatedFiles("skills")];
  const extra = actual.filter((name) => !expected.has(name));
  if (extra.length) throw new Error(`unexpected generated Codex files: ${extra.join(", ")}`);
  for (const [name, content] of expected) {
    const destination = path.join(directory, name);
    if (write) {
      await mkdir(path.dirname(destination), { recursive: true });
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
    await syncCodex(root, process.argv[2] === "--write");
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
