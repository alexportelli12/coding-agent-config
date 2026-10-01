---
name: commit-pr-writing
description: Write outcome-focused commit messages, pull-request titles, and concise pull-request descriptions from completed work and its evidence. Use whenever an agent is preparing commit or pull-request copy, especially during automated implementation delivery; do not use it for Git execution, branching, releases, or repository management.
---

# Commit And Pull Request Writing

Translate a completed change into copy that lets a reviewer understand its
purpose, outcome, behavioural impact, validation target, and quality evidence
without reading the diff.

## Evidence And Precedence

Use the original request, resolved requirements and acceptance criteria from the
active session, repository context, final diff, verification results, and
applicable review evidence. Describe what the final implementation actually
achieves rather than copying session notes or narrating the implementation
process.

Inspect and follow repository-specific commit conventions, contribution
guidance, and pull-request templates. They take precedence over this skill. Do
not impose Conventional Commits unless the repository requires them.

## Commit Message

Write a concise subject that communicates the meaningful outcome. Prefer a
capability or behavioural result such as `Add staff access controls`, `Show
today's items on household overview`, or `Track listing price changes`.

Avoid generic mechanics such as `Update files`, `Refactor components`, or a
list of modified implementation units. Normally return only the subject. Add a
short body only when material context, a non-obvious constraint, or an important
trade-off cannot be communicated accurately in the subject.

## Pull Request Title

Write a concise title describing the capability, behaviour, or problem
addressed. Someone scanning a pull-request list should understand the intended
outcome without opening the diff. Avoid filenames, classes, components,
services, and implementation mechanics unless they genuinely are the subject
of the change.

## Pull Request Description

Keep the description in plain English and short enough to fit on one screen.
A repository pull-request template takes precedence; when one exists, fit these
sections into it. Otherwise use:

```markdown
## What this solves
<One to three sentences: the problem, limitation, or need.>

## What changed
<Optional single visual; see below.>
- <Behavioural or product outcome.>

## How to check
- <Route or entry point · action · expected result.>

## Evidence
- <Concrete proof; see below.>
- Gates: verify ✓ · <rendered QA ✓> · <review ✓ (n findings resolved)>

## Merge danger
**Door:** <one-way | two-way> · <why>
**Blast radius:** <one word> · <what could break>
```

**What changed** describes what users can now do, what behaviour changed, what
limitation was removed, or what safeguard was introduced. Include an
architectural outcome only when it materially helps the reviewer.

**Optional visual.** When the change is about structure or flow, one visual
may replace prose: a shaped diff, call tree, component tree, file tree, or
Mermaid diagram. Use at most one, and only when it explains faster than bullets.
For UI changes the screenshot is the visual. (The idea comes from Matt Pocock's
`pr` skill and Dex Horthy's `show-me`.)

**How to check** comes from the resolved acceptance criteria: what a reviewer
should try and what they should see, not an implementation checklist.

**Evidence.** "Tests pass" is a claim, not evidence. For a behaviour change,
name in plain language the test that now protects it, for example "a checkout
test now fails if a discount takes the total below zero". For a UI change,
state that rendered inspection was performed and what it covered. Do not claim
or require fail-then-pass proof; the workflow is not test-first. The gates line
lists only gates that actually ran; do not unpack `verify` or paste logs.

**Merge danger** copies the independent reviewer's door verdict and blast
radius. When no review ran, state your own assessment and mark it
"self-assessed", using the door and blast-radius definitions in the
`code-reviewer` agent.

Put media for extra viewports or states in a collapsed `<details>` block so the
description still fits on one screen.

Avoid file-by-file changelogs, implementation inventories, unnecessary symbol
names, internal state details, dependency mechanics, exhaustive background,
generic filler, repeated title prose, and explanations of obvious code
mechanics. Use technical terminology only when it is the clearest concise
language.

## Final Check

Ensure the copy is accurate to the final diff, makes no unsupported claims, and
lets a busy reviewer understand in under a minute why the work was needed, what
it achieves, how to check it, what proves it, and how dangerous it is to merge.
