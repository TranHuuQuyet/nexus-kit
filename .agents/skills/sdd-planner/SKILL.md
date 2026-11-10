---
name: sdd-planner
description: Skill to generate architecture and task specifications using Spec Kit with approval versioning and change management.
---
# SDD Planner Skill

## When to use
Trigger this skill when the user asks to plan a feature, design architecture, modify requirements on an existing spec, or create a task specification.

## Hard Guardrails
- **NEVER write or modify application code in `src/` during the planning phase.**
- **Do NOT assume ambiguous requirements.** Surface assumptions explicitly and ask clarifying questions before finalizing a spec.
- **CHANGE MANAGEMENT**: If modifying an already-approved spec, you MUST increment `Version`, record the change in `## Change Log`, reset `Status` to `In Review`, and set `Approved-Hash` to `Pending`.

## Workflow
1. **Read Constitution**: ALWAYS read `.specify/constitution.md` first to verify tech stack constraints, typing rules, and quality gates.
2. **Load Spec Kit Blueprint**: Read `.specify/templates/spec-template.md` as the mandatory structural template.
3. **Clarifying Interview & Assumptions**:
   - Surface hidden assumptions immediately (e.g., auth mechanism, storage engine, validation library).
   - If the request is underspecified, ask concise clarifying questions one at a time until requirements are concrete.
4. **Enforce Strict Scope Lock**:
   - Partition capabilities into **In-Scope** (explicitly required) and **Out-of-Scope** (explicitly excluded to prevent AI scope creep).
5. **Author Deterministic Contracts**:
   - Define explicit Domain Models / Schemas (TypeScript interfaces, Zod/JSON schemas, error types).
   - Map Logic Flows & State Transitions using Mermaid diagrams.
   - Enumerate Edge Cases (null/empty input, network timeout, idempotency, boundary limits).
   - Assign verifiable Acceptance Criteria IDs (`AC-1`, `AC-2`, etc.).
6. **Version & Save Specification**:
   - Set `Status: Draft` (or `In Review` for changes), `Version: 1.0.0` (or bumped semantic version), and `Approved-Hash: Pending`.
   - Save into `.specify/tasks/` with an incrementing numeric prefix and descriptive kebab-case name (e.g., `002-feature-name-spec.md`).
7. **Human Approval Gate**:
   - Present a summary of the spec and instruct the user to approve it (e.g., by running `npx create-nexus-kit --approve .specify/tasks/<file>.md`) before `sdd-coder` is permitted to execute.
