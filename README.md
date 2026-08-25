# coding-agent-config

This is the configuration I use to make coding agents more reliable across my projects.

The basic idea is pretty simple: **I don't want to rely on writing the perfect prompt every time I ask an agent to work on a codebase.**

Instead, I want the workflow around the agent to do a lot of the heavy lifting.

This repo is my attempt at building that workflow.

It gives [OpenCode](https://opencode.ai/) a shared set of commands, skills, agents and verification tools that I can use across different repositories. The application repo still owns its architecture, conventions and quality checks — this config provides the workflow around them.

## What problem am I trying to solve?

Coding agents are very capable, but giving one a task and hoping for the best can still be pretty hit or miss.

I've found that the quality improves significantly when the agent is encouraged to:

* understand the repository before changing it;
* turn larger tasks into a clear requirements contract;
* start from a known-good baseline;
* use deterministic tooling to catch things machines are good at catching;
* actually inspect UI changes rather than assuming they look right;
* get a fresh pair of eyes on changes where judgement matters; and
* leave the final product decision to me.

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
Define what "done" means
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
I validate the product
```

Not every change needs every step.

A tiny mechanical change shouldn't require a requirements document and multiple reviewers. A substantial feature probably should.

The workflow is deliberately proportional to the work.

## PRPs

For larger pieces of work I use **PRPs (Product Requirement Prompts)**.

A PRP is basically a temporary contract between me and the coding agent.

Before implementation, the agent investigates the repository and captures things like:

* what we're trying to achieve;
* the important requirements;
* decisions we've already made;
* constraints and edge cases; and
* what should be observably true when the work is finished.

What it **doesn't** do is prescribe exactly how the agent should implement the feature.

The repository and the agent still get to make those decisions based on the actual code.

PRPs are temporary working documents, not permanent project documentation. Once the feature is done, they've served their purpose.

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

## Where agents still need judgement

Not everything worth checking can be turned into a lint rule.

A test suite can tell me that something works. It can't reliably tell me that:

* the architecture makes sense;
* a solution became unnecessarily complicated;
* a UI has poor hierarchy;
* an interaction feels awkward; or
* something technically correct is still a bad product decision.

For meaningful changes, the workflow can therefore bring in independent engineering or UI reviewers.

These reviewers don't edit the code. Their job is to look at the finished work with fresh context and point out things the implementing agent may have missed.

For UI work, there's another important step: **look at the actual rendered interface**.

Passing tests isn't proof that a UI looks good.

## What's in here?

The repo is roughly split into a few building blocks:

```text
commands/   → workflows I explicitly invoke
agent/      → specialised agent roles
skills/     → expertise loaded when it's actually needed
scripts/    → shared deterministic tooling
plugins/    → small OpenCode integrations
AGENTS.md   → durable engineering principles for the workflow
```

Some examples:

**Commands** handle things like generating and executing PRPs or defining UX principles.

**Skills** provide focused knowledge for areas like Angular, UI design, Playwright, repository investigation and skill creation.

**Agents** give specific jobs to fresh contexts — for example an engineering reviewer or UI reviewer that didn't implement the original change.

**Scripts** contain reusable tooling such as the verification runner used across repositories.

## Repository first

A really important boundary in this setup is that **this repo does not try to become the source of truth for every project I work on**.

If I'm working on an Angular application, that application's repository should tell the agent how the application is structured, how it is tested and what conventions it follows.

This config sits above that.

It provides a consistent way of approaching the work without pretending every codebase is the same.

That separation also means I can keep improving the workflow here without coupling every project to a giant global instruction file.

## Human stays in the loop

The end goal isn't an autonomous agent that gets to decide when a product is finished.

The workflow tries to automate the parts where automation is useful:

**investigation → implementation → verification → review**

But product intent and final validation stay with me.

An agent can prove that the tests pass.

It can give me evidence that the implementation is sound.

It can review the interface.

It still doesn't get to decide whether we built the right thing.

## Can I use this?

Absolutely.

This repo is public mainly because I wanted to share the workflow I've been building and evolving while using coding agents day to day.

It's opinionated around how **I** like to work, so I wouldn't recommend blindly copying the whole thing and expecting it to fit your setup.

Browse it. Steal the bits you like. Change the bits you don't.

If it gives you one useful idea for improving your own coding-agent workflow, then it has done its job.
