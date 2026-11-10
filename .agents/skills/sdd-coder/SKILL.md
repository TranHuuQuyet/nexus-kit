---
name: sdd-coder
description: Skill to write code strictly based on approved, non-stale specifications.
---
# SDD Coder Skill

## When to use
Trigger this skill when the user asks to implement code or complete a task that has already been planned and approved in the `.specify/tasks/` directory.

## Hard Guardrails
- **NO SPEC, NO CODE**: Refuse to write code if no corresponding specification exists in `.specify/tasks/`. Redirect to `sdd-planner` instead.
- **APPROVAL & DRIFT GATE**: NEVER implement a spec whose `Status` is `Draft`, `In Review`, or `Superseded`, or whose `Approved-Hash` fails integrity verification (`npx create-nexus-kit --verify-spec <spec-path>`). If requirements changed after approval, stop and require human re-approval first.
- **ZERO SCOPE CREEP**: Implement ONLY items explicitly defined in the spec's `In-Scope` section. Never touch unrelated files or perform unsolicited refactoring.
- **NO HALLUCINATED DEPENDENCIES**: Never install third-party packages not authorized in the spec or `.specify/constitution.md`.

## Workflow
1. **Verify Approval & Integrity Gate**:
   - Read the target specification in `.specify/tasks/` completely.
   - Verify `Status` is `Approved` or `In Progress`.
   - Run `npx create-nexus-kit --verify-spec .specify/tasks/<spec-file>.md` (or verify `Approved-Hash`) to confirm the spec is neither unapproved nor stale/modified since approval.
2. **Enforce Constitution**: Read `.specify/constitution.md` to strictly honor the project's tech stack, strict typing (no `any` or blind casts), and error handling standards.
3. **Incremental, Type-Safe Implementation**:
   - Write modular, single-responsibility files inside `src/` conforming strictly to the spec's Domain Models and Interface Contracts.
   - Handle every documented Edge Case explicitly (never leave empty `catch {}` blocks or silent failures).
4. **Automated Test Verification**:
   - Write unit/integration tests verifying the happy path and every negative/edge case defined in the spec.
   - Run the test suite and ensure all tests pass with zero warnings.
5. **Handover to Verifier**: Invoke `sdd-verifier` to audit the implementation against all Acceptance Criteria before claiming task completion.
