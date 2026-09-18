---
description: Investigate and implement a request through verified pull request creation
agent: build
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

After successful final deterministic verification, add independent judgement
only when it materially improves confidence:

- For substantial work with meaningful behavioural, architectural,
  integration, state-management, security, or maintainability consequence,
  invoke `engineering-reviewer`.
- For meaningful user-facing work, perform the rendered/browser inspection
  above first, then invoke `ui-reviewer` with fresh review context.

Small or mechanical changes do not need engineering review merely because the
agent exists. Do not invoke UI review for changes without meaningful user-facing
impact.

Reviewers receive only the original request, resolved task requirements and
acceptance criteria from the active session, fresh repository evidence, relevant
implementation context, final diff, applicable rendered evidence, and the fact
that `npm run verify` passed. Do not send implementation transcripts, reasoning,
self-review, or explanations defending choices. Reviewers judge; they do not
implement. Never select a reviewer to fix its own findings.

## Review Remediation

Investigate every finding with repository evidence. A finding may be resolved
by a bounded fix or by establishing that it does not apply. Do not blindly
accept subjective or out-of-scope findings.

Use this severity model:

- `high/blocker`: must be resolved;
- `medium`: must be resolved;
- `low`: report, but do not automatically churn code.

For a valid high/blocker or medium finding, determine the fix and delegate to
an implementation specialist only when specialist expertise materially helps.
Never delegate it to the reviewer that raised it. If code changes, run
`npm run verify` again before further judgement. Rerun only affected gates:

- engineering remediation: engineering review again;
- UI remediation: rendered inspection and UI review again;
- cross-cutting remediation: rerun both when both are materially affected.

Allow at most two remediation passes per judgement gate. If meaningful
high/blocker or medium findings remain after two passes, stop and involve the
user. Low findings do not consume a pass unless the orchestrator or user
explicitly chooses to address them.

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
inspection, and all applicable independent judgement and remediation gates have
completed with no unresolved `high/blocker` or `medium` findings.

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
   repeat rendered inspection or independent judgement only where the upstream
   integration could materially affect that evidence. Commit any resulting
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

The cleanup operation decides from authoritative GitHub pull-request state and
never deletes ambiguous, dirty, open-PR, or lacking-PR-metadata workspaces.
