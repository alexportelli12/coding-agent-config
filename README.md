# coding-agent-config

This is the configuration I use to make coding agents more reliable across my projects.

The basic idea is pretty simple: **I don't want to rely on writing the perfect prompt every time I ask an agent to work on a codebase.**

Instead, I want the workflow around the agent to do a lot of the heavy lifting.

This repo is my attempt at building that workflow.

It gives [OpenCode](https://opencode.ai/) and [Claude Code](https://code.claude.com/) one shared set of commands, skills, agent instructions and verification tools across projects. The application repo still owns its architecture, conventions and quality checks.

## Install

Add `~/.local/bin` (on Windows `%USERPROFILE%\.local\bin`) to `PATH` in your
shell and CI first. Use Node.js and run `node scripts/install.mjs` from this checkout, then
`node scripts/install.mjs --check`. The installer links the shared files into
`~/.config/opencode/` and `~/.claude/` and exposes `verify-runner` and
`implementation-workspace` in that bin directory. `npm run verify`
then works identically in a normal shell, CI, OpenCode or Claude Code. No
application repo needs host-specific config. The installer is idempotent,
preflights all destinations and stops without changing anything if it finds
conflicting existing configuration; resolve those paths deliberately and rerun.
If you previously copied Claude Code commands, agents or skills by hand, compare
them and move your own copies aside before rerunning; setup never overwrites
them. Existing application repositories need no changes to their `verify`
scripts. Existing worktree metadata, paths and `opencode/` branches remain valid:
legacy metadata continues to be updated in place, while new worktrees use a
host-neutral metadata filename. The legacy Git lock name is retained to keep
old and new lifecycle processes synchronized.
Do not link the whole `~/.claude/skills` directory: Claude Code may also store
its own synced skills there. The installer links only this checkout's authored
skills. Run `npm run verify` here to check the configuration and lifecycle.

The shared boundary is `AGENTS.md`, `commands/`, `skills/`, `agent/` (canonical
role prompts), and `scripts/`. `opencode.json` owns OpenCode models, agent
permissions, and its Playwright MCP. `claude/agents.json` owns Claude-specific
agent metadata; `claude/agents/` is generated from it and `agent/` by
`npm run agents:generate`. The generated wrappers are checked by `npm run verify`
so behavioural prompts cannot silently drift. Claude Code reads the linked
`CLAUDE.md` from `AGENTS.md`, while both hosts discover the same commands and
skills through their native user configuration directories.
This follows [Claude Code's user skills/commands](https://code.claude.com/docs/en/skills),
[subagents](https://code.claude.com/docs/en/sub-agents), and
[MCP scopes](https://code.claude.com/docs/en/mcp), and OpenCode's
[commands](https://opencode.ai/docs/commands/) and
[agent prompt files](https://opencode.ai/docs/agents/).

For rendered inspection in Claude Code, install the browser server in native
user scope where Chromium/Playwright is available:

```bash
claude mcp add --scope user playwright -- npx -y @playwright/mcp@latest --headless --isolated
claude mcp get playwright
```

Configure the browser binary and output directory for your platform as needed;
OpenCode's existing `opencode.json` Playwright settings remain OpenCode-only.
OCR Delegation Mode requires the `ocr` CLI on `PATH` in either host. The
reviewer uses `ocr delegate preview` and `ocr delegate rule` locally; the host
supplies the reviewing model. Claude Code may prompt for access to a newly
created external implementation worktree; grant that directory for the session
using its native `/add-dir` when requested. Verify Claude Code configuration
with `claude doctor`, `/status`, and `/agents` after installation.

## What problem am I trying to solve?

Coding agents are very capable, but giving one a task and hoping for the best can still be pretty hit or miss.

I've found that the quality improves significantly when the agent is encouraged to:

* understand the repository before changing it;
* establish a clear requirements contract for the active task;
* start from a known-good baseline;
* use deterministic tooling to catch things machines are good at catching;
* actually inspect UI changes rather than assuming they look right;
* get a fresh pair of eyes on changes where judgement matters;
* deliver completed work as a reviewable pull request; and
* leave the final product and merge decisions to me.

The goal isn't to make the agent follow a huge rulebook.

It's almost the opposite.

I want **less prompting, less repeated context and fewer instructions that should really be enforced by tooling**.

## The workflow

At a high level, feature work looks something like this:

```text
Understand the task
        ↓
Investigate the repository
        ↓
Define what "done" means in the active session
        ↓
Verify the repo is healthy
        ↓
Implement
        ↓
Run deterministic checks
        ↓
Inspect the actual result
        ↓
Independent review where useful
        ↓
Create a pull request
        ↓
I validate the product and decide whether to merge
```

Not every change needs every step.

A tiny mechanical change shouldn't require exhaustive requirements analysis and independent review. A substantial feature probably should.

The workflow is deliberately proportional to the work.

## Implementation workflow

[`/implement`](commands/implement.md) is the single command for taking a request from discovery through a pull request ready for review.

The agent first investigates the repository and establishes a lean task contract in the active session. That contract captures things like:

* what we're trying to achieve;
* the important requirements;
* decisions we've already made;
* constraints and edge cases; and
* what should be observably true when the work is finished.

The session itself is the working artifact. The workflow doesn't create a separate planning or requirements document.

The contract also doesn't prescribe exactly how the agent should implement the feature. The repository and the agent still get to make those decisions based on the actual code.

If investigation reveals a material product or architectural ambiguity, the agent asks me. Otherwise it continues without a separate planning approval checkpoint.

The command first synchronizes the repository's normal control checkout using explicit fetch and fast-forward semantics, then creates a dedicated feature branch and linked worktree outside the repository. Branch and worktree names preserve the short request slug; if that slug is already in use, allocation adds a deterministic numeric suffix. New branches use the `agent/` prefix unless a repository requires `--prefix`; existing `opencode/` branches and their retained worktrees remain owned and usable. The repository directory retains a deterministic identity hash so repositories with the same basename cannot share workspaces, while the returned `sessionId` remains a separate opaque ownership token. Discovery, dependency setup, implementation, verification and review all happen in that isolated workspace, so concurrent `/implement` sessions do not share branches, staged files or mutable dependency state.

After a green verification baseline, the command implements, runs final verification, performs applicable rendered inspection and independent review, and remediates meaningful findings. It then commits the intended changes and records that the committed tree is covered by the completed evidence before rechecking the remote default branch. Centralized lifecycle tooling rebases only session-owned unpublished commits, preserves published follow-up history with a merge when synchronization is required, and stops on ambiguous or conflicting state. Any effective integration change clears that evidence record, so the branch remains unpublishable until the command refreshes the affected gates and records the new tree.

It never merges the pull request.

The implementation worktree stays locked and available after PR creation for follow-up requests in the same session. Follow-ups synchronize and update that exact owned branch and existing PR rather than creating another workspace or PR. Failed preflights are also retained for diagnosis. Lifecycle operations resolve the owned worktree from session metadata, so agents no longer need to remember which directory they run from.

The lifecycle also includes small workspace utilities:

```bash
implementation-workspace list                     # all retained workspaces
implementation-workspace info --session <id>      # path, branch, PR for one
implementation-workspace cleanup                  # dry-run report by default
implementation-workspace cleanup --dry-run false  # actually remove safe ones
```

`prepare` copies gitignored local env files (`.env*`) from the control checkout into each fresh worktree — never overwriting existing files and reporting exactly what it provisioned — so repositories that need machine-local environment configuration verify without manual copying. Transient evidence such as rendered-inspection screenshots or analysis documents is written to a temporary directory inside the owned worktree or a system temporary directory, never into the control checkout.

`cleanup` deletes retained worktrees only when it can deterministically establish that removing the worktree cannot discard the only useful representation of the implementation history. GitHub state (`gh pr view`) must report the recorded pull request merged or closed, and Git evidence must confirm consumption: the branch head (or the PR's recorded merge commit, for squash merges) must be contained in a freshly fetched remote default branch. Open pull requests, missing pull-request metadata, dirty worktrees, the invoking worktree, in-flight operations, and any state that cannot be proven with Git evidence are always protected, and the local branch is deleted only when Git itself accepts a safe `branch -d`.

## Verification

One of the biggest ideas behind this setup is that **things which can be checked deterministically shouldn't depend on an agent remembering an instruction**.

Each project owns an:

```bash
npm run verify
```

That command represents the project's definition of mechanically healthy code.

Depending on the project, that might include formatting, linting, type checking, tests, builds, architecture rules or other checks.

This repo provides a shared verification runner so those checks behave consistently across my projects, but it deliberately doesn't decide what every repository should verify.

The project owns the rules. This workflow makes sure they get respected.

The command must pass before implementation begins and again after implementation or remediation. Pull-request delivery only starts after final verification and every applicable judgement gate is clear of unresolved high or medium findings.

## Where agents still need judgement

Not everything worth checking can be turned into a lint rule.

A test suite can tell me that something works. It can't reliably tell me that:

* the architecture makes sense;
* a solution became unnecessarily complicated;
* a UI has poor hierarchy;
* an interaction feels awkward; or
* something technically correct is still a bad product decision.

For meaningful changes, the workflow can therefore bring in one independent code reviewer using [OpenCodeReview Delegation Mode](https://github.com/alibaba/open-code-review/blob/main/pages/src/content/docs/en/integrations/delegate.md) for deterministic file selection and review rules.

The reviewer doesn't edit code. It reviews the finished work with fresh task context, including UI/UX where relevant; the orchestrator triages findings and fixes justified issues. After fixes, one focused confirmation checks resolution and material regressions. Only a serious blocker permits one bounded exception cycle.

The reviewer runs `ocr delegate preview` and `ocr delegate rule` in the isolated worktree with task context and JSON output, then reviews the selected diffs itself using its OpenCode or Claude Code model. OCR never calls an LLM and needs no separate model configuration or API key. Its default selection excludes common test files; when relevant changed specs are excluded, the implementation repository can add narrow `include` patterns in `.opencodereview/rule.json` so OCR selects them. The CLI-based workflow works in both hosts without depending on either host's OCR plugin.

For UI work, there's another important step: **look at the actual rendered interface**.

Passing tests isn't proof that a UI looks good.

## What's in here?

The repo is roughly split into a few building blocks:

```text
commands/   → workflows I explicitly invoke
agent/      → specialised agent roles
skills/     → expertise loaded when it's actually needed
scripts/    → shared deterministic tooling
AGENTS.md   → durable engineering principles for the workflow
claude/     → Claude Code agent metadata and generated wrappers
opencode.json → OpenCode-only host configuration
```

Some examples:

**Commands** handle implementing a request end to end, defining UX principles or auditing the workflow itself.

**Skills** provide focused knowledge for areas like Angular, UI design, Playwright, repository investigation, commit and pull-request writing, and skill creation.

**Agents** give specific jobs to fresh contexts, for example a code reviewer that didn't implement the original change.

**Scripts** contain reusable tooling such as the verification runner and the deterministic implementation workspace lifecycle used across repositories.

## Repository first

A really important boundary in this setup is that **this repo does not try to become the source of truth for every project I work on**.

If I'm working on an Angular application, that application's repository should tell the agent how the application is structured, how it is tested and what conventions it follows.

This config sits above that.

It provides a consistent way of approaching the work without pretending every codebase is the same.

That separation also means I can keep improving the workflow here without coupling every project to a giant global instruction file.

## Human stays in the loop

The end goal isn't an autonomous agent that gets to decide when a product is finished.

The workflow tries to automate the parts where automation is useful:

**investigation → implementation → verification → review → pull-request delivery**

Product intent, final validation and the merge decision stay with me.

An agent can prove that the tests pass.

It can give me evidence that the implementation is sound.

It can review the interface.

It can prepare a concise pull request for me to review.

It still doesn't get to decide whether we built the right thing or whether the pull request should be merged.

## Can I use this?

Absolutely.

This repo is public mainly because I wanted to share the workflow I've been building and evolving while using coding agents day to day.

It's opinionated around how **I** like to work, so I wouldn't recommend blindly copying the whole thing and expecting it to fit your setup.

Browse it. Steal the bits you like. Change the bits you don't.

If it gives you one useful idea for improving your own coding-agent workflow, then it has done its job.
