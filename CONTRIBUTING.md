# Contributing to Nexus Kit 🌌

Thank you for your interest in contributing to **Nexus Kit**! 

Nexus Kit is an open-source framework designed to eliminate AI "vibe coding" by bridging **Spec Kit** (specification governance) and **Agent Skills** (agent execution standards).

---

## 🧭 Core Principles

Every contribution must honor the project's foundational laws:
1. **Spec-Driven First**: No feature is implemented without an agreed-upon specification in `.specify/tasks/`.
2. **Deterministic & Standard-Compliant**:
   - Skills must follow the **Agent Skills Specification** (YAML frontmatter + `When to use` + `Workflow`).
   - Templates must remain 100% interoperable with upstream **Spec Kit**.
3. **Zero Runtime Dependencies**: The CLI tool `create-nexus-kit` relies strictly on native Node.js built-ins. Do not introduce third-party dependencies unless strictly justified.

---

## 🛠️ Development & Testing Workflow

### 1. Fork & Clone
```bash
git clone https://github.com/TranHuuQuyet/nexus-kit.git
cd nexus-kit
```

### 2. Testing the CLI Locally
```bash
# Test help output
node create-nexus-kit/bin/index.js --help

# Test scaffolding in a temporary folder
node create-nexus-kit/bin/index.js /tmp/test-app
rm -rf /tmp/test-app
```

### 3. Adding New Skills
When adding a new SDD skill in `.agents/skills/<skill-name>/`:
1. Create `SKILL.md` with valid YAML frontmatter:
   ```yaml
   ---
   name: <skill-name>
   description: <one-sentence description>
   ---
   ```
2. Include both `## When to use` and `## Workflow` sections.
3. Synchronize the skill into `create-nexus-kit/bin/index.js` and `create-nexus-kit/install.sh`.

---

## 📜 Pull Request Process

1. Create a feature branch from `main`: `git checkout -b feat/your-feature-name`.
2. Ensure all automated GitHub Actions CI checks pass.
3. Submit a Pull Request with a clear description of the problem solved and test evidence.

---

## 📄 License

By contributing to Nexus Kit, you agree that your contributions will be licensed under the [MIT License](LICENSE).
