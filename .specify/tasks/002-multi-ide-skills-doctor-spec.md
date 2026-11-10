# SPEC-002: Multi-IDE Integration, Production-Grade Skills & CLI Doctor

> **Status:** `Completed`  
> **Author:** Senior Tooling Engineer (via `sdd-planner`)  
> **Date:** 2026-11-10  
> **Target Path:** `.agents/skills/`, `.cursor/`, `.github/`, `CLAUDE.md`, `create-nexus-kit/`

---

## 1. Overview & Objective

### 1.1 Problem Statement
1. AI coding assistants rely on IDE-specific rule paths (`CLAUDE.md`, `.cursor/rules/*.mdc`, `.github/copilot-instructions.md`). Without lightweight adapters, users on Cursor, Claude Code, or GitHub Copilot do not automatically inherit Nexus Kit's Spec-Driven rules.
2. Current `SKILL.md` files provide high-level workflows but lack explicit anti-hallucination guardrails, clarifying interview rules, and traceability audit matrices.
3. Users have no automated command to verify whether their workspace is properly configured and healthy.

### 1.2 Scope Boundaries
- **In-Scope:**
  - Lightweight IDE pointer adapters (`CLAUDE.md`, `.cursor/rules/nexus-kit.mdc`, `.github/copilot-instructions.md`).
  - Upgrading `sdd-planner`, `sdd-coder`, and `sdd-verifier` skills with strict deterministic rules and traceability formats.
  - Implementing `--doctor` (alias `--check`) diagnostic mode in `create-nexus-kit/bin/index.js`.
  - Synchronizing all upgrades into `create-nexus-kit` (`bin/index.js`, `install.sh`, `package.json` v1.2.0).
  - Updating CI workflow `.github/workflows/ci.yml` to verify IDE adapters and `--doctor`.
- **Out-of-Scope:**
  - Adding external npm dependencies to `create-nexus-kit`.
  - Writing proprietary IDE plugins.

---

## 2. Interfaces & Contracts

### 2.1 CLI `--doctor` Interface
- **Invocation:** `create-nexus-kit --doctor [target-dir]` or `create-nexus-kit --check [target-dir]`
- **Default Target:** `process.cwd()`
- **Checks Executed:**
  1. `constitution`: `.specify/constitution.md` exists; warn if `TECH STACK` contains default placeholder.
  2. `template`: `.specify/templates/spec-template.md` exists.
  3. `tasks`: `.specify/tasks/` exists; count `.md` specification files.
  4. `skills`: Verify `sdd-planner`, `sdd-coder`, `sdd-verifier` `SKILL.md` files exist and contain valid YAML frontmatter (`---`, `name:`, `description:`).
  5. `ide-adapters`: Check `CLAUDE.md`, `.cursor/rules/nexus-kit.mdc`, `.github/copilot-instructions.md`.
- **Exit Codes:**
  - `0`: All mandatory Nexus Kit structures (constitution, template, skills) are valid.
  - `1`: One or more mandatory Nexus Kit files are missing or malformed.

---

## 3. Acceptance Criteria

- [x] **AC-1 (Multi-IDE Adapters)**: `CLAUDE.md`, `.cursor/rules/nexus-kit.mdc`, and `.github/copilot-instructions.md` exist and cleanly point to `.specify/constitution.md` and `.agents/skills/`.
- [x] **AC-2 (Production-Grade Skills)**: All 3 `SKILL.md` files include strict guardrails, maintain valid YAML frontmatter, and include `## When to use` and `## Workflow`.
- [x] **AC-3 (CLI Doctor Command)**: `node create-nexus-kit/bin/index.js --doctor` executes without external dependencies, validates project health, reports warnings/errors clearly, and returns accurate exit codes (`0` / `1`).
- [x] **AC-4 (Scaffolding Parity)**: Both `create-nexus-kit/bin/index.js` and `create-nexus-kit/install.sh` scaffold all new IDE adapters and upgraded skills.
- [x] **AC-5 (CI Integration)**: `.github/workflows/ci.yml` tests `--doctor` and validates the newly generated files.
