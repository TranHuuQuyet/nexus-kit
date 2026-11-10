# GitHub Copilot Instructions — Nexus Kit

This repository follows **Spec-Driven Development (SDD)** powered by Nexus Kit.

## Mandatory Directives
- **No Spec, No Code**: Never generate or modify code in `src/` without verifying that an approved specification exists in `.specify/tasks/`.
- **Constitution First**: Always read `.specify/constitution.md` to respect project tech stack and type-safety guidelines.
- **Follow Skills**:
  - For planning/architecture: follow `.agents/skills/sdd-planner/SKILL.md` and use `.specify/templates/spec-template.md`.
  - For implementation: follow `.agents/skills/sdd-coder/SKILL.md` and stay strictly within `In-Scope` bounds.
  - For verification: follow `.agents/skills/sdd-verifier/SKILL.md` to audit against Acceptance Criteria.
