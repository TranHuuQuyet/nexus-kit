# SPEC-003: CLI Non-Overwrite Safety, Deep Doctor Validator, Unit Tests & Verified Antigravity Rules

> **Status:** `Completed`  
> **Author:** Senior Tooling Engineer (via `sdd-planner`)  
> **Date:** 2026-11-10  
> **Target Path:** `AGENTS.md`, `create-nexus-kit/`, `.github/workflows/ci.yml`, `README.md`, `README.vi.md`
> **Approved-By:** `Tran Huu Quyet`  
> **Approved-At:** `2026-11-10T07:08:33.204Z`  
> **Approved-Hash:** `sha256:92b9ba9e7ac165d0c6eaa459734be6ef73aea66ac1a3e3c954c206eb35ca8be5`  

---

## 1. Overview & Objective

### 1.1 Problem Statement
Code review surfaced 4 engineering gaps in Nexus Kit v1.2.0:
1. **P0 — File Overwrite Risk**: Running `npx create-nexus-kit .` in an existing project overwrites existing `README.md`, `CLAUDE.md`, `.gitignore`, or `.specify/constitution.md` unconditionally.
2. **P1 — Shallow Doctor Checks**: `--doctor` uses basic substring checks instead of parsing YAML frontmatter, validating section structure, checking spec templates, or verifying cross-references in IDE adapters.
3. **P2 — Insufficient Test Coverage**: `npm test` only runs `--help`, lacking automated tests for overwrite protection, `--force`, malformed YAML, and broken cross-references.
4. **P2 — Unverified Antigravity Rule Loading**: Antigravity `.agents/skills/` uses progressive disclosure; without a root `AGENTS.md` (without frontmatter, per Antigravity's rules spec), rules are not unconditionally injected into context.

### 1.2 Scope Boundaries
- **In-Scope:**
  - Non-destructive scaffolding by default (skip existing files, display skipped list) + `--force` / `-f` flag to overwrite (`bin/index.js` and `install.sh`).
  - Modular core engine in `create-nexus-kit/lib/nexus.js` with deep validation (`PASS`, `WARN`, `FAIL` levels), strict YAML frontmatter parsing, and cross-reference checks.
  - Automated test suite in `create-nexus-kit/tests/cli.test.js` using `node:test` and `node:assert/strict` (zero external dependencies).
  - Root `AGENTS.md` (no YAML frontmatter, verified against Antigravity customization specification).
  - Accurate IDE support matrix in `README.md`, `README.vi.md`, and `create-nexus-kit/README.md`.
  - CI pipeline update to execute `npm test`.
- **Out-of-Scope:**
  - Adding third-party npm dependencies (must remain 0 dependencies).
  - Implementing interactive prompt TUI menus.

---

## 2. Interfaces & Validation Rules

### 2.1 CLI Flags & Behavior
- `npx create-nexus-kit [target]` — Creates missing directories/files. Skips any file that already exists. Logs `[SKIP]` for skipped files and prints a hint to use `--force` if any were skipped.
- `npx create-nexus-kit [target] --force` (or `-f`) — Overwrites existing files intentionally.
- `npx create-nexus-kit --doctor [target]` (or `--check [target]`) — Runs deep validator and exits `0` (if zero `FAIL`) or `1` (if >= 1 `FAIL`).

### 2.2 Doctor Validation Matrix
| Check | PASS Condition | WARN Condition | FAIL Condition |
| :--- | :--- | :--- | :--- |
| Constitution | Exists & configured | Exists with default placeholder | Missing or unreadable |
| Spec Template | Exists & has Scope/AC headings | Missing recommended headings | Missing |
| Tasks Dir | Exists & has >= 1 `.md` spec | Exists with 0 specs | Missing directory |
| Skills (`SKILL.md`) | Valid YAML frontmatter (`name` matches dir, non-empty `description`), `## When to use`, `## Workflow`, `## Hard Guardrails` | Missing `## Hard Guardrails` | Missing file, unclosed/invalid YAML, `name` != folder, empty `description`, missing `## When to use` or `## Workflow` |
| `AGENTS.md` | Exists, NO YAML frontmatter, references `.specify/constitution.md` & `.agents/skills/` | Missing file or has YAML frontmatter (unsupported by Antigravity directory rules) | — (or FAIL if malformed cross-ref) -> WARN on missing optional adapter, WARN/FAIL on broken cross-ref |
| `CLAUDE.md` | Exists & references `.specify/constitution.md` & `.agents/skills/` | Missing file or missing cross-references | — |
| `.cursor/rules/nexus-kit.mdc` | Exists, valid YAML with `alwaysApply: true`, references constitution & skills | Missing file, missing `alwaysApply: true`, or missing cross-references | — |
| `.github/copilot-instructions.md` | Exists & references `.specify/constitution.md` & `.agents/skills/` | Missing file or missing cross-references | — |

*(Note: If an IDE adapter file exists, missing cross-references to `.specify/constitution.md` or `.agents/skills/` should produce a clear `WARN` detailing which reference is missing; if a mandatory file like `constitution.md`, `spec-template.md`, or any `SKILL.md` is missing/malformed, it must produce `FAIL` and exit `1`.)*

---

## 3. Acceptance Criteria

- [x] **AC-1 (Non-Overwrite Default)**: Running `create-nexus-kit` on a directory with existing files skips existing files without modifying them, prints skipped file list, and exits `0`.
- [x] **AC-2 (`--force` Overwrite)**: Running with `--force` or `-f` overwrites existing files cleanly (supported in both Node CLI and `install.sh`).
- [x] **AC-3 (Deep Doctor Validator)**: `--doctor` parses YAML frontmatter strictly, validates `name` matches folder name, checks section structure, validates `spec-template.md`, checks adapter cross-references and `.cursor` `alwaysApply: true`, and emits explicit `PASS` / `WARN` / `FAIL` statuses.
- [x] **AC-4 (Antigravity `AGENTS.md` Support)**: `AGENTS.md` (with no YAML frontmatter) is created at root and scaffolded by CLI, verified against Antigravity rules format.
- [x] **AC-5 (Automated Tests & CI)**: `npm test` runs `node --test tests/*.test.js`, verifying scaffold, skip-existing, `--force`, doctor PASS/WARN/FAIL cases, and malformed skills; CI runs `npm test`.
- [x] **AC-6 (Accurate README IDE Matrix)**: READMEs accurately document exact loading mechanisms for Antigravity, Claude Code, Cursor, and GitHub Copilot.
