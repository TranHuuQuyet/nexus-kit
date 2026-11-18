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
7. **Human Approval Gate & Status Board**:
   - Present a summary of the spec, instruct the user to approve it (e.g., by running \`npx create-nexus-kit --approve .specify/tasks/<file>.md\`) before \`sdd-coder\` is permitted to execute, and display the current **Spec Status Board** in your response (read MCP \`nexus://board\`, or run \`nexus-kit board\` / \`npx create-nexus-kit board\`, or render a Markdown table \`ID | Ver | Status | Integrity | Criteria | Progress | Title\` directly from \`.specify/tasks/\` if offline).
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
5. **Handover to Verifier & Status Board**: Invoke \`sdd-verifier\` to audit the implementation against all Acceptance Criteria before claiming task completion, and include the updated **Spec Status Board** in your chat report (via MCP \`nexus://board\`, CLI \`nexus-kit board\`, or Markdown fallback table from \`.specify/tasks/\`).
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
5. **Finalize, Emit Verification Report & Status Board**:
   - Render a Traceability & Compliance table marking each AC as \`[PASSED]\` or \`[FAILED]\` with observed evidence.
   - Only if all checks pass: mark ACs as \`- [x]\` and update \`Status\` to \`Completed\`. Otherwise block completion and hand specific remediation items back to \`sdd-coder\`.
   - Always conclude your response by displaying the live **Spec Status Board** in chat: prefer MCP resource \`nexus://board\`, otherwise run \`nexus-kit board\` / \`npx create-nexus-kit board\`, or if offline/sandboxed render a Markdown table (\`ID | Ver | Status | Integrity | Criteria | Progress | Title\`) directly from \`.specify/tasks/\`.
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
4. **Show Spec Status Board**: At the end of every Planning, Coding, or Verification response, display the current **Spec Status Board** in chat (prefer MCP \`nexus://board\`, else run \`nexus-kit board\` / \`npx create-nexus-kit board\`, or render a Markdown table from \`.specify/tasks/\` if offline).
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
4. **Show Spec Status Board**: At the end of every Planning, Coding, or Verification response, display the current **Spec Status Board** in chat (prefer MCP \`nexus://board\`, else run \`nexus-kit board\` / \`npx create-nexus-kit board\`, or render a Markdown table from \`.specify/tasks/\` if offline).
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
4. **SHOW SPEC STATUS BOARD**: At the end of every Planning, Coding, or Verification response, display the current **Spec Status Board** in chat (prefer MCP \`nexus://board\`, else run \`nexus-kit board\` / \`npx create-nexus-kit board\`, or render a Markdown table from \`.specify/tasks/\` if offline).
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
- **Show Spec Status Board**: At the end of every Planning, Coding, or Verification response, display the current **Spec Status Board** in chat (prefer MCP \`nexus://board\`, else run \`nexus-kit board\` / \`npx create-nexus-kit board\`, or render a Markdown table from \`.specify/tasks/\` if offline).
`,

  windsurfAdapter: `# Windsurf Cascade Rules — Nexus Kit SDD Protocol

This project is governed by **Nexus Kit** (Spec-Driven Development).

## Mandatory Directives
1. **NO VIBE CODING**: Never write or modify application code in \`src/\` without an approved specification in \`.specify/tasks/\`.
2. **Read Constitution First**: Always consult \`.specify/constitution.md\` before planning or coding to verify tech stack constraints and quality gates.
3. **Execute the SDD Triad** (located in \`.agents/skills/\`):
   - **Planning**: Load \`.agents/skills/sdd-planner/SKILL.md\` and \`.specify/templates/spec-template.md\`. Draft specifications into \`.specify/tasks/\` and wait for human approval before coding.
   - **Coding**: Load \`.agents/skills/sdd-coder/SKILL.md\` and implement strictly within \`In-Scope\` bounds of approved specs.
   - **Verification**: Load \`.agents/skills/sdd-verifier/SKILL.md\` to audit implementation against all Acceptance Criteria.
4. **Show Spec Status Board**: At the end of every Planning, Coding, or Verification response, display the current **Spec Status Board** in chat (prefer MCP \`nexus://board\`, else run \`nexus-kit board\` / \`npx create-nexus-kit board\`, or render a Markdown table from \`.specify/tasks/\` if offline).
`,

  clineAdapter: `# Cline Rules — Nexus Kit SDD Protocol

This repository adheres to **Nexus Kit** (Spec-Driven Development).

## Mandatory Rules
1. **NO VIBE CODING**: Never write or modify application code in \`src/\` without an approved specification in \`.specify/tasks/\`.
2. **Read Constitution First**: Check \`.specify/constitution.md\` before writing any code to ensure compliance with the tech stack and typing rules.
3. **SDD Workflow** (located in \`.agents/skills/\`):
   - **sdd-planner**: When asked to create or modify a feature, use \`.agents/skills/sdd-planner/SKILL.md\` and \`.specify/templates/spec-template.md\`. Save to \`.specify/tasks/\` and require human approval (\`--approve\`).
   - **sdd-coder**: Follow \`.agents/skills/sdd-coder/SKILL.md\` only after verifying approval with \`nexus-kit --verify-spec <spec-path>\`.
   - **sdd-verifier**: Follow \`.agents/skills/sdd-verifier/SKILL.md\` to audit Acceptance Criteria before completing the task.
4. **Show Spec Status Board**: At the end of every Planning, Coding, or Verification response, display the current **Spec Status Board** in chat (prefer MCP \`nexus://board\`, else run \`nexus-kit board\` / \`npx create-nexus-kit board\`, or render a Markdown table from \`.specify/tasks/\` if offline).
`,

  preCommitHook: `#!/bin/sh
# Nexus Kit Git Hard Gate — Pre-commit Hook
# Prevents unapproved vibe coding in src/

# 1. Identify staged files in src/
STAGED_SRC=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '^src/' || true)

if [ -z "$STAGED_SRC" ]; then
  # No modifications to src/, allow commit
  exit 0
fi

# 2. Check if node is available
if ! command -v node >/dev/null 2>&1; then
  printf "\\033[1;31m[NEXUS-KIT HARD GATE ERROR]\\033[0m node is required to verify specification integrity.\\n"
  exit 1
fi

# 3. Run inline Node validator
node -e '
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

let stagedSrcFiles = [];
try {
  const output = execSync("git diff --cached --name-only --diff-filter=ACMR", { encoding: "utf8" });
  stagedSrcFiles = output.split(/\\r?\\n/).map(function(f) { return f.trim().replace(/\\\\/g, "/"); }).filter(function(f) { return f.startsWith("src/"); });
} catch (e) {
  // If git diff fails, allow fallback
}

if (stagedSrcFiles.length === 0) {
  process.exit(0);
}

const tasksDir = path.join(process.cwd(), ".specify", "tasks");
if (!fs.existsSync(tasksDir)) {
  console.error("\\x1b[1;31m[NEXUS-KIT HARD GATE VIOLATION]\\x1b[0m");
  console.error("  Commit blocked: Staged changes in src/ without a .specify/tasks/ directory!");
  console.error("  Rule: NO VIBE CODING - Always plan and approve a specification first.\\n");
  process.exit(1);
}

const specFiles = fs.readdirSync(tasksDir).filter(function(f) { return f.endsWith("-spec.md") || f.endsWith(".spec.md"); });
if (specFiles.length === 0) {
  console.error("\\x1b[1;31m[NEXUS-KIT HARD GATE VIOLATION]\\x1b[0m");
  console.error("  Commit blocked: Staged changes in src/ with zero specifications in .specify/tasks/!");
  console.error("  Rule: NO VIBE CODING - Run sdd-planner and approve a spec first.\\n");
  process.exit(1);
}

function parseMeta(content) {
  const meta = {};
  for (const line of content.replace(/\\r\\n/g, "\\n").split("\\n")) {
    const match = line.match(/^>\\s*\\*\\*([^:]+):\\*\\*\\s*(.+)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if (val.startsWith("\\x60") && val.endsWith("\\x60") && val.length >= 2 && val.slice(1, -1).indexOf("\\x60") === -1) {
        val = val.slice(1, -1).trim();
      }
      meta[key] = val;
    }
  }
  return meta;
}

function computeHash(content) {
  const lines = content.replace(/\\r\\n/g, "\\n").split("\\n");
  const filtered = lines.filter(function(line) {
    return !/^>\\s*\\*\\*(?:Status|Approved-By|Approved-At|Approved-Hash):\\*\\*/i.test(line);
  });
  const canonical = filtered.join("\\n").replace(/^(\\s*[-*]\\s*)\\[[xX]\\]/gm, "$1[ ]").trim();
  const digest = crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
  return "sha256:" + digest;
}

function isPathCovered(filePath, pattern) {
  const normFile = filePath.replace(/\\\\/g, "/");
  const normPattern = pattern.replace(/\\\\/g, "/").trim();
  if (normPattern === "src/..." || normPattern === "src/*" || normPattern === "src/**" || normPattern === "src/" || normPattern === "src") {
    return normFile.startsWith("src/");
  }
  if (normPattern.endsWith("/")) {
    return normFile.startsWith(normPattern);
  }
  return normFile === normPattern || normFile.startsWith(normPattern + "/");
}

let validApprovedSpecs = 0;
let driftedSpecs = 0;
const activeTargetPaths = [];

for (const file of specFiles) {
  const full = path.join(tasksDir, file);
  const raw = fs.readFileSync(full, "utf8");
  const meta = parseMeta(raw);
  const status = meta["Status"];

  if (status === "Approved" || status === "Completed" || status === "In Progress") {
    const stampedHash = meta["Approved-Hash"];
    const liveHash = computeHash(raw);
    if (stampedHash && stampedHash === liveHash) {
      validApprovedSpecs++;
      const targetMeta = meta["Target Path"] || meta["Target-Path"] || "";
      if (targetMeta) {
        const parts = targetMeta.split(",").map(function(p) { return p.trim().replace(/^[\\x60]|[\\x60]$/g, ""); }).filter(Boolean);
        for (const part of parts) {
          activeTargetPaths.push({ specFile: file, pattern: part });
        }
      }
    } else {
      driftedSpecs++;
      console.warn("\\x1b[33m[WARN]\\x1b[0m Spec " + file + " is marked " + status + " but Approved-Hash does not match content (tampered/drifted)!");
    }
  }
}

if (driftedSpecs > 0) {
  console.error("\\x1b[1;31m[NEXUS-KIT HARD GATE VIOLATION]\\x1b[0m");
  console.error("  Commit blocked: " + driftedSpecs + " specification(s) in .specify/tasks/ have been modified after approval (drift detected)!");
  console.error("  Rule: Requirement drift must be re-reviewed and re-stamped using \\"nexus-kit --approve <spec-file>\\".\\n");
  process.exit(1);
}

if (validApprovedSpecs === 0) {
  console.error("\\x1b[1;31m[NEXUS-KIT HARD GATE VIOLATION]\\x1b[0m");
  console.error("  Commit blocked: Changes staged in src/, but NO Approved or Completed spec found in .specify/tasks/!");
  console.error("  Hint: Use \\"nexus-kit --approve .specify/tasks/<spec-file>.md\\" after review.\\n");
  process.exit(1);
}

const uncoveredFiles = stagedSrcFiles.filter(function(f) {
  return !activeTargetPaths.some(function(t) { return isPathCovered(f, t.pattern); });
});

if (uncoveredFiles.length > 0) {
  console.error("\\x1b[1;31m[NEXUS-KIT HARD GATE VIOLATION]\\x1b[0m");
  console.error("  Commit blocked: The following staged file(s) in src/ are NOT covered by any approved specification Target Path:");
  uncoveredFiles.forEach(function(f) { console.error("    - " + f); });
  console.error("  Active Approved Specs Target Paths:");
  if (activeTargetPaths.length === 0) {
    console.error("    (No Target Path defined in active specs)");
  } else {
    activeTargetPaths.forEach(function(t) { console.error("    - [" + t.specFile + "] -> " + t.pattern); });
  }
  console.error("  Rule: NO VIBE CODING - Every code change in src/ must be scoped within an approved spec.\\n");
  process.exit(1);
}

console.log("\\x1b[32m✔ [NEXUS-KIT HARD GATE]\\x1b[0m Verified " + stagedSrcFiles.length + " staged file(s) across " + validApprovedSpecs + " approved spec(s). Commit allowed.");
process.exit(0);
'
`,

  readme: (projectName) => `# ${projectName}

Powered by **Nexus Kit** (Spec Kit + Agent Skills) for deterministic, spec-driven AI engineering.

## Getting Started (4-Step Workflow)

### 1. Configure Your Tech Stack
Update line 4 in \`.specify/constitution.md\` (e.g., \`TypeScript 5, Node.js 20, Vitest\`):
\`\`\`bash
npx create-nexus-kit@latest --doctor
\`\`\`

### 2. Plan a Feature (\`sdd-planner\`)
Open your AI IDE (Antigravity, Claude Code, Cursor, or GitHub Copilot) and prompt:
> *"Plan a feature for user authentication with JWT. Do not write code yet."*

The agent reads \`.specify/constitution.md\`, clarifies ambiguities, and saves \`.specify/tasks/001-jwt-auth-spec.md\` (\`Status: Draft\`).

### 3. Review & Approve the Spec (\`--approve\`)
Review the generated spec, then lock and stamp its SHA-256 hash:
\`\`\`bash
npx create-nexus-kit@latest --approve .specify/tasks/001-jwt-auth-spec.md
\`\`\`
*(Tip: If you installed \`npm i -g create-nexus-kit\`, you can use the short alias \`nexus-kit --approve ...\`)*

### 4. Implement & Verify (\`sdd-coder\` + \`sdd-verifier\`)
Prompt your AI agent:
> *"Implement the approved spec \`.specify/tasks/001-jwt-auth-spec.md\`."*

- \`sdd-coder\` verifies \`--verify-spec\` before writing modular code and tests in \`src/\`.
- \`sdd-verifier\` audits Acceptance Criteria, marks them \`[x]\`, and runs \`--doctor\`.

### Changing Requirements Mid-Flight (Change Management)
If requirements change after approval: prompt the agent to bump \`Version\` in the spec, log the change in \`## Change Log\`, reset \`Status\` to \`In Review\`, and re-run \`--approve\` before coding.

## Repository Layout
- **\`.specify/\`**: \`constitution.md\`, \`templates/spec-template.md\`, and \`tasks/*.md\`.
- **\`.agents/skills/\`**: \`sdd-planner\`, \`sdd-coder\`, and \`sdd-verifier\`.
- **\`AGENTS.md\`, \`CLAUDE.md\`, \`.cursor/rules/\`, \`.github/copilot-instructions.md\`**: Automatic IDE rule adapters.
- **\`src/\`**: Application source code.
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
