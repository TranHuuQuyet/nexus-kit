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
- **BOUNDED SELF-HEALING & NO FAKE PASSES**: Never lower the quality bar to force tests to pass (never delete tests, comment out assertions, or replace checks with trivial assertions). Auto-remediation is bounded to a maximum of 3 iterations; if unresolved, halt and escalate.

## Workflow
1. **Verify Approval & Integrity Gate**:
   - Read the target specification in `.specify/tasks/` completely.
   - Verify `Status` is `Approved` or `In Progress`.
   - Run `npx create-nexus-kit --verify-spec .specify/tasks/<spec-file>.md` (or verify `Approved-Hash`) to confirm the spec is neither unapproved nor stale/modified since approval.
2. **Enforce Constitution & Contracts**: Read `.specify/constitution.md` to strictly honor tech stack, strict typing (no `any` or blind casts), and error handling standards.
3. **Mandatory TDD Red-Green-Refactor Loop**:
   - **Step 3.1: Red Phase (Test First)**:
     * Author automated unit/integration tests directly mapping each Acceptance Criterion (`AC-1`..`AC-N`) and edge case before touching `src/`.
     * Execute test runner and confirm tests fail as expected (`Red`) due to missing implementation.
   - **Step 3.2: Green Phase (Minimal Implementation)**:
     * Write clean, type-safe implementation code inside `src/` conforming strictly to the spec's Domain Models and Interface Contracts.
     * Run tests and confirm all pass with zero warnings (`Green`).
   - **Step 3.3: Refactor Phase (Hardening)**:
     * Clean up code, remove duplication, and handle documented Edge Cases explicitly (never leave empty `catch {}` blocks or unhandled promises).
4. **Bounded Self-Healing**:
   - If tests or linters fail during development, read the full error stack trace to diagnose the root cause.
   - Auto-repair the implementation (maximum 3 iterations).
   - If still failing after 3 attempts, halt immediately and present the diagnostic failure log to the user.
5. **Handover to Verifier & Status Board**: Invoke `sdd-verifier` to audit the implementation against all Acceptance Criteria before claiming task completion, and include the updated **Spec Status Board** in your chat report (via MCP `nexus://board`, CLI `nexus-kit board`, or Markdown fallback table from `.specify/tasks/`).

## Agent Handoff Protocol
- **Subagent Delegation (Isolated TDD)**: When executing extensive test suites or refactoring, delegate test execution to an isolated subagent or background task runner.
- **Handoff to Verifier**: Once the TDD Red-Green loop passes with zero warnings, conclude your turn by directly prompting invocation of `sdd-verifier` (e.g. `/sdd-verifier`) along with the live Spec Status Board.
