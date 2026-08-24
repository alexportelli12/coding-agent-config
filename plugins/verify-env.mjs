import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "scripts",
);

export default async () => ({
  "shell.env": async (_input, output) => {
    const currentPath = output.env.PATH ?? process.env.PATH ?? "";
    output.env.PATH = [scriptsDirectory, currentPath]
      .filter(Boolean)
      .join(path.delimiter);
  },
});
