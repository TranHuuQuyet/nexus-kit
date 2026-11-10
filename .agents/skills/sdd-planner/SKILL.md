---
name: sdd-planner
description: Skill to generate architecture and task specifications using Spec Kit.
---
# SDD Planner Skill

## When to use
Trigger this skill when the user asks to plan a feature, design architecture, or create a task specification.

## Workflow
1. ALWAYS read `.specify/constitution.md` first to understand the project guardrails.
2. Ask clarifying questions if the user's request is ambiguous.
3. Generate a structured Markdown specification document outlining Data Models, API Endpoints, UI Components, and Logic Flow.
4. Save this specification document into `.specify/tasks/` with a descriptive name (e.g., `feature-name-spec.md`).
