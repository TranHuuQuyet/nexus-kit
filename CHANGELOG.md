# Changelog

All notable changes to **Nexus Kit** (`create-nexus-kit`) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.3.0] - 2026-11-22

### Added
- **Agentic Skills Evolution (`SPEC-013` - Phase 1)**:
  - **`sdd-planner`**:
    - **Socratic Clarifying Probing**: Prompts AI to ask concise questions offering concrete architectural options (`[Option A: ...]`, `[Option B: ...]`, `[Option C: ...]`) when requests lack technical details.
    - **Pre-flight Codebase Inspection**: Inspects existing domain models and utilities before drafting specs to prevent duplicate code and maximize reuse.
  - **`spec-template.md`**:
    - **Non-Functional Requirements (NFRs)**: Standardized section `2.3 Non-Functional Requirements (NFRs)` covering Performance Budgets, Security & Privacy (OWASP compliance), and Backward Compatibility / Migrations.
  - **`sdd-coder`**:
    - **Mandatory TDD Red-Green-Refactor Loop**: Enforces writing automated tests mapping `AC-1`..`AC-N` first (`Red`), implementing minimal code in `src/` to satisfy tests (`Green`), and refactoring for strict types and clean architecture.
    - **Bounded Self-Healing Policy**: Authorizes up to 3 automated remediation cycles based on stack traces; strictly prohibits lowering the quality bar (no test deletion, no trivial mocks, no empty assertions).
  - **`sdd-verifier`**:
    - **Anti-Fake Test Gate**: Audits test code to reject trivial assertions (e.g. `expect(true).toBe(true)`), empty tests, or excessive mocking that bypasses unit logic.
    - **Git Diff Scope & Dependency Leak Gate**: Verifies that modified files strictly match `Target Path` and audits manifests for unauthorized dependencies.
  - **Scaffolding & Ecosystem Parity**:
    - Synchronized all rules across `.agents/skills/`, `.specify/templates/`, `create-nexus-kit/lib/templates.js`, `create-nexus-kit/install.sh`, and `dist/agensi/nexus-kit/SKILL.md`.
    - Added dedicated automated test suite `create-nexus-kit/tests/skills.test.js` bringing test suite to **56 passing tests across 12 suites**.

---

## [2.2.0] - 2026-11-18

### Added
- **Auto Status Board in Chat Across All AI IDEs & Agents (`SPEC-012`)**:
  - Updated all 3 SDD Skills (`sdd-planner`, `sdd-coder`, `sdd-verifier`) and all 6 IDE adapters (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/nexus-kit.mdc`, `.github/copilot-instructions.md`, `.windsurfrules`, `.clinerules`) with a deterministic 3-tier Spec Status Board reporting rule:
    1. Prefer MCP resource `nexus://board` if connected.
    2. Otherwise run `nexus-kit board` / `npx create-nexus-kit board`.
    3. Offline/sandbox fallback: read `.specify/tasks/*-spec.md` and render a Markdown Status Board table.
  - Updated MCP workflow prompts (`sdd_plan`, `sdd_implement`, `sdd_verify`) in `lib/mcp.js` to include Status Board reporting.
  - Synchronized `install.sh` and root repository templates 100% with `lib/templates.js`.

---

## [2.1.1] - 2026-11-18

### Fixed
- **`install.sh` Pre-commit Hook Parity**: Synchronized `create-nexus-kit/install.sh` with the v2.1+ Git pre-commit hook supporting requirement drift blocking and fine-grained Scoped Target Path enforcement.
- **Metadata & Multi-Value `Target Path` Parsing**: Fixed `parseSpecMetadata` in `lib/nexus.js` (to support spaced keys such as `Target Path` and `Upstream Spec Kit`) and `parseMeta` in `lib/templates.js` / `install.sh` so comma-separated, backtick-wrapped paths (e.g., `` `src/auth/`, `src/utils/` ``) are preserved without truncation.
- **Canonical Hash Alignment**: Aligned `computeSpecHash` (`lib/nexus.js`) and hook `computeHash` (`lib/templates.js` & `install.sh`) to identically normalize both `- [x]` and `* [x]` checkboxes.
- **MCP `nexus_verify_spec` Consistency**: Added `In Progress` status validation in `lib/mcp.js` to match CLI `--verify-spec` behavior.
- **Accurate AC Counting**: Updated `getTasksSummary` to count explicit `**AC-` acceptance criteria without inflation from Edge Case checkboxes.
- **YAML Frontmatter Parser Edge Cases**: Added UTF-8 BOM stripping, preserved newlines for literal block scalars (`|` / `|-`), and added length guard for single-character quotes.
- **CLI Step Numbering**: Fixed sequential numbering of "Next steps" when scaffolding into `.` (`npx create-nexus-kit .`).

### Added
- Comprehensive regression tests expanding the suite to **50 tests across 12 suites** (direct unit tests for `verifySpecForCoding`, `parseSpecMetadata`, `computeSpecHash`, multi-value & wildcard `Target Path`, `install.sh --with-hooks`, MCP `In Progress`, and MCP `force: true`).

---

## [2.1.0] - 2026-11-16

### Security & Governance Hardening
- **Anti-Self-Approval Gate**: Removed `nexus_approve_spec` from exposed `MCP_TOOLS`; invoking it via MCP returns a `[FORBIDDEN]` error. Specification approval is strictly a human-exclusive action via CLI (`nexus-kit --approve <spec-file>`).
- **Spec Non-Overwrite Protection**: `createSpecDraft` now defaults to `force: false` and throws if a specification file already exists, preventing accidental loss of approved specs or hashes.
- **Strict `approveSpec` Path & Format Boundaries**: Enforced that approved targets must reside inside `.specify/tasks/`, end with `-spec.md` or `.spec.md`, and contain a valid `# SPEC-[ID]: [Title]` heading.
- **Scoped Git Hard Gate**: Upgraded `.git/hooks/pre-commit` to inspect every individual staged file in `src/` and verify coverage against the `Target Path` metadata of valid approved specifications.

---

## [2.0.1] - 2026-11-16

### Changed & Fixed
- Modularized `create-nexus-kit/lib/nexus.js` by extracting `lib/templates.js` and `lib/presets.js`.
- Hardened `createSpecDraft` against directory traversal in task IDs.
- Hardened `extractSectionContent` heading termination boundaries (`#` and `##`).

---

## [2.0.0] - 2026-11-16

### Added
- **Native Model Context Protocol (MCP) Server** (`nexus-kit mcp`): Zero-dependency JSON-RPC 2.0 server over `stdio` exposing tools (`nexus_check_constitution`, `nexus_get_specs`, `nexus_verify_spec`, `nexus_doctor`, `nexus_create_spec`), resources (`nexus://constitution`, `nexus://specs`, `nexus://board`), and SDD workflow prompts (`sdd_plan`, `sdd_implement`, `sdd_verify`).

---

## [1.7.0] - 2026-11-15

### Added
- **Terminal Status Board** (`nexus-kit board` / `nexus-kit board --json`): Visual ANSI task table showing versions, statuses, cryptographic integrity, AC progress bars, and drift alerts.
- **Tech Stack Presets** (`--preset <name>`): Built-in presets for `nextjs`, `fastapi`, `nestjs`, `react`, and `node`.

---

## [1.6.0] - 2026-11-15

### Added
- **Git Pre-commit Hard Gates** (`nexus-kit init-hooks` / `--with-hooks`): Executable `.git/hooks/pre-commit` blocking un-spec'd commits in `src/`.
- **Windsurf & Cline IDE Adapters**: Added `.windsurfrules` and `.clinerules`.

---

## [1.5.0] - 2026-11-11

### Added
- Short `nexus-kit` CLI binary alias alongside `create-nexus-kit`.
- Step-by-step usage walkthroughs (`GUIDE.md`, `GUIDE.vi.md`).

---

## [1.4.0] - 2026-11-10

### Added
- Spec approval lifecycle (`--approve`, `--verify-spec`) with canonical SHA-256 integrity hashing and anti-drift verification.
- End-to-End SDD workflow automated tests.

---

## [1.3.0] - 2026-11-10

### Added
- Non-overwrite safety by default (`--force` required to overwrite existing files).
- Deep `--doctor` integrity validator and `AGENTS.md` open-standard adapter.

---

## [1.2.0] - 2026-11-10

### Added
- Multi-IDE adapters (`CLAUDE.md`, `.cursor/rules/nexus-kit.mdc`, `.github/copilot-instructions.md`).
- Production-grade SDD Skills Triad (`sdd-planner`, `sdd-coder`, `sdd-verifier`).
