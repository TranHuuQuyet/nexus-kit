# Nexus Kit Usage Guide (New vs. Existing Projects)

<p align="center">
  <b>English</b> | <a href="GUIDE.vi.md"><b>Tiếng Việt</b></a>
</p>

This guide walks through setting up and using **Nexus Kit** for two real-world scenarios:
- **Track A:** **Brand-new (Greenfield)** project with no existing files.
- **Track B:** **In-progress (Brownfield)** project that already has source code, `README.md`, `.gitignore`, or a custom directory layout.

> **Prerequisite:** Node.js `>= 18` installed.  
> *(Tip: Run `npm install -g create-nexus-kit@latest` to use the short `nexus-kit` command instead of `npx create-nexus-kit@latest`.)*

---

## 1. Quick Side-by-Side Comparison

| Item | Track A: Brand-New Project | Track B: Existing / In-Progress Project |
| :--- | :--- | :--- |
| **Terminal Working Directory** | Parent directory (e.g. `~/Documents`) | **Root of your existing project** (e.g. `~/Documents/CloudPulse`) |
| **Initialization Command** | `npx create-nexus-kit@latest my-app` *(or `nexus-kit my-app`)* | `npx create-nexus-kit@latest .` *(must include the trailing dot `.`)* |
| **Impact on Existing Files** | Creates all directories and files from scratch | **Non-destructive:** Automatically `[SKIPPED]` for any existing files (`README.md`, `.gitignore`, etc.). Only overwrites if you explicitly pass `--force` |
| **Tech Stack Configuration** | Edit `.specify/constitution.md` with your planned stack | Edit `.specify/constitution.md` with your current stack **and document your real source folders** (if not `src/`) |
| **Post-Setup Check** | `cd my-app && npx create-nexus-kit@latest --doctor` | `npx create-nexus-kit@latest --doctor` (inside the project root) |
| **Existing IDE Rules** | Creates all 4 adapters (`AGENTS.md`, `CLAUDE.md`, Cursor, Copilot) | If `AGENTS.md` or `CLAUDE.md` already exists, CLI skips it — add references to `.specify/constitution.md` and `.agents/skills/` manually |
| **First Specification** | Plan the initial feature from a blank slate | Write specs for **upcoming features, fixes, or refactors** — no need to retroactively spec stable legacy code |

---

## 2. Step-by-Step Setup by Scenario

<table>
<tr>
<th width="50%">Track A: Brand-New Project</th>
<th width="50%">Track B: Existing / In-Progress Project</th>
</tr>
<tr>
<td valign="top">

### Step 1A: Scaffold the Project
Run from your parent workspace folder (do not create projects inside the `nexus-kit` repository itself):
```bash
cd ~/Documents
npx create-nexus-kit@latest my-app
cd my-app
```
This creates:
- `.specify/` (`constitution.md`, `templates/`, `tasks/`)
- `.agents/skills/` (`sdd-planner`, `sdd-coder`, `sdd-verifier`)
- `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/nexus-kit.mdc`, `.github/copilot-instructions.md`
- `src/`, `README.md`, `.gitignore`

### Step 2A: Configure Your Tech Stack
Open `.specify/constitution.md` and update line 4:
```markdown
4. TECH STACK: TypeScript 5, Next.js 15, Zod, Vitest
```

### Step 3A: Verify Repository Integrity
```bash
npx create-nexus-kit@latest --doctor
```
Expected initial output: `0 failed` (with 1 normal `[WARN]` noting `.specify/tasks/` has 0 specifications yet).

### Step 4A: Build Your First Feature
Open `my-app` in your AI IDE and follow the **Daily 4-Phase Workflow** in Section 3 below.

</td>
<td valign="top">

### Step 1B: Initialize Inside Your Existing Project Root
`cd` into your **project root** and run the command **with a trailing dot `.`**:
```bash
cd /path/to/your-project
npx create-nexus-kit@latest .
```
> **Important:** Never omit the trailing `.`. Without `.` (or a folder name), the CLI defaults to creating a subfolder named `nexus-kit-app/` inside your repository instead of initializing the root.

Existing project files (such as `README.md` or `.gitignore`) are marked `[SKIPPED]` and left untouched.

### Step 2B: Configure Tech Stack + Real Folder Paths
Open `.specify/constitution.md` at the project root, replace the line-4 placeholder with your current stack, and note your actual source directories if you do not use a single `src/` folder:
```markdown
4. TECH STACK: React 18, Vite, Tailwind CSS, .NET 8 (AWS Lambda), xUnit, AWS SAM
5. REPO STRUCTURE: Frontend in `frontend/`, Backend in `backend/`, IaC in `template.yaml`.
```
> Note: Edit `.specify/constitution.md` only — **do not modify** `.agents/skills/*/SKILL.md` or `--doctor` may flag broken workflow chain references.

### Step 3B: Verify Integration
```bash
npx create-nexus-kit@latest --doctor
```
- If `--doctor` warns that a pre-existing `AGENTS.md` or `CLAUDE.md` is missing cross-references, open that file and add links/mentions for `.specify/constitution.md` and `.agents/skills/`.
- Goal: **`0 failed`**.

### Step 4B: Start Using SDD From Your Next Task
Open the project root in your AI IDE, start a **New Conversation** so the IDE discovers `.agents/skills/`, and follow **Section 3**. In each new spec, set `Target Path` to your actual target module path.

</td>
</tr>
</table>

---

## 3. Daily 4-Phase Workflow (Applies to Both Tracks)

Once `--doctor` reports `0 failed`, every new feature or non-trivial change follows this closed-loop workflow:

```text
[1] sdd-planner (Draft Spec) ➔ [2] Human Review & --approve (SHA-256) ➔ [3] sdd-coder (Code + Tests) ➔ [4] sdd-verifier (Audit)
```

### Phase 1: Plan (`sdd-planner`)
- **How to invoke:** Select **`sdd-planner`** from your IDE's skill menu (or prompt directly):
  > *"Use `sdd-planner` to create a spec for [describe the feature or change]. Do not write code yet."*
- **What the AI does:** Reads `.specify/constitution.md` and `.specify/templates/spec-template.md`, asks clarifying questions, locks `In-Scope` / `Out-of-Scope` boundaries, defines schemas and flows, and saves `.specify/tasks/001-feature-name-spec.md` with `Status: Draft`.

### Phase 2: Human Review & Cryptographic Approval (`--approve`)
- Review `.specify/tasks/001-feature-name-spec.md` to confirm requirements, scope, and Acceptance Criteria.
- Approve and seal the spec in your terminal at the project root:
  ```bash
  npx create-nexus-kit@latest --approve .specify/tasks/001-feature-name-spec.md
  # Or specify the reviewer name explicitly:
  npx create-nexus-kit@latest --approve .specify/tasks/001-feature-name-spec.md --by "Your Name"
  ```
- **Why `Approved-Hash` (`sha256:...`) matters:** It acts as a tamper-evident seal on the spec body. If requirements or `In-Scope` items are modified after approval, the hash check fails and blocks coding until re-approved.

### Phase 3: Implement & Test (`sdd-coder`)
- **How to invoke:** Select **`sdd-coder`** from the skill menu (or prompt):
  > *"Implement the approved spec `.specify/tasks/001-feature-name-spec.md`."*
- **What the AI does:**
  1. Runs `npx create-nexus-kit@latest --verify-spec .specify/tasks/001-feature-name-spec.md` to confirm the spec is `Approved` and has not drifted.
  2. Implements only items listed in `In-Scope`, writes unit/integration tests, and verifies all tests pass.

### Phase 4: Audit & Close (`sdd-verifier`)
- **How to invoke:** Select **`sdd-verifier`** from the skill menu (or prompt):
  > *"Use `sdd-verifier` to audit and close `.specify/tasks/001-feature-name-spec.md`."*
- **What the AI does:** Maps every Acceptance Criterion (`AC-1`..`AC-N`) to real source files and passing test outputs, checks off `- [x]`, updates `Status: Completed`, and runs `npx create-nexus-kit@latest --doctor`. *(Checking off `[x]` and changing `Status` to `Completed` does not invalidate `Approved-Hash`.)*

---

## 4. Changing Requirements Mid-Flight (Change Management)

If requirements change after a spec has already been `--approve`d:
1. **Do not** manually edit the spec and ask `sdd-coder` to keep coding (it will fail with `Spec drift detected!`).
2. Ask **`sdd-planner`** to update the spec, increment `Version` (e.g., `1.0.0` → `1.1.0`), record the update in `## Change Log`, and reset `Status` to `In Review`.
3. Re-review and run `npx create-nexus-kit@latest --approve <spec-file>` to stamp a fresh SHA-256 hash before resuming coding.

---

## 5. Quick Troubleshooting

| Symptom | Cause | Fix |
| :--- | :--- | :--- |
| `--doctor` reports every file `[FAIL]` right after scaffolding | Forgot the trailing `.` when initializing an existing project, creating a `nexus-kit-app/` subfolder instead | Run `npx create-nexus-kit@latest .` at your project root, copy `nexus-kit-app/.specify/constitution.md` to `.specify/constitution.md`, then `rm -rf nexus-kit-app` |
| `[WARN] TECH STACK placeholder is unconfigured` | Line 4 of `.specify/constitution.md` at the project root still contains the default placeholder (or edits were not saved) | Open `.specify/constitution.md` in your project root, replace the placeholder text, save the file, and re-run `--doctor` |
| `sdd-planner`, `sdd-coder`, `sdd-verifier` do not appear in the IDE menu | Wrong workspace root open, chat session predates setup, or IDE uses natural-language progressive discovery | Open the exact project root containing `.agents/skills/` and start a **New Conversation**; you can also invoke skills by name directly in chat |
| `Spec drift detected!` from `--verify-spec` or `--doctor` | Spec content changed after `--approve` was stamped | Review the diff in the spec file; if intentional, re-run `npx create-nexus-kit@latest --approve <spec-file>` |
