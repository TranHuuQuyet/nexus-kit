---
name: sdd-planner
description: Skill to generate architecture and task specifications using Spec Kit.
---
# SDD Planner Skill

## When to use
Trigger this skill when the user asks to plan a feature, design architecture, or create a task specification.

## Workflow
1. **Read Constitution**: ALWAYS read `.specify/constitution.md` first to understand the project guardrails and tech stack.
2. **Load Template**: Load `.specify/templates/spec-template.md` as the blueprint.
3. **Elicit Requirements**: If the user's request is ambiguous, ask clarifying questions one at a time. Explicitly state assumptions.
4. **Author Specification**:
   - Define User Stories, strict In-Scope and Out-of-Scope boundaries.
   - Specify deterministic Data Models, Types, and Interfaces.
   - Detail the Logic Flow with Mermaid diagrams.
   - Enumerate Edge Cases and concrete Acceptance Criteria (AC-1, AC-2, etc.).
5. **Save Document**: Save into `.specify/tasks/` with an incrementing ID and descriptive name (e.g., `002-feature-name-spec.md`).
6. **Gate Check**: Prompt the user to review and approve the specification before any code is written.
