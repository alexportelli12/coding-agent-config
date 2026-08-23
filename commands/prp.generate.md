---
description: Generate a lean Product Requirement Prompt from a feature description
agent: documentation
---

# Generate PRP: $ARGUMENTS

Generate a lean **Product Requirement Prompt (PRP)** for the requested work. A
PRP is a temporary specification contract: it defines what must be true when
the work is finished, not how the implementing agent must build it.

## Preconditions

Before researching the task, confirm from the repository's package manifests
and workspace configuration that `npm run verify` is available from the
repository root. This is the repository's canonical deterministic quality
contract.

If that contract does not exist, stop and tell the user that the repository is
not ready for the PRP workflow because it does not expose `npm run verify`.
Do not generate a PRP, add `verify`, or set up validation as part of this
command.

## Investigation

Investigate enough to understand the requested outcome and resolve decisions
without turning the result into an implementation manual:

1. Load and run `repo-context` for a current, observational repository map.
2. Inspect the affected feature or system, its closest relevant analogues,
   existing architecture, and relevant tests or behavioural contracts.
3. Read repository-specific instructions and any relevant product or UX
   principles, including `UX_PRINCIPLES.md` when present.
4. Use a specialist skill when its expertise materially improves the planning.

Treat repository evidence and established product principles as the first
source of answers. Ask the user only about genuine unresolved product
behaviour, UX intent, business rules, meaningful architectural choices with
product consequences, or important edge cases that cannot be inferred. Ask the
fewest focused questions necessary; do not ask the user to choose ordinary
implementation details.

Do not persist the repo-context report, generic repository context, framework
tutorials, expected file lists, implementation anchors, coding steps, test
technology, generic validation commands, or speculative abstractions.

## PRP Contract

Write the PRP to the repository's existing gitignored temporary PRP location,
normally `.ai/planning/prp/{feature-name}.md`. PRPs are temporary, are not
permanent documentation, and are manually discarded when the user decides the
work is complete. Do not automatically delete them and do not create a new
permanent planning location.

Use judgement and omit sections that add no value:

```markdown
# Goal

# Requirements

# Decisions

# Acceptance Criteria

## Behaviour

## Experience

# Constraints

# Edge Cases
```

The content should follow these rules:

- **Goal** states the intended outcome concisely without implementation
  language.
- **Requirements** captures product and engineering requirements that must
  remain true.
- **Decisions** records meaningful choices already established during
  investigation or clarification, not ordinary executor choices.
- **Acceptance Criteria / Behaviour** describes objectively observable,
  deterministic outcomes. Include behaviours important enough to deserve
  automated protection, without prescribing test technology or test level.
- **Acceptance Criteria / Experience** captures important human- or
  judgement-dependent qualities for user-facing work. Do not present these as
  deterministic tests.
- **Constraints** contains only real compatibility, scope, external-contract,
  or established architectural constraints.
- **Edge Cases** contains meaningful discovered or clarified cases, not a
  speculative exhaustive list.

Keep the contract short enough that an implementation agent can hold it as the
source of task requirements while investigating implementation details itself.
Do not add a confidence score or an implementation checklist unless the task
has an unusual, concrete reason to need one.

After writing the file, report its path and any unresolved ambiguity. Do not
implement the requested feature.
