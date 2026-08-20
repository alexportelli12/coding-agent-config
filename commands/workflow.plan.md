---
description: "Start the feature planning workflow (PRD -> Architecture -> Task Breakdown)"
model: opencode-go/kimi-k2.7-code
steps: 40
---

# Feature Planning Workflow

Execute the planning phase for the feature described below. Use the Task tool to delegate to subagents. Act with tools; keep chat terse.

Feature input: $ARGUMENTS

## Step 0: Slug, paths, existence

1. If `$ARGUMENTS` is empty, stop and say: `Usage: /workflow.plan <feature-slug-or-description>`.
2. Normalize a **feature slug**:
   - Prefer the user-provided slug if already kebab-case.
   - Otherwise derive kebab-case from the feature name (lowercase, hyphens, no spaces).
3. Set:
   - `FEATURE_SLUG` = the slug
   - `FEATURE_DIR` = `.ai/features/<FEATURE_SLUG>/`
   - `PRD` = `.ai/features/<FEATURE_SLUG>/01-prd.md`
   - `ARCH` = `.ai/features/<FEATURE_SLUG>/02-architecture.md`
   - `TASKS` = `.ai/features/<FEATURE_SLUG>/03-execution-tasks.md`
4. If `FEATURE_DIR` already exists with any of those files:
   - Ask whether to **resume** (reuse existing docs and only regenerate missing ones) or **overwrite** (regenerate all three).
   - Do not overwrite without explicit user choice.
5. Pass `FEATURE_SLUG` and full paths in every Task prompt. Subagents write only under `FEATURE_DIR`.

## Goal

Produce `01-prd.md`, `02-architecture.md`, and `03-execution-tasks.md` under `FEATURE_DIR`. User reviews the full set at the end. Do not implement code in this command.

## Human gates (allowed stops)

Stop and wait for the user only when:

1. **PRD gate:** `@prd-generator` asks clarifying product questions.
2. **Architecture gate:** `@architect` asks technical questions that block the blueprint.
3. **Champion halt:** `@feature-champion` reports missing contracts (API shapes, tables, etc.).
4. **Final review:** all three docs exist; present them for user review.

Otherwise continue immediately to the next step. Do not invent extra approval gates between PRD → architecture → tasks.

## Step 1: PRD Generation

Delegate via Task to `prd-generator` with:

- Feature brain dump / `$ARGUMENTS`
- `FEATURE_SLUG` and `PRD` path
- Instruction: write only to `PRD`; create `FEATURE_DIR` if needed

If the agent asks clarifying questions, wait for answers, then re-delegate or continue until `PRD` exists.

## Step 2: Architecture Design

Immediately after `PRD` exists, delegate via Task to `architect` with:

- `FEATURE_SLUG`, `PRD`, `ARCH` paths
- Instruction: read `PRD` only; do not re-interview the product brain dump; write only to `ARCH`

If the agent asks technical questions, wait, then continue until `ARCH` exists. Do not wait for user approval of the PRD first unless Step 0 overwrite/resume requires it.

## Step 3: Task Breakdown

Immediately after `ARCH` exists, delegate via Task to `feature-champion` with:

- `FEATURE_SLUG`, `PRD`, `ARCH`, `TASKS` paths
- Instruction: read `PRD` + `ARCH`; write only to `TASKS`
- Reminder: keep role separation; chunk same-file / same-expert work into fewer larger tasks; emit explicit Parallel Groups; stay strict on technical dependencies

If the champion reports missing contracts, stop and report exactly what is missing. Do not invent tasks.

## Step 4: Review

Stop and present all three documents (`PRD`, `ARCH`, `TASKS`) with their paths. Wait for user review. If the user requests changes, re-delegate only the affected agent(s) with the change request and paths, then present the updated set.

Do not begin implementation until the user explicitly runs `/workflow.execute` or instructs implementation.
