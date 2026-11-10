# Nexus Kit

<p align="center">
  <b>English</b> | <a href="README.vi.md"><b>Tiếng Việt</b></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/create-nexus-kit"><img src="https://img.shields.io/npm/v/create-nexus-kit.svg" alt="npm version" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="https://github.com/TranHuuQuyet/nexus-kit/actions"><img src="https://github.com/TranHuuQuyet/nexus-kit/actions/workflows/ci.yml/badge.svg" alt="CI Status" /></a>
  <a href="package.json"><img src="https://img.shields.io/badge/dependencies-0-success" alt="Zero Dependencies" /></a>
</p>

---

## Overview

Nexus Kit is an orchestration framework that bridges **Spec Kit** (specification governance) and **Agent Skills** (agent execution standards). It establishes a disciplined, deterministic engineering environment designed to eliminate unstructured AI code generation.

---

## Prerequisites

Nexus Kit integrates with two upstream open specifications:

1. **[Spec Kit](https://github.com/github/spec-kit)**: Tooling and standards for specification lifecycle management.
2. **[Agent Skills](https://github.com/anthropics/agent-skills)**: Open industry standard for defining AI agent capabilities (`SKILL.md`).

---

## Architecture

```mermaid
flowchart LR
    subgraph Upstream["Upstream Standards"]
        SK["Spec Kit\n(Specification Governance)"]
        AS["Agent Skills\n(Agent Protocol)"]
    end

    subgraph NexusKit["Nexus Kit Core"]
        direction TB
        SpecDir[".specify/\n(constitution.md, tasks, templates)"]
        SkillsDir[".agents/skills/\n(sdd-planner, sdd-coder, sdd-verifier)"]
    end

    SK -. "Domain Structure" .-> SpecDir
    AS -. "Protocol Standard" .-> SkillsDir

    SpecDir <-->|"Contracts & Quality Gates"| SkillsDir
    SkillsDir -->|"Deterministic Code"| Src["src/"]
```

### Component Roles

- **`.specify/` (Spec Kit Domain)**: Houses the project constitution (`constitution.md`), reusable templates (`templates/`), and active task specifications (`tasks/`). Serves as the single source of truth.
- **`.agents/skills/` (Agent Skills Domain)**: Implements the SDD triad:
  - **`sdd-planner`**: Analyzes requirements, checks `constitution.md`, and authors formal specifications into `.specify/tasks/`.
  - **`sdd-coder`**: Implements approved specifications in `src/` with strict scope boundaries.
  - **`sdd-verifier`**: Audits implementation against all Acceptance Criteria defined in the task spec.
- **`src/`**: Application source code generated strictly from approved specifications.

---

## Quick Start

Initialize a new project using the zero-dependency CLI:

```bash
# Method 1: Using npx (Recommended)
npx create-nexus-kit my-project

# Method 2: Using Shell Script
curl -sL https://raw.githubusercontent.com/TranHuuQuyet/nexus-kit/main/create-nexus-kit/install.sh | bash
```

---

## Repository Structure

```text
nexus-kit/
├── .specify/                         # Spec Kit Domain
│   ├── constitution.md               # Engineering guidelines & constraints
│   ├── templates/                    # Specification templates
│   │   └── spec-template.md
│   └── tasks/                        # Feature specifications
├── .agents/skills/                   # Agent Skills Domain
│   ├── sdd-planner/SKILL.md          # Requirements elicitation & specification
│   ├── sdd-coder/SKILL.md            # Deterministic implementation
│   └── sdd-verifier/SKILL.md         # Specification compliance audit
├── src/                              # Application source code
├── create-nexus-kit/                 # Scaffolding CLI package (npm)
├── .github/workflows/ci.yml          # Automated CI pipeline
├── CONTRIBUTING.md                   # Contribution guidelines
├── README.md                         # English documentation
├── README.vi.md                      # Vietnamese documentation
└── LICENSE                           # MIT License
```

---

## Agent Protocol

```
Request ➔ sdd-planner (Draft Spec) ➔ Human Review Gate ➔ sdd-coder (Implement) ➔ sdd-verifier (Audit)
```

1. **Planning**: Prompt the agent to design a feature. The agent activates `sdd-planner`, loads `spec-template.md`, and drafts a specification in `.specify/tasks/`.
2. **Review Gate**: Review and approve the specification document prior to code generation.
3. **Implementation**: Direct the agent to implement the approved spec. The agent activates `sdd-coder`, producing typed, modular code in `src/`.
4. **Verification**: The agent activates `sdd-verifier` to audit all Acceptance Criteria before completion.

---

## License & Governance

### License
This project is open-source under the [MIT License](LICENSE) © 2026 [Tran Huu Quyet](https://github.com/TranHuuQuyet).

### Upstream Attribution
Nexus Kit is an independent project that builds on open specifications:
- **[Spec Kit](https://github.com/github/spec-kit)**: Specification-driven development conventions.
- **[Agent Skills](https://github.com/anthropics/agent-skills)**: Agent skill format and runtime specifications.

### Disclaimer
This software, accompanying templates, and agent instructions are provided "AS IS", without warranty of any kind. Users are responsible for evaluating, testing, and approving all AI-generated code prior to production deployment.
