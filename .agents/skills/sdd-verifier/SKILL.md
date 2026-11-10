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

## Workflow
1. **Extract Spec Contract & Integrity**:
   - Read the target specification document in `.specify/tasks/`.
   - Verify `Approved-Hash` integrity has not drifted unexpectedly during implementation.
   - Extract all Acceptance Criteria (`AC-1`, `AC-2`...), `In-Scope` bounds, `Out-of-Scope` prohibitions, and `Edge Cases`.
2. **Build Traceability Matrix**:
   - Inspect files in `src/` and map every Acceptance Criterion to the exact file path and line range implementing it.
   - Verify no `Out-of-Scope` code or unauthorized dependencies were introduced.
3. **Constitution Compliance Check**:
   - Audit code against `.specify/constitution.md`: verify explicit types (no `any`), structured validation (no loose string parsing), and proper error handling.
4. **Run Automated Gates**:
   - Execute project tests, type checks, linters, and `npx create-nexus-kit --doctor` directly in the terminal and observe full outputs.
5. **Finalize & Emit Verification Report**:
   - Render a Traceability & Compliance table marking each AC as `[PASSED]` or `[FAILED]` with observed evidence.
   - Only if all checks pass: mark ACs as `- [x]` and update `Status` to `Completed`. Otherwise block completion and hand specific remediation items back to `sdd-coder`.
