import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const VERSION = '1.4.0';

export const VALID_SPEC_STATUSES = [
  'Draft',
  'In Review',
  'Approved',
  'In Progress',
  'Completed',
  'Superseded'
];

export const TEMPLATES = {
  constitution: `# Core Constitution & Engineering Guidelines

1. NO VIBE CODING: Never jump straight to writing code. Always verify if a specification exists in \`.specify/tasks/\` first.
2. DETERMINISTIC OUTPUTS: Use explicit typings, data models, and schemas. Avoid unstructured string parsing.
3. QUALITY GATES: All code written must directly map to a predefined requirement in the task spec.
4. TECH STACK: [Người dùng sẽ cập nhật công nghệ cụ thể tại đây]
`,

  specTemplate: `# [SPEC-ID]: [Feature Title]

> **Status:** \`Draft\`  
> **Version:** \`1.0.0\`  
> **Author:** [AI Agent / Engineer]  
> **Date:** [YYYY-MM-DD]  
> **Approved-By:** \`Pending\`  
> **Approved-At:** \`Pending\`  
> **Approved-Hash:** \`Pending\`  
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

---

## 6. Change Log

| Version | Date | Author | Summary |
| :--- | :--- | :--- | :--- |
| \`1.0.0\` | \`[YYYY-MM-DD]\` | \`[Author]\` | Initial draft specification. |
`,

  plannerSkill: `---
name: sdd-planner
description: Skill to generate architecture and task specifications using Spec Kit with approval versioning and change management.
---
# SDD Planner Skill

## When to use
Trigger this skill when the user asks to plan a feature, design architecture, modify requirements on an existing spec, or create a task specification.

## Hard Guardrails
- **NEVER write or modify application code in \`src/\` during the planning phase.**
- **Do NOT assume ambiguous requirements.** Surface assumptions explicitly and ask clarifying questions before finalizing a spec.
- **CHANGE MANAGEMENT**: If modifying an already-approved spec, you MUST increment \`Version\`, record the change in \`## Change Log\`, reset \`Status\` to \`In Review\`, and set \`Approved-Hash\` to \`Pending\`.

## Workflow
1. **Read Constitution**: ALWAYS read \`.specify/constitution.md\` first to verify tech stack constraints, typing rules, and quality gates.
2. **Load Spec Kit Blueprint**: Read \`.specify/templates/spec-template.md\` as the mandatory structural template.
3. **Clarifying Interview & Assumptions**:
   - Surface hidden assumptions immediately (e.g., auth mechanism, storage engine, validation library).
   - If the request is underspecified, ask concise clarifying questions one at a time until requirements are concrete.
4. **Enforce Strict Scope Lock**:
   - Partition capabilities into **In-Scope** (explicitly required) and **Out-of-Scope** (explicitly excluded to prevent AI scope creep).
5. **Author Deterministic Contracts**:
   - Define explicit Domain Models / Schemas (TypeScript interfaces, Zod/JSON schemas, error types).
   - Map Logic Flows & State Transitions using Mermaid diagrams.
   - Enumerate Edge Cases (null/empty input, network timeout, idempotency, boundary limits).
   - Assign verifiable Acceptance Criteria IDs (\`AC-1\`, \`AC-2\`, etc.).
6. **Version & Save Specification**:
   - Set \`Status: Draft\` (or \`In Review\` for changes), \`Version: 1.0.0\` (or bumped semantic version), and \`Approved-Hash: Pending\`.
   - Save into \`.specify/tasks/\` with an incrementing numeric prefix and descriptive kebab-case name (e.g., \`002-feature-name-spec.md\`).
7. **Human Approval Gate**:
   - Present a summary of the spec and instruct the user to approve it (e.g., by running \`npx create-nexus-kit --approve .specify/tasks/<file>.md\`) before \`sdd-coder\` is permitted to execute.
`,

  coderSkill: `---
name: sdd-coder
description: Skill to write code strictly based on approved, non-stale specifications.
---
# SDD Coder Skill

## When to use
Trigger this skill when the user asks to implement code or complete a task that has already been planned and approved in the \`.specify/tasks/\` directory.

## Hard Guardrails
- **NO SPEC, NO CODE**: Refuse to write code if no corresponding specification exists in \`.specify/tasks/\`. Redirect to \`sdd-planner\` instead.
- **APPROVAL & DRIFT GATE**: NEVER implement a spec whose \`Status\` is \`Draft\`, \`In Review\`, or \`Superseded\`, or whose \`Approved-Hash\` fails integrity verification (\`npx create-nexus-kit --verify-spec <spec-path>\`). If requirements changed after approval, stop and require human re-approval first.
- **ZERO SCOPE CREEP**: Implement ONLY items explicitly defined in the spec's \`In-Scope\` section. Never touch unrelated files or perform unsolicited refactoring.
- **NO HALLUCINATED DEPENDENCIES**: Never install third-party packages not authorized in the spec or \`.specify/constitution.md\`.

## Workflow
1. **Verify Approval & Integrity Gate**:
   - Read the target specification in \`.specify/tasks/\` completely.
   - Verify \`Status\` is \`Approved\` or \`In Progress\`.
   - Run \`npx create-nexus-kit --verify-spec .specify/tasks/<spec-file>.md\` (or verify \`Approved-Hash\`) to confirm the spec is neither unapproved nor stale/modified since approval.
2. **Enforce Constitution**: Read \`.specify/constitution.md\` to strictly honor the project's tech stack, strict typing (no \`any\` or blind casts), and error handling standards.
3. **Incremental, Type-Safe Implementation**:
   - Write modular, single-responsibility files inside \`src/\` conforming strictly to the spec's Domain Models and Interface Contracts.
   - Handle every documented Edge Case explicitly (never leave empty \`catch {}\` blocks or silent failures).
4. **Automated Test Verification**:
   - Write unit/integration tests verifying the happy path and every negative/edge case defined in the spec.
   - Run the test suite and ensure all tests pass with zero warnings.
5. **Handover to Verifier**: Invoke \`sdd-verifier\` to audit the implementation against all Acceptance Criteria before claiming task completion.
`,

  verifierSkill: `---
name: sdd-verifier
description: Skill to verify and audit implemented code against approved task specifications, integrity hashes, and constitution guardrails.
---
# SDD Verifier Skill

## When to use
Trigger this skill immediately after \`sdd-coder\` finishes implementing code, before committing or opening a pull request, or when the user asks to audit whether a task in \`.specify/tasks/\` is genuinely complete.

## Hard Guardrails
- **ZERO TRUST AUDIT**: Never assume an implementation works or matches the spec by memory. Read the actual source files and observe live command outputs.
- **NO PARTIAL PASSES**: All Acceptance Criteria (\`AC-1\`..\`AC-N\`) and all tests must pass without skipped assertions. Never mark \`Status: Completed\` if any AC remains unchecked (\`- [ ]\`).

## Workflow
1. **Extract Spec Contract & Integrity**:
   - Read the target specification document in \`.specify/tasks/\`.
   - Verify \`Approved-Hash\` integrity has not drifted unexpectedly during implementation.
   - Extract all Acceptance Criteria (\`AC-1\`, \`AC-2\`...), \`In-Scope\` bounds, \`Out-of-Scope\` prohibitions, and \`Edge Cases\`.
2. **Build Traceability Matrix**:
   - Inspect files in \`src/\` and map every Acceptance Criterion to the exact file path and line range implementing it.
   - Verify no \`Out-of-Scope\` code or unauthorized dependencies were introduced.
3. **Constitution Compliance Check**:
   - Audit code against \`.specify/constitution.md\`: verify explicit types (no \`any\`), structured validation (no loose string parsing), and proper error handling.
4. **Run Automated Gates**:
   - Execute project tests, type checks, linters, and \`npx create-nexus-kit --doctor\` directly in the terminal and observe full outputs.
5. **Finalize & Emit Verification Report**:
   - Render a Traceability & Compliance table marking each AC as \`[PASSED]\` or \`[FAILED]\` with observed evidence.
   - Only if all checks pass: mark ACs as \`- [x]\` and update \`Status\` to \`Completed\`. Otherwise block completion and hand specific remediation items back to \`sdd-coder\`.
`,

  agentsAdapter: `# AGENTS.md — Nexus Kit SDD Protocol

This workspace operates under **Nexus Kit** (Spec-Driven Development).

## Mandatory Rules
1. **NO VIBE CODING**: Never write or modify application code in \`src/\` without an approved specification in \`.specify/tasks/\`.
2. **Read Constitution First**: Always read \`.specify/constitution.md\` before planning or writing code.
3. **Execute the SDD Triad** (located in \`.agents/skills/\`):
   - **Planning**: Use \`.agents/skills/sdd-planner/SKILL.md\` and \`.specify/templates/spec-template.md\` to draft specs into \`.specify/tasks/\`. Wait for human approval before coding.
   - **Coding**: Use \`.agents/skills/sdd-coder/SKILL.md\` to implement strictly within the \`In-Scope\` bounds of the approved spec.
   - **Verification**: Use \`.agents/skills/sdd-verifier/SKILL.md\` to audit the implementation against all Acceptance Criteria.
`,

  claudeAdapter: `# CLAUDE.md — Nexus Kit SDD Protocol

This project is governed by **Nexus Kit** (Spec-Driven Development).

## Mandatory Rules
1. **NO VIBE CODING**: Never write or modify code in \`src/\` without an approved specification in \`.specify/tasks/\`.
2. **Read Constitution First**: Always check \`.specify/constitution.md\` before planning or coding.
3. **Use SDD Skills** (located in \`.agents/skills/\`):
   - Planning a feature -> Follow \`.agents/skills/sdd-planner/SKILL.md\` and \`.specify/templates/spec-template.md\`.
   - Implementing a spec -> Follow \`.agents/skills/sdd-coder/SKILL.md\`.
   - Auditing implementation -> Follow \`.agents/skills/sdd-verifier/SKILL.md\`.
`,

  cursorAdapter: `---
description: Enforce Nexus Kit Spec-Driven Development (SDD) Constitution and Skills workflow
globs:
alwaysApply: true
---

# Nexus Kit — Spec-Driven Development Rules

This repository uses **Nexus Kit**. You must enforce these rules on every interaction:

1. **NO VIBE CODING**: Do NOT write or edit application code in \`src/\` unless an approved specification exists in \`.specify/tasks/\`.
2. **READ CONSTITUTION**: Always read \`.specify/constitution.md\` first to verify tech stack constraints and coding standards.
3. **FOLLOW THE SDD TRIAD** (in \`.agents/skills/\`):
   - **Planning**: Load \`.agents/skills/sdd-planner/SKILL.md\` and \`.specify/templates/spec-template.md\`, clarify requirements, and save the spec into \`.specify/tasks/\`. Wait for human approval before coding.
   - **Coding**: Load \`.agents/skills/sdd-coder/SKILL.md\` and implement strictly within the \`In-Scope\` bounds of the approved spec.
   - **Verification**: Load \`.agents/skills/sdd-verifier/SKILL.md\` to audit the implementation against all Acceptance Criteria.
`,

  copilotAdapter: `# GitHub Copilot Instructions — Nexus Kit

This repository follows **Spec-Driven Development (SDD)** powered by Nexus Kit.

## Mandatory Directives
- **No Spec, No Code**: Never generate or modify code in \`src/\` without verifying that an approved specification exists in \`.specify/tasks/\`.
- **Constitution First**: Always read \`.specify/constitution.md\` to respect project tech stack and type-safety guidelines.
- **Follow Skills**:
  - For planning/architecture: follow \`.agents/skills/sdd-planner/SKILL.md\` and use \`.specify/templates/spec-template.md\`.
  - For implementation: follow \`.agents/skills/sdd-coder/SKILL.md\` and stay strictly within \`In-Scope\` bounds.
  - For verification: follow \`.agents/skills/sdd-verifier/SKILL.md\` to audit against Acceptance Criteria.
`,

  readme: (projectName) => `# ${projectName}

**The Ultimate Integration Framework for Spec Kit & Agent Skills**

Nexus Kit là lớp điều phối và tích hợp tối ưu (Orchestration Layer) kết nối giữa **Spec Kit** (hệ thống quản trị đặc tả) và **Agent Skills** (hệ sinh thái kỹ năng của AI Agent). Cấu trúc này thiết lập một môi trường làm việc kỷ luật, đảm bảo AI Agents luôn vận hành có quy trình, loại bỏ hoàn toàn tình trạng "Vibe Coding".

## Kiến trúc thư mục
- **\`.specify/\`**: Nơi chứa bộ luật (\`constitution.md\`), mẫu đặc tả (\`templates/\`) và các bản thiết kế tính năng (\`tasks/\`).
- **\`.agents/skills/\`**: Nơi chứa bộ ba kỹ năng SDD: \`sdd-planner\`, \`sdd-coder\`, và \`sdd-verifier\`.
- **\`AGENTS.md\`, \`CLAUDE.md\`, \`.cursor/rules/\`, \`.github/copilot-instructions.md\`**: Các cầu nối tự động kích hoạt luật cho Antigravity, Claude Code, Cursor và GitHub Copilot.
- **\`src/\`**: Nơi chứa mã nguồn thực tế.

## Quy trình làm việc cho Agent
1. Gọi Agent lập kế hoạch tính năng (Agent kích hoạt \`sdd-planner\`, sinh spec vào \`.specify/tasks/\`).
2. Con người duyệt bản spec bằng \`npx create-nexus-kit --approve .specify/tasks/<file>.md\` (Human Approval Gate).
3. Yêu cầu Agent tiến hành code (Agent kích hoạt \`sdd-coder\`, kiểm tra \`--verify-spec\` và viết code vào \`src/\`).
4. Thẩm định chéo chất lượng code (Agent kích hoạt \`sdd-verifier\` đối chiếu Acceptance Criteria và chạy \`--doctor\`).
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

/**
 * Strictly parses YAML frontmatter at the start of a Markdown document.
 */
export function parseYamlFrontmatter(rawContent) {
  const normalized = rawContent.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    return { valid: false, error: 'Missing opening YAML frontmatter delimiter (---)' };
  }

  const endIdx = normalized.indexOf('\n---\n', 4);
  const eofEndIdx = normalized.endsWith('\n---') ? normalized.length - 4 : -1;
  const closeIdx = endIdx !== -1 ? endIdx : eofEndIdx;

  if (closeIdx === -1) {
    return { valid: false, error: 'Missing closing YAML frontmatter delimiter (---)' };
  }

  const yamlBlock = normalized.slice(4, closeIdx);
  const body = normalized.slice(closeIdx + 5).trim();
  const data = {};
  const lines = yamlBlock.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }

    const match = line.match(/^([A-Za-z0-9_-]+):(.*)$/);
    if (!match) {
      return { valid: false, error: `Invalid YAML syntax at line: "${line}"` };
    }

    const key = match[1].trim();
    const val = match[2].trim();

    if (val === '>-' || val === '>' || val === '|-' || val === '|') {
      const multilineParts = [];
      while (i + 1 < lines.length && (lines[i + 1].startsWith('  ') || lines[i + 1].trim() === '')) {
        i++;
        multilineParts.push(lines[i].trim());
      }
      data[key] = multilineParts.join(' ').trim();
    } else if (val === 'true') {
      data[key] = true;
    } else if (val === 'false') {
      data[key] = false;
    } else if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      data[key] = val.slice(1, -1);
    } else {
      data[key] = val;
    }
  }

  return { valid: true, data, body };
}

/**
 * Extracts content under a specific Markdown H2 heading (e.g., "## Workflow").
 */
export function extractSectionContent(markdownBody, headingTitle) {
  const lines = markdownBody.replace(/\r\n/g, '\n').split('\n');
  const targetHeading = `## ${headingTitle}`.toLowerCase();
  let collecting = false;
  const collected = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!collecting && trimmed.toLowerCase() === targetHeading) {
      collecting = true;
      continue;
    }
    if (collecting) {
      if (/^##\s+/.test(trimmed)) {
        break;
      }
      collected.push(line);
    }
  }

  if (!collecting) {
    return null;
  }
  return collected.join('\n').trim();
}

/**
 * Parses spec blockquote metadata (Status, Version, Approved-By, Approved-At, Approved-Hash).
 */
export function parseSpecMetadata(rawMarkdown) {
  const normalized = rawMarkdown.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const meta = {};

  for (const line of lines) {
    const match = line.match(/^>\s*\*\*([A-Za-z-]+):\*\*\s*(.+)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if (val.startsWith('`') && val.endsWith('`') && val.length >= 2) {
        val = val.slice(1, -1).trim();
      }
      meta[key] = val;
    }
  }

  return meta;
}

/**
 * Computes canonical SHA-256 hash of a spec document.
 * Excludes dynamic approval header lines and normalizes [x]/[ ] checkboxes so status
 * transitions and AC verification ticks do not trigger false drift warnings,
 * while any edits to requirements, scope, models, or AC wording invalidate the hash.
 */
export function computeSpecHash(rawMarkdown) {
  const lines = rawMarkdown.replace(/\r\n/g, '\n').split('\n');
  const filteredLines = lines.filter(
    (line) => !/^>\s*\*\*(?:Status|Approved-By|Approved-At|Approved-Hash):\*\*/i.test(line)
  );
  const canonical = filteredLines
    .join('\n')
    .replace(/^(\s*-\s*)\[[xX]\]/gm, '$1[ ]')
    .trim();

  const digest = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
  return `sha256:${digest}`;
}

/**
 * Stamps a specification with Status: Approved and its canonical SHA-256 hash.
 */
export function approveSpec(specPath, options = {}) {
  if (!fs.existsSync(specPath)) {
    throw new Error(`Specification not found: ${specPath}`);
  }

  const raw = fs.readFileSync(specPath, 'utf8').replace(/\r\n/g, '\n');
  const hash = computeSpecHash(raw);
  const approvedBy = options.by || process.env.USER || 'Human Reviewer';
  const approvedAt = new Date().toISOString();

  const lines = raw.split('\n');
  const upsertField = (fieldName, value) => {
    const pattern = new RegExp(`^>\\s*\\*\\*${fieldName}:\\*\\*.*$`);
    const replacement = `> **${fieldName}:** \`${value}\`  `;
    const idx = lines.findIndex((l) => pattern.test(l));
    if (idx !== -1) {
      lines[idx] = replacement;
    } else {
      // Insert after last blockquote metadata line or after first heading
      let insertIdx = lines.findIndex((l) => /^>\s*\*\*/.test(l));
      if (insertIdx !== -1) {
        while (insertIdx + 1 < lines.length && /^>\s*\*\*/.test(lines[insertIdx + 1])) {
          insertIdx++;
        }
        lines.splice(insertIdx + 1, 0, replacement);
      } else {
        lines.splice(1, 0, '', replacement);
      }
    }
  };

  upsertField('Status', 'Approved');
  upsertField('Approved-By', approvedBy);
  upsertField('Approved-At', approvedAt);
  upsertField('Approved-Hash', hash);

  fs.writeFileSync(specPath, lines.join('\n'), 'utf8');

  return {
    specPath,
    status: 'Approved',
    approvedBy,
    approvedAt,
    hash
  };
}

/**
 * Verifies whether a spec is approved and its canonical hash matches (anti-stale/drift check).
 */
export function verifySpecForCoding(specPath) {
  if (!fs.existsSync(specPath)) {
    return { ready: false, status: 'FAIL', reason: `Specification file not found: ${specPath}` };
  }

  const raw = fs.readFileSync(specPath, 'utf8');
  const meta = parseSpecMetadata(raw);
  const status = meta['Status'];

  if (!status) {
    return { ready: false, status: 'FAIL', reason: 'Missing > **Status:** metadata field in specification.' };
  }

  if (status !== 'Approved' && status !== 'In Progress') {
    return {
      ready: false,
      status: 'FAIL',
      reason: `Spec status is '${status}'. Only 'Approved' or 'In Progress' specs may be implemented by sdd-coder.`
    };
  }

  const recordedHash = meta['Approved-Hash'];
  if (!recordedHash || recordedHash === 'Pending' || recordedHash === '[Pending]') {
    return {
      ready: false,
      status: 'FAIL',
      reason: `Spec lacks cryptographic Approved-Hash stamp. Run: npx create-nexus-kit --approve ${specPath}`
    };
  }

  const liveHash = computeSpecHash(raw);
  if (recordedHash !== liveHash) {
    return {
      ready: false,
      status: 'FAIL',
      reason: `Spec drift detected! Requirements were modified after approval (recorded: ${recordedHash.slice(0, 18)}..., live: ${liveHash.slice(0, 18)}...). Re-review and re-run --approve.`
    };
  }

  return {
    ready: true,
    status: 'PASS',
    metadata: meta,
    hash: liveHash
  };
}

/**
 * Scaffolds a Nexus Kit project into targetDir safely without overwriting existing files unless force=true.
 */
export function scaffoldProject(targetDir, options = {}) {
  const force = Boolean(options.force);
  const projectName = options.projectName || path.basename(targetDir);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const directories = [
    '.specify/templates',
    '.specify/tasks',
    '.agents/skills/sdd-planner',
    '.agents/skills/sdd-coder',
    '.agents/skills/sdd-verifier',
    '.cursor/rules',
    '.github',
    'src'
  ];

  for (const dir of directories) {
    fs.mkdirSync(path.join(targetDir, dir), { recursive: true });
  }

  const files = [
    { relPath: '.specify/constitution.md', content: TEMPLATES.constitution },
    { relPath: '.specify/templates/spec-template.md', content: TEMPLATES.specTemplate },
    { relPath: '.specify/tasks/.gitkeep', content: '' },
    { relPath: '.agents/skills/sdd-planner/SKILL.md', content: TEMPLATES.plannerSkill },
    { relPath: '.agents/skills/sdd-coder/SKILL.md', content: TEMPLATES.coderSkill },
    { relPath: '.agents/skills/sdd-verifier/SKILL.md', content: TEMPLATES.verifierSkill },
    { relPath: 'AGENTS.md', content: TEMPLATES.agentsAdapter },
    { relPath: 'CLAUDE.md', content: TEMPLATES.claudeAdapter },
    { relPath: '.cursor/rules/nexus-kit.mdc', content: TEMPLATES.cursorAdapter },
    { relPath: '.github/copilot-instructions.md', content: TEMPLATES.copilotAdapter },
    { relPath: 'src/.gitkeep', content: '' },
    { relPath: 'README.md', content: TEMPLATES.readme(projectName) },
    { relPath: '.gitignore', content: TEMPLATES.gitignore }
  ];

  const created = [];
  const overwritten = [];
  const skipped = [];

  for (const file of files) {
    const fullFilePath = path.join(targetDir, file.relPath);
    const exists = fs.existsSync(fullFilePath);

    if (exists && !force) {
      skipped.push(file.relPath);
      continue;
    }

    fs.writeFileSync(fullFilePath, file.content, 'utf8');
    if (exists) {
      overwritten.push(file.relPath);
    } else {
      created.push(file.relPath);
    }
  }

  return {
    targetDir,
    projectName,
    created,
    overwritten,
    skipped
  };
}

/**
 * Validates full Nexus Kit integrity: constitution, template, spec lifecycle/hashes,
 * closed-loop skills, IDE adapters, and template parity (when inside source repo).
 */
export function validateProject(targetDir) {
  const results = [];

  const addResult = (status, category, message) => {
    results.push({ status, category, message });
  };

  // 1. Constitution Integrity
  const constPath = path.join(targetDir, '.specify/constitution.md');
  if (!fs.existsSync(constPath)) {
    addResult('FAIL', 'constitution', 'Missing .specify/constitution.md');
  } else {
    const content = fs.readFileSync(constPath, 'utf8').trim();
    const hasLaws = content.includes('NO VIBE CODING') && content.includes('DETERMINISTIC OUTPUTS') && content.includes('QUALITY GATES');
    if (!content) {
      addResult('FAIL', 'constitution', '.specify/constitution.md is empty');
    } else if (!hasLaws) {
      addResult('FAIL', 'constitution', '.specify/constitution.md is missing mandatory core laws (NO VIBE CODING, DETERMINISTIC OUTPUTS, QUALITY GATES)');
    } else if (content.includes('[Người dùng sẽ cập nhật công nghệ cụ thể tại đây]')) {
      addResult('WARN', 'constitution', '.specify/constitution.md found, but TECH STACK placeholder is unconfigured');
    } else {
      addResult('PASS', 'constitution', '.specify/constitution.md is present and configured');
    }
  }

  // 2. Spec Template Integrity
  const tplPath = path.join(targetDir, '.specify/templates/spec-template.md');
  if (!fs.existsSync(tplPath)) {
    addResult('FAIL', 'template', 'Missing .specify/templates/spec-template.md');
  } else {
    const tplContent = fs.readFileSync(tplPath, 'utf8');
    const missingParts = [];
    if (!tplContent.includes('Scope Boundaries')) missingParts.push('Scope Boundaries');
    if (!tplContent.includes('Acceptance Criteria')) missingParts.push('Acceptance Criteria');
    if (!tplContent.includes('Change Log')) missingParts.push('Change Log');
    if (!tplContent.includes('Approved-Hash')) missingParts.push('Approved-Hash metadata');

    if (missingParts.length > 0) {
      addResult('WARN', 'template', `.specify/templates/spec-template.md is missing recommended fields/sections: ${missingParts.join(', ')}`);
    } else {
      addResult('PASS', 'template', '.specify/templates/spec-template.md integrity verified');
    }
  }

  // 3. Spec Lifecycle & Drift Integrity (.specify/tasks/*.md)
  const tasksDir = path.join(targetDir, '.specify/tasks');
  if (!fs.existsSync(tasksDir)) {
    addResult('FAIL', 'tasks', 'Missing .specify/tasks/ directory');
  } else {
    const specs = fs.readdirSync(tasksDir).filter((f) => f.endsWith('.md')).sort();
    if (specs.length === 0) {
      addResult('WARN', 'tasks', '.specify/tasks/ exists, but has 0 specifications yet (use sdd-planner to create one)');
    } else {
      for (const specFile of specs) {
        const specPath = path.join(tasksDir, specFile);
        const raw = fs.readFileSync(specPath, 'utf8');
        const meta = parseSpecMetadata(raw);
        const status = meta['Status'];

        if (!status || !VALID_SPEC_STATUSES.includes(status)) {
          addResult('FAIL', `spec:${specFile}`, `${specFile}: Invalid or missing Status ('${status || 'none'}')`);
          continue;
        }

        if (status === 'Approved' || status === 'In Progress' || status === 'Completed') {
          const recordedHash = meta['Approved-Hash'];
          if (!recordedHash || recordedHash === 'Pending' || recordedHash === '[Pending]') {
            addResult('WARN', `spec:${specFile}`, `${specFile}: Status is '${status}' without cryptographic Approved-Hash stamp (run --approve)`);
            continue;
          }

          const liveHash = computeSpecHash(raw);
          if (recordedHash !== liveHash) {
            addResult('FAIL', `spec:${specFile}`, `${specFile}: Spec drift detected! Modified after approval without re-approval (hash mismatch)`);
            continue;
          }
        }

        if (status === 'Completed') {
          const acMatches = raw.match(/^\s*-\s*\[\s*\]\s*\*\*AC-/gm);
          if (acMatches && acMatches.length > 0) {
            addResult('FAIL', `spec:${specFile}`, `${specFile}: Status is 'Completed' while ${acMatches.length} Acceptance Criteria remain unchecked (- [ ])`);
            continue;
          }
        }

        if (meta['Version'] && meta['Version'] !== '1.0.0' && !raw.includes('Change Log')) {
          addResult('WARN', `spec:${specFile}`, `${specFile}: Version ${meta['Version']} lacks a Change Log section`);
          continue;
        }

        addResult('PASS', `spec:${specFile}`, `${specFile}: Spec lifecycle & integrity verified (${status})`);
      }
    }
  }

  // 4. Agent Skills Triad (YAML + Content + Closed-Loop Semantic Chain)
  const skillExpectations = {
    'sdd-planner': ['.specify/constitution.md', 'spec-template.md', '.specify/tasks/', '--approve'],
    'sdd-coder': ['.specify/tasks/', '.specify/constitution.md', '--verify-spec', 'sdd-verifier'],
    'sdd-verifier': ['.specify/tasks/', '.specify/constitution.md', 'src/', 'Acceptance Criteria']
  };

  for (const [skill, requiredRefs] of Object.entries(skillExpectations)) {
    const skillRelPath = `.agents/skills/${skill}/SKILL.md`;
    const skillPath = path.join(targetDir, skillRelPath);

    if (!fs.existsSync(skillPath)) {
      addResult('FAIL', `skill:${skill}`, `Missing ${skillRelPath}`);
      continue;
    }

    const raw = fs.readFileSync(skillPath, 'utf8');
    const parsed = parseYamlFrontmatter(raw);
    if (!parsed.valid) {
      addResult('FAIL', `skill:${skill}`, `${skillRelPath}: ${parsed.error}`);
      continue;
    }

    const { name, description } = parsed.data;
    if (typeof name !== 'string' || !name.trim() || name !== skill) {
      addResult('FAIL', `skill:${skill}`, `${skillRelPath}: Frontmatter name '${name || ''}' must match directory '${skill}'`);
      continue;
    }
    if (typeof description !== 'string' || description.trim().length < 10) {
      addResult('FAIL', `skill:${skill}`, `${skillRelPath}: Frontmatter 'description' must be descriptive (>= 10 chars)`);
      continue;
    }

    const whenToUse = extractSectionContent(parsed.body, 'When to use');
    const workflow = extractSectionContent(parsed.body, 'Workflow');
    if (!whenToUse || !workflow) {
      const missing = [!whenToUse && '## When to use', !workflow && '## Workflow'].filter(Boolean).join(', ');
      addResult('FAIL', `skill:${skill}`, `${skillRelPath}: Missing or empty required section(s): ${missing}`);
      continue;
    }

    const missingChainRefs = requiredRefs.filter((ref) => !parsed.body.includes(ref));
    if (missingChainRefs.length > 0) {
      addResult('FAIL', `skill:${skill}`, `${skillRelPath}: Broken workflow chain; missing reference(s): ${missingChainRefs.join(', ')}`);
      continue;
    }

    const guardrails = extractSectionContent(parsed.body, 'Hard Guardrails');
    if (!guardrails) {
      addResult('WARN', `skill:${skill}`, `${skillRelPath}: Valid, but recommended '## Hard Guardrails' section is missing`);
      continue;
    }

    addResult('PASS', `skill:${skill}`, `${skillRelPath} passed YAML, content & closed-loop chain validation`);
  }

  // 5. IDE Adapters & Cross-Reference Checks
  const checkCrossRefs = (content) => {
    const missing = [];
    if (!content.includes('.specify/constitution.md')) missing.push('.specify/constitution.md');
    if (!content.includes('.agents/skills/')) missing.push('.agents/skills/');
    return missing;
  };

  const agentsPath = path.join(targetDir, 'AGENTS.md');
  if (!fs.existsSync(agentsPath)) {
    addResult('WARN', 'adapter:agents', 'Missing Antigravity / Open Standard adapter (AGENTS.md)');
  } else {
    const raw = fs.readFileSync(agentsPath, 'utf8');
    if (raw.replace(/\r\n/g, '\n').startsWith('---\n')) {
      addResult('WARN', 'adapter:agents', 'AGENTS.md should not contain YAML frontmatter (per Antigravity directory-rule spec)');
    } else {
      const missingRefs = checkCrossRefs(raw);
      if (missingRefs.length > 0) {
        addResult('WARN', 'adapter:agents', `AGENTS.md is missing cross-references to: ${missingRefs.join(', ')}`);
      } else {
        addResult('PASS', 'adapter:agents', 'IDE Adapter: Antigravity / Open Standard (AGENTS.md)');
      }
    }
  }

  const claudePath = path.join(targetDir, 'CLAUDE.md');
  if (!fs.existsSync(claudePath)) {
    addResult('WARN', 'adapter:claude', 'Missing Claude Code adapter (CLAUDE.md)');
  } else {
    const raw = fs.readFileSync(claudePath, 'utf8');
    const missingRefs = checkCrossRefs(raw);
    if (missingRefs.length > 0) {
      addResult('WARN', 'adapter:claude', `CLAUDE.md is missing cross-references to: ${missingRefs.join(', ')}`);
    } else {
      addResult('PASS', 'adapter:claude', 'IDE Adapter: Claude Code (CLAUDE.md)');
    }
  }

  const cursorPath = path.join(targetDir, '.cursor/rules/nexus-kit.mdc');
  if (!fs.existsSync(cursorPath)) {
    addResult('WARN', 'adapter:cursor', 'Missing Cursor IDE adapter (.cursor/rules/nexus-kit.mdc)');
  } else {
    const raw = fs.readFileSync(cursorPath, 'utf8');
    const parsed = parseYamlFrontmatter(raw);
    if (!parsed.valid) {
      addResult('WARN', 'adapter:cursor', `.cursor/rules/nexus-kit.mdc: ${parsed.error}`);
    } else if (parsed.data.alwaysApply !== true) {
      addResult('WARN', 'adapter:cursor', `.cursor/rules/nexus-kit.mdc must set 'alwaysApply: true' in frontmatter`);
    } else {
      const missingRefs = checkCrossRefs(parsed.body);
      if (missingRefs.length > 0) {
        addResult('WARN', 'adapter:cursor', `.cursor/rules/nexus-kit.mdc is missing cross-references to: ${missingRefs.join(', ')}`);
      } else {
        addResult('PASS', 'adapter:cursor', 'IDE Adapter: Cursor (.cursor/rules/nexus-kit.mdc)');
      }
    }
  }

  const copilotPath = path.join(targetDir, '.github/copilot-instructions.md');
  if (!fs.existsSync(copilotPath)) {
    addResult('WARN', 'adapter:copilot', 'Missing GitHub Copilot adapter (.github/copilot-instructions.md)');
  } else {
    const raw = fs.readFileSync(copilotPath, 'utf8');
    const missingRefs = checkCrossRefs(raw);
    if (missingRefs.length > 0) {
      addResult('WARN', 'adapter:copilot', `.github/copilot-instructions.md is missing cross-references to: ${missingRefs.join(', ')}`);
    } else {
      addResult('PASS', 'adapter:copilot', 'IDE Adapter: GitHub Copilot (.github/copilot-instructions.md)');
    }
  }

  // 6. Source Repo Template Parity Check (runs when targetDir is the Nexus Kit source repository itself)
  const cliLibPath = path.join(targetDir, 'create-nexus-kit/lib/nexus.js');
  if (fs.existsSync(cliLibPath)) {
    const parityPairs = [
      { rel: '.specify/templates/spec-template.md', expected: TEMPLATES.specTemplate },
      { rel: '.agents/skills/sdd-planner/SKILL.md', expected: TEMPLATES.plannerSkill },
      { rel: '.agents/skills/sdd-coder/SKILL.md', expected: TEMPLATES.coderSkill },
      { rel: '.agents/skills/sdd-verifier/SKILL.md', expected: TEMPLATES.verifierSkill },
      { rel: 'AGENTS.md', expected: TEMPLATES.agentsAdapter },
      { rel: 'CLAUDE.md', expected: TEMPLATES.claudeAdapter },
      { rel: '.cursor/rules/nexus-kit.mdc', expected: TEMPLATES.cursorAdapter },
      { rel: '.github/copilot-instructions.md', expected: TEMPLATES.copilotAdapter }
    ];

    const drifted = [];
    for (const pair of parityPairs) {
      const full = path.join(targetDir, pair.rel);
      if (!fs.existsSync(full) || fs.readFileSync(full, 'utf8').replace(/\r\n/g, '\n') !== pair.expected.replace(/\r\n/g, '\n')) {
        drifted.push(pair.rel);
      }
    }

    if (drifted.length > 0) {
      addResult('FAIL', 'parity', `Template drift between root repo and create-nexus-kit/lib/nexus.js: ${drifted.join(', ')}`);
    } else {
      addResult('PASS', 'parity', 'Root repository and create-nexus-kit templates are 100% in sync');
    }
  }

  const passCount = results.filter((r) => r.status === 'PASS').length;
  const warnCount = results.filter((r) => r.status === 'WARN').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;

  return {
    targetDir,
    results,
    passCount,
    warnCount,
    failCount,
    exitCode: failCount > 0 ? 1 : 0
  };
}
