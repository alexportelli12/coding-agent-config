---
description: Investigate and implement a request through verified pull request creation
---

# Implement: $ARGUMENTS

Take the request in `$ARGUMENTS` from repository-grounded discovery through a
pull request ready for human product validation. The active session is the task
contract; do not create or persist a planning or requirements artifact.

## Prepare The Isolated Workspace

Before repository discovery or any feature work, run from the launch checkout:

```bash
implementation-workspace prepare --slug "<short-request-slug>"
```

Use `--prefix` only when an already-known repository instruction requires a
different branch prefix. The centralized tool must establish that this is the
clean primary control worktree on the checked-out remote default branch, fetch
the configured remote, fast-forward the local default branch when safe, and
create a collision-safe feature branch in a dedicated locked worktree. Record
its JSON result, especially `worktreePath`, `sessionId`, `branch`,
`defaultBranch`, and `baseSha`, in session context.

From this point onward, run every repository inspection, command, delegated
task, edit, verification, render, review, remediation, and delivery operation
against `worktreePath`, never the control checkout. Pass the exact `sessionId`
to later lifecycle operations; lifecycle operations resolve the owned worktree
from session metadata and may run from any location inside the repository, so
cwd mistakes self-correct instead of failing. If deterministic preparation
fails, report its diagnostic and stop; do not stash, switch branches, improvise
another worktree, or attempt more aggressive Git recovery.

`prepare` copies gitignored local env files (`.env*`) from the control checkout
into the fresh worktree and reports them as `provisionedEnv`. Never invent,
edit, or commit these files; they are machine-local inputs the repository needs
for verification and remain untracked in the worktree.

Workspace preparation intentionally precedes repository discovery so all
repository evidence is gathered from the isolated checkout. Apply branch
naming requirements already present in launch-time instructions; if discovery
later reveals an incompatible hard requirement, stop rather than renaming the
owned branch outside the lifecycle tool.

Prepare dependencies inside the isolated worktree using the repository's
documented deterministic setup when needed. Do not share or link mutable
dependency directories between implementation worktrees.

## Establish The Task Contract

Before changing code:

1. Confirm from the repository's package manifests and workspace configuration
   that `npm run verify` is available from the repository root. It is the
   repository's canonical deterministic quality contract.
2. Load and run `repo-context` for current observational repository evidence.
   Keep its report in session context only.
3. Inspect the affected feature or system, its closest relevant analogues,
   existing architecture, tests or behavioural contracts, local instructions,
   and relevant product or UX principles.
4. Use specialist skills when their expertise materially improves discovery or
   implementation.
5. Derive a concise active contract covering the goal, requirements, meaningful
   resolved decisions, observable behaviour and experience acceptance criteria,
   real constraints, and relevant edge cases. Omit categories that add no value.

If `npm run verify` does not exist, stop and report that the repository does not
satisfy the implementation workflow contract. Do not add it as incidental
feature work.

Treat repository evidence and established product principles as the first
source of answers. Ask the user only about genuine unresolved product behaviour,
UX intent, business rules, architectural choices with product consequences, or
important edge cases that cannot be inferred. Ask the fewest focused questions
necessary. Do not stop for approval of the active contract when the request and
repository evidence are sufficient, and do not ask the user to choose ordinary
implementation details.

Keep the active contract lean enough to remain useful throughout the session.
Do not persist generic repository context, framework tutorials, expected file
lists, implementation steps, test technology, or speculative abstractions.

## Preflight: Green Before Work

Before implementation:

1. Inspect repository-specific contribution, commit, and pull-request
   conventions from the isolated worktree.
2. Run `npm run verify` there.

If the preflight verify fails, stop and report the failure. Do not begin
implementation or attempt to classify failures as pre-existing.
The locked worktree remains retained for diagnosis; lifecycle `cleanup`
protects it because no pull request was recorded.

The implementation invariant is: the repository was green when work began.

## Implementation

The active task contract defines product intent and scope. Resolve ordinary
implementation choices from repository evidence, keep changes bounded, and
avoid unrelated refactors. The orchestrating agent owns current investigation,
implementation orchestration, delegation, remediation, final verification, and
pull-request delivery.

### Behaviour Criteria

Use the active contract's Behaviour acceptance criteria to identify important
deterministic behaviour that deserves enduring automated protection. When a
criterion is important, reasonably testable, and supported by the repository's
existing infrastructure, add or update the appropriate proof at the level that
best fits the behaviour: unit, component, integration, or E2E. This is
behaviour-first, not mandatory test-first development. Do not prescribe a test
technology or add low-value tests merely to increase coverage.

During implementation, delegated agents may run targeted checks useful for
their work, such as a focused test, typecheck, or rendered check. They do not
own final repository verification and must not redundantly run the full
repository gauntlet.

### E2E Boundary

E2E is risk-triggered, not universal. Use it only when an important criterion
crosses system boundaries that cheaper checks cannot meaningfully prove. A
user-facing feature does not automatically require E2E.

If a criterion genuinely requires E2E proof and the repository has no suitable
E2E infrastructure, stop and report the verification gap. Do not introduce
Playwright, Cypress, or another E2E framework as incidental feature work.

## Final Verification

When implementation is settled, use the repository's intentional auto-fix
mechanism first if one exists and is useful. Do not invent a universal auto-fix
command. Then run:

```bash
npm run verify
```

This is the authoritative final deterministic gate, owned by this orchestrating
agent. When the repository uses shared verification execution tooling,
successful check output should remain low-noise and failure diagnostics should
remain available; deterministic tooling owns that reporting policy.

A failure means the implementation is incomplete. Investigate and remediate
implementation-caused failures, then rerun `npm run verify`. Respect repository
safeguards and do not weaken them to make verification pass. Any code
remediation requires another full `npm run verify` before completion.

Re-read the original request and active task contract, then inspect the final
diff to confirm the acceptance criteria and scope are covered.

## Rendered UI Inspection

For meaningful user-facing work, after deterministic verification perform a
separate proportional browser inspection using available tooling. Check the
affected route or state, meaningful interactions, representative desktop and
mobile layouts, runtime or console errors, obvious responsive failures, and
relevant accessibility behaviour as appropriate.

Transient evidence is not a deliverable: rendered-inspection screenshots,
analysis documents, temporary reports, and other generated artifacts must be
written to a temporary directory inside the isolated implementation worktree or
a system temporary directory — never into the control checkout. Do not add
committed screenshots or pixel baselines. Do not claim subjective hierarchy,
coherence, usability, or product intent as deterministic verification.

## Independent Judgement

After successful final deterministic verification, invoke `code-reviewer` once
in `discovery` mode when independent judgement materially improves confidence:
substantial behavioural, architectural, integration, security, maintainability,
or meaningful user-facing changes. Perform the rendered inspection above first
when applicable. Small mechanical changes need no review merely because the
agent exists.

Give the reviewer the owned worktree and review target (workspace changes
against HEAD before the first commit; for a fully committed target, the branch
range). On follow-up work, review the new workspace changes against HEAD;
previously delivered commits have their own review evidence. Prepare a concise
business-context Markdown file in a temporary directory inside the owned
worktree or a system temporary directory for OCR's `--background-file`. Keep
its sanitized content within OCR's 8,000-character limit. Include the original
request or PRP's purpose, resolved task requirements and acceptance criteria,
relevant repository/UX principles and constraints, and, in confirmation, the
accepted findings and fixes. Supply fresh repository context,
the diff, verification status and applicable rendered evidence to the reviewer.
Do not send implementation transcripts, reasoning, self-review, or advocacy.
The reviewer uses `ocr delegate preview --format json` with that background to
obtain OCR's selected file set, then `ocr delegate rule --format json` for its
rules. The host-assigned reviewer model reads those diffs and performs the
complete review, returning findings and coverage limits without implementing.
OCR only supplies deterministic selection and rules; it needs no LLM provider
or API key. Do not invoke OCR-managed review or translate the host's model into
OCR provider/model flags.

OCR's built-in `default_path` excludes common tests, including
`**/*.spec.{js,jsx,ts,tsx}`. If preview excludes relevant changed tests/specs,
the reviewer reports this coverage gap. The orchestrator preserves any
existing project OCR rules and adds narrowly scoped `include` patterns in the
implementation repository's `.opencodereview/rule.json` for the relevant
tests. OCR's `include` bypasses the built-in default-path exclusion without
overriding its other project rules. Re-run `npm run verify` after changing the
repository config and have the reviewer repeat delegation preview before
judgement. Do not manually append excluded files to the selected set or apply
a global catch-all rule that overrides project-specific review configuration.
If delegation or rule resolution fails, the review gate is not clear; report
the failure rather than switching execution modes.

## Review Remediation

Investigate every discovery finding with repository evidence. A finding may be
resolved by a bounded fix or by establishing that it does not apply. Do not
blindly accept subjective or out-of-scope findings.

Use this severity model for reviewer findings:

- `critical` or `high`: must be resolved;
- `medium`: must be resolved;
- `low`: report, but do not automatically churn code.

Here, a blocking finding means an applicable `critical`, `high`, or `medium`
finding. Keep a concise finding ledger in session context. Record each finding's
original severity and disposition, the remediation for each
blocking finding, and lows as informational. Do not create a repository artifact
for the ledger, and do not promote or remediate a low finding without strong
task-specific evidence.

If discovery has no applicable blocking findings, the gate is
complete; retain any low findings for completion reporting.

Investigate and batch all applicable blocking findings before returning to
judgement. Delegate remediation to an implementation specialist only when its
expertise materially helps, and never to the reviewer that raised the finding.
If code changes, run `npm run verify` before further judgement. Refresh rendered
inspection when UI is affected, then invoke the same `code-reviewer` once in
`confirmation` mode on the current target.

Give the confirmation reviewer fresh context containing the original request
and requirements, the finding ledger, a concise remediation summary,
the resulting diff and affected artifact or behaviour, current verification
status, and applicable rendered evidence. Do not send implementation
transcripts or advocacy. Confirmation must determine whether each original
blocking finding is resolved and inspect enough of the remediated artifact or
behaviour to detect material consequences. It is not another discovery review.

A confirmation finding blocks completion only when it is an unresolved original
blocking finding, a material regression caused or exposed by remediation, a
correctness or safety issue, or a genuinely blocking failure of the task
requirements. Do not reopen informational lows, seek additional polish, ask for
additional blocking findings beyond the ledger and remediation consequences, or
otherwise restart broad discovery.

After the ordinary confirmation, finish when important findings are resolved;
report minor/non-blocking findings rather than starting another cycle. Only a
genuinely serious regression or blocker justifies an exception: investigate it,
add its disposition to the ledger, perform exactly one batched exception
remediation, rerun `npm run verify`, refresh UI evidence when affected, and run
one final `confirmation` with the same reviewer. Never restart discovery or an
ordinary remediation cycle. Any qualifying blocker remaining at final
confirmation stops the workflow with the finding and verification evidence.
Low findings never initiate confirmation or exception remediation unless the
user explicitly asks to address them.

## Follow-Up On An Existing Pull Request

When this active session already owns a retained `worktreePath`, `sessionId`,
and pull-request URL, reuse that exact workspace instead of running `prepare`.
Never infer ownership of another retained worktree. Run `sync` before follow-up
changes, refresh the active task contract for the request, and establish a green
baseline after any synchronization. Then use the normal implementation,
verification, review, commit, evidence, synchronization, and publication gates.
Publication updates the existing pull-request branch; do not create a second
pull request. Record the existing URL again with `mark-pr` after publication.

## Pull Request Delivery

Only enter this stage after final `npm run verify`, applicable rendered
inspection, and the applicable independent judgement and remediation gate has
completed with no unresolved `critical`, `high`, or `medium` findings.

1. Re-read the original request, active task contract, final diff, review
   evidence, applicable contribution guidance, and pull-request template.
   Inspect the full implementation diff and worktree status again.
2. Stage only the intended implementation and verify the staged diff. Do not
   commit an unrelated or empty change.
3. Load `commit-pr-writing` and use it to derive the commit message from the
   completed outcome and evidence. Repository-required message conventions take
   precedence.
4. Create the commit, then run
   `implementation-workspace record-evidence --session "<sessionId>"`. This
   records that the current committed tree is covered by the completed gates.
   Run `implementation-workspace sync --session "<sessionId>"`. This re-fetches
   the remote default branch and either confirms
   the recorded base is current, safely rebases exclusively session-owned
   unpublished commits, or merges the current default into already-published
   follow-up history without rewriting it.
5. When synchronization reports `requiresRevalidation: true`, treat prior
   evidence as stale: rerun `npm run verify`, inspect the resulting diff, and
   repeat rendered inspection or a previously applicable independent review
   in `confirmation` mode only where the upstream integration could materially
   affect that evidence.
   Use the integration diff as remediation context with the existing finding
   ledger, and apply the same bounded confirmation, exception-remediation, and
   final-confirmation rule without restarting discovery. Commit any resulting
   remediation as an intended additional commit using `commit-pr-writing`.
   Record evidence for the resulting committed tree, then synchronize again.
6. Run `implementation-workspace publish --session "<sessionId>"`. It performs
   one final fetch and synchronization check and pushes only the owned feature
   branch without force. It must return `published: false` while the current
   tree lacks recorded evidence. If its final synchronization changes the tree,
   refresh the affected gates and record evidence before retrying.
7. After successful publication, use `commit-pr-writing` to derive the
   pull-request title and description from the final synchronized outcome and
   current evidence. For initial delivery, create the pull request against the
   `defaultBranch` reported by the latest lifecycle result. For follow-up
   delivery, update the existing pull request's title and description instead;
   do not create another pull request. Never merge it. Then run
   `implementation-workspace mark-pr --session "<sessionId>" --url "<pr-url>"`
   so the retained worktree records that it is awaiting review.

If committing, lifecycle synchronization, pushing, authentication, remote
access, or pull-request creation fails, preserve the implementation worktree
and any commit already created. Report the failed stage and the centralized
tool's diagnostic clearly. Do not bypass permissions, resolve ambiguous
ownership or conflicts by guessing, rewrite shared history, force push, stash,
discard work, include unrelated changes, or improvise destructive recovery.

## Completion

Successful execution ends when the pull request has been created and is ready
for human product validation and a merge decision.

Return the pull-request reference and link, a concise verification summary,
applicable rendered or independent-review evidence, and any unresolved
low-severity concerns useful during product review. Also surface the retained
implementation workspace for human validation: run

```bash
implementation-workspace info --session "<sessionId>"
```

and include its `worktreePath`, `branch`, and `prUrl` verbatim, plus a note
that working inside the workspace starts with changing into `worktreePath` of
the retained locked worktree followed by the repository's own documented
setup/run commands. Surface only run commands discovered from repository
evidence; do not invent repository commands. Do not merge the pull request.
Keep the locked implementation worktree for follow-up changes in this session;
PR creation is not a cleanup boundary. If the user wants a quick overview of
all retained workspaces or safe deletion of merged-PR worktrees, point them to

```bash
implementation-workspace list
implementation-workspace cleanup            # dry-run report by default
implementation-workspace cleanup --dry-run false
```

The cleanup operation decides from authoritative GitHub pull-request state plus
deterministic Git evidence that the branch history is consumed by the remote
default branch, and never deletes ambiguous, dirty, open-PR,
lacking-PR-metadata, or unconsumed-history workspaces.
