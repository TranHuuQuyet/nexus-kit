# CLAUDE.md — Nexus Kit SDD Protocol

This project is governed by **Nexus Kit** (Spec-Driven Development).

## Mandatory Rules
1. **NO VIBE CODING**: Never write or modify code in `src/` without an approved specification in `.specify/tasks/`.
2. **Read Constitution First**: Always check `.specify/constitution.md` before planning or coding.
3. **Use SDD Skills** (located in `.agents/skills/`):
   - Planning a feature -> Follow `.agents/skills/sdd-planner/SKILL.md` and `.specify/templates/spec-template.md`.
   - Implementing a spec -> Follow `.agents/skills/sdd-coder/SKILL.md`.
   - Auditing implementation -> Follow `.agents/skills/sdd-verifier/SKILL.md`.
4. **Show Spec Status Board**: At the end of every Planning, Coding, or Verification response, display the current **Spec Status Board** in chat (prefer MCP `nexus://board`, else run `nexus-kit board` / `npx create-nexus-kit board`, or render a Markdown table from `.specify/tasks/` if offline).
5. **Agent Handoff Protocol**: Fluid transitions between roles: Planner hands off to Coder upon approval (`/sdd-coder`), Coder hands off to Verifier upon green tests (`/sdd-verifier`), and Verifier hands remediation back to Coder on failure or closes the task on success.
