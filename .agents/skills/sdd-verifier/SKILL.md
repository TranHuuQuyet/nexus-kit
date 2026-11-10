---
name: sdd-verifier
description: Skill to verify and audit implemented code against task specifications and constitution guardrails.
---
# SDD Verifier Skill

## When to use
Trigger this skill when code has been implemented by `sdd-coder`, before committing or merging, or when the user asks to verify/audit whether a task in `.specify/tasks/` is completed.

## Workflow
1. **Locate Task Spec**: Read the target specification document in `.specify/tasks/`.
2. **Extract Criteria**: Identify all Acceptance Criteria (AC-1, AC-2, etc.), In-Scope bounds, and Out-of-Scope restrictions.
3. **Audit Implementation**:
   - Inspect files in `src/` to verify every AC is implemented.
   - Verify that NO Out-of-Scope logic or unapproved dependencies were introduced.
   - Verify adherence to `.specify/constitution.md` (no `any`, explicit types, proper error handling).
4. **Run Verification Commands**:
   - Run type checks and test suites.
5. **Output Verification Report**:
   - Present a checklist of all ACs with `[PASSED]` or `[FAILED]` status.
   - If any AC fails, provide actionable instructions for `sdd-coder` to fix.
