---
description: "Execute the approved task list for a specific feature"
model: opencode-go/kimi-k2.7-code
steps: 80
---

# Feature Execution Workflow

Execute the approved task list for one feature. Use the Task tool to delegate. Act with tools; keep chat terse.

Feature input: $ARGUMENTS

## Step 0: Slug and pre-flight

1. If `$ARGUMENTS` is empty, stop and say: `Usage: /workflow.execute <feature-slug>`.
2. Set `FEATURE_SLUG` to the exact kebab-case slug (do not invent a new name).
3. Set:
   - `FEATURE_DIR` = `.ai/features/<FEATURE_SLUG>/`
   - `PRD` = `.ai/features/<FEATURE_SLUG>/01-prd.md`
   - `ARCH` = `.ai/features/<FEATURE_SLUG>/02-architecture.md`
   - `TASKS` = `.ai/features/<FEATURE_SLUG>/03-execution-tasks.md`
4. If `TASKS` is missing, stop: `Missing 03-execution-tasks.md. Run /workflow.plan <slug> first.`
5. Read `TASKS`. Resume from the first pending `[ ]` task. Never re-do tasks already marked `[x]`.

## Tracker ownership (single owner)

**You (orchestrator) are the only writer of `TASKS`.**

- Subagents must not edit `03-execution-tasks.md`.
- After each task or parallel batch finishes, verify acceptance criteria yourself (read files, run checks if needed).
- Only then mark verified tasks `[x]` in `TASKS`.
- If verification fails, leave `[ ]`, stop the batch path if needed, and report failure.

## Parallelism rules

Prefer structure emitted by the champion:

1. If `TASKS` contains headings named `Parallel Group` (e.g. `### Parallel Group 1A`), run each group as one parallel batch, then proceed in document order.
2. Tasks under a phase with no Parallel Group heading run **one at a time** in document order.
3. Never invent independence. If unsure, run sequential.
4. Never parallelize across phases. Cloud schema before Frontend that depends on it.

Fallback only when no Parallel Groups exist: same-phase tasks may run in parallel **only if** all of these are true:

- Different role tags **and**
- No shared files, modules, models, APIs, or DB objects in the task text **and**
- No task needs output/side effects of another pending task

If any condition fails, sequential.

## Execution loop

### Parallel batch

For a Parallel Group (or a verified independent set):

1. Delegate each task with the Task tool in **one parallel turn**.
   - Route by role tag (see Role Routing).
   - Pass: `FEATURE_SLUG`, `PRD`, `ARCH`, `TASKS` paths, **exact task id + full task text**, and acceptance criteria.
   - Guard: **"Execute only this assigned task. Do not edit 03-execution-tasks.md or any shared task tracker. Do not pick other pending tasks. Return the STATUS block."**
2. Wait for every subagent in the batch.
3. Parse each STATUS block. Verify acceptance criteria; inspect changed files when needed.
4. Mark only verified tasks `[x]` in `TASKS` yourself.
5. If any task is `failed` or `blocked` or fails verification, stop and report before continuing.
6. Continue to the next group/task.

### Sequential task

Delegate one task. Wait. Parse STATUS. Verify. Mark `[x]` yourself if verified. Then next pending `[ ]`.

## Role Routing

- `[Role: Cloud]` → Task subagent `cloud-executor`
- `[Role: Frontend]` → Task subagent `frontend-executor`
- `[Role: QA]` → Task subagent `qa-executor`
- `[Role: Reviewer]` → Task subagent `reviewer`

## Required subagent return shape

Expect this block from every executor (and use it before marking `[x]`):

```markdown
STATUS: done | blocked | failed
TASK: <task id>
FILES: <changed paths>
VERIFY: <commands + result, or n/a>
NOTES: <1-3 lines>
```

Missing STATUS or `failed`/`blocked` → do not mark complete.

## Review and feedback loop

When every implementation/QA task in `TASKS` is `[x]`:

1. Delegate Task subagent `reviewer` (fresh context) with `FEATURE_SLUG`, `PRD`, `ARCH`, `TASKS`, and: **"Review all changes against PRD, architecture, team standards, security, and performance. Do not edit files. Return the structured review report."**
2. Wait for the review report.
3. If overall status is `pass` or `pass_with_minor`:
   - Append to `TASKS`: `- [x] **Task R.1:** [Role: Reviewer] Final review — no blockers.`
   - Go to Completion.
4. If overall status is `changes_required`:
   - For each `blocker` and `major` finding, append a new pending `[ ]` task assigned to the stated role, with the suggested fix copied into the description. Skip pure `minor` unless user asked for polish.
   - Return to the Execution loop for the new tasks only.
   - After those complete, run `reviewer` again.

### Review cycle cap

- Maximum **2** full reviewer passes after the initial implementation (initial review + one rework review, or two rework cycles if you count only post-rework — hard stop: at most **2** times the reviewer returns `changes_required` followed by rework).
- After the cap, stop even if still `changes_required`. Present the latest review report and remaining open tasks. Do not loop forever.

## Completion

When the reviewer reports no blockers (`pass` / `pass_with_minor`) and all tasks in `TASKS` are `[x]`, stop.

Output exactly:

**The feature implementation is complete. All unit tests pass. The built-in reviewer verified the changes against the PRD, architecture, standards, security, and performance. It is now ready for manual testing.**
