---
name: repo-context
description: Inspect a repository to establish an evidence-based map of its stack, workspace structure, conventions, testing, CI/CD, and infrastructure. Use when a task requires repository-wide context, when the user asks about project architecture or technology choices, or before substantial implementation where local patterns are not yet understood. Do not run for narrow tasks when reading the affected files provides sufficient context.
---

# Repo Context

Build a concise, evidence-based starting map of a repository by scanning source files and configuration. The report complements repository documentation and local code inspection; it does not replace architecture decisions, ADRs, or feature-specific context.

## Usage

```bash
node <skill-base>/scripts/inspect.js [path-to-repo]
```

Defaults to `process.cwd()` if path is omitted. Output the relevant report sections to the user rather than treating the full report as permanent context. Treat strong findings as likely repository defaults, not binding rules. Before applying a finding, inspect the affected area and its closest analogue. Mixed and limited findings require local verification.

The scanner is strongest for JavaScript and TypeScript repositories. Other ecosystems receive manifest and structure detection but may not receive equivalent convention analysis. Report scan limits and uncertainty honestly.

## Report Sections

| Section                        | What it detects                                                                                                                         |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Tech Stack**                 | Root and workspace package manifests, frameworks + versions, key libraries, dev tools, build scripts                                    |
| **Detected Patterns**          | File coverage for state APIs, styling approaches, and async syntax                                                                      |
| **Conventions**                | DI style, I/O style, control flow, independent forms API evidence, templates, change detection, file naming, selector prefixes           |
| **Architecture & Topology**    | Primary source areas, Angular projects, framework locations, likely entry points                                                        |
| **Backend & Infrastructure**   | Supabase (config, migrations, edge functions, shared support), Docker files, env files                                                   |
| **CI / CD**                    | Pipeline names, jobs and triggers plus Vercel, Netlify, Render, Fly.io, and Firebase App Hosting configuration                           |
| **Testing Setup**              | Framework dependencies/configs, Angular and Node test runners, redacted Playwright origin/test directory, unit and end-to-end counts    |
| **Monorepo / Workspaces**      | npm/yarn/pnpm workspaces, Turborepo, Nx, Lerna, Rush; lists packages in `packages/`, `apps/`, `libs/`                                   |
| **Project Structure**          | Budgeted tree prioritising root config and important top-level source areas while filtering generated output                           |

## How to Apply the Report

The **Conventions** table reports what the codebase appears to use, with evidence/coverage. Apply findings according to their confidence:

- **strong** = the pattern appears across multiple eligible files with little/no competing usage. Treat as a likely repository default after checking relevant local code.
- **mixed** = both approaches are established. Inspect the affected feature and match the closest intentional pattern.
- **limited** = too little evidence exists to infer a repository rule. Do not turn it into a constraint.

A lack of explicit syntax is not proof that the alternative is absent (for example, Angular default change detection is often implicit).

Use detected conventions as defaults after checking relevant local code. Key mappings:

| If report says...                  | Then in new code...                                             |
| ---------------------------------- | --------------------------------------------------------------- |
| DI: inject() strong                | Prefer inject() unless local code intentionally differs         |
| I/O: input()/output() strong       | Prefer input()/output() unless local code intentionally differs |
| State: Signals dominant            | Inspect where Signals occur and prefer the local state pattern  |
| State: RxJS subjects dominant      | Inspect their role; do not infer all state should use subjects  |
| Styling: Less                      | Prefer Less where the affected area follows that pattern        |
| Forms evidence lists approaches    | Inspect the affected form; Signal, reactive, and template-driven forms may coexist |
| Templates: External strong         | Prefer templateUrl                                              |
| Selector prefix: tf-               | All new component selectors start with tf-                      |
| File naming: no .component. suffix | Name files header.ts, not header.component.ts                   |

For CI/CD, verify detected pipeline names and job identifiers in the workflow file before reusing them.

For Supabase, use migration and edge-function findings to locate the backend surface, then inspect the relevant files before making schema or API decisions.

## Extending

Edit `PATTERN_DEFS` or `CONVENTION_PAIRS` at the top of `scripts/inspect.js`:

```js
// Pattern counting (which approach is dominant)
const PATTERN_DEFS = {
  Category: { "Label A": [/regex/], "Label B": [/regex/] },
};

// Convention pairs (A vs B, winner becomes the rule)
const CONVENTION_PAIRS = [
  {
    category: "Name",
    scope: "typescript",
    a: { label: "X", re: /x/ },
    b: { label: "Y", re: /y/ },
  },
];
```
