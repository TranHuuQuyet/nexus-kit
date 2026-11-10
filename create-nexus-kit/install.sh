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

PROJECT_NAME="${1:-nexus-kit-app}"

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

# Keep empty git folders
touch "$PROJECT_DIR/.specify/tasks/.gitkeep"
touch "$PROJECT_DIR/src/.gitkeep"

echo -e "${YELLOW}→ Generating templates, skills, and IDE adapters...${NC}"

# .specify/constitution.md
cat << 'EOF' > "$PROJECT_DIR/.specify/constitution.md"
# Core Constitution & Engineering Guidelines

1. NO VIBE CODING: Never jump straight to writing code. Always verify if a specification exists in `.specify/tasks/` first.
2. DETERMINISTIC OUTPUTS: Use explicit typings, data models, and schemas. Avoid unstructured string parsing.
3. QUALITY GATES: All code written must directly map to a predefined requirement in the task spec.
4. TECH STACK: [Người dùng sẽ cập nhật công nghệ cụ thể tại đây]
EOF
echo -e "  ${GREEN}✔${NC} ${DIM}Created${NC} .specify/constitution.md"

# .specify/templates/spec-template.md
cat << 'EOF' > "$PROJECT_DIR/.specify/templates/spec-template.md"
# [SPEC-ID]: [Feature Title]

> **Status:** `Draft` | `In Review` | `Approved` | `In Progress` | `Completed`  
> **Author:** [AI Agent / Engineer]  
> **Date:** [YYYY-MM-DD]  
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
EOF
echo -e "  ${GREEN}✔${NC} ${DIM}Created${NC} .specify/templates/spec-template.md"

# .agents/skills/sdd-planner/SKILL.md
cat << 'EOF' > "$PROJECT_DIR/.agents/skills/sdd-planner/SKILL.md"
---
name: sdd-planner
description: Skill to generate architecture and task specifications using Spec Kit.
---
# SDD Planner Skill

## When to use
Trigger this skill when the user asks to plan a feature, design architecture, modify system behavior, or create a task specification.

## Hard Guardrails
- **NEVER write or modify application code in `src/` during the planning phase.**
- **Do NOT assume ambiguous requirements.** Surface assumptions explicitly and ask clarifying questions before finalizing a spec.

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
6. **Save Specification**:
   - Save into `.specify/tasks/` with an incrementing numeric prefix and descriptive kebab-case name (e.g., `002-feature-name-spec.md`).
7. **Human Approval Gate**:
   - Present a summary of the spec and explicitly ask the user to review and approve it before `sdd-coder` is permitted to execute.
EOF
echo -e "  ${GREEN}✔${NC} ${DIM}Created${NC} .agents/skills/sdd-planner/SKILL.md"

# .agents/skills/sdd-coder/SKILL.md
cat << 'EOF' > "$PROJECT_DIR/.agents/skills/sdd-coder/SKILL.md"
---
name: sdd-coder
description: Skill to write code strictly based on generated specifications.
---
# SDD Coder Skill

## When to use
Trigger this skill when the user asks to implement code or complete a task that has already been planned and approved in the `.specify/tasks/` directory.

## Hard Guardrails
- **NO SPEC, NO CODE**: Refuse to write code if no corresponding specification exists in `.specify/tasks/`. Redirect to `sdd-planner` instead.
- **ZERO SCOPE CREEP**: Implement ONLY items explicitly defined in the spec's `In-Scope` section. Never touch unrelated files or perform unsolicited refactoring.
- **NO HALLUCINATED DEPENDENCIES**: Never install third-party packages not authorized in the spec or `.specify/constitution.md`.

## Workflow
1. **Verify Target Spec**: Identify and completely read the approved specification file in `.specify/tasks/`. Confirm its status is `Approved` or explicitly cleared by the user.
2. **Enforce Constitution**: Read `.specify/constitution.md` to strictly honor the project's tech stack, strict typing (no `any` or blind casts), and error handling standards.
3. **Incremental, Type-Safe Implementation**:
   - Write modular, single-responsibility files inside `src/` conforming strictly to the spec's Domain Models and Interface Contracts.
   - Handle every documented Edge Case explicitly (never leave empty `catch {}` blocks or silent failures).
4. **Automated Test Verification**:
   - Write unit/integration tests verifying the happy path and every negative/edge case defined in the spec.
   - Run the test suite and ensure all tests pass with zero warnings.
5. **Handover to Verifier**: Invoke `sdd-verifier` to audit the implementation against all Acceptance Criteria before claiming task completion.
EOF
echo -e "  ${GREEN}✔${NC} ${DIM}Created${NC} .agents/skills/sdd-coder/SKILL.md"

# .agents/skills/sdd-verifier/SKILL.md
cat << 'EOF' > "$PROJECT_DIR/.agents/skills/sdd-verifier/SKILL.md"
---
name: sdd-verifier
description: Skill to verify and audit implemented code against task specifications and constitution guardrails.
---
# SDD Verifier Skill

## When to use
Trigger this skill immediately after `sdd-coder` finishes implementing code, before committing or opening a pull request, or when the user asks to audit whether a task in `.specify/tasks/` is genuinely complete.

## Hard Guardrails
- **ZERO TRUST AUDIT**: Never assume an implementation works or matches the spec by memory. Read the actual source files and observe live command outputs.
- **NO PARTIAL PASSES**: All Acceptance Criteria (`AC-1`..`AC-N`) and all tests must pass without skipped assertions.

## Workflow
1. **Extract Spec Contract**: Read the target specification document in `.specify/tasks/`. Extract all Acceptance Criteria (`AC-1`, `AC-2`...), `In-Scope` bounds, `Out-of-Scope` prohibitions, and `Edge Cases`.
2. **Build Traceability Matrix**:
   - Inspect files in `src/` and map every Acceptance Criterion to the exact file path and line range implementing it.
   - Verify no `Out-of-Scope` code or unauthorized dependencies were introduced.
3. **Constitution Compliance Check**:
   - Audit code against `.specify/constitution.md`: verify explicit types (no `any`), structured validation (no loose string parsing), and proper error handling.
4. **Run Automated Gates**:
   - Execute tests, type checks, and linters directly in the terminal and observe full outputs.
5. **Emit Verification Report**:
   - Render a Traceability & Compliance table marking each AC as `[PASSED]` or `[FAILED]` with observed evidence.
   - If any check fails, block completion and hand specific remediation items back to `sdd-coder`.
EOF
echo -e "  ${GREEN}✔${NC} ${DIM}Created${NC} .agents/skills/sdd-verifier/SKILL.md"

# CLAUDE.md
cat << 'EOF' > "$PROJECT_DIR/CLAUDE.md"
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
echo -e "  ${GREEN}✔${NC} ${DIM}Created${NC} CLAUDE.md"

# .cursor/rules/nexus-kit.mdc
cat << 'EOF' > "$PROJECT_DIR/.cursor/rules/nexus-kit.mdc"
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
echo -e "  ${GREEN}✔${NC} ${DIM}Created${NC} .cursor/rules/nexus-kit.mdc"

# .github/copilot-instructions.md
cat << 'EOF' > "$PROJECT_DIR/.github/copilot-instructions.md"
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
echo -e "  ${GREEN}✔${NC} ${DIM}Created${NC} .github/copilot-instructions.md"

# README.md
cat << EOF > "$PROJECT_DIR/README.md"
# ${PROJECT_DISPLAY_NAME}

**The Ultimate Integration Framework for Spec Kit & Agent Skills**

Nexus Kit là lớp điều phối và tích hợp tối ưu (Orchestration Layer) kết nối giữa **Spec Kit** (hệ thống quản trị đặc tả) và **Agent Skills** (hệ sinh thái kỹ năng của AI Agent). Cấu trúc này thiết lập một môi trường làm việc kỷ luật, đảm bảo AI Agents luôn vận hành có quy trình, loại bỏ hoàn toàn tình trạng "Vibe Coding".

## Kiến trúc thư mục
- **\`.specify/\`**: Nơi chứa bộ luật (\`constitution.md\`), mẫu đặc tả (\`templates/\`) và các bản thiết kế tính năng (\`tasks/\`).
- **\`.agents/skills/\`**: Nơi chứa bộ ba kỹ năng SDD: \`sdd-planner\`, \`sdd-coder\`, và \`sdd-verifier\`.
- **\`CLAUDE.md\`, \`.cursor/rules/\`, \`.github/copilot-instructions.md\`**: Các cầu nối tự động kích hoạt luật cho Claude Code, Cursor và GitHub Copilot.
- **\`src/\`**: Nơi chứa mã nguồn thực tế.

## Quy trình làm việc cho Agent
1. Gọi Agent lập kế hoạch tính năng (Agent kích hoạt \`sdd-planner\`, sinh spec vào \`.specify/tasks/\`).
2. Con người duyệt bản spec (Human Approval Gate).
3. Yêu cầu Agent tiến hành code (Agent kích hoạt \`sdd-coder\`, viết code vào \`src/\`).
4. Thẩm định chéo chất lượng code (Agent kích hoạt \`sdd-verifier\` đối chiếu Acceptance Criteria).
EOF
echo -e "  ${GREEN}✔${NC} ${DIM}Created${NC} README.md"

# .gitignore
cat << 'EOF' > "$PROJECT_DIR/.gitignore"
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
echo -e "  ${GREEN}✔${NC} ${DIM}Created${NC} .gitignore"

echo -e "\n${GREEN}${BOLD}✨ Success! Nexus Kit template created successfully.${NC}\n"
echo -e "${BOLD}Next steps:${NC}"
if [ "$PROJECT_NAME" != "." ]; then
  echo -e "  1. ${CYAN}cd ${PROJECT_NAME}${NC}"
fi
echo -e "  2. Open the project in your AI-powered editor (Antigravity, Cursor, Claude Code, Copilot)"
echo -e "  3. Update technology guidelines in ${CYAN}.specify/constitution.md${NC}"
echo -e "  4. Let AI plan via ${YELLOW}sdd-planner${NC}, build via ${YELLOW}sdd-coder${NC}, and audit via ${YELLOW}sdd-verifier${NC}\n"
echo -e "${DIM}Happy deterministic coding!${NC}\n"
