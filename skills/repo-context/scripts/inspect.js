#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

let YAML = null;
try {
  YAML = require("yaml");
} catch {
  // The script remains standalone; YAML details are reported as limited without it.
}

const MAX_OUTPUT_LINES = 350;
const MAX_TREE_LINES = 60;
const MAX_SOURCE_FILES = 5000;
const MAX_SOURCE_FILE_BYTES = 512 * 1024;
const MAX_TOTAL_SOURCE_BYTES = 32 * 1024 * 1024;
const MAX_CONFIG_FILE_BYTES = 1024 * 1024;
const MAX_WALK_DEPTH = 12;
const MAX_PACKAGE_REPORTS = 12;

const IGNORE = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  "playwright-report",
  "test-results",
  "blob-report",
  ".next",
  ".nuxt",
  ".turbo",
  ".cache",
  "__pycache__",
  ".venv",
  "venv",
  "target",
  "generated",
  "snapshots",
  "__snapshots__",
]);

const NON_PRODUCTION_DIRS = new Set([
  "test",
  "tests",
  "e2e",
  "cypress",
  "playwright",
  "fixtures",
  "__fixtures__",
  "evals",
  "examples",
  "demo",
  "demos",
]);

const LOCK_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
  "bun.lock",
  "Gemfile.lock",
  "Cargo.lock",
  "poetry.lock",
  "composer.lock",
]);

const CODE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".vue",
  ".svelte",
  ".py",
  ".rb",
  ".rs",
  ".go",
  ".java",
  ".kt",
  ".cs",
  ".php",
  ".html",
  ".css",
  ".scss",
  ".sass",
  ".less",
]);

function isIgnoredEntryName(name) {
  return IGNORE.has(name) || /(?:^|[-_.])snapshots$/.test(name);
}

const PATTERN_DEFS = {
  "State APIs": {
    "Angular Signals": [/\bsignal\s*\(/, /\bcomputed\s*\(/, /\beffect\s*\(/],
    "RxJS subjects": [/\bBehaviorSubject\b/, /\bReplaySubject\b/],
    "Redux / NgRx": [/\bstore\.dispatch\s*\(/, /\bcreateSlice\s*\(/, /\bcreateReducer\s*\(/],
    Zustand: [/\bcreate\s*\(/, /\buseStore\b/],
    Pinia: [/\bdefineStore\s*\(/],
  },
  Styling: {
    Tailwind: [/\b(?:class|className)\s*=\s*["'`][^"'`]*(?:\bflex\b|\bgrid\b|\bp-[0-9]|\bm-[0-9])/],
    Less: [],
    SCSS: [],
    CSS: [],
    "CSS-in-JS": [/\bstyled\.[a-z]+/, /\bcss`/, /\bmakeStyles\s*\(/],
  },
  "Async syntax": {
    "async/await": [/\basync\s+(?:function|\([^)]*\)\s*=>|[a-zA-Z_$][\w$]*\s*\()/, /\bawait\s+/],
    ".then() chains": [/\.then\s*\(/],
  },
};

const CONVENTION_PAIRS = [
  {
    category: "Dependency Injection",
    scope: "typescript",
    a: { label: "inject()", re: /\binject\s*(?:<|\()/ },
    b: { label: "Constructor DI", re: /constructor\s*\([^)]*(?:private|protected|public|readonly)\s/ },
  },
  {
    category: "Component I/O",
    scope: "typescript",
    a: { label: "input()/output()", re: /\b(?:input|output|model)\s*(?:<|\()/ },
    b: { label: "@Input/@Output", re: /@(?:Input|Output)\s*\(/ },
  },
  {
    category: "Control Flow",
    scope: "templates",
    a: { label: "@if/@for/@switch", re: /@(?:if|for|switch)\s*[\s(]/ },
    b: { label: "*ngIf/*ngFor", re: /\*ng(?:If|For|SwitchCase)\b/ },
  },
  {
    category: "Templates",
    scope: "typescript",
    a: { label: "External", re: /\btemplateUrl\s*:/ },
    b: { label: "Inline", re: /\btemplate\s*:\s*(?:`|'|")/ },
  },
];

function resolveRoot(input = process.argv[2]) {
  const candidate = path.resolve(input || process.cwd());
  try {
    return fs.realpathSync(candidate);
  } catch {
    return candidate;
  }
}

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function safeStat(root, candidate, expectedType) {
  try {
    const linkStat = fs.lstatSync(candidate);
    if (linkStat.isSymbolicLink()) return false;
    const real = fs.realpathSync(candidate);
    if (!isInside(root, real)) return false;
    return expectedType === "file" ? linkStat.isFile() : linkStat.isDirectory();
  } catch {
    return false;
  }
}

function fileExists(root, candidate) {
  return safeStat(root, candidate, "file");
}

function dirExists(root, candidate) {
  return safeStat(root, candidate, "directory");
}

function readFileSafe(root, candidate, diagnostics, maxBytes = MAX_CONFIG_FILE_BYTES) {
  if (!fileExists(root, candidate)) return null;
  try {
    const stat = fs.statSync(candidate);
    if (stat.size > maxBytes) {
      diagnostics.skippedLarge++;
      diagnostics.skippedLargePaths ||= [];
      if (diagnostics.skippedLargePaths.length < 3) diagnostics.skippedLargePaths.push(path.relative(root, candidate));
      return null;
    }
    return fs.readFileSync(candidate, "utf8");
  } catch {
    diagnostics.unreadable++;
    return null;
  }
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/([|*_{}\[\]<>#])/g, "\\$1")
    .trim();
}

function cleanLiteral(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/`/g, "'")
    .trim();
}

function inlineCode(value) {
  const clean = String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/`/g, "'")
    .trim();
  return `\`${clean}\``;
}

function redactUrl(value) {
  try {
    const parsed = new URL(value);
    parsed.username = "";
    parsed.password = "";
    parsed.search = "";
    parsed.hash = "";
    return parsed.origin;
  } catch {
    return "configured (value redacted)";
  }
}

function stripComments(content) {
  return content.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1 ");
}

function relativeSegments(root, candidate) {
  return path.relative(root, candidate).split(path.sep).map((segment) => segment.toLowerCase());
}

function classifySource(root, candidate) {
  const segments = relativeSegments(root, candidate);
  const base = path.basename(candidate).toLowerCase();
  if (segments.some((segment) => NON_PRODUCTION_DIRS.has(segment))) return "non-production";
  if (/\.(?:spec|test)\.[^.]+$/.test(base)) return "non-production";
  return "production";
}

function walkCodeFiles(root, dir, files, diagnostics, depth = 0) {
  if (depth > MAX_WALK_DEPTH || diagnostics.limitReached) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    diagnostics.unreadable++;
    return;
  }

  for (const entry of entries) {
    if (diagnostics.limitReached) return;
    if (entry.isSymbolicLink() || isIgnoredEntryName(entry.name) || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkCodeFiles(root, full, files, diagnostics, depth + 1);
      continue;
    }
    if (!CODE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
    if (files.length >= MAX_SOURCE_FILES) {
      diagnostics.limitReached = true;
      diagnostics.limitReason = `source file limit (${MAX_SOURCE_FILES})`;
      return;
    }
    files.push(full);
  }
}

function loadSourceFiles(root) {
  const diagnostics = {
    discovered: 0,
    loaded: 0,
    production: 0,
    nonProduction: 0,
    bytes: 0,
    skippedLarge: 0,
    skippedLargePaths: [],
    unreadable: 0,
    limitReached: false,
    limitReason: "",
  };
  const files = [];
  walkCodeFiles(root, root, files, diagnostics);
  diagnostics.discovered = files.length;
  const sources = [];

  for (const file of files) {
    try {
      const stat = fs.statSync(file);
      if (stat.size > MAX_SOURCE_FILE_BYTES) {
        diagnostics.skippedLarge++;
        if (diagnostics.skippedLargePaths.length < 3) diagnostics.skippedLargePaths.push(path.relative(root, file));
        continue;
      }
      if (diagnostics.bytes + stat.size > MAX_TOTAL_SOURCE_BYTES) {
        diagnostics.limitReached = true;
        diagnostics.limitReason = `source byte limit (${Math.round(MAX_TOTAL_SOURCE_BYTES / 1024 / 1024)} MiB)`;
        break;
      }
      const kind = classifySource(root, file);
      sources.push({
        path: file,
        relativePath: path.relative(root, file),
        content: fs.readFileSync(file, "utf8"),
        ext: path.extname(file).toLowerCase(),
        kind,
      });
      diagnostics.loaded++;
      diagnostics.bytes += stat.size;
      if (kind === "production") diagnostics.production++;
      else diagnostics.nonProduction++;
    } catch {
      diagnostics.unreadable++;
    }
  }
  return { sources, diagnostics };
}

function discoverPackageRoots(root) {
  const roots = [];
  if (fileExists(root, path.join(root, "package.json"))) roots.push(root);

  function scanContainer(containerPath, depth) {
    if (depth > 2 || roots.length > MAX_PACKAGE_REPORTS) return;
    let entries = [];
    try {
      entries = fs.readdirSync(containerPath, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
      const packageRoot = path.join(containerPath, entry.name);
      if (fileExists(root, path.join(packageRoot, "package.json"))) {
        roots.push(packageRoot);
      } else {
        scanContainer(packageRoot, depth + 1);
      }
    }
  }

  for (const container of ["apps", "packages", "libs"]) {
    const containerPath = path.join(root, container);
    if (!dirExists(root, containerPath)) continue;
    scanContainer(containerPath, 0);
  }
  return [...new Set(roots)];
}

function packageManager(root) {
  if (fileExists(root, path.join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (fileExists(root, path.join(root, "yarn.lock"))) return "yarn";
  if (fileExists(root, path.join(root, "bun.lock")) || fileExists(root, path.join(root, "bun.lockb"))) return "bun";
  return "npm";
}

function readPackages(root, diagnostics) {
  const packages = [];
  for (const packageRoot of discoverPackageRoots(root).slice(0, MAX_PACKAGE_REPORTS)) {
    const content = readFileSafe(root, path.join(packageRoot, "package.json"), diagnostics);
    if (!content) continue;
    try {
      const pkg = JSON.parse(content);
      packages.push({ root: packageRoot, relativeRoot: path.relative(root, packageRoot) || ".", pkg });
    } catch {
      diagnostics.parseErrors = (diagnostics.parseErrors || 0) + 1;
    }
  }
  return packages;
}

function detectTechStack(root, packages, diagnostics) {
  const lines = [];
  const manifests = [
    ["requirements.txt", "Python"], ["Pipfile", "Python"], ["pyproject.toml", "Python"],
    ["Gemfile", "Ruby"], ["Cargo.toml", "Rust"], ["go.mod", "Go"],
    ["pom.xml", "Java"], ["build.gradle", "Java / Kotlin"], ["composer.json", "PHP"],
    ["pubspec.yaml", "Dart / Flutter"], ["mix.exs", "Elixir"],
  ];
  const languages = [];
  if (packages.length) languages.push("JavaScript / TypeScript");
  for (const [file, language] of manifests) {
    if (fileExists(root, path.join(root, file))) languages.push(language);
  }
  if (!languages.length) return "No recognised root manifest found. Source structure is still reported.";
  lines.push(`- **Manifest ecosystems:** ${[...new Set(languages)].map(cleanText).join(", ")}`);

  const frameworkChecks = [
    ["@angular/core", "Angular"], ["react", "React"], ["next", "Next.js"], ["vue", "Vue"],
    ["nuxt", "Nuxt"], ["svelte", "Svelte"], ["astro", "Astro"], ["express", "Express"],
    ["fastify", "Fastify"], ["@nestjs/core", "NestJS"], ["hono", "Hono"],
  ];
  const libraryChecks = [
    ["tailwindcss", "Tailwind CSS"], ["@supabase/supabase-js", "Supabase"], ["firebase", "Firebase"],
    ["prisma", "Prisma"], ["drizzle-orm", "Drizzle ORM"], ["rxjs", "RxJS"],
    ["@ngrx/store", "NgRx"], ["@ngrx/signals", "NgRx Signals"], ["zustand", "Zustand"],
    ["@reduxjs/toolkit", "Redux Toolkit"], ["pinia", "Pinia"], ["zod", "Zod"],
  ];
  const toolChecks = [
    ["typescript", "TypeScript"], ["@angular/cli", "Angular CLI"], ["@angular/build", "Angular Build"],
    ["vite", "Vite"], ["webpack", "Webpack"], ["esbuild", "esbuild"], ["vitest", "Vitest"],
    ["jest", "Jest"], ["@playwright/test", "Playwright"], ["playwright", "Playwright"],
    ["cypress", "Cypress"], ["karma", "Karma"], ["eslint", "ESLint"], ["prettier", "Prettier"],
    ["less", "Less"], ["sass", "Sass"], ["tsx", "tsx"], ["ts-node", "ts-node"],
  ];
  const manager = packageManager(root);
  const rootPackage = packages.find((item) => item.relativeRoot === ".");
  const declaredManager = rootPackage && typeof rootPackage.pkg.packageManager === "string" ? rootPackage.pkg.packageManager : null;
  lines.push(`- **Package manager:** ${cleanText(declaredManager || manager)}`);

  for (const item of packages) {
    const deps = item.pkg.dependencies || {};
    const devDeps = item.pkg.devDependencies || {};
    const all = { ...deps, ...devDeps };
    const frameworks = frameworkChecks.filter(([name]) => all[name]).map(([name, label]) => `${label} ${cleanText(all[name])}`);
    const libraries = libraryChecks.filter(([name]) => all[name]).map(([name, label]) => `${label} ${cleanText(all[name])}`);
    const tools = [...new Set(toolChecks.filter(([name]) => all[name]).map(([name, label]) => `${label} ${cleanText(all[name])}`))];
    const scripts = item.pkg.scripts || {};
    const scriptNames = Object.keys(scripts);
    const exactScripts = ["validate", "start", "dev", "build", "build:prod", "test", "test:ci", "test:coverage", "test:e2e", "test:scraping", "lint", "lint:fix", "db:test", "e2e", "storybook"].filter((name) => scripts[name]);
    const relatedScripts = scriptNames.filter((name) => /^(?:test|lint|e2e|playwright|db)(?::|$)/.test(name));
    const important = [...new Set([...exactScripts, ...relatedScripts])].slice(0, 14);
    lines.push(`- **Package ${inlineCode(item.relativeRoot)}:** ${Object.keys(deps).length} production, ${Object.keys(devDeps).length} dev dependencies`);
    if (frameworks.length) lines.push(`  Frameworks: ${frameworks.join(", ")}`);
    if (libraries.length) lines.push(`  Key libraries: ${libraries.join(", ")}`);
    if (tools.length) lines.push(`  Dev tools: ${tools.join(", ")}`);
    if (important.length) lines.push(`  Scripts: ${important.map((name) => inlineCode(`${manager} run ${name}`)).join(", ")}`);
  }
  if (discoverPackageRoots(root).length > MAX_PACKAGE_REPORTS) {
    lines.push(`- Package reporting capped at ${MAX_PACKAGE_REPORTS} package roots.`);
  }
  return lines.join("\n");
}

function matchesAny(content, patterns) {
  return patterns.some((pattern) => pattern.test(content));
}

function isEligiblePattern(label, source, content) {
  if (label === "Angular Signals") {
    return isAngularSource(source) && /\b(?:signal|computed|effect)\s*\(/.test(content);
  }
  if (label === "RxJS subjects") {
    return /(?:from\s*["']rxjs["']|require\s*\(\s*["']rxjs["']\s*\))/.test(content);
  }
  if (label === "Redux / NgRx") {
    return /(?:@ngrx\/|@reduxjs\/toolkit|\bredux\b)/.test(content);
  }
  if (label === "Zustand") return /(?:from\s*["']zustand["']|require\s*\(\s*["']zustand["']\s*\))/.test(content);
  if (label === "Pinia") return /(?:from\s*["']pinia["']|require\s*\(\s*["']pinia["']\s*\))/.test(content);
  return true;
}

function detectPatterns(sources) {
  const production = sources.filter((source) => source.kind === "production");
  const counts = {};
  for (const [category, definitions] of Object.entries(PATTERN_DEFS)) {
    counts[category] = Object.fromEntries(Object.keys(definitions).map((label) => [label, 0]));
  }

  for (const source of production) {
    if (source.ext === ".less") counts.Styling.Less++;
    if (source.ext === ".scss" || source.ext === ".sass") counts.Styling.SCSS++;
    if (source.ext === ".css") counts.Styling.CSS++;
    const content = stripComments(source.content);
    for (const [category, definitions] of Object.entries(PATTERN_DEFS)) {
      for (const [label, patterns] of Object.entries(definitions)) {
        if (patterns.length && isEligiblePattern(label, source, content) && matchesAny(content, patterns)) counts[category][label]++;
      }
    }
  }

  const lines = [
    `_Analysed ${production.length} production files; excluded ${sources.length - production.length} test, fixture, example, or eval files._`,
    "",
    "| Category | Leading evidence | Other evidence | Coverage |",
    "|----------|------------------|----------------|----------|",
  ];
  let findings = 0;
  for (const [category, values] of Object.entries(counts)) {
    const entries = Object.entries(values).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    if (!entries.length) continue;
    findings++;
    const tied = entries.length > 1 && entries[0][1] === entries[1][1];
    const coverage = production.length ? Math.round((entries[0][1] / production.length) * 1000) / 10 : 0;
    lines.push(`| ${cleanText(category)} | **${cleanText(entries[0][0])}** (${entries[0][1]} files) | ${entries.slice(1, 3).map(([label, count]) => `${cleanText(label)} (${count})`).join(", ") || "None observed"} | ${entries[0][1]}/${production.length} files (${coverage}%)${tied ? "; tied" : ""} |`);
  }
  return findings ? lines.join("\n") : "_No supported patterns detected in production files._";
}

function isAngularSource(source) {
  return /from\s*["']@angular\//.test(source.content) || /@(?:Component|Directive|Injectable|Pipe)\s*\(/.test(source.content);
}

function sourcesForConvention(pair, sources) {
  const production = sources.filter((source) => source.kind === "production");
  if (pair.scope === "templates") return production.filter((source) => source.ext === ".html" || (source.ext === ".ts" && isAngularSource(source)));
  if (pair.scope === "angular") return production.filter((source) => source.ext === ".html" || isAngularSource(source));
  return production.filter((source) => [".ts", ".tsx"].includes(source.ext) && isAngularSource(source));
}

function scoreConvention(pair, sources) {
  let aOnly = 0;
  let bOnly = 0;
  let both = 0;
  for (const source of sourcesForConvention(pair, sources)) {
    const content = stripComments(source.content);
    const hasA = pair.a.re.test(content);
    const hasB = pair.b.re.test(content);
    if (hasA && hasB) both++;
    else if (hasA) aOnly++;
    else if (hasB) bOnly++;
  }
  if (!aOnly && !bOnly && !both) return null;
  const exclusive = aOnly + bOnly;
  const aWins = aOnly >= bOnly;
  const winnerCount = Math.max(aOnly, bOnly);
  const ratio = exclusive ? winnerCount / exclusive : 0;
  const tied = aOnly === bOnly;
  const confidence = tied || both > 0 || exclusive < 3 ? (exclusive < 3 && both === 0 ? "limited" : "mixed") : ratio >= 0.85 ? "strong" : "mixed";
  return {
    category: pair.category,
    preferred: tied ? "No clear default" : aWins ? pair.a.label : pair.b.label,
    alternative: tied ? `${pair.a.label} / ${pair.b.label}` : aWins ? pair.b.label : pair.a.label,
    confidence,
    evidence: `${pair.a.label}: ${aOnly}, ${pair.b.label}: ${bOnly}, both: ${both}`,
  };
}

function detectFormEvidence(sources) {
  const counts = {
    "Signal Forms": 0,
    "Reactive Forms": 0,
    "Template-driven Forms": 0,
  };
  for (const source of sources.filter((item) => item.kind === "production" && (item.ext === ".html" || isAngularSource(item)))) {
    const content = stripComments(source.content);
    if (/@angular\/forms\/signals/.test(content) || /\[field\]\s*=/.test(content)) counts["Signal Forms"]++;
    if (/\b(?:FormControl|FormGroup|FormBuilder|formControlName|formGroup)\b/.test(content)) counts["Reactive Forms"]++;
    if (/\b(?:ngModel|ngForm)\b/.test(content)) counts["Template-driven Forms"]++;
  }
  const observed = Object.entries(counts).filter(([, count]) => count > 0);
  if (!observed.length) return "";
  return [
    "**Forms evidence:**",
    ...observed.map(([label, count]) => `- ${label}: ${count} ${count === 1 ? "file" : "files"}`),
    "- These approaches can coexist; inspect the affected form before choosing one.",
  ].join("\n");
}

function detectConventions(root, sources) {
  const angularSources = sources.filter((source) => source.kind === "production" && isAngularSource(source));
  if (!angularSources.length) return "_No supported framework-specific conventions detected._";
  const lines = [];
  const results = CONVENTION_PAIRS.map((pair) => scoreConvention(pair, sources)).filter(Boolean);
  if (results.length) {
    lines.push("| Convention | Observed default | Alternative | Confidence | Evidence |", "|------------|------------------|-------------|------------|----------|");
    for (const result of results) {
      lines.push(`| ${cleanText(result.category)} | **${cleanText(result.preferred)}** | ${cleanText(result.alternative)} | ${result.confidence} | ${cleanText(result.evidence)} |`);
    }
    lines.push("");
  }

  const forms = detectFormEvidence(sources);
  if (forms) lines.push(forms, "");

  const componentSources = angularSources.filter((source) => /@Component\s*\(/.test(stripComments(source.content)));
  const withSuffix = componentSources.filter((source) => /\.component\.ts$/.test(source.path)).length;
  const withoutSuffix = componentSources.length - withSuffix;
  const notes = [];
  if (componentSources.length) {
    const confidence = componentSources.length < 3 ? "limited" : withSuffix === 0 || withoutSuffix === 0 ? "strong" : "mixed";
    notes.push(`Component filenames: ${withSuffix} with ${inlineCode(".component.ts")}, ${withoutSuffix} without (${confidence})`);
    const onPush = componentSources.filter((source) => /ChangeDetectionStrategy\.OnPush/.test(stripComments(source.content))).length;
    notes.push(`Explicit OnPush: ${onPush}/${componentSources.length} components; absence does not prove default change detection`);
  }

  const prefixes = new Map();
  for (const source of componentSources) {
    const match = stripComments(source.content).match(/selector\s*:\s*["']([a-z][\w-]*)/);
    if (!match || !match[1].includes("-")) continue;
    const prefix = match[1].split("-")[0];
    prefixes.set(prefix, (prefixes.get(prefix) || 0) + 1);
  }
  const topPrefix = [...prefixes.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topPrefix) notes.push(`Selector prefix observed: ${inlineCode(`${topPrefix[0]}-`)} in ${topPrefix[1]}/${componentSources.length} components`);

  if (notes.length) {
    lines.push("**Additional evidence:**");
    lines.push(...notes.map((note) => `- ${note}`));
  }
  return lines.join("\n") || "_No supported conventions detected._";
}

function detectArchitecture(root, sources, diagnostics) {
  const production = sources.filter((source) => source.kind === "production");
  const lines = [];
  const areaCounts = new Map();
  for (const source of production) {
    const [area] = source.relativePath.split(path.sep);
    if (!area || area === path.basename(source.relativePath)) continue;
    areaCounts.set(area, (areaCounts.get(area) || 0) + 1);
  }
  const areas = [...areaCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (areas.length) lines.push(`- **Primary source areas:** ${areas.map(([area, count]) => `${inlineCode(`${area}/`)} (${count} ${count === 1 ? "file" : "files"})`).join(", ")}`);

  const angularPath = path.join(root, "angular.json");
  if (fileExists(root, angularPath)) {
    const content = readFileSafe(root, angularPath, diagnostics);
    try {
      const config = content ? JSON.parse(content) : null;
      const projects = config && config.projects && typeof config.projects === "object" ? Object.entries(config.projects) : [];
      if (projects.length) {
        lines.push(`- **Angular projects:** ${projects.slice(0, 10).map(([name, project]) => {
          const type = project && project.projectType ? ` (${cleanText(project.projectType)})` : "";
          const sourceRoot = project && project.sourceRoot ? ` at ${inlineCode(project.sourceRoot)}` : "";
          return `${inlineCode(name)}${type}${sourceRoot}`;
        }).join(", ")}`);
      }
    } catch {
      diagnostics.parseErrors = (diagnostics.parseErrors || 0) + 1;
    }
  }

  const angularFiles = production.filter(isAngularSource).length;
  const expressFiles = production.filter((source) => /(?:from\s*["']express["']|require\s*\(\s*["']express["']\s*\))/.test(stripComments(source.content))).length;
  const supabaseFunctionFiles = production.filter((source) => source.relativePath.split(path.sep).slice(0, 2).join("/") === "supabase/functions").length;
  const frameworkEvidence = [];
  if (angularFiles) frameworkEvidence.push(`Angular APIs in ${angularFiles} ${angularFiles === 1 ? "file" : "files"}`);
  if (expressFiles) frameworkEvidence.push(`Express imports in ${expressFiles} ${expressFiles === 1 ? "file" : "files"}`);
  if (supabaseFunctionFiles) frameworkEvidence.push(`Supabase function code in ${supabaseFunctionFiles} ${supabaseFunctionFiles === 1 ? "file" : "files"}`);
  if (frameworkEvidence.length) lines.push(`- **Framework locations:** ${frameworkEvidence.join("; ")}`);

  const entryPoints = production.filter((source) => {
    const segments = source.relativePath.split(path.sep);
    return /^(?:main|server)\.[cm]?[jt]s$/.test(path.basename(source.path)) || (path.basename(source.path) === "index.ts" && segments.length <= 2);
  }).map((source) => source.relativePath).slice(0, 12);
  if (entryPoints.length) lines.push(`- **Likely entry points:** ${entryPoints.map(inlineCode).join(", ")}`);
  return lines.join("\n");
}

function listDirectories(root, candidate, limit = 20) {
  if (!dirExists(root, candidate)) return [];
  try {
    return fs.readdirSync(candidate, { withFileTypes: true }).filter((entry) => entry.isDirectory() && !entry.isSymbolicLink()).map((entry) => entry.name).sort().slice(0, limit);
  } catch {
    return [];
  }
}

function detectBackendInfra(root, diagnostics) {
  const lines = [];
  const supabase = path.join(root, "supabase");
  if (dirExists(root, supabase)) {
    lines.push("**Supabase**");
    if (fileExists(root, path.join(supabase, "config.toml"))) lines.push("- `supabase/config.toml` present");
    const migrationsDir = path.join(supabase, "migrations");
    if (dirExists(root, migrationsDir)) {
      let migrations = [];
      try {
        migrations = fs.readdirSync(migrationsDir, { withFileTypes: true }).filter((entry) => entry.isFile() && /\.(?:sql|ts)$/.test(entry.name)).map((entry) => entry.name).sort();
      } catch {
        diagnostics.unreadable++;
      }
      lines.push(`- Migrations: **${migrations.length}** file(s)`);
      if (migrations.length) lines.push(`- Latest by filename order: ${migrations.slice(-3).reverse().map(inlineCode).join(", ")}`);
    }
    const functions = listDirectories(root, path.join(supabase, "functions"));
    const edgeFunctions = functions.filter((name) => !name.startsWith("_"));
    const supportDirectories = functions.filter((name) => name.startsWith("_"));
    if (edgeFunctions.length) lines.push(`- Edge functions: ${edgeFunctions.map(inlineCode).join(", ")}`);
    if (supportDirectories.length) lines.push(`- Shared/support directories: ${supportDirectories.map(inlineCode).join(", ")}`);
    if (fileExists(root, path.join(supabase, "seed.sql"))) lines.push("- `supabase/seed.sql` present");
    lines.push("");
  }

  const dockerFiles = ["Dockerfile", "docker-compose.yml", "docker-compose.yaml", "compose.yml", "compose.yaml", ".dockerignore"].filter((file) => fileExists(root, path.join(root, file)));
  if (dockerFiles.length) lines.push(`**Docker:** ${dockerFiles.map(inlineCode).join(", ")}`, "");

  const envFiles = [".env", ".env.example", ".env.sample", ".env.local", ".env.development", ".env.staging", ".env.production", ".env.test"].filter((file) => fileExists(root, path.join(root, file)));
  if (envFiles.length) {
    const example = envFiles.find((file) => /example|sample/.test(file));
    let keyNote = "";
    if (example) {
      const content = readFileSafe(root, path.join(root, example), diagnostics);
      const count = content ? content.split("\n").filter((line) => /^[A-Z_][A-Z0-9_]*\s*=/.test(line.trim())).length : 0;
      keyNote = ` (${count} documented keys)`;
    }
    lines.push(`**Environment files:** ${envFiles.map(inlineCode).join(", ")}${keyNote}`, "");
  }
  return lines.join("\n").trim();
}

function parseYaml(content, diagnostics) {
  if (!content || !YAML) return null;
  try {
    return YAML.parse(content);
  } catch {
    diagnostics.parseErrors = (diagnostics.parseErrors || 0) + 1;
    return null;
  }
}

function detectCICD(root, diagnostics) {
  const lines = [];
  const workflowsDir = path.join(root, ".github", "workflows");
  if (dirExists(root, workflowsDir)) {
    let files = [];
    try {
      files = fs.readdirSync(workflowsDir).filter((file) => /\.(?:yml|yaml)$/.test(file)).sort().slice(0, 20);
    } catch {
      diagnostics.unreadable++;
    }
    if (files.length) {
      lines.push("**GitHub Actions**");
      for (const file of files) {
        const content = readFileSafe(root, path.join(workflowsDir, file), diagnostics);
        const parsed = parseYaml(content, diagnostics);
        const name = parsed && typeof parsed.name === "string" ? cleanText(parsed.name) : inlineCode(file);
        const jobs = parsed && parsed.jobs && typeof parsed.jobs === "object" ? Object.keys(parsed.jobs).slice(0, 12) : [];
        const triggerValue = parsed ? (parsed.on ?? parsed.true) : null;
        const triggers = typeof triggerValue === "string" ? [triggerValue] : Array.isArray(triggerValue) ? triggerValue : triggerValue && typeof triggerValue === "object" ? Object.keys(triggerValue) : [];
        const detail = parsed ? `${triggers.length ? ` [${triggers.map(cleanText).join(", ")}]` : ""}${jobs.length ? ` - jobs: ${jobs.map(inlineCode).join(", ")}` : ""}` : " - details unavailable without valid YAML parsing";
        lines.push(`- ${name} (${inlineCode(file)})${detail}`);
      }
      lines.push("");
    }
  }

  const simpleConfigs = [
    [".gitlab-ci.yml", "GitLab CI"], ["bitbucket-pipelines.yml", "Bitbucket Pipelines"],
    [".circleci/config.yml", "CircleCI"], ["azure-pipelines.yml", "Azure Pipelines"],
    ["azure-pipelines.yaml", "Azure Pipelines"],
  ];
  for (const [file, label] of simpleConfigs) {
    if (!fileExists(root, path.join(root, file))) continue;
    const content = readFileSafe(root, path.join(root, file), diagnostics);
    const parsed = parseYaml(content, diagnostics);
    let detail = "";
    if (parsed && parsed.jobs && typeof parsed.jobs === "object") detail = ` - jobs: ${Object.keys(parsed.jobs).slice(0, 12).map(inlineCode).join(", ")}`;
    lines.push(`**${label}:** ${inlineCode(file)}${detail}`);
  }

  const deploy = [];
  for (const [file, label] of [["vercel.json", "Vercel"], ["netlify.toml", "Netlify"], ["render.yaml", "Render"], ["fly.toml", "Fly.io"]]) {
    if (fileExists(root, path.join(root, file))) deploy.push(`${inlineCode(file)} (${label})`);
  }
  try {
    const appHostingFiles = fs.readdirSync(root).filter((file) => /^apphosting(?:\.[\w-]+)?\.ya?ml$/.test(file) && fileExists(root, path.join(root, file)));
    for (const file of appHostingFiles) deploy.push(`${inlineCode(file)} (Firebase App Hosting)`);
  } catch {
    diagnostics.unreadable++;
  }
  if (dirExists(root, path.join(root, ".vercel"))) deploy.push("`.vercel/` (Vercel)");
  if (deploy.length) {
    if (lines.length && lines.at(-1) !== "") lines.push("");
    lines.push(`**Deploy configuration:** ${deploy.join(", ")}`);
  }
  return lines.join("\n").trim();
}

function detectTestingSetup(root, packages, diagnostics, sources) {
  const lines = [];
  const packageRoots = packages.length ? packages.map((item) => item.root) : [root];
  const configChecks = [
    ["playwright.config.ts", "Playwright"], ["playwright.config.js", "Playwright"], ["playwright.config.mts", "Playwright"],
    ["vitest.config.ts", "Vitest"], ["vitest.config.js", "Vitest"], ["vitest.config.mts", "Vitest"],
    ["jest.config.ts", "Jest"], ["jest.config.js", "Jest"], ["jest.config.mjs", "Jest"],
    ["cypress.config.ts", "Cypress"], ["cypress.config.js", "Cypress"], ["cypress.config.mts", "Cypress"], ["karma.conf.js", "Karma"],
  ];
  const dependencyChecks = [
    ["@playwright/test", "Playwright"], ["playwright", "Playwright"], ["vitest", "Vitest"],
    ["jest", "Jest"], ["cypress", "Cypress"], ["karma", "Karma"], ["jasmine-core", "Jasmine"],
  ];
  const sortedRoots = [...packageRoots].sort((a, b) => b.length - a.length);
  const specSources = sources.filter((source) => /\.(?:spec|test)\.(?:[cm]?[jt]sx?)$/.test(source.path));

  for (const packageRoot of packageRoots) {
    const found = new Map();
    const playwrightTestDirectories = [];
    const packageInfo = packages.find((item) => item.root === packageRoot);
    const allDependencies = packageInfo ? { ...(packageInfo.pkg.dependencies || {}), ...(packageInfo.pkg.devDependencies || {}) } : {};
    for (const [dependency, label] of dependencyChecks) {
      if (allDependencies[dependency] && !found.has(label)) found.set(label, label);
    }
    for (const [file, label] of configChecks) {
      const configPath = path.join(packageRoot, file);
      if (!fileExists(root, configPath)) continue;
      let detail = "";
      if (label === "Playwright") {
        const content = readFileSafe(root, configPath, diagnostics);
        const baseUrl = content ? (content.match(/baseURL\s*:\s*["'`]([^"'`]+)["'`]/) || [])[1] : null;
        const testDir = content ? (content.match(/\btestDir\s*:\s*["'`]([^"'`]+)["'`]/) || [])[1] : null;
        const details = [];
        if (baseUrl) details.push(`base origin: ${inlineCode(redactUrl(baseUrl))}`);
        if (testDir) {
          const resolvedTestDir = path.resolve(packageRoot, testDir);
          if (isInside(packageRoot, resolvedTestDir)) {
            playwrightTestDirectories.push(resolvedTestDir);
            details.push(`test dir: ${inlineCode(path.relative(packageRoot, resolvedTestDir) || ".")}`);
          }
        }
        if (details.length) detail = `, ${details.join(", ")}`;
      }
      found.set(label, `${label} (${inlineCode(file)}${detail})`);
    }

    const angularConfigPath = path.join(packageRoot, "angular.json");
    if (fileExists(root, angularConfigPath)) {
      const content = readFileSafe(root, angularConfigPath, diagnostics);
      try {
        const config = content ? JSON.parse(content) : null;
        for (const project of Object.values((config && config.projects) || {})) {
          const targets = (project && (project.targets || project.architect)) || {};
          const builder = targets.test && (targets.test.builder || targets.test.executor);
          if (builder) found.set(`Angular:${builder}`, `Angular test builder ${inlineCode(builder)}`);
        }
      } catch {
        diagnostics.parseErrors = (diagnostics.parseErrors || 0) + 1;
      }
    }

    const ownedSpecs = specSources.filter((source) => {
      const owner = sortedRoots.find((candidate) => isInside(candidate, source.path));
      return owner === packageRoot;
    });
    const nodeTestSpecs = ownedSpecs.filter((source) => /(?:from\s*["']node:test["']|require\s*\(\s*["']node:test["']\s*\))/.test(stripComments(source.content))).length;
    const scripts = packageInfo ? Object.values(packageInfo.pkg.scripts || {}) : [];
    if (nodeTestSpecs || scripts.some((script) => /\bnode\b[^\n]*\s--test\b/.test(script))) {
      found.set("Node test runner", `Node test runner${nodeTestSpecs ? ` (${nodeTestSpecs} spec${nodeTestSpecs === 1 ? "" : "s"})` : ""}`);
    }
    const e2eSpecs = ownedSpecs.filter((source) =>
      playwrightTestDirectories.some((testDir) => isInside(testDir, source.path)) ||
      relativeSegments(packageRoot, source.path).some((segment) => ["e2e", "playwright", "cypress"].includes(segment))
    ).length;
    const unitSpecs = ownedSpecs.length - e2eSpecs;
    if (found.size || ownedSpecs.length) {
      const counts = [];
      if (unitSpecs) counts.push(`${unitSpecs} colocated/unit spec(s)`);
      if (e2eSpecs) counts.push(`${e2eSpecs} end-to-end spec(s)`);
      lines.push(`- **${inlineCode(path.relative(root, packageRoot) || ".")}:** ${[...found.values()].join(", ") || "framework not identified"}${counts.length ? `; ${counts.join(", ")}` : ""}`);
    }
  }
  return lines.join("\n");
}

function detectMonorepo(root, packages, diagnostics) {
  const lines = [];
  const rootPackage = packages.find((item) => item.relativeRoot === ".");
  if (rootPackage && rootPackage.pkg.workspaces) {
    const workspaces = Array.isArray(rootPackage.pkg.workspaces) ? rootPackage.pkg.workspaces : rootPackage.pkg.workspaces.packages || [];
    lines.push(`- **Package workspaces:** ${workspaces.map(inlineCode).join(", ")}`);
  }
  const pnpmPath = path.join(root, "pnpm-workspace.yaml");
  if (fileExists(root, pnpmPath)) {
    const parsed = parseYaml(readFileSafe(root, pnpmPath, diagnostics), diagnostics);
    const packageGlobs = parsed && Array.isArray(parsed.packages) ? parsed.packages : [];
    lines.push(`- **pnpm workspace:** ${packageGlobs.length ? packageGlobs.map(inlineCode).join(", ") : "present; package globs unavailable"}`);
  }
  for (const [file, label] of [["turbo.json", "Turborepo"], ["nx.json", "Nx"], ["lerna.json", "Lerna"], ["rush.json", "Rush"]]) {
    if (fileExists(root, path.join(root, file))) lines.push(`- **${label}:** ${inlineCode(file)}`);
  }
  const children = packages.filter((item) => item.relativeRoot !== ".");
  if (children.length) lines.push(`- **Discovered package roots:** ${children.map((item) => inlineCode(item.relativeRoot)).join(", ")}`);
  return lines.join("\n");
}

function visibleTreeEntries(dir) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
      .filter((entry) => !entry.isSymbolicLink() && !isIgnoredEntryName(entry.name) && !LOCK_FILES.has(entry.name) && (!entry.name.startsWith(".") || [".github", ".storybook"].includes(entry.name)))
      .sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name));
  } catch {
    return [];
  }
  return entries;
}

function appendTreeArea(dir, prefix, depth, state, areaLimit) {
  if (depth > 2 || state.lines.length >= MAX_TREE_LINES - 1 || state.areaLines >= areaLimit) return;
  const entries = visibleTreeEntries(dir);
  for (let index = 0; index < entries.length; index++) {
    if (state.lines.length >= MAX_TREE_LINES - 1 || state.areaLines >= areaLimit) {
      state.lines.push(`${prefix}...`);
      state.areaLines++;
      return;
    }
    const entry = entries[index];
    const last = index === entries.length - 1;
    state.lines.push(`${prefix}${last ? "`-- " : "|-- "}${cleanLiteral(entry.name)}${entry.isDirectory() ? "/" : ""}`);
    state.areaLines++;
    if (entry.isDirectory()) appendTreeArea(path.join(dir, entry.name), prefix + (last ? "    " : "|   "), depth + 1, state, areaLimit);
  }
}

function generateTree(root) {
  const state = { lines: [`${cleanLiteral(path.basename(root))}/`], areaLines: 0 };
  const rootEntries = visibleTreeEntries(root);
  const rootFiles = rootEntries.filter((entry) => entry.isFile());
  const filePriority = ["package.json", "angular.json", "nx.json", "vite.config.ts", "tsconfig.json", "playwright.config.ts", "README.md", "AGENTS.md"];
  rootFiles.sort((a, b) => {
    const aPriority = filePriority.indexOf(a.name);
    const bPriority = filePriority.indexOf(b.name);
    return (aPriority === -1 ? 100 : aPriority) - (bPriority === -1 ? 100 : bPriority) || a.name.localeCompare(b.name);
  });
  for (const file of rootFiles.slice(0, 8)) state.lines.push(`|-- ${cleanLiteral(file.name)}`);

  const directoryPriority = ["src", "apps", "packages", "libs", "supabase", "server", "backend", "api", "scraping", "tests", "test", "e2e", ".github", "public"];
  const rootDirectories = rootEntries.filter((entry) => entry.isDirectory()).sort((a, b) => {
    const aPriority = directoryPriority.indexOf(a.name);
    const bPriority = directoryPriority.indexOf(b.name);
    return (aPriority === -1 ? 100 : aPriority) - (bPriority === -1 ? 100 : bPriority) || a.name.localeCompare(b.name);
  });
  const shownDirectories = rootDirectories.slice(0, 8);
  for (const directory of shownDirectories) {
    if (state.lines.length >= MAX_TREE_LINES - 2) break;
    state.lines.push(`|-- ${cleanLiteral(directory.name)}/`);
    state.areaLines = 0;
    appendTreeArea(path.join(root, directory.name), "|   ", 1, state, 5);
  }
  if (rootDirectories.length > shownDirectories.length) state.lines.push(`... (${rootDirectories.length - shownDirectories.length} additional top-level directories omitted)`);
  if (rootFiles.length > 8) state.lines.push(`... (${rootFiles.length - 8} additional root files omitted)`);
  if (state.lines.length > MAX_TREE_LINES) state.lines = state.lines.slice(0, MAX_TREE_LINES - 1).concat(`... (tree capped at ${MAX_TREE_LINES} lines)`);
  return state.lines.join("\n");
}

function diagnosticReport(diagnostics) {
  const notes = [
    `Scanned ${diagnostics.loaded} source files (${diagnostics.production} production, ${diagnostics.nonProduction} non-production), ${Math.round(diagnostics.bytes / 1024)} KiB.`,
  ];
  if (diagnostics.skippedLarge) {
    const paths = diagnostics.skippedLargePaths.length ? `: ${diagnostics.skippedLargePaths.map(inlineCode).join(", ")}` : ".";
    notes.push(`Skipped ${diagnostics.skippedLarge} oversized file(s)${paths}`);
  }
  if (diagnostics.unreadable) notes.push(`Could not read ${diagnostics.unreadable} files or directories.`);
  if (diagnostics.parseErrors) notes.push(`Could not parse ${diagnostics.parseErrors} configuration files.`);
  if (diagnostics.limitReached) notes.push(`Scan truncated at ${diagnostics.limitReason}.`);
  if (!YAML) notes.push("Structured YAML parsing unavailable; detailed YAML findings may be omitted.");
  return notes.map((note) => `- ${note}`).join("\n");
}

function assembleReport(title, sections) {
  const output = [`# Repo Context: ${cleanText(title)}`, ""];
  for (const [heading, content] of sections) {
    if (!content) continue;
    const block = [`## ${heading}`, "", content, ""];
    const candidateLineCount = [...output, ...block].join("\n").split("\n").length;
    if (candidateLineCount > MAX_OUTPUT_LINES - 2) {
      output.push(`## ${heading}`, "", `_Section omitted to preserve the ${MAX_OUTPUT_LINES}-line report budget._`, "");
      continue;
    }
    output.push(...block);
  }
  return output.join("\n").trimEnd();
}

function generateReport(rootInput) {
  const root = resolveRoot(rootInput);
  if (!dirExists(root, root)) throw new Error(`"${root}" is not a valid directory.`);
  const { sources, diagnostics } = loadSourceFiles(root);
  const packages = readPackages(root, diagnostics);
  const sections = [
    ["Tech Stack", detectTechStack(root, packages, diagnostics)],
    ["Detected Patterns", detectPatterns(sources)],
    ["Conventions", detectConventions(root, sources)],
    ["Architecture & Topology", detectArchitecture(root, sources, diagnostics)],
    ["Backend & Infrastructure", detectBackendInfra(root, diagnostics)],
    ["CI / CD", detectCICD(root, diagnostics)],
    ["Testing Setup", detectTestingSetup(root, packages, diagnostics, sources)],
    ["Monorepo / Workspaces", detectMonorepo(root, packages, diagnostics)],
    ["Project Structure", `\`\`\`text\n${generateTree(root)}\n\`\`\``],
    ["Scan Notes", diagnosticReport(diagnostics)],
  ];
  return assembleReport(path.basename(root), sections);
}

function main() {
  try {
    console.log(generateReport(process.argv[2]));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  classifySource,
  cleanText,
  generateReport,
  redactUrl,
  scoreConvention,
};
