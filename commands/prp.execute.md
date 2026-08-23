---
description: Execute a Product Requirement Prompt with repository verification
agent: build
---

# Execute PRP: $ARGUMENTS

Implement the PRP identified by `$ARGUMENTS`. Find it in the repository's
gitignored temporary PRP location, normally `.ai/planning/prp/`. Read it
completely before making changes.

## Preflight: Green Before Work

Before implementation:

1. Load and run `repo-context` again for current, independent repository
   evidence. Do not persist its report beside the PRP.
2. Confirm that the repository exposes `npm run verify` from its root.
3. Run `npm run verify` before changing code.

If `npm run verify` does not exist, stop and report that the repository does
not satisfy the PRP workflow contract. Do not add it as part of feature work.
If the preflight verify fails, stop and report the failure. Do not begin
implementation or attempt to classify failures as pre-existing.

The implementation invariant is: the repository was green when PRP work
began.

## Implementation

The PRP is the product and scope contract. Investigate the current repository,
affected feature, closest analogues, local instructions, and relevant product
or UX principles before deciding how to implement it. Use specialist skills or
delegate focused work when their expertise materially helps; for example, use
the consolidated Angular skill for meaningful Angular work and UI-design
expertise for meaningful interface work.

The orchestrating agent owns current investigation, implementation
orchestration, delegation, remediation, and final verification.

Keep the work within the PRP: resolve ordinary implementation choices from
repository evidence, avoid unrelated refactors, and ask the user only when
implementation reveals a material product or architectural ambiguity that the
repository cannot answer.

### Behaviour Criteria

Use the PRP's Behaviour acceptance criteria to identify important deterministic
behaviour that deserves enduring automated protection. When a criterion is
important, reasonably testable, and supported by the repository's existing
infrastructure, add or update the appropriate proof at the level that best
fits the behaviour: unit, component, integration, or E2E. This is
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
mechanism first if one exists and is useful. Do not invent a universal
auto-fix command.

Then run:

```bash
npm run verify
```

This is the authoritative final deterministic gate, owned by this orchestrating
agent. A failure means the implementation is incomplete: investigate and
remediate implementation-caused failures, then rerun `npm run verify`. Respect
`AGENTS.md` and repository safeguards; do not weaken them to make verification
pass. Any code remediation requires another full `npm run verify` before
completion.

Re-read the PRP and inspect the final diff to confirm the acceptance criteria
and scope are covered.

## Rendered UI Inspection

For meaningful user-facing work, after deterministic verification perform a
separate proportional browser inspection using available tooling. Check the
affected route or state, meaningful interactions, representative desktop and
mobile layouts, runtime or console errors, obvious responsive failures, and
relevant accessibility behaviour as appropriate.

This is rendered evidence and judgement, not repository E2E or visual
regression infrastructure. Do not add committed screenshots or pixel
baselines. Do not claim subjective hierarchy, coherence, usability, or product
intent as deterministic verification.

## Completion

After implementation, final `npm run verify`, and any applicable rendered
inspection, report completion to the user for product validation. Do not
automatically delete the PRP.

Return a concise summary of the implementation, deterministic verification,
rendered evidence when applicable, unresolved concerns, and the request for
human product validation.
