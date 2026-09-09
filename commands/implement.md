---
description: Investigate and implement a request through verified pull request creation
agent: build
---

# Implement: $ARGUMENTS

Take the request in `$ARGUMENTS` from repository-grounded discovery through a
pull request ready for human product validation. The active session is the task
contract; do not create or persist a planning or requirements artifact.

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

1. Inspect repository-specific Git, contribution, branch, and pull-request
   conventions, then inspect the current branch, default branch, remotes,
   worktree, and existing branch commits relative to the intended base. Record
   pre-existing changes in session context so they cannot be included later.
2. Run `npm run verify`.
3. Ensure implementation will occur on the intended feature branch. Reuse an
   appropriate existing branch, or create one after the green baseline using
   repository conventions. Do not implement feature work on the default branch.

If the preflight verify fails, stop and report the failure. Do not begin
implementation or attempt to classify failures as pre-existing.

Preserve pre-existing user changes. If they overlap the intended work so that
their ownership cannot be separated safely, or if the intended branch cannot
be established confidently, stop and ask the user rather than risking an
incorrect commit.

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

This is rendered evidence and judgement, not repository E2E or visual
regression infrastructure. Do not add committed screenshots or pixel baselines.
Do not claim subjective hierarchy, coherence, usability, or product intent as
deterministic verification.

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

## Pull Request Delivery

Only enter this stage after final `npm run verify`, applicable rendered
inspection, and all applicable independent judgement and remediation gates have
completed with no unresolved `high/blocker` or `medium` findings.

1. Re-read the original request, active task contract, final diff, and review
   evidence. Inspect Git status, the current and default branches, remotes,
   upstream, the full branch commit and diff range against the intended base,
   and any applicable contribution guidance or pull-request template again.
2. Compare the final worktree with the recorded preflight state. Stage only the
   intended implementation and verify the staged diff. Do not commit unrelated
   user changes or an empty change.
3. Load `commit-pr-writing` and use it to derive the commit message, pull-request
   title, and pull-request description from the final outcome and evidence.
   Repository-required message conventions and pull-request templates take
   precedence.
4. Confirm the intended feature branch is not the repository's default branch,
   create the commit, and push that branch normally without force.
5. Create the pull request against the appropriate base branch. Never merge it.

If committing, pushing, authentication, remote access, or pull-request creation
fails, preserve the implementation and any commit already created. Report the
failed stage and useful recovery evidence clearly. Do not bypass permissions,
rewrite history, force push, discard work, include unrelated changes, or
improvise destructive recovery.

## Completion

Successful execution ends when the pull request has been created and is ready
for human product validation and a merge decision.

Return the pull-request reference and link, a concise verification summary,
applicable rendered or independent-review evidence, and any unresolved
low-severity concerns useful during product review. Do not merge the pull
request.
