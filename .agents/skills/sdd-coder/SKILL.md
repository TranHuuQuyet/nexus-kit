---
name: sdd-coder
description: Skill to write code strictly based on generated specifications.
---
# SDD Coder Skill

## When to use
Trigger this skill when the user asks to implement code or complete a task that has already been planned in the `.specify/tasks/` directory.

## Workflow
1. Ask the user which specification file in `.specify/tasks/` they want to implement (if not explicitly mentioned).
2. Read the chosen specification file completely.
3. Write modular, robust code in the `src/` directory that strictly adheres to the specification AND the rules in `.specify/constitution.md`.
4. Do NOT hallucinate features or logic that are not present in the specification.
