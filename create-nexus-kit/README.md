# create-nexus-kit

<p align="center">
  <b>English</b> | <a href="https://github.com/TranHuuQuyet/nexus-kit/blob/main/README.vi.md"><b>Tiếng Việt</b></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/create-nexus-kit"><img src="https://img.shields.io/npm/v/create-nexus-kit.svg" alt="npm version" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen" alt="Node.js Version" /></a>
  <a href="package.json"><img src="https://img.shields.io/badge/dependencies-0-success" alt="Zero Dependencies" /></a>
</p>

---

## Overview

`create-nexus-kit` is the official zero-dependency CLI to scaffold production-grade **Nexus Kit** projects. It establishes an integrated environment connecting **Spec Kit** (specification governance) and **Agent Skills** (agent execution standards) to eliminate unstructured AI code generation ("vibe coding") across Claude Code, Cursor, GitHub Copilot, and Antigravity.

---

## Prerequisites & Architecture

Nexus Kit connects two open upstream specifications:

1. **[Spec Kit](https://github.com/github/spec-kit)**: Powers the `.specify/` directory, maintaining the project constitution, tasks, and specification lifecycle.
2. **[Agent Skills](https://github.com/anthropics/agent-skills)**: Powers the `.agents/skills/` directory, providing standardized behaviors for AI agents.

Nexus Kit bridges them with a production-grade SDD triad and Multi-IDE adapters:
- **`sdd-planner`**: Conducts clarifying interviews, enforces scope lock, and authors formal specifications into `.specify/tasks/`.
- **`sdd-coder`**: Implements approved specifications in `src/` with strict typing, zero scope creep, and automated tests.
- **`sdd-verifier`**: Performs zero-trust audits building a traceability matrix against all Acceptance Criteria.
- **IDE Adapters**: Generates verified rule files for Antigravity (`AGENTS.md` without frontmatter), Claude Code (`CLAUDE.md`), Cursor (`.cursor/rules/nexus-kit.mdc` with `alwaysApply: true`), and GitHub Copilot (`.github/copilot-instructions.md`).

---

## Quick Start

### Method 1: Using npx (Recommended)

No global installation required (skips existing files by default unless `--force` is passed):

```bash
# Scaffold in a new folder
npx create-nexus-kit my-app

# Scaffold safely inside an existing project (skips existing files)
npx create-nexus-kit .

# Overwrite existing files intentionally
npx create-nexus-kit . --force

# Approve a spec and stamp its canonical SHA-256 hash
npx create-nexus-kit --approve .specify/tasks/001-feature-spec.md

# Verify a spec is approved and not stale before coding
npx create-nexus-kit --verify-spec .specify/tasks/001-feature-spec.md

# Run full Nexus Kit integrity validation (specs, hashes, skills, adapters)
npx create-nexus-kit --doctor
```

### Method 2: Using Shell Script

```bash
# Default project name (nexus-kit-app)
curl -sL https://raw.githubusercontent.com/TranHuuQuyet/nexus-kit/main/create-nexus-kit/install.sh | bash

# Custom project name
curl -sL https://raw.githubusercontent.com/TranHuuQuyet/nexus-kit/main/create-nexus-kit/install.sh | bash -s -- my-app
```

### Method 3: Global npm Installation

```bash
npm install -g create-nexus-kit
create-nexus-kit my-app
```

---

## Generated Project Structure

```text
my-app/
├── .specify/
│   ├── constitution.md               # Engineering guidelines & constraints
│   ├── templates/                    # Specification templates
│   │   └── spec-template.md
│   └── tasks/                        # Feature specifications
├── .agents/skills/
│   ├── sdd-planner/SKILL.md          # Requirements elicitation & specification
│   ├── sdd-coder/SKILL.md            # Deterministic implementation
│   └── sdd-verifier/SKILL.md         # Specification compliance audit
├── .cursor/rules/nexus-kit.mdc       # Cursor IDE rules (alwaysApply: true)
├── .github/copilot-instructions.md   # GitHub Copilot instructions
├── AGENTS.md                         # Antigravity / Open Standard directory rule
├── CLAUDE.md                         # Claude Code instructions
├── src/                              # Application source code
├── .gitignore                        # Standard exclusions
└── README.md                         # Project overview & agent instructions
```

---

## Agent Protocol

```
Request ➔ sdd-planner (Draft Spec) ➔ Human Review Gate ➔ sdd-coder (Implement) ➔ sdd-verifier (Audit)
```

1. **Plan**: Prompt your AI agent to design a feature. The agent triggers `sdd-planner`, reads `constitution.md`, asks clarifying questions, and drafts `.specify/tasks/<feature>-spec.md`.
2. **Approve**: Review and approve the generated specification (Data models, API contracts, Edge cases).
3. **Build**: Prompt the agent to implement the approved spec. The agent activates `sdd-coder` to write exact, type-safe code and tests in `src/`.
4. **Verify**: The agent triggers `sdd-verifier` to audit all Acceptance Criteria before completion.

---

## Maintainer Guide

To publish an update to the npm registry:

```bash
# 1. Login to npm
npm login

# 2. Test locally
npm test

# 3. Publish to npm
npm publish --access public
```

---

## License

[MIT](LICENSE) © [Tran Huu Quyet](https://github.com/TranHuuQuyet)
