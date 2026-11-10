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
mkdir -p "$PROJECT_DIR/src"

# Keep empty git folders
touch "$PROJECT_DIR/.specify/templates/.gitkeep"
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
1. ALWAYS read `.specify/constitution.md` first to understand the project guardrails.
2. Ask clarifying questions if the user's request is ambiguous.
3. Generate a structured Markdown specification document outlining Data Models, API Endpoints, UI Components, and Logic Flow.
4. Save this specification document into `.specify/tasks/` with a descriptive name (e.g., `feature-name-spec.md`).
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
1. Ask the user which specification file in `.specify/tasks/` they want to implement (if not explicitly mentioned).
2. Read the chosen specification file completely.
3. Write modular, robust code in the `src/` directory that strictly adheres to the specification AND the rules in `.specify/constitution.md`.
4. Do NOT hallucinate features or logic that are not present in the specification.
EOF
echo -e "  ${GREEN}✔${NC} ${DIM}Created${NC} .agents/skills/sdd-coder/SKILL.md"

# README.md
cat << EOF > "$PROJECT_DIR/README.md"
# ${PROJECT_DISPLAY_NAME} 🌌

**A Spec-Driven Development (SDD) Template for AI Agents**

Nexus Kit là điểm giao thoa giữa **Luật lệ (Spec Kit)** và **Hành động (Agent Skills)**. Cấu trúc này thiết lập một môi trường làm việc kỷ luật, đảm bảo AI Agents luôn lập kế hoạch và tuân thủ nguyên tắc hệ thống trước khi tiến hành viết code.

## Kiến trúc thư mục
- **\`.specify/\`**: Nơi chứa bộ luật (\`constitution.md\`) và các bản thiết kế tính năng (\`tasks/\`). Đây là "pháp luật" của dự án.
- **\`.agents/skills/\`**: Nơi chứa các kỹ năng (Skills) định hướng hành vi cho AI. Đây là "bộ não quy trình" giúp AI biết cách đọc luật và viết code đúng chuẩn.
- **\`src/\`**: Nơi chứa mã nguồn thực tế.

## Cách sử dụng cho Agent
1. Gọi Agent và yêu cầu lập kế hoạch tính năng (Agent sẽ dùng \`sdd-planner\` skill).
2. Duyệt bản spec được tạo trong \`.specify/tasks/\`.
3. Yêu cầu Agent tiến hành code (Agent sẽ dùng \`sdd-coder\` skill).
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
echo -e "  4. Let AI plan features using ${YELLOW}sdd-planner${NC} and write code using ${YELLOW}sdd-coder${NC}\n"
echo -e "${DIM}Happy deterministic coding! 🚀${NC}\n"
