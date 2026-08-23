# repo-context

Give coding agents an evidence-based starting map of a repository before they make repository-wide implementation decisions.

## The problem

You have probably been here before: you open a TypeScript or JavaScript repo you did not write, and the first hour disappears into reading `package.json`, hunting for where components live, and guessing which patterns the team actually follows.

- Do they use Signals or RxJS?
- `inject()` or constructor DI?
- Tailwind, SCSS, or Less?
- Where are the tests? Which CI pipeline runs them?
- Is this a monorepo? What are the workspace boundaries?

An AI coding agent can otherwise make an early guess that does not match the surrounding style and spend time correcting it.

## The cost of guessing wrong

Bad first guesses compound quickly:

- Code that mixes `input()` with `@Input` in the same codebase
- Tests written in the wrong framework or directory
- CI workflows that ignore the team's naming conventions
- Manual context docs like `architecture.md` that were accurate six months ago and are now quietly wrong

That last one is especially painful. Hand-written context documents are a kindness to future developers, but they rot the moment the code moves on.

## The solution

`repo-context` scans source files and configuration, then produces a concise Markdown report with evidence and confidence signals.

The report complements repository documentation rather than replacing ADRs, architecture notes, or feature-specific inspection.

Run it when a task needs repository-wide context to get a map of the tech stack, observed conventions, CI/CD, testing setup, backend infrastructure, and workspace structure. The scanner is strongest for JavaScript and TypeScript projects; findings in other ecosystems may be less complete.

## What it detects

| Area | What you learn |
|------|----------------|
| **Tech stack** | Package manager, frameworks, versions, key libraries, dev tools, and validation scripts from package manifests and configs |
| **Patterns** | File coverage for state APIs, styling approaches, and async syntax |
| **Conventions** | Dependency injection, component I/O, control flow, independent forms API evidence, templates, change detection, naming, and selector prefixes |
| **Architecture** | Primary source areas, Angular projects, framework locations, and likely entry points |
| **Backend & infra** | Supabase config, migrations, edge functions and shared support, Docker, and env files |
| **CI/CD** | GitHub Actions, GitLab CI, CircleCI, Azure Pipelines, and common deployment configuration including Firebase App Hosting |
| **Testing** | Framework dependencies/configs, Angular and Node test runners, redacted Playwright origins/test directories, and unit versus end-to-end counts |
| **Monorepo** | npm/yarn/pnpm workspaces, Turborepo, Nx, Lerna, Rush, plus packages in `packages/`, `apps/`, `libs/` |
| **Structure** | Budgeted tree that prioritises root configuration and important source areas while filtering generated reports |

## Usage

```bash
node scripts/inspect.js [path-to-repo]
```

Omit the path to scan the current working directory:

```bash
node scripts/inspect.js
```

The report is written to stdout. In an OpenCode session, use relevant findings as an initial context map and verify them against the affected code before applying them.

## How to read the conventions table

Each convention pair reports observed usage and the strength of its evidence:

- **strong** — multiple eligible files use one approach with little competing
  usage;
- **mixed** — both approaches are established, or files contain both;
- **limited** — there is not enough evidence to infer a repository-wide pattern.

These are repository-wide observations, not architecture rules. Inspect the
affected feature and closest analogue before deciding. An intentional local
pattern may override a broader majority, and missing syntax does not prove the
alternative is absent.

## Limitations

The report is a heuristic starting point, not a complete architectural model. It may miss intentionally local patterns, unsupported configuration syntax, generated code, unusually nested packages, or decisions documented outside source code.

Repository documentation can explain intent and tradeoffs that source scanning cannot infer. Use both when they are available.

## Extending the scan

Add new patterns or convention pairs at the top of `scripts/inspect.js`:

```js
// Count files containing each observed API
const PATTERN_DEFS = {
  "State APIs": {
    Signals: [/\bsignal\s*\(/, /\bcomputed\s*\(/],
    "RxJS subjects": [/\bBehaviorSubject\b/],
  },
};

// Compare two convention alternatives while preserving mixed evidence
const CONVENTION_PAIRS = [
  {
    category: "Dependency Injection",
    scope: "typescript",
    a: { label: "inject()", re: /\binject\s*\(/ },
    b: { label: "Constructor DI", re: /constructor\s*\([^)]*(?:private|public)\s/ },
  },
];
```

## Validation

Run the deterministic scanner tests with Node's built-in test runner:

```bash
node --test tests/inspect.test.js
```

## License

MIT
