#!/usr/bin/env bash

set -e

# ANSI Color Codes
CYAN='\033[1;36m'
MAGENTA='\033[1;35m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}"
cat << "EOF"
  _  _                     _  ___ _   
 | \| |_____ ___  _ ___   | |/ (_) |_ 
 | .` / -_) \ / || (_-<   | ' <| |  _|
 |_|\_\___/_\_\\_,_/__/   |_|\_\_|\__|
EOF
echo -e "${MAGENTA}${BOLD}  Spec-Driven Development (SDD) for AI Agents${NC}\n"

FORCE="false"
PROJECT_NAME=""

for arg in "$@"; do
  case "$arg" in
    --force|-f)
      FORCE="true"
      ;;
    *)
      if [ -z "$PROJECT_NAME" ]; then
        PROJECT_NAME="$arg"
      fi
      ;;
  esac
done

PROJECT_NAME="${PROJECT_NAME:-nexus-kit-app}"

if [ "$PROJECT_NAME" = "." ]; then
  PROJECT_DIR="$(pwd)"
  PROJECT_DISPLAY_NAME="$(basename "$PROJECT_DIR")"
elif [[ "$PROJECT_NAME" = /* ]]; then
  PROJECT_DIR="$PROJECT_NAME"
  PROJECT_DISPLAY_NAME="$(basename "$PROJECT_DIR")"
else
  PROJECT_DIR="$(pwd)/$PROJECT_NAME"
  PROJECT_DISPLAY_NAME="$PROJECT_NAME"
fi

echo -e "${BLUE}ℹ${NC} Initializing ${BOLD}${PROJECT_DISPLAY_NAME}${NC} at ${DIM}${PROJECT_DIR}${NC}\n"

# Create directory structure
echo -e "${YELLOW}→ Creating directory structure...${NC}"
mkdir -p "$PROJECT_DIR/.specify/templates"
mkdir -p "$PROJECT_DIR/.specify/tasks"
mkdir -p "$PROJECT_DIR/.agents/skills/sdd-planner"
mkdir -p "$PROJECT_DIR/.agents/skills/sdd-coder"
mkdir -p "$PROJECT_DIR/.agents/skills/sdd-verifier"
mkdir -p "$PROJECT_DIR/.cursor/rules"
mkdir -p "$PROJECT_DIR/.github"
mkdir -p "$PROJECT_DIR/src"

SKIPPED_COUNT=0

# Helper: safe_write <rel_path> << 'EOF' ... EOF
safe_write() {
  local rel_path="$1"
  local full_path="$PROJECT_DIR/$rel_path"
  if [ -f "$full_path" ] && [ "$FORCE" != "true" ]; then
    cat > /dev/null
    echo -e "  ${DIM}[SKIPPED]     $rel_path (already exists)${NC}"
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
  else
    local existed="false"
    [ -f "$full_path" ] && existed="true"
    cat > "$full_path"
    if [ "$existed" = "true" ]; then
      echo -e "  ${YELLOW}[OVERWRITTEN]${NC} $rel_path"
    else
      echo -e "  ${GREEN}[CREATED]${NC}     $rel_path"
    fi
  fi
}

# Keep empty git folders safely
safe_write ".specify/tasks/.gitkeep" < /dev/null
safe_write "src/.gitkeep" < /dev/null

echo -e "${YELLOW}→ Generating templates, skills, and IDE adapters...${NC}"

safe_write ".specify/constitution.md" << 'EOF'
# Core Constitution & Engineering Guidelines

1. NO VIBE CODING: Never jump straight to writing code. Always verify if a specification exists in `.specify/tasks/` first.
2. DETERMINISTIC OUTPUTS: Use explicit typings, data models, and schemas. Avoid unstructured string parsing.
3. QUALITY GATES: All code written must directly map to a predefined requirement in the task spec.
4. TECH STACK: [Người dùng sẽ cập nhật công nghệ cụ thể tại đây]
EOF

safe_write ".specify/templates/spec-template.md" << 'EOF'
# [SPEC-ID]: [Feature Title]

> **Status:** `Draft`  
> **Version:** `1.0.0`  
> **Author:** [AI Agent / Engineer]  
> **Date:** [YYYY-MM-DD]  
> **Approved-By:** `Pending`  
> **Approved-At:** `Pending`  
> **Approved-Hash:** `Pending`  
> **Upstream Spec Kit:** Compatible with Spec Kit v1.0+  
> **Target Path:** `src/...`

---

## 1. Overview & Objective

### 1.1 Problem Statement
*Mô tả ngắn gọn bối cảnh và vấn đề thực tế cần giải quyết.*

### 1.2 User Stories
- **As a** `[vai trò người dùng]`, **I want** `[hành động / chức năng]` **so that** `[giá trị mang lại]`.

### 1.3 Scope Boundaries (Ranh giới phạm vi)
- **In-Scope (Bắt buộc làm):**
  - [Liệt kê các module / chức năng cần xây dựng]
- **Out-of-Scope (Tuyệt đối không làm trong task này):**
  - [Liệt kê các chức năng chưa cần thiết để ngăn chặn AI Vibe Coding]

---

## 2. Data Models & Interface Contracts

### 2.1 Domain Models (TypeScript / Schemas)
```typescript
export interface EntityModel {
  id: string;          // UUID v4
  title: string;       // Non-empty string
  createdAt: string;   // ISO 8601 UTC
}
```

### 2.2 API / CLI / Component Contracts
- **Input / Signature:**
- **Output / Return Type:**
- **Failure Responses:**

---

## 3. Logic Flow & State Transitions

```mermaid
flowchart TD
    Start([Nhận yêu cầu]) --> Validate{Validate Schema}
    Validate -- Không hợp lệ --> ErrorHandler[Throw ValidationError]
    Validate -- Hợp lệ --> ExecuteLogic[Thực thi logic nghiệp vụ]
    ExecuteLogic --> SaveStorage[Ghi nhận vào Storage / State]
    SaveStorage --> ReturnResult([Trả về kết quả chuẩn hóa])
```

---

## 4. Edge Cases & Error Handling

- [ ] **Empty / Null Input**: Xử lý đầu vào rỗng.
- [ ] **Timeout / Network Failure**: Xử lý lỗi kết nối hoặc gián đoạn.
- [ ] **Duplicate / Idempotency**: Xử lý trường hợp thao tác lặp lại.

---

## 5. Acceptance Criteria (Tiêu chí nghiệm thu)

- [ ] **AC-1**: Dữ liệu đầu vào bắt buộc được validate qua schema tường minh.
- [ ] **AC-2**: Thực thi đúng luồng xử lý và trả về đúng hợp đồng đã cam kết.
- [ ] **AC-3**: Xử lý đầy đủ các trường hợp biên tại mục 4.
- [ ] **AC-4**: Không sử dụng `any`, tuân thủ 100% `constitution.md`.
- [ ] **AC-5**: Có unit test bao phủ luồng chính và ít nhất 2 trường hợp lỗi biên.

---

## 6. Change Log

| Version | Date | Author | Summary |
| :--- | :--- | :--- | :--- |
| `1.0.0` | `[YYYY-MM-DD]` | `[Author]` | Initial draft specification. |
EOF

safe_write ".agents/skills/sdd-planner/SKILL.md" << 'EOF'
---
name: sdd-planner
description: Skill to generate architecture and task specifications using Spec Kit with approval versioning and change management.
---
# SDD Planner Skill

## When to use
Trigger this skill when the user asks to plan a feature, design architecture, modify requirements on an existing spec, or create a task specification.

## Hard Guardrails
- **NEVER write or modify application code in `src/` during the planning phase.**
- **Do NOT assume ambiguous requirements.** Surface assumptions explicitly and ask clarifying questions before finalizing a spec.
- **CHANGE MANAGEMENT**: If modifying an already-approved spec, you MUST increment `Version`, record the change in `## Change Log`, reset `Status` to `In Review`, and set `Approved-Hash` to `Pending`.

## Workflow
1. **Read Constitution**: ALWAYS read `.specify/constitution.md` first to verify tech stack constraints, typing rules, and quality gates.
2. **Load Spec Kit Blueprint**: Read `.specify/templates/spec-template.md` as the mandatory structural template.
3. **Clarifying Interview & Assumptions**:
   - Surface hidden assumptions immediately (e.g., auth mechanism, storage engine, validation library).
   - If the request is underspecified, ask concise clarifying questions one at a time until requirements are concrete.
4. **Enforce Strict Scope Lock**:
   - Partition capabilities into **In-Scope** (explicitly required) and **Out-of-Scope** (explicitly excluded to prevent AI scope creep).
5. **Author Deterministic Contracts**:
   - Define explicit Domain Models / Schemas (TypeScript interfaces, Zod/JSON schemas, error types).
   - Map Logic Flows & State Transitions using Mermaid diagrams.
   - Enumerate Edge Cases (null/empty input, network timeout, idempotency, boundary limits).
   - Assign verifiable Acceptance Criteria IDs (`AC-1`, `AC-2`, etc.).
6. **Version & Save Specification**:
   - Set `Status: Draft` (or `In Review` for changes), `Version: 1.0.0` (or bumped semantic version), and `Approved-Hash: Pending`.
   - Save into `.specify/tasks/` with an incrementing numeric prefix and descriptive kebab-case name (e.g., `002-feature-name-spec.md`).
7. **Human Approval Gate**:
   - Present a summary of the spec and instruct the user to approve it (e.g., by running `npx create-nexus-kit --approve .specify/tasks/<file>.md`) before `sdd-coder` is permitted to execute.
EOF

safe_write ".agents/skills/sdd-coder/SKILL.md" << 'EOF'
---
name: sdd-coder
description: Skill to write code strictly based on approved, non-stale specifications.
---
# SDD Coder Skill

## When to use
Trigger this skill when the user asks to implement code or complete a task that has already been planned and approved in the `.specify/tasks/` directory.

## Hard Guardrails
- **NO SPEC, NO CODE**: Refuse to write code if no corresponding specification exists in `.specify/tasks/`. Redirect to `sdd-planner` instead.
- **APPROVAL & DRIFT GATE**: NEVER implement a spec whose `Status` is `Draft`, `In Review`, or `Superseded`, or whose `Approved-Hash` fails integrity verification (`npx create-nexus-kit --verify-spec <spec-path>`). If requirements changed after approval, stop and require human re-approval first.
- **ZERO SCOPE CREEP**: Implement ONLY items explicitly defined in the spec's `In-Scope` section. Never touch unrelated files or perform unsolicited refactoring.
- **NO HALLUCINATED DEPENDENCIES**: Never install third-party packages not authorized in the spec or `.specify/constitution.md`.

## Workflow
1. **Verify Approval & Integrity Gate**:
   - Read the target specification in `.specify/tasks/` completely.
   - Verify `Status` is `Approved` or `In Progress`.
   - Run `npx create-nexus-kit --verify-spec .specify/tasks/<spec-file>.md` (or verify `Approved-Hash`) to confirm the spec is neither unapproved nor stale/modified since approval.
2. **Enforce Constitution**: Read `.specify/constitution.md` to strictly honor the project's tech stack, strict typing (no `any` or blind casts), and error handling standards.
3. **Incremental, Type-Safe Implementation**:
   - Write modular, single-responsibility files inside `src/` conforming strictly to the spec's Domain Models and Interface Contracts.
   - Handle every documented Edge Case explicitly (never leave empty `catch {}` blocks or silent failures).
4. **Automated Test Verification**:
   - Write unit/integration tests verifying the happy path and every negative/edge case defined in the spec.
   - Run the test suite and ensure all tests pass with zero warnings.
5. **Handover to Verifier**: Invoke `sdd-verifier` to audit the implementation against all Acceptance Criteria before claiming task completion.
EOF

safe_write ".agents/skills/sdd-verifier/SKILL.md" << 'EOF'
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
   - Execute project tests, type checks, and linters directly in the terminal and observe full outputs.
5. **Finalize & Emit Verification Report**:
   - Render a Traceability & Compliance table marking each AC as `[PASSED]` or `[FAILED]` with observed evidence.
   - Only if all checks pass: mark ACs as `- [x]` and update `Status` to `Completed`. Otherwise block completion and hand specific remediation items back to `sdd-coder`.
EOF

safe_write "AGENTS.md" << 'EOF'
# AGENTS.md — Nexus Kit SDD Protocol

This workspace operates under **Nexus Kit** (Spec-Driven Development).

## Mandatory Rules
1. **NO VIBE CODING**: Never write or modify application code in `src/` without an approved specification in `.specify/tasks/`.
2. **Read Constitution First**: Always read `.specify/constitution.md` before planning or writing code.
3. **Execute the SDD Triad** (located in `.agents/skills/`):
   - **Planning**: Use `.agents/skills/sdd-planner/SKILL.md` and `.specify/templates/spec-template.md` to draft specs into `.specify/tasks/`. Wait for human approval before coding.
   - **Coding**: Use `.agents/skills/sdd-coder/SKILL.md` to implement strictly within the `In-Scope` bounds of the approved spec.
   - **Verification**: Use `.agents/skills/sdd-verifier/SKILL.md` to audit the implementation against all Acceptance Criteria.
EOF

safe_write "CLAUDE.md" << 'EOF'
# CLAUDE.md — Nexus Kit SDD Protocol

This project is governed by **Nexus Kit** (Spec-Driven Development).

## Mandatory Rules
1. **NO VIBE CODING**: Never write or modify code in `src/` without an approved specification in `.specify/tasks/`.
2. **Read Constitution First**: Always check `.specify/constitution.md` before planning or coding.
3. **Use SDD Skills** (located in `.agents/skills/`):
   - Planning a feature -> Follow `.agents/skills/sdd-planner/SKILL.md` and `.specify/templates/spec-template.md`.
   - Implementing a spec -> Follow `.agents/skills/sdd-coder/SKILL.md`.
   - Auditing implementation -> Follow `.agents/skills/sdd-verifier/SKILL.md`.
EOF

safe_write ".cursor/rules/nexus-kit.mdc" << 'EOF'
---
description: Enforce Nexus Kit Spec-Driven Development (SDD) Constitution and Skills workflow
globs:
alwaysApply: true
---

# Nexus Kit — Spec-Driven Development Rules

This repository uses **Nexus Kit**. You must enforce these rules on every interaction:

1. **NO VIBE CODING**: Do NOT write or edit application code in `src/` unless an approved specification exists in `.specify/tasks/`.
2. **READ CONSTITUTION**: Always read `.specify/constitution.md` first to verify tech stack constraints and coding standards.
3. **FOLLOW THE SDD TRIAD** (in `.agents/skills/`):
   - **Planning**: Load `.agents/skills/sdd-planner/SKILL.md` and `.specify/templates/spec-template.md`, clarify requirements, and save the spec into `.specify/tasks/`. Wait for human approval before coding.
   - **Coding**: Load `.agents/skills/sdd-coder/SKILL.md` and implement strictly within the `In-Scope` bounds of the approved spec.
   - **Verification**: Load `.agents/skills/sdd-verifier/SKILL.md` to audit the implementation against all Acceptance Criteria.
EOF

safe_write ".github/copilot-instructions.md" << 'EOF'
# GitHub Copilot Instructions — Nexus Kit

This repository follows **Spec-Driven Development (SDD)** powered by Nexus Kit.

## Mandatory Directives
- **No Spec, No Code**: Never generate or modify code in `src/` without verifying that an approved specification exists in `.specify/tasks/`.
- **Constitution First**: Always read `.specify/constitution.md` to respect project tech stack and type-safety guidelines.
- **Follow Skills**:
  - For planning/architecture: follow `.agents/skills/sdd-planner/SKILL.md` and use `.specify/templates/spec-template.md`.
  - For implementation: follow `.agents/skills/sdd-coder/SKILL.md` and stay strictly within `In-Scope` bounds.
  - For verification: follow `.agents/skills/sdd-verifier/SKILL.md` to audit against Acceptance Criteria.
EOF

{
  printf '# %s\n' "$PROJECT_DISPLAY_NAME"
  cat << 'EOF'

Powered by **Nexus Kit** (Spec Kit + Agent Skills) for deterministic, spec-driven AI engineering.

## Getting Started (4-Step Workflow)

### 1. Configure Your Tech Stack
Update line 4 in `.specify/constitution.md` (e.g., `TypeScript 5, Node.js 20, Vitest`):
```bash
npx create-nexus-kit@latest --doctor
```

### 2. Plan a Feature (`sdd-planner`)
Open your AI IDE (Antigravity, Claude Code, Cursor, or GitHub Copilot) and prompt:
> *"Plan a feature for user authentication with JWT. Do not write code yet."*

The agent reads `.specify/constitution.md`, clarifies ambiguities, and saves `.specify/tasks/001-jwt-auth-spec.md` (`Status: Draft`).

### 3. Review & Approve the Spec (`--approve`)
Review the generated spec, then lock and stamp its SHA-256 hash:
```bash
npx create-nexus-kit@latest --approve .specify/tasks/001-jwt-auth-spec.md
```
*(Tip: If you installed `npm i -g create-nexus-kit`, you can use the short alias `nexus-kit --approve ...`)*

### 4. Implement & Verify (`sdd-coder` + `sdd-verifier`)
Prompt your AI agent:
> *"Implement the approved spec `.specify/tasks/001-jwt-auth-spec.md`."*

- `sdd-coder` verifies `--verify-spec` before writing modular code and tests in `src/`.
- `sdd-verifier` audits Acceptance Criteria, marks them `[x]`, and runs `--doctor`.

### Changing Requirements Mid-Flight (Change Management)
If requirements change after approval: prompt the agent to bump `Version` in the spec, log the change in `## Change Log`, reset `Status` to `In Review`, and re-run `--approve` before coding.

## Repository Layout
- **`.specify/`**: `constitution.md`, `templates/spec-template.md`, and `tasks/*.md`.
- **`.agents/skills/`**: `sdd-planner`, `sdd-coder`, and `sdd-verifier`.
- **`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `.github/copilot-instructions.md`**: Automatic IDE rule adapters.
- **`src/`**: Application source code.
EOF
} | safe_write "README.md"

safe_write ".gitignore" << 'EOF'
# OS
.DS_Store
Thumbs.db

# Dependencies & Build artifacts
node_modules/
dist/
build/

# Environment files
.env
.env*.local

# Logs
*.log
EOF

if [ "$SKIPPED_COUNT" -gt 0 ]; then
  echo -e "\n${YELLOW}ℹ Skipped ${SKIPPED_COUNT} existing file(s) to protect your data.${NC}"
  echo -e "  ${DIM}Pass --force if you intentionally want to overwrite existing files.${NC}"
fi

echo -e "\n${GREEN}${BOLD}✔ Success! Nexus Kit scaffolding completed.${NC}\n"
echo -e "${BOLD}Next steps:${NC}"
if [ "$PROJECT_NAME" != "." ]; then
  echo -e "  1. ${CYAN}cd ${PROJECT_NAME}${NC}"
fi
echo -e "  2. Open the project in your AI editor (Antigravity, Claude Code, Cursor, GitHub Copilot)"
echo -e "  3. Update technology guidelines in ${CYAN}.specify/constitution.md${NC}"
echo -e "  4. Plan via ${YELLOW}sdd-planner${NC}, build via ${YELLOW}sdd-coder${NC}, and audit via ${YELLOW}sdd-verifier${NC}\n"
