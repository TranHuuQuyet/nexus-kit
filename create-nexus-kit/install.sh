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
mkdir -p "$PROJECT_DIR/src"

# Keep empty git folders
touch "$PROJECT_DIR/.specify/tasks/.gitkeep"
touch "$PROJECT_DIR/src/.gitkeep"

echo -e "${YELLOW}→ Generating templates and configurations...${NC}"

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
Trigger this skill when the user asks to plan a feature, design architecture, or create a task specification.

## Workflow
1. **Read Constitution**: ALWAYS read `.specify/constitution.md` first to understand the project guardrails and tech stack.
2. **Load Template**: Load `.specify/templates/spec-template.md` as the blueprint.
3. **Elicit Requirements**: If the user's request is ambiguous, ask clarifying questions one at a time. Explicitly state assumptions.
4. **Author Specification**:
   - Define User Stories, strict In-Scope and Out-of-Scope boundaries.
   - Specify deterministic Data Models, Types, and Interfaces.
   - Detail the Logic Flow with Mermaid diagrams.
   - Enumerate Edge Cases and concrete Acceptance Criteria (AC-1, AC-2, etc.).
5. **Save Document**: Save into `.specify/tasks/` with an incrementing ID and descriptive name (e.g., `002-feature-name-spec.md`).
6. **Gate Check**: Prompt the user to review and approve the specification before any code is written.
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
Trigger this skill when the user asks to implement code or complete a task that has already been planned in the `.specify/tasks/` directory.

## Workflow
1. **Target Specification**: Select and completely read the target specification file in `.specify/tasks/`. Verify it is in `Approved` or active status.
2. **Review Constitution**: Read `.specify/constitution.md` to enforce the project's tech stack, typing conventions, and error handling rules.
3. **Deterministic Implementation**:
   - Write modular, type-safe code in `src/` matching the exact data models and interfaces defined in the spec.
   - Strictly adhere to `In-Scope` items. Do NOT hallucinate features, endpoints, or unapproved dependencies.
4. **Test-Driven Verification**:
   - Author automated tests verifying both happy paths and documented edge cases.
5. **Invoke Verification**: Hand off to `sdd-verifier` to perform the final compliance audit against all Acceptance Criteria.
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
Trigger this skill when code has been implemented by `sdd-coder`, before committing or merging, or when the user asks to verify/audit whether a task in `.specify/tasks/` is completed.

## Workflow
1. **Locate Task Spec**: Read the target specification document in `.specify/tasks/`.
2. **Extract Criteria**: Identify all Acceptance Criteria (AC-1, AC-2, etc.), In-Scope bounds, and Out-of-Scope restrictions.
3. **Audit Implementation**:
   - Inspect files in `src/` to verify every AC is implemented.
   - Verify that NO Out-of-Scope logic or unapproved dependencies were introduced.
   - Verify adherence to `.specify/constitution.md` (no `any`, explicit types, proper error handling).
4. **Run Verification Commands**:
   - Run type checks and test suites.
5. **Output Verification Report**:
   - Present a checklist of all ACs with `[PASSED]` or `[FAILED]` status.
   - If any AC fails, provide actionable instructions for `sdd-coder` to fix.
EOF
echo -e "  ${GREEN}✔${NC} ${DIM}Created${NC} .agents/skills/sdd-verifier/SKILL.md"

# README.md
cat << EOF > "$PROJECT_DIR/README.md"
# ${PROJECT_DISPLAY_NAME}

**The Ultimate Integration Framework for Spec Kit & Agent Skills**

Nexus Kit là lớp điều phối và tích hợp tối ưu (Orchestration Layer) kết nối giữa **Spec Kit** (hệ thống quản trị đặc tả) và **Agent Skills** (hệ sinh thái kỹ năng của AI Agent). Cấu trúc này thiết lập một môi trường làm việc kỷ luật, đảm bảo AI Agents luôn vận hành có quy trình, loại bỏ hoàn toàn tình trạng "Vibe Coding".

## Kiến trúc thư mục
- **\`.specify/\`**: Nơi chứa bộ luật (\`constitution.md\`), mẫu đặc tả (\`templates/\`) và các bản thiết kế tính năng (\`tasks/\`).
- **\`.agents/skills/\`**: Nơi chứa bộ ba kỹ năng SDD: \`sdd-planner\`, \`sdd-coder\`, và \`sdd-verifier\`.
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
echo -e "  2. Open the project in your AI-powered editor (Antigravity, Cursor, etc.)"
echo -e "  3. Update technology guidelines in ${CYAN}.specify/constitution.md${NC}"
echo -e "  4. Let AI plan features using ${YELLOW}sdd-planner${NC}, implement using ${YELLOW}sdd-coder${NC}, and verify with ${YELLOW}sdd-verifier${NC}\n"
echo -e "${DIM}Happy deterministic coding! 🚀${NC}\n"
