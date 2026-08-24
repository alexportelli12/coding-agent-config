---
name: workflow-for-alex
description: Design and evolve Alex's global coding-agent workflow configuration. Use when auditing or changing AGENTS.md, agents, commands, skills, PRP orchestration, validation ownership, or workflow governance.
metadata:
  opencode/autoinvoke: false
---

# Workflow Governance

## Governing objective

The workflow helps capable agents produce maintainable, high-quality software
while keeping active context high-signal. Optimise for:

- clear ownership;
- minimal relevant context;
- strong repository evidence;
- deterministic enforcement where possible;
- executable behavioural protection;
- independent judgement where automation cannot decide;
- bounded orchestration; and
- low unnecessary ceremony.

Humans should make product decisions and resolve real trade-offs, not become
routine code-quality bottlenecks. Do not optimise for autonomy or short prompts
as ends in themselves. The objective is maximum useful signal with the minimum
context and ceremony required for the outcome.

## Ownership model

Use this hierarchy when deciding where information or responsibility belongs:

| Owner | Responsibility |
| --- | --- |
| `AGENTS.md` | Durable cross-project engineering judgement |
| Repository code, config, and docs | Repository-specific truth |
| `repo-context` | Observational repository evidence |
| Deterministic tooling and `verify` | Mechanical invariants |
| Tests | Executable behavioural specifications |
| Skills | Specialist expertise |
| Agents | Specialist roles |
| Commands | Workflow orchestration |
| PRPs | Temporary feature requirements, decisions, and acceptance criteria |
| Human | Product intent, unresolved trade-offs, and final product validation |

Every instruction needs a legitimate owner. Avoid repeating an instruction in
multiple layers unless both layers independently need it, such as reviewer
severity semantics. The target is not zero duplicated words; it is zero
ambiguous ownership.

The workflow skill is the architectural and governance source of truth for this
configuration. It does not replace `AGENTS.md`, specialist expertise, reviewer
protocols, repository validation, or task contracts.

## Decision ladder

When a rule or piece of knowledge is being added, move it toward the strongest
appropriate enforcement or evidence layer:

```text
prose instruction
    -> repository fact or config
    -> compiler, linter, or architecture check
    -> test or executable specification
    -> metric or quality gate
    -> permission boundary
    -> agent judgement
    -> human judgement
```

This is not a demand to automate everything. Some concerns are inherently
judgement-based. Ask whether a concern can be reliably established by
something stronger than asking an LLM to remember prose. If so, prefer that
mechanism and remove the weaker duplicate where practical.

## Context economy

Context is a resource. Every persistent instruction must materially improve a
decision. Prefer progressive disclosure, specialist skills loaded only when
relevant, repository inspection over copied facts, concise role definitions,
temporary task contracts, and fresh evidence at decision boundaries.

Avoid giant universal files, framework tutorials for capable models, duplicated
validation instructions, permanent planning artifacts, stale repository
summaries, speculative rules, and loading every specialist skill for every task.
Shorter is not automatically better: intentionally loaded expertise should stay
detailed when it improves decisions. Optimise active context, not byte count.

## Repository-first reasoning

The repository is authoritative for its own implementation. Global guidance
must not impose architecture, APIs, or tooling choices over an intentional
local approach. Resolve decisions using this precedence:

1. explicit task or product requirement;
2. documented repository or product principle;
3. intentional local or feature pattern;
4. repository-wide evidence;
5. specialist expertise;
6. generic preference.

`repo-context` reports observations with evidence and uncertainty; it does not
make architecture decisions. A newer API or fashionable pattern is not an
improvement merely because it is newer.

## Deterministic quality contract

Repositories using the PRP workflow expose `npm run verify`. The repository
owns what that command contains. It may combine formatting, lint, type checks,
tests, builds, architecture boundaries, duplication or complexity signals,
security checks, secrets detection, or other appropriate invariants. These are
examples, not a universal gauntlet.

The global invariant is the interface: `npm run verify` is the repository's
authoritative deterministic quality contract. PRP execution requires a green
baseline before implementation and a green final result afterward. Do not
duplicate repository-specific checks in global prose or add project tooling
from this configuration.

Shared execution tooling may own how repository-selected checks run and report,
but it must not select the checks. In this configuration, OpenCode's global
shell environment exposes `scripts/verify-runner` on `PATH`, so a repository can
keep its policy in its own manifest, for example:

```json
"verify": "verify-runner --check format \"npm run format:check\" --check lint \"npm run lint\" --check test \"npm test\""
```

The runner suppresses captured output for successful checks and preserves it for
failures. This output policy belongs to deterministic tooling, not to agent
instructions. `npm run verify` remains the only workflow gate agents invoke.
Each `--check` receives one name and one command string; repository manifests
should quote command arguments when needed so the runner receives them intact.
Repositories used outside this OpenCode environment need an equivalent
`PATH` setup or an explicit local adapter; committed manifests should not point
at a user's `~/.config/opencode` path.

Metrics such as CRAP score and duplication are bounded signals, not global
ideology. Prefer scoped or differential enforcement where practical, calibrate
thresholds against real repositories, and do not make legacy code block
unrelated work without evidence. Do not turn this global configuration into a
project gauntlet or add CRAP, duplication, or security tooling here; evaluate
such mechanisms in the repository that owns the code.

## Behaviour and judgement

Important deterministic behaviour acceptance criteria should graduate into
appropriate executable specifications when they are reasonably testable. Use
the cheapest test level that meaningfully proves the behaviour; E2E is
risk-triggered rather than universal. This is behaviour-first, not mandatory
test-first development.

Architectural appropriateness, unnecessary complexity, maintainability, UI
hierarchy, usability, and visual coherence cannot always be reduced to
deterministic checks. Use independent reviewer judgement when it materially
improves confidence. Implementers implement; reviewers judge. Reviewer findings
are evidence to investigate, not commands to obey blindly.

## Orchestration economy

Agents and subagents cost context, latency, tokens, duplicated work, and
possible disagreement. Use them when role separation or specialist expertise
materially improves the result, not merely because they exist. Specialists use
targeted checks while implementing; they do not duplicate the full gauntlet.
The orchestrator owns final verification. Independent reviewers run only when
the change warrants them, and remediation loops remain bounded.

## Temporary task artifacts

PRPs are temporary task contracts, not permanent repository documentation. If
implementation reveals enduring knowledge, graduate it to its proper owner:

- behaviour -> test;
- mechanical invariant -> tooling;
- architecture decision -> repository documentation or configuration;
- recurring specialist judgement -> skill;
- repository fact -> repository itself;
- workflow principle -> this skill.

Do not preserve PRPs as historical context and do not automatically delete
them. The user decides when task artifacts can be discarded.

## Evidence-driven evolution

Change the workflow in response to observed failures or recurring friction, not
hypothetical completeness. Classify a failure before adding an instruction:

| Failure | Likely owner to investigate |
| --- | --- |
| Deterministic behaviour miss | Test or executable-spec gap |
| Type, lint, or mechanical issue | `verify` tooling gap |
| Repeated architecture violation | Architecture enforcement or reviewer gap |
| Repeated Angular reasoning failure | Angular skill gap |
| Visual, responsive, or usability miss | UI implementation or review gap |
| Contradictory instructions | Governance or ownership gap |
| Repeated unnecessary agent work | Orchestration gap |

Ask:

1. What failed, and what evidence shows it?
2. Which layer should have caught it?
3. Is it recurring enough to justify a workflow change?
4. Can a deterministic mechanism own it?
5. If prose is necessary, which single layer owns it?
6. What existing instruction can be removed or replaced?

Do not answer every failure by adding another prompt sentence. Prefer
substitution, movement, consolidation, or deletion.

Human product validation follows the same discipline. If it finds a problem
after all gates pass, fix the feature and consider whether the failure class
belongs in an executable specification, tooling, specialist guidance,
reviewer guidance, product/UX principles, or workflow governance. One isolated
mistake does not automatically justify a global change.

## Calibration and audit

Trust in the workflow must remain evidence-based. Occasionally examine real
completed work that passed the workflow and ask whether important issues
escaped. This is calibration, not another mandatory per-PRP gate. Calibrate
future metric thresholds against real repository evidence.

Do not introduce scheduled audits, mandatory percentages, arbitrary ceremony,
new reviewer agents, or new tooling in this skill without evidence and a
separate justified decision.

## Evolving the configuration

Before changing workflow configuration, inspect the current relevant files and
all instructions touching the concern. Identify the current owner, classify
the issue, and check whether an existing instruction can be replaced or moved.
When responsibility moves, establish the new authoritative owner, remove
obsolete duplicates, search for stale references, and validate the resulting
configuration as a whole.

Audit semantic meaning, not just matching text. Candidate overlaps can be found
with searches, but contradiction requires reasoning about scope and exceptions.
If a proposed change would materially redesign the architecture or lacks
evidence, report it rather than silently expanding the task. "No meaningful
workflow change is justified" is a valid conclusion.
