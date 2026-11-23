# GitHub Copilot Instructions — Nexus Kit

This repository follows **Spec-Driven Development (SDD)** powered by Nexus Kit.

## Mandatory Directives
- **No Spec, No Code**: Never generate or modify code in `src/` without verifying that an approved specification exists in `.specify/tasks/`.
- **Constitution First**: Always read `.specify/constitution.md` to respect project tech stack and type-safety guidelines.
- **Follow Skills**:
  - For planning/architecture: follow `.agents/skills/sdd-planner/SKILL.md` and use `.specify/templates/spec-template.md`.
  - For implementation: follow `.agents/skills/sdd-coder/SKILL.md` and stay strictly within `In-Scope` bounds.
  - For verification: follow `.agents/skills/sdd-verifier/SKILL.md` to audit against Acceptance Criteria.
- **Show Spec Status Board**: At the end of every Planning, Coding, or Verification response, display the current **Spec Status Board** in chat (prefer MCP `nexus://board`, else run `nexus-kit board` / `npx create-nexus-kit board`, or render a Markdown table from `.specify/tasks/` if offline).
- **Agent Handoff Protocol**: Fluid transitions between roles: Planner hands off to Coder upon approval (`/sdd-coder`), Coder hands off to Verifier upon green tests (`/sdd-verifier`), and Verifier hands remediation back to Coder on failure or closes the task on success.
