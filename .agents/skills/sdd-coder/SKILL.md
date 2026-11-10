---
name: sdd-coder
description: Skill to write code strictly based on generated specifications.
---
# SDD Coder Skill

## When to use
Trigger this skill when the user asks to implement code or complete a task that has already been planned in the `.specify/tasks/` directory.

## Workflow
1. **Target Specification**: Select and completely read the target specification file in `.specify/tasks/`. Verify it is in `Approved` or active status.
2. **Review Constitution**: Read `.specify/constitution.md` to enforce the project's tech stack, typing conventions, and error handling rules.
3. **Deterministic Implementation**:
   - Write modular, type-safe code in `src/` matching the exact data models and interfaces defined in the spec.
   - Strictly adhere to `In-Scope` items. Do NOT hallucinate features, endpoints, or unapproved dependencies.
4. **Test-Driven Verification**:
   - Author automated tests verifying both happy paths and documented edge cases.
5. **Invoke Verification**: Hand off to `sdd-verifier` to perform the final compliance audit against all Acceptance Criteria.
