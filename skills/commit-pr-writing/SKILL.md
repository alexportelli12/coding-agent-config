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

Keep the description in plain English and normally short enough to fit on one
screen. Adapt to a required repository template; otherwise use:

```markdown
## What this solves

<One to three short sentences explaining the problem, limitation, or need.>

## What changed

- <Concise behavioural or product outcome.>
- <Another meaningful outcome or safeguard when needed.>

## QA / Requirements

- <Observable action or result that determines whether the change works.>

## Verification

- <Very short summary of meaningful completed evidence.>
```

Describe what users can now do, what behaviour changed, what limitation was
removed, or what safeguard was introduced. Include a significant architectural
outcome only when it materially helps the reviewer understand the change.

Derive `QA / Requirements` primarily from the resolved acceptance criteria and
implemented behaviour. State what a reviewer should try or observe, not an
implementation checklist, and do not copy session notes verbatim.

Summarise only meaningful completed quality evidence, such as `npm run verify`
passing, rendered inspection, or applicable independent review. Do not unpack
every command behind `verify` or paste logs.

Avoid file-by-file changelogs, implementation inventories, unnecessary symbol
names, internal state details, dependency mechanics, exhaustive background,
generic filler, repeated title prose, and explanations of obvious code
mechanics. Use technical terminology only when it is the clearest concise
language.

## Final Check

Ensure the copy is accurate to the final diff, makes no unsupported claims, and
lets a busy reviewer understand in under a minute why the work was needed, what
it achieves, what to validate, and whether the applicable quality gates passed.
