---
description: Execute a PRP implementation plan
agent: build
---

# Execute PRP: $ARGUMENTS

Implement the feature using the PRP file. Search for it in `.ai/planning/prp/`, `prp/`, or other planning directories.

**Context:** Load `repo-context` for current repository-wide defaults, architecture, tech stack, and available scripts. Re-read the affected feature area because local patterns may be more relevant than repository-wide majorities.

## CRITICAL: NO COMMITS

**NEVER commit changes.** The user will commit manually. Do not run `git add`, `git commit`, or other git commands that modify repository state.

## Step 0: Establish Execution Context

Before implementation:

1. Read the PRP completely.
2. Check for `UX_PRINCIPLES.md`; if present, read it as supporting guidance for implementation decisions the PRP leaves open.
3. Load `repo-context`.
4. Read the manifest/lock file(s) to determine package manager and available scripts.
5. Inspect the PRP's implementation anchors and the closest analogous code in the affected feature area.
6. Check repository-local skills/instructions/templates and follow any relevant ones.

Only run commands that actually exist or are directly supported by detected tooling/configuration. Never invent validation commands.

## Convention Precedence

Use this order when deciding how new code should look:

1. Explicit requirements in the PRP/user request
2. Relevant repository-local instructions/skills
3. Closest intentional pattern in the affected feature area
4. High-confidence repository-wide conventions from `repo-context`
5. Framework defaults only when the repository provides no stronger signal

Do not copy an obviously legacy/deprecated local pattern merely because it is nearby. If signals conflict materially and the PRP does not resolve them, use the approach best supported by current repository evidence and mention the decision in the completion summary.

## UX Decision Precedence

The PRP remains the primary implementation contract. For UX decisions it does not fully specify, use this order:

1. Explicit PRP requirements
2. UX constraints captured in the PRP
3. `UX_PRINCIPLES.md`
4. Existing project patterns
5. Generic UX judgement

Apply only principles relevant to decisions genuinely left open by the PRP. Do not use unrelated UX observations to redesign the feature, alter agreed behavior, audit adjacent experiences, or expand scope. If `UX_PRINCIPLES.md` is absent, continue without it.

## Workflow

| Step | Action                                                                                  | Key Points                                                           |
| ---- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1    | **Plan:** Break PRP into dependency-ordered TodoWrite tasks                             | Keep tasks implementation-sized; do not expand PRP scope             |
| 2    | **Implement:** Work through tasks, marking in_progress → completed                      | Reuse existing abstractions; avoid unrelated refactors               |
| 3    | **Targeted Validate:** Run the narrowest relevant existing checks during implementation | Prefer affected tests/type/lint checks where supported               |
| 4    | **Final Validate:** Run appropriate repository gates that exist                         | Build/lint/typecheck; run relevant existing tests whenever practical |
| 5    | **Docs/Exports:** Update only directly affected existing docs/barrels/registries        | Do not create documentation churn                                    |
| 6    | **Verify:** Re-read PRP and diff; check every acceptance criterion and scope boundary   | Ensure no requirement was missed and no accidental scope was added   |

## Tests

Separate **running tests** from **writing tests**:

- Run relevant existing tests whenever practical, even when the PRP does not require new tests.
- Create or update tests when the PRP/user requires them, repository policy requires them, or the change introduces meaningful behavior that existing project practice expects to be covered.
- Do not add low-value tests solely to increase test count.
- Do not rewrite unrelated tests.

## Validation

Determine the package manager from repository evidence (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `bun.lockb`/`bun.lock`, workspace config, etc.).

Run only checks supported by the repository. Typical examples, **only when present**, are build, lint, typecheck, unit tests, and relevant e2e tests.

Validate progressively:

1. Narrow/affected checks while implementing, when the tooling supports them.
2. Appropriate full repository gates once near completion.

### Existing Failures

When validation fails, determine whether the failure was introduced by this implementation.

- Fix failures caused by your changes at the source.
- Never disable lint/type rules, weaken tests, or introduce `any`/equivalent escapes merely to make validation pass.
- Do **not** expand scope to repair unrelated pre-existing failures.
- If a failure appears pre-existing or unrelated, preserve the evidence and report it clearly in the final summary.

## Scope Control

The PRP is the implementation contract. Do not opportunistically refactor unrelated code, upgrade dependencies, redesign adjacent features, or fix unrelated defects unless required to satisfy the PRP.

If implementation reveals that a PRP assumption is wrong:

- adapt when the repository makes the intended outcome unambiguous and the change remains within scope;
- otherwise stop before making a product/architecture decision that materially changes the agreed behavior and ask for clarification.

## Complete

Before finishing:

- [ ] Every PRP acceptance criterion verified
- [ ] All TodoWrite tasks completed
- [ ] Diff reviewed for accidental/unrelated changes
- [ ] Relevant existing tests run where practical
- [ ] Appropriate available validation gates passed, or unrelated failures documented
- [ ] Required exports/docs/registrations updated
- [ ] No PRP scope silently dropped or expanded
- [ ] **NO commits made**

Return a concise summary of what changed, validation performed/results, and any assumptions or pre-existing issues the user should know about.
