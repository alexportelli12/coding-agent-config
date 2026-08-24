# coding-agent-config

Global OpenCode configuration for Alex's coding-agent workflow. It is a small
orchestration layer for repository-first software work: agents investigate the
repository that owns the code, keep changes bounded, use deterministic checks
where possible, and reserve judgement calls for independent reviewers and the
human product owner.

This repository does not define an application's architecture or a consuming
repository's validation commands. The active repository remains the source of
truth for its code, patterns, product behavior, and `npm run verify`
implementation.

## Workflow

The explicit PRP path is:

```text
request
  -> investigate repository and affected feature
  -> generate a temporary PRP when a task needs a requirements contract
  -> execute with a green verification baseline
  -> implement within scope and add important behavioral proof
  -> run the repository's npm run verify
  -> inspect the rendered UI when the change is meaningfully user-facing
  -> obtain applicable independent engineering and/or UI judgement
  -> remediate bounded findings and re-verify
  -> human product validation
```

The orchestrating agent owns investigation, implementation, delegation,
remediation, and final deterministic verification. Specialists run targeted
checks useful to their work; they do not duplicate the repository's full
verification gate. Small or mechanical work does not automatically require a
PRP or an independent review.

### PRPs

PRPs (Product Requirement Prompts) are temporary task contracts, not permanent
documentation or implementation plans. Use [`/prp.generate`](commands/prp.generate.md)
when a feature benefits from explicit investigation, decisions, and acceptance
criteria. The command requires the target repository to expose `npm run verify`,
uses [`repo-context`](skills/repo-context/SKILL.md), and writes the PRP to the
repository's existing gitignored location, normally `.ai/planning/prp/`.

The PRP records the goal, requirements, meaningful decisions, observable
behavior and experience acceptance criteria, real constraints, and relevant
edge cases. It deliberately does not prescribe implementation steps or test
technology. The user decides when to discard a completed PRP; execution does
not delete it automatically.

Use [`/prp.execute`](commands/prp.execute.md) to read and implement a PRP. It
requires a fresh repository investigation and a green `npm run verify` before
code changes. It runs the same gate after implementation, re-reads the PRP,
and inspects the final diff before entering any applicable review steps.

## Verification And Review

### Deterministic gate

`npm run verify` is the authoritative deterministic quality contract for the
repository being changed. That repository owns which formatter, linter, type
check, test, build, architecture, security, or other checks it contains. This
configuration must not turn that contract into a global gauntlet or add checks
to a project that does not own them.

The shared runner in [`scripts/verify.mjs`](scripts/verify.mjs) supports that
contract. A repository can expose named checks through its own npm script and
invoke them as `verify-runner --check <name> <npm-script> ...`. The runner:

- executes checks sequentially and stops at the first failure;
- keeps successful command output quiet while reporting check progress;
- preserves failed stdout and stderr, the failed command, and its exit status;
- forwards termination signals; and
- works through [`scripts/verify-runner.cmd`](scripts/verify-runner.cmd) on
  Windows.

The [`verify-env` plugin](plugins/verify-env.mjs) prepends `scripts/` to the
shell `PATH`, making the shared runner available to shell commands. The
runner's behavior is covered by [`scripts/verify.test.mjs`](scripts/verify.test.mjs).
The global configuration provides this runner, but does not itself define a
root `npm run verify` script.

### Judgement gates

Deterministic checks establish mechanical invariants and executable behavior;
they do not reliably establish architectural fit, unnecessary complexity,
maintainability, information hierarchy, usability, or visual coherence.

After verification, the workflow adds judgement only when the change warrants
it:

| Change | Additional evidence |
| --- | --- |
| Meaningful user-facing work | Browser inspection of affected routes and states at representative desktop and mobile sizes, after verification. This is rendered evidence, not E2E or visual-regression infrastructure. |
| Substantial engineering, architectural, integration, state, security, or maintainability work | Independent [`engineering-reviewer`](agent/engineering-reviewer.md). |
| Meaningful user-facing work | Independent [`ui-reviewer`](agent/ui-reviewer.md), using fresh review context after rendered inspection. |

Reviewers judge and do not edit or implement fixes. Findings are evidence to
investigate, not commands to follow blindly. High/blocker and medium findings
must be resolved or shown not to apply; remediation is bounded to two passes
per judgement gate. Any remediation that changes code requires another full
`npm run verify`. The workflow finishes by returning the result to the human
for product validation; passing checks and reviews do not decide product
intent or unresolved trade-offs.

## Agents And Skills

### Agents

- [`documentation`](agent/documentation.md) writes concise, high-signal
  documentation and generates PRPs without implementing feature work.
- [`engineering-reviewer`](agent/engineering-reviewer.md) independently reviews
  substantial completed work for scope-relevant engineering risks. It is
  read-only and does not run the full verification suite.
- [`ui-designer`](agent/ui-designer.md) implements repository-grounded UI work,
  using targeted checks and rendered inspection when available. The orchestrator
  still owns final verification and independent UI review.
- [`ui-reviewer`](agent/ui-reviewer.md) independently judges meaningful rendered
  user-facing work. It is read-only and does not turn personal preference into
  a defect.
- The built-in `build` agent executes [`/prp.execute`](commands/prp.execute.md);
  built-in `general` and `explore` are configured to use the session model in
  [`opencode.json`](opencode.json).

### Specialist skills

Skills are loaded progressively and only when their expertise is relevant.

- [`workflow-for-alex`](skills/workflow-for-alex/SKILL.md) governs ownership,
  context economy, repository-first reasoning, deterministic enforcement, and
  bounded orchestration.
- [`repo-context`](skills/repo-context/SKILL.md) produces an observational,
  evidence-based repository map. Its scanner and tests live under
  [`skills/repo-context/`](skills/repo-context/).
- [`angular`](skills/angular/SKILL.md) provides Angular judgement for meaningful
  component, forms, data-access, state, testing, and architecture work. It
  points to concern-specific references under
  [`skills/angular/references/`](skills/angular/references/).
- [`ui-designer`](skills/ui-designer/SKILL.md) covers practical interface
  hierarchy, interaction, accessibility, responsive behavior, and rendered
  validation. Its focused references live under
  [`skills/ui-designer/references/`](skills/ui-designer/references/).
- [`frontend-design`](skills/frontend-design/SKILL.md) supplies distinctive
  visual direction for new or reshaped interfaces; it does not replace the
  practical UI judgement in `ui-designer`.
- [`playwright-tests`](skills/playwright-tests/SKILL.md) guides maintainable
  Playwright tests, selectors, helpers, isolation, and assertions when a
  repository actually uses Playwright.
- [`ux-principles`](skills/ux-principles/SKILL.md) creates or refines a product's
  `UX_PRINCIPLES.md` through repository evidence and focused product-owner
  discovery. [`/ux.principles`](commands/ux.principles.md) uses it without
  modifying product code or the PRP workflow.
- [`skill-creator`](skills/skill-creator/SKILL.md) creates and improves skills,
  including evaluation, comparison, benchmarking, feedback, and packaging
  support. Its bundled agents, scripts, schemas, and viewer are under
  [`skills/skill-creator/`](skills/skill-creator/).

## Boundaries And Ownership

The ownership model is intentional:

- `AGENTS.md` holds durable cross-project engineering judgement and worktree
  boundaries.
- Repository code, configuration, tests, and product documentation own local
  truth, behavior, and mechanical validation.
- Skills provide specialist expertise; agents provide role separation; commands
  provide orchestration; PRPs provide temporary requirements and acceptance
  criteria.
- The human owns product intent, genuine unresolved trade-offs, and final
  product validation.

Keep work scoped to the request and the PRP. Prefer the repository's existing
patterns and capabilities, preserve unrelated user changes, and do not add a
framework, E2E system, or global quality rule as incidental feature work.
Implementers implement; reviewers review. Git history stays under the user's
control: this configuration does not commit, push, merge, rebase, or create
branches unless explicitly requested.

## Structure

| Path | Responsibility |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | Durable engineering judgement, communication expectations, and user-controlled git/worktree boundaries. |
| [`opencode.json`](opencode.json) | OpenCode configuration: model overrides, the local verification plugin, and the headless isolated Playwright MCP server. |
| [`commands/`](commands/) | User-invoked orchestration for PRP generation/execution, UX principles, and workflow audits. |
| [`agent/`](agent/) | File-based custom agent roles, including documentation, implementation/design, and independent reviewers. |
| [`skills/`](skills/) | Progressive specialist guidance plus references, executable helpers, and tests owned by individual skills. |
| [`plugins/`](plugins/) | OpenCode plugin hooks; currently the shell environment hook that exposes shared scripts. |
| [`scripts/`](scripts/) | Cross-repository verification runner and its tests. |
| [`.gitignore`](.gitignore) | Excludes local dependencies/metadata and temporary PRP artifacts such as `.ai/planning/prp/`. |
| `package.json` (local, ignored) | Node package metadata for the OpenCode plugin API dependency when present in the local installation; package metadata and dependencies are not repository-owned. |

For detailed behavior, use the command, agent, or skill file linked above rather
than treating this orientation document as a second instruction source.
