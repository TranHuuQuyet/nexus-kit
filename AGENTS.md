# AGENTS.md — Nexus Kit SDD Protocol

This workspace operates under **Nexus Kit** (Spec-Driven Development).

## Mandatory Rules
1. **NO VIBE CODING**: Never write or modify application code in `src/` without an approved specification in `.specify/tasks/`.
2. **Read Constitution First**: Always read `.specify/constitution.md` before planning or writing code.
3. **Execute the SDD Triad** (located in `.agents/skills/`):
   - **Planning**: Use `.agents/skills/sdd-planner/SKILL.md` and `.specify/templates/spec-template.md` to draft specs into `.specify/tasks/`. Wait for human approval before coding.
   - **Coding**: Use `.agents/skills/sdd-coder/SKILL.md` to implement strictly within the `In-Scope` bounds of the approved spec.
   - **Verification**: Use `.agents/skills/sdd-verifier/SKILL.md` to audit the implementation against all Acceptance Criteria.
4. **Show Spec Status Board**: At the end of every Planning, Coding, or Verification response, display the current **Spec Status Board** in chat (prefer MCP `nexus://board`, else run `nexus-kit board` / `npx create-nexus-kit board`, or render a Markdown table from `.specify/tasks/` if offline).
5. **Agent Handoff Protocol**: Fluid transitions between roles: Planner hands off to Coder upon approval (`/sdd-coder`), Coder hands off to Verifier upon green tests (`/sdd-verifier`), and Verifier hands remediation back to Coder on failure or closes the task on success.
