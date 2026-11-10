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

  plannerSkill: `---
name: sdd-planner
description: Skill to generate architecture and task specifications using Spec Kit.
---
# SDD Planner Skill

## When to use
Trigger this skill when the user asks to plan a feature, design architecture, or create a task specification.

## Workflow
1. ALWAYS read \`.specify/constitution.md\` first to understand the project guardrails.
2. Ask clarifying questions if the user's request is ambiguous.
3. Generate a structured Markdown specification document outlining Data Models, API Endpoints, UI Components, and Logic Flow.
4. Save this specification document into \`.specify/tasks/\` with a descriptive name (e.g., \`feature-name-spec.md\`).
`,

  coderSkill: `---
name: sdd-coder
description: Skill to write code strictly based on generated specifications.
---
# SDD Coder Skill

## When to use
Trigger this skill when the user asks to implement code or complete a task that has already been planned in the \`.specify/tasks/\` directory.

## Workflow
1. Ask the user which specification file in \`.specify/tasks/\` they want to implement (if not explicitly mentioned).
2. Read the chosen specification file completely.
3. Write modular, robust code in the \`src/\` directory that strictly adheres to the specification AND the rules in \`.specify/constitution.md\`.
4. Do NOT hallucinate features or logic that are not present in the specification.
`,

  readme: (projectName) => `# ${projectName} 🌌

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
    console.log('create-nexus-kit v1.0.0');
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
    { relPath: '.specify/templates/.gitkeep', content: '' },
    { relPath: '.specify/tasks/.gitkeep', content: '' },
    { relPath: '.agents/skills/sdd-planner/SKILL.md', content: TEMPLATES.plannerSkill },
    { relPath: '.agents/skills/sdd-coder/SKILL.md', content: TEMPLATES.coderSkill },
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
  console.log(`  4. Let AI plan features using ${c.yellow}sdd-planner${c.reset} and write code using ${c.yellow}sdd-coder${c.reset}\n`);
  console.log(`${c.dim}Happy deterministic coding! 🚀${c.reset}\n`);
}

run();
