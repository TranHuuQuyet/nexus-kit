---
name: sdd-verifier
description: Skill to verify and audit implemented code against approved task specifications, integrity hashes, and constitution guardrails.
---
# SDD Verifier Skill

## When to use
Trigger this skill immediately after `sdd-coder` finishes implementing code, before committing or opening a pull request, or when the user asks to audit whether a task in `.specify/tasks/` is genuinely complete.

## Hard Guardrails
- **ZERO TRUST AUDIT**: Never assume an implementation works or matches the spec by memory. Read the actual source files and observe live command outputs.
- **NO PARTIAL PASSES**: All Acceptance Criteria (`AC-1`..`AC-N`) and all tests must pass without skipped assertions. Never mark `Status: Completed` if any AC remains unchecked (`- [ ]`).
- **ANTI-FAKE TEST GATE**: Never accept tests with empty bodies, trivial assertions (e.g. `expect(true).toBe(true)`), commented-out checks, or over-mocking that circumvents real logic execution.
- **SCOPE INTEGRITY GATE**: Fail the verification if unstaged/staged git changes include files outside the spec's `Target Path` or unauthorized dependencies in `package.json`.

## Workflow
1. **Extract Spec Contract & Integrity**:
   - Read the target specification document in `.specify/tasks/`.
   - Verify `Approved-Hash` integrity has not drifted unexpectedly during implementation.
   - Extract all Acceptance Criteria (`AC-1`, `AC-2`...), `In-Scope` bounds, `Out-of-Scope` prohibitions, Non-Functional Requirements (NFRs), and `Edge Cases`.
2. **Git Diff Scope & Dependency Leak Check**:
   - Run `git status --porcelain` and `git diff --name-only` to verify all changed files are strictly within `Target Path` and `In-Scope`.
   - Inspect package manifests (e.g. `package.json`) to confirm zero unauthorized dependencies were added.
3. **Anti-Fake Test & Quality Audit**:
   - Inspect all written test files.
   - Verify each Acceptance Criterion has non-trivial, affirmative and negative assertions (no empty tests or bypassed checks).
4. **Build Traceability Matrix**:
   - Inspect files in `src/` and map every Acceptance Criterion to the exact file path and line range implementing it.
   - Verify code against `.specify/constitution.md`: explicit types (no `any`), structured validation, and robust error handling.
5. **Run Automated Gates**:
   - Execute project tests, type checks, linters, and `npx create-nexus-kit --doctor` directly in the terminal and observe full outputs.
6. **Finalize, Emit Verification Report & Status Board**:
   - Render a Traceability & Compliance table marking each AC as `[PASSED]` or `[FAILED]` with observed evidence.
   - Only if all checks pass: mark ACs as `- [x]` and update `Status` to `Completed`. Otherwise block completion and hand specific remediation items back to `sdd-coder`.
   - Always conclude your response by displaying the live **Spec Status Board** in chat: prefer MCP resource `nexus://board`, otherwise run `nexus-kit board` / `npx create-nexus-kit board`, or if offline/sandboxed render a Markdown table (`ID | Ver | Status | Integrity | Criteria | Progress | Title`) directly from `.specify/tasks/`.

## Agent Handoff Protocol
- **Remediation Handoff**: If any Acceptance Criteria or tests fail during verification, reject completion and immediately hand off a structured remediation checklist back to `sdd-coder` (e.g. `/sdd-coder`).
- **Completion Handoff**: When 100% of Acceptance Criteria pass, mark `Status: Completed`, render the final Spec Status Board, and signal task closure to the user and team.
