#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// ANSI color escape codes
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

const BANNER = `
${c.cyan}${c.bold}  _  _                     _  ___ _   
 | \\| |_____ ___  _ ___   | |/ (_) |_ 
 | .\` / -_) \\ / || (_-<   | ' <| |  _|
 |_|\\_\\___/_\\_\\\\_,_/__/   |_|\\_\\_|\\__|${c.reset}
${c.magenta}${c.bold}  Spec-Driven Development (SDD) for AI Agents${c.reset}
`;

const TEMPLATES = {
  constitution: `# Core Constitution & Engineering Guidelines

1. NO VIBE CODING: Never jump straight to writing code. Always verify if a specification exists in \`.specify/tasks/\` first.
2. DETERMINISTIC OUTPUTS: Use explicit typings, data models, and schemas. Avoid unstructured string parsing.
3. QUALITY GATES: All code written must directly map to a predefined requirement in the task spec.
4. TECH STACK: [Người dùng sẽ cập nhật công nghệ cụ thể tại đây]
`,

  specTemplate: `# [SPEC-ID]: [Feature Title]

> **Status:** \`Draft\` | \`In Review\` | \`Approved\` | \`In Progress\` | \`Completed\`  
> **Author:** [AI Agent / Engineer]  
> **Date:** [YYYY-MM-DD]  
> **Upstream Spec Kit:** Compatible with Spec Kit v1.0+  
> **Target Path:** \`src/...\`

---

## 1. Overview & Objective

### 1.1 Problem Statement
*Mô tả ngắn gọn bối cảnh và vấn đề thực tế cần giải quyết.*

### 1.2 User Stories
- **As a** \`[vai trò người dùng]\`, **I want** \`[hành động / chức năng]\` **so that** \`[giá trị mang lại]\`.

### 1.3 Scope Boundaries (Ranh giới phạm vi)
- **In-Scope (Bắt buộc làm):**
  - [Liệt kê các module / chức năng cần xây dựng]
- **Out-of-Scope (Tuyệt đối không làm trong task này):**
  - [Liệt kê các chức năng chưa cần thiết để ngăn chặn AI Vibe Coding]

---

## 2. Data Models & Interface Contracts

### 2.1 Domain Models (TypeScript / Schemas)
\`\`\`typescript
export interface EntityModel {
  id: string;          // UUID v4
  title: string;       // Non-empty string
  createdAt: string;   // ISO 8601 UTC
}
\`\`\`

### 2.2 API / CLI / Component Contracts
- **Input / Signature:**
- **Output / Return Type:**
- **Failure Responses:**

---

## 3. Logic Flow & State Transitions

\`\`\`mermaid
flowchart TD
    Start([Nhận yêu cầu]) --> Validate{Validate Schema}
    Validate -- Không hợp lệ --> ErrorHandler[Throw ValidationError]
    Validate -- Hợp lệ --> ExecuteLogic[Thực thi logic nghiệp vụ]
    ExecuteLogic --> SaveStorage[Ghi nhận vào Storage / State]
    SaveStorage --> ReturnResult([Trả về kết quả chuẩn hóa])
\`\`\`

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
- [ ] **AC-4**: Không sử dụng \`any\`, tuân thủ 100% \`constitution.md\`.
- [ ] **AC-5**: Có unit test bao phủ luồng chính và ít nhất 2 trường hợp lỗi biên.
`,

  plannerSkill: `---
name: sdd-planner
description: Skill to generate architecture and task specifications using Spec Kit.
---
# SDD Planner Skill

## When to use
Trigger this skill when the user asks to plan a feature, design architecture, or create a task specification.

## Workflow
1. **Read Constitution**: ALWAYS read \`.specify/constitution.md\` first to understand the project guardrails and tech stack.
2. **Load Template**: Load \`.specify/templates/spec-template.md\` as the blueprint.
3. **Elicit Requirements**: If the user's request is ambiguous, ask clarifying questions one at a time. Explicitly state assumptions.
4. **Author Specification**:
   - Define User Stories, strict In-Scope and Out-of-Scope boundaries.
   - Specify deterministic Data Models, Types, and Interfaces.
   - Detail the Logic Flow with Mermaid diagrams.
   - Enumerate Edge Cases and concrete Acceptance Criteria (AC-1, AC-2, etc.).
5. **Save Document**: Save into \`.specify/tasks/\` with an incrementing ID and descriptive name (e.g., \`002-feature-name-spec.md\`).
6. **Gate Check**: Prompt the user to review and approve the specification before any code is written.
`,

  coderSkill: `---
name: sdd-coder
description: Skill to write code strictly based on generated specifications.
---
# SDD Coder Skill

## When to use
Trigger this skill when the user asks to implement code or complete a task that has already been planned in the \`.specify/tasks/\` directory.

## Workflow
1. **Target Specification**: Select and completely read the target specification file in \`.specify/tasks/\`. Verify it is in \`Approved\` or active status.
2. **Review Constitution**: Read \`.specify/constitution.md\` to enforce the project's tech stack, typing conventions, and error handling rules.
3. **Deterministic Implementation**:
   - Write modular, type-safe code in \`src/\` matching the exact data models and interfaces defined in the spec.
   - Strictly adhere to \`In-Scope\` items. Do NOT hallucinate features, endpoints, or unapproved dependencies.
4. **Test-Driven Verification**:
   - Author automated tests verifying both happy paths and documented edge cases.
5. **Invoke Verification**: Hand off to \`sdd-verifier\` to perform the final compliance audit against all Acceptance Criteria.
`,

  verifierSkill: `---
name: sdd-verifier
description: Skill to verify and audit implemented code against task specifications and constitution guardrails.
---
# SDD Verifier Skill

## When to use
Trigger this skill when code has been implemented by \`sdd-coder\`, before committing or merging, or when the user asks to verify/audit whether a task in \`.specify/tasks/\` is completed.

## Workflow
1. **Locate Task Spec**: Read the target specification document in \`.specify/tasks/\`.
2. **Extract Criteria**: Identify all Acceptance Criteria (AC-1, AC-2, etc.), In-Scope bounds, and Out-of-Scope restrictions.
3. **Audit Implementation**:
   - Inspect files in \`src/\` to verify every AC is implemented.
   - Verify that NO Out-of-Scope logic or unapproved dependencies were introduced.
   - Verify adherence to \`.specify/constitution.md\` (no \`any\`, explicit types, proper error handling).
4. **Run Verification Commands**:
   - Run type checks and test suites.
5. **Output Verification Report**:
   - Present a checklist of all ACs with \`[PASSED]\` or \`[FAILED]\` status.
   - If any AC fails, provide actionable instructions for \`sdd-coder\` to fix.
`,

  readme: (projectName) => `# ${projectName}

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
`,

  gitignore: `# OS
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
`
};

function printHelp() {
  console.log(BANNER);
  console.log(`
${c.bold}Usage:${c.reset}
  npx create-nexus-kit [project-name]

${c.bold}Arguments:${c.reset}
  [project-name]   Name of the directory to create (default: nexus-kit-app)

${c.bold}Options:${c.reset}
  -h, --help       Show this help message
  -v, --version    Show version number

${c.bold}Examples:${c.reset}
  ${c.dim}$${c.reset} npx create-nexus-kit my-awesome-app
  ${c.dim}$${c.reset} npx create-nexus-kit .
`);
}

function run() {
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help')) {
    printHelp();
    process.exit(0);
  }

  if (args.includes('-v') || args.includes('--version')) {
    console.log('create-nexus-kit v1.1.0');
    process.exit(0);
  }

  console.log(BANNER);

  const rawName = args[0] || 'nexus-kit-app';
  const isCurrentDir = rawName === '.';
  const projectDir = isCurrentDir ? process.cwd() : path.resolve(process.cwd(), rawName);
  const projectName = isCurrentDir ? path.basename(projectDir) : rawName;

  console.log(`${c.blue}ℹ${c.reset} Initializing ${c.bold}${projectName}${c.reset} at ${c.dim}${projectDir}${c.reset}\n`);

  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  const directories = [
    '.specify/templates',
    '.specify/tasks',
    '.agents/skills/sdd-planner',
    '.agents/skills/sdd-coder',
    '.agents/skills/sdd-verifier',
    'src'
  ];

  console.log(`${c.yellow}→ Creating directory structure...${c.reset}`);
  for (const dir of directories) {
    const fullDirPath = path.join(projectDir, dir);
    fs.mkdirSync(fullDirPath, { recursive: true });
  }

  console.log(`${c.yellow}→ Generating templates and configurations...${c.reset}`);

  const files = [
    { relPath: '.specify/constitution.md', content: TEMPLATES.constitution },
    { relPath: '.specify/templates/spec-template.md', content: TEMPLATES.specTemplate },
    { relPath: '.specify/tasks/.gitkeep', content: '' },
    { relPath: '.agents/skills/sdd-planner/SKILL.md', content: TEMPLATES.plannerSkill },
    { relPath: '.agents/skills/sdd-coder/SKILL.md', content: TEMPLATES.coderSkill },
    { relPath: '.agents/skills/sdd-verifier/SKILL.md', content: TEMPLATES.verifierSkill },
    { relPath: 'src/.gitkeep', content: '' },
    { relPath: 'README.md', content: TEMPLATES.readme(projectName) },
    { relPath: '.gitignore', content: TEMPLATES.gitignore }
  ];

  for (const file of files) {
    const fullFilePath = path.join(projectDir, file.relPath);
    fs.writeFileSync(fullFilePath, file.content, 'utf8');
    console.log(`  ${c.green}✔${c.reset} ${c.dim}Created${c.reset} ${file.relPath}`);
  }

  console.log(`\n${c.green}${c.bold}✨ Success! Nexus Kit template created successfully.${c.reset}\n`);
  console.log(`${c.bold}Next steps:${c.reset}`);
  if (!isCurrentDir) {
    console.log(`  1. ${c.cyan}cd ${projectName}${c.reset}`);
    console.log(`  2. Open the project in your AI-powered editor (Antigravity, Cursor, etc.)`);
  } else {
    console.log(`  1. Open the project in your AI-powered editor (Antigravity, Cursor, etc.)`);
  }
  console.log(`  3. Update technology guidelines in ${c.cyan}.specify/constitution.md${c.reset}`);
  console.log(`  4. Let AI plan features using ${c.yellow}sdd-planner${c.reset}, implement using ${c.yellow}sdd-coder${c.reset}, and verify with ${c.yellow}sdd-verifier${c.reset}\n`);
  console.log(`${c.dim}Happy deterministic coding! 🚀${c.reset}\n`);
}

run();
