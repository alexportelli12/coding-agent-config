---
description: Audit or coherently update Alex's global coding-agent workflow configuration
agent: build
---

# Update My Workflow: $ARGUMENTS

Load the `workflow-for-alex` skill before doing anything else. Treat it as the
architectural and governance source of truth for this configuration.

If `$ARGUMENTS` is present, investigate the reported workflow problem. If it is
empty, perform a general audit. In either mode:

1. Inspect the relevant current files and, for a broad audit, the root
   configuration holistically: `AGENTS.md`, agents, commands, skills,
   references, `.gitignore`, and relevant `opencode.json` fields.
2. Search for every instruction touching the concern.
3. Identify the current owner or owners and classify the finding as
   contradiction, duplication, stale instruction, wrong ownership, missing
   deterministic protection, missing expertise, orchestration inefficiency, or
   not a workflow problem.
4. Prefer replacing, moving, consolidating, or deleting an existing instruction
   over adding another one.
5. When responsibility moves, establish the new owner, remove obsolete
   duplicates, search for stale references, and inspect the result as a whole.

For a requested change, implement the smallest coherent correction justified by
the evidence. Do not add a new agent, skill, command, or reference unless its
responsibility is distinct and recurring enough to earn its maintenance cost.

Audit semantic contradictions explicitly. Searches find candidate overlaps;
reason about whether instructions actually conflict. Check especially for
competing final-verification owners, reviewers implementing changes, global
framework or tooling absolutes overriding repository evidence, stale references,
and commands duplicating specialist expertise.

Identify prose that could be mechanically enforced, but do not add
repository-specific tooling from this global configuration. Classify the
opportunity for the repository's own `verify`, tests, architecture checks, or
other appropriate owner instead.

Make only clearly justified, low-risk changes during a general audit. Report a
larger architectural change before implementing it. Do not manufacture work:
no meaningful workflow change is a valid result.

For a requested change, report what changed and why, what ownership moved or
was consolidated, and important alternatives deliberately rejected. For a
general audit, report meaningful findings, applied cleanup, and any larger
findings left for a deliberate decision. Keep the report concise.
