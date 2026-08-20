---
name: workflow-for-alex
description: Design, review, and optimise AI commands, skills, and agents so they align with Alex's engineering principles, workflow philosophy, and preferred collaboration style.
metadata:
  opencode/autoinvoke: false
---

# Workflow Design Principles for Alex

## Purpose

This skill helps create, review, and improve AI workflows:

- commands
- skills
- subagents
- prompts
- automation workflows

The goal is to ensure AI workflows complement Alex's root `AGENTS.md` rather than contradict it.

The root `AGENTS.md` defines how Alex wants engineering work to be approached.

This skill defines how AI workflows should be designed so they reinforce those principles.

Do not duplicate the root `AGENTS.md`. Build on it.

---

# Core philosophy

AI workflows should amplify good engineering judgement, not replace it.

A good workflow should:

- reduce repetitive thinking
- capture valuable expertise
- improve consistency
- make complex work easier
- help engineers make better decisions

A bad workflow:

- adds ceremony without value
- creates unnecessary steps
- blindly follows checklists
- encourages people to stop thinking
- duplicates existing knowledge

Before creating anything, ask:

> "What problem does this solve today?"

Avoid creating workflows that only solve hypothetical future problems.

---

# Design principles

## Prefer judgement over rigid rules

Good engineering requires context.

Avoid creating workflows that blindly enforce behaviour.

Prefer:

"Consider these factors and make a decision"

over:

"Always do these exact steps."

The goal is to help an engineer think better, not remove the need for thinking.

---

## Keep instructions high signal

AI context has a cost.

Every instruction should justify its existence.

Prefer:

- clear principles
- important constraints
- decision-making frameworks
- useful examples

Avoid:

- unnecessary explanations
- duplicated documentation
- obvious rules
- long checklists that provide little value

If information already exists elsewhere, reference it instead of copying it.

---

## Understand before acting

AI workflows should encourage agents to understand context before making changes.

A good workflow should consider:

- existing repository patterns
- architecture
- documentation
- previous decisions
- project-specific constraints

Do not design workflows that encourage agents to jump straight into implementation without understanding the system.

---

## Optimise for the correct outcome

Do not optimise workflows for:

- maximum automation
- maximum speed
- maximum output

Optimise for:

- correct decisions
- maintainable solutions
- reduced mistakes
- better engineering outcomes

Automation is valuable when it removes unnecessary effort, not when it removes important thinking.

---

# Creating commands

Commands should have:

- a clear purpose
- a predictable outcome
- a defined scope

A good command should answer:

- When should I use this?
- What problem does it solve?
- What context does it need?
- What should the output look like?

Avoid commands that try to do everything.

Prefer small, composable workflows.

---

# Creating skills

Skills should capture reusable expertise.

A good skill contains:

- knowledge that applies across multiple situations
- principles and decision-making guidance
- patterns that improve consistency

A skill should not become a dumping ground for:

- temporary decisions
- project-specific instructions
- duplicated documentation

Prefer principles over procedures.

---

# Creating agents

Agents should have a clear responsibility.

A good agent:

- has a defined role
- understands its goal
- knows its boundaries
- knows when to ask for input
- respects existing workflows

Avoid creating agents that overlap heavily with existing agents or have unclear ownership.

---

# Avoid unnecessary complexity

Apply the same engineering principle used when building software:

> "Is this solving a problem we have today, or a problem we might have tomorrow?"

Do not create:

- extra approval steps without value
- unnecessary subagents
- complex orchestration
- workflows harder to understand than the problem they solve

Start simple.

Add complexity only when experience proves it is needed.

---

# Communication style

AI workflows created using this skill should encourage:

- natural language over robotic instructions
- concise explanations over unnecessary verbosity
- clear reasoning over unexplained decisions
- honest uncertainty over confident guessing

The AI should feel like a trusted engineering partner, not a command executor.

---

# Review checklist

Before finalising a command, skill, or agent:

## Value

- Does this solve a real recurring problem?
- Will it save time or improve decisions?

## Alignment

- Does this complement the root `AGENTS.md`?
- Does it reinforce good engineering judgement?

## Simplicity

- Is this the simplest workflow that solves the problem?
- Are there unnecessary steps?

## Maintainability

- Will someone understand why this exists?
- Is the scope clear?
- Is the workflow easy to evolve?

## Boundaries

- Does it know what it should and should not do?
- Does it avoid making decisions outside its responsibility?

---

# Final principle

Create AI workflows the same way you create software:

Start with the problem.
Understand the context.
Choose the simplest solution that provides value.
Improve it based on experience.

The goal is not more automation.

The goal is better engineering.
