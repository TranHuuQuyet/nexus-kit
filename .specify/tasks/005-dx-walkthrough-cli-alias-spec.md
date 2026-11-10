# SPEC-005: Developer Experience Walkthrough & Short CLI Alias

> **Status:** `Completed`  
> **Version:** `1.0.0`  
> **Author:** Senior Tooling Engineer (via `sdd-planner`)  
> **Date:** 2026-11-10  
> **Approved-By:** `Tran Huu Quyet`  
> **Approved-At:** `2026-11-10T12:08:11.553Z`  
> **Approved-Hash:** `sha256:5f3f8aa22122bb05924e0c353dac4aaaa5d1f003348120826579b5eaab2285fd`  
> **Target Path:** `README.md`, `README.vi.md`, `create-nexus-kit/`

---

## 1. Overview & Objective

### 1.1 Problem Statement
1. Existing documentation (`README.md`, `README.vi.md`, `create-nexus-kit/README.md`, and the scaffolded project `README.md`) summarizes CLI flags and abstract phases, but lacks concrete prompt examples, a `TECH STACK` configuration example, and Change Management usage steps for first-time users.
2. Daily lifecycle commands (`--approve`, `--verify-spec`, `--doctor`) are verbose via `npx create-nexus-kit` and vulnerable to stale `npx` caching unless `@latest` or a global/local bin alias (`nexus-kit`) is documented and exposed.

### 1.2 Scope Boundaries
- **In-Scope:**
  - Add `"nexus-kit": "bin/index.js"` alias to `"bin"` in `create-nexus-kit/package.json` (v1.5.0).
  - Update `TEMPLATES.readme` in `create-nexus-kit/lib/nexus.js` and `create-nexus-kit/install.sh` with a concise 4-step checklist + example AI prompts + Change Management note.
  - Update `README.md`, `README.vi.md`, and `create-nexus-kit/README.md` with clean, practical walkthroughs (no bloated prose or emojis) and `@latest` / `nexus-kit` alias usage.
  - Add unit test assertions in `create-nexus-kit/tests/cli.test.js` verifying `bin` alias and generated `README.md` checklist.
- **Out-of-Scope:**
  - Adding interactive CLI prompts or runtime dependencies.

---

## 2. Acceptance Criteria

- [x] **AC-1 (CLI Alias)**: `create-nexus-kit/package.json` exposes both `create-nexus-kit` and `nexus-kit` binaries pointing to `bin/index.js` at version `1.5.0`.
- [x] **AC-2 (Generated Project Checklist)**: Both `lib/nexus.js` and `install.sh` generate a concise, actionable `README.md` containing Tech Stack setup, sample AI prompts, `--approve`, and `--doctor` commands.
- [x] **AC-3 (Repository & NPM Docs)**: `README.md`, `README.vi.md`, and `create-nexus-kit/README.md` include clean step-by-step usage walkthroughs (including Change Management) and `npx create-nexus-kit@latest` guidance.
- [x] **AC-4 (Automated Tests & CI)**: `npm test` verifies the `nexus-kit` bin alias and generated `README.md` walkthrough, and `--doctor` passes with zero errors.

---

## 3. Change Log

| Version | Date | Author | Summary |
| :--- | :--- | :--- | :--- |
| `1.0.0` | `2026-11-10` | `sdd-planner` | Initial specification for DX walkthrough and CLI alias. |
