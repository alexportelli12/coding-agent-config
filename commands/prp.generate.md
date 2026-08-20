---
description: Generate a PRP implementation plan from a feature description
agent: documentation
---

# Generate PRP: $ARGUMENTS

Generate a lean, actionable PRP (Product Requirements Prompt) for the described feature.

**Context:** Load `repo-context` to detect repository-wide defaults, architecture, tech stack, and available scripts. Treat its confidence/evidence as guidance: feature-local patterns take precedence over repository-wide defaults when they intentionally differ.

## Step 1: Research

| Action                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------- |
| Run `repo-context` — note high-confidence conventions, mixed patterns, structure, and available scripts               |
| Search the affected feature area for the closest analogous implementations and reusable components/services/modules   |
| Prefer feature-local patterns over global conventions unless the local code is clearly legacy or being replaced       |
| Check for existing PRP templates (e.g. `.ai/planning/templates/`) and use if found, otherwise generate inline         |
| If `UX_PRINCIPLES.md` exists, read it and select only principles relevant to the requested change                      |
| Identify only knowledge gaps that would materially change scope, UX, data design, integration, or acceptance criteria |

Do not duplicate the full `repo-context` report in the PRP. Capture only feature-specific findings needed for execution.

When `UX_PRINCIPLES.md` exists, translate applicable principles into concrete UX considerations and constraints for this change. Do not audit the product, surface unrelated UX issues, or expand scope. If the file does not exist, continue without it and do not block generation.

## Step 2: Clarify Only When Needed

Ask **zero questions when the requirements and repository evidence are sufficient**.

When clarification is genuinely required, use the question tool for the smallest number of focused questions needed (normally 1–3, maximum 5):

| Category        | Ask only when...                                                                        |
| --------------- | --------------------------------------------------------------------------------------- |
| **Scope**       | MVP/full scope or boundaries would change implementation                                |
| **UX**          | User flow or interaction cannot be inferred from requirements/existing product patterns |
| **Data**        | Schema, ownership, persistence, or API behavior is ambiguous                            |
| **Integration** | Multiple materially different integration approaches exist                              |
| **Edge Cases**  | Product behavior for an important failure/empty/loading state is undefined              |

Maximum 2 question rounds. Do not ask for information that can be discovered from the repository. For non-blocking uncertainty, document a reasonable assumption in the PRP instead of interrupting the user.

## Step 3: Generate PRP

**Include:**

- Goal and feature-specific success/acceptance criteria
- Explicit decisions and assumptions established during clarification
- Expected files/areas to create or modify, with paths where confidently known
- **Implementation anchors:** precise paths + symbols/components/services that demonstrate the patterns to follow, with a short explanation of relevance
- Small code snippets only when a repository pattern is unusual or ambiguous and a path/symbol reference is insufficient
- Dependency-ordered implementation steps; avoid prescribing implementation details that the executing agent can safely derive from the codebase
- Important edge cases and failure states
- Relevant UX considerations and constraints derived from `UX_PRINCIPLES.md`, when present
- Out-of-scope boundaries
- Validation plan using only scripts/configuration that actually exist; distinguish targeted validation from final repository gates

**Exclude:**

- Full `repo-context` output
- Generic framework patterns or coding standards dynamically discoverable at execution time
- Large copied code snippets
- Full code implementations
- Speculative files or architecture presented as fact

## Output

Save to `.ai/planning/prp/{feature-name}.md` if the directory exists. Otherwise use an existing planning directory; if none exists, create `.ai/planning/prp/`.

**Checklist:**

- [ ] Repository and affected feature area researched
- [ ] Closest analogous implementations identified
- [ ] Questions asked only where the answer materially affects implementation
- [ ] Acceptance criteria are observable and feature-specific
- [ ] Implementation anchors use precise paths/symbols instead of unnecessary copied code
- [ ] Implementation ordered by dependency
- [ ] Assumptions, edge cases, and out-of-scope boundaries documented
- [ ] Relevant `UX_PRINCIPLES.md` guidance incorporated without expanding scope, when the file exists
- [ ] Validation references only commands/scripts/configuration that exist
- [ ] PRP contains no unnecessary repository-wide context duplication

**Confidence:** Rate 1–10: can an execution agent complete this PRP in one pass without making product decisions? Briefly state the main reason confidence is not 10, if applicable.
