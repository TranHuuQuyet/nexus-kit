import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.resolve(__dirname, '../bin/index.js');

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-e2e-'));
}

describe('End-to-End SDD Workflow: Planner -> Gate -> Change Mgmt -> Coder -> Verifier -> Doctor', () => {
  let projectDir;

  beforeEach(() => {
    projectDir = createTempDir();
  });

  afterEach(() => {
    fs.rmSync(projectDir, { recursive: true, force: true });
  });

  test('executes full lifecycle enforcing approval gates, drift blocking, real implementation, and audit sign-off', () => {
    // 0. Scaffold fresh project and configure constitution
    const initProc = spawnSync(process.execPath, [CLI_PATH, '.'], { cwd: projectDir, encoding: 'utf8' });
    assert.equal(initProc.status, 0);

    const constPath = path.join(projectDir, '.specify/constitution.md');
    const updatedConst = fs
      .readFileSync(constPath, 'utf8')
      .replace('[Người dùng sẽ cập nhật công nghệ cụ thể tại đây]', 'Node.js 20+ (ES Modules)');
    fs.writeFileSync(constPath, updatedConst, 'utf8');

    // Verify all 3 skills are present and cross-linked
    const plannerSkill = fs.readFileSync(path.join(projectDir, '.agents/skills/sdd-planner/SKILL.md'), 'utf8');
    const coderSkill = fs.readFileSync(path.join(projectDir, '.agents/skills/sdd-coder/SKILL.md'), 'utf8');
    const verifierSkill = fs.readFileSync(path.join(projectDir, '.agents/skills/sdd-verifier/SKILL.md'), 'utf8');
    assert.match(plannerSkill, /--approve/);
    assert.match(coderSkill, /--verify-spec/);
    assert.match(verifierSkill, /--doctor/);

    // 1. PLANNER PHASE: Create Draft Spec following spec-template.md
    const specRelPath = '.specify/tasks/001-slugify-spec.md';
    const specAbsPath = path.join(projectDir, specRelPath);
    const initialSpec = `# SPEC-001: Deterministic URL Slugify Utility

> **Status:** \`Draft\`  
> **Version:** \`1.0.0\`  
> **Author:** \`sdd-planner\`  
> **Date:** \`2026-11-10\`  
> **Approved-By:** \`Pending\`  
> **Approved-At:** \`Pending\`  
> **Approved-Hash:** \`Pending\`  
> **Target Path:** \`src/slugify.mjs\`

---

## 1. Overview & Objective
### 1.3 Scope Boundaries
- **In-Scope:**
  - \`slugify(input)\` pure function in \`src/slugify.mjs\`
- **Out-of-Scope:**
  - HTML parsing or database storage

---

## 4. Edge Cases & Error Handling
- Throw TypeError on non-string input (null/undefined/number).

---

## 5. Acceptance Criteria

- [ ] **AC-1**: Lowercases strings, replaces spaces/punctuation with single hyphens, trims leading/trailing hyphens.
- [ ] **AC-2**: Throws TypeError if input is not a string.
- [ ] **AC-3**: Unit tests cover happy path and edge cases.

---

## 6. Change Log

| Version | Date | Author | Summary |
| :--- | :--- | :--- | :--- |
| \`1.0.0\` | \`2026-11-10\` | \`sdd-planner\` | Initial draft specification. |
`;
    fs.writeFileSync(specAbsPath, initialSpec, 'utf8');

    // 2. GATE 1: Coder MUST be blocked while spec is Draft
    const blockedDraft = spawnSync(process.execPath, [CLI_PATH, '--verify-spec', specRelPath], {
      cwd: projectDir,
      encoding: 'utf8'
    });
    assert.equal(blockedDraft.status, 1);
    assert.match(blockedDraft.stderr, /Status is 'Draft'|Spec status is 'Draft'/i);

    // 3. APPROVAL: Human approves spec with --approve
    const approve1 = spawnSync(process.execPath, [CLI_PATH, '--approve', specRelPath, '--by', 'Tech Lead'], {
      cwd: projectDir,
      encoding: 'utf8'
    });
    assert.equal(approve1.status, 0);
    assert.match(approve1.stdout, /Specification approved and stamped/);

    const verifyReady1 = spawnSync(process.execPath, [CLI_PATH, '--verify-spec', specRelPath], {
      cwd: projectDir,
      encoding: 'utf8'
    });
    assert.equal(verifyReady1.status, 0);

    // 4. CHANGE MANAGEMENT & DRIFT DETECTION:
    // Simulate unapproved requirement change after approval (without running --approve)
    const tamperedSpec = fs
      .readFileSync(specAbsPath, 'utf8')
      .replace(
        '- [ ] **AC-3**: Unit tests cover happy path and edge cases.',
        '- [ ] **AC-3**: Unit tests cover happy path, unicode normalization, and edge cases.'
      );
    fs.writeFileSync(specAbsPath, tamperedSpec, 'utf8');

    // Both --verify-spec and --doctor MUST catch drift and exit 1
    const blockedDrift = spawnSync(process.execPath, [CLI_PATH, '--verify-spec', specRelPath], {
      cwd: projectDir,
      encoding: 'utf8'
    });
    assert.equal(blockedDrift.status, 1);
    assert.match(blockedDrift.stderr, /Spec drift detected/i);

    const doctorDrift = spawnSync(process.execPath, [CLI_PATH, '--doctor', projectDir], { encoding: 'utf8' });
    assert.equal(doctorDrift.status, 1);
    assert.match(doctorDrift.stdout, /Spec drift detected/i);

    // 5. RE-APPROVAL: Planner logs change & bumps version, Human re-approves
    const versionedSpec = fs
      .readFileSync(specAbsPath, 'utf8')
      .replace('> **Version:** `1.0.0`', '> **Version:** `1.1.0`')
      .concat('| `1.1.0` | `2026-11-10` | `sdd-planner` | Added unicode normalization to AC-3. |\n');
    fs.writeFileSync(specAbsPath, versionedSpec, 'utf8');

    const approve2 = spawnSync(process.execPath, [CLI_PATH, '--approve', specRelPath, '--by', 'Tech Lead'], {
      cwd: projectDir,
      encoding: 'utf8'
    });
    assert.equal(approve2.status, 0);

    const verifyReady2 = spawnSync(process.execPath, [CLI_PATH, '--verify-spec', specRelPath], {
      cwd: projectDir,
      encoding: 'utf8'
    });
    assert.equal(verifyReady2.status, 0);

    // 6. CODER PHASE: Implement src/slugify.mjs and src/slugify.test.mjs strictly matching spec
    fs.writeFileSync(
      path.join(projectDir, 'src/slugify.mjs'),
      `export function slugify(input) {
  if (typeof input !== 'string') {
    throw new TypeError('Expected string input for slugify');
  }
  return input
    .normalize('NFKD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
`,
      'utf8'
    );

    fs.writeFileSync(
      path.join(projectDir, 'src/slugify.test.mjs'),
      `import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from './slugify.mjs';

test('AC-1 & AC-3: slugifies strings and normalizes unicode', () => {
  assert.equal(slugify('  Hello, World! 2026  '), 'hello-world-2026');
  assert.equal(slugify('Tiếng Việt Có Dấu'), 'tieng-viet-co-dau');
});

test('AC-2: throws TypeError on non-string inputs', () => {
  assert.throws(() => slugify(null), TypeError);
  assert.throws(() => slugify(123), TypeError);
});
`,
      'utf8'
    );

    // Run implementation unit tests
    const srcTests = spawnSync(process.execPath, ['--test', 'src/slugify.test.mjs'], {
      cwd: projectDir,
      encoding: 'utf8'
    });
    assert.equal(srcTests.status, 0, `src tests failed: ${srcTests.stderr}\n${srcTests.stdout}`);

    // 7. VERIFIER PHASE:
    // 7a. Prematurely marking Status: Completed while ACs are unchecked MUST fail --doctor
    const prematureComplete = fs
      .readFileSync(specAbsPath, 'utf8')
      .replace('> **Status:** `Approved`', '> **Status:** `Completed`');
    fs.writeFileSync(specAbsPath, prematureComplete, 'utf8');

    const doctorPremature = spawnSync(process.execPath, [CLI_PATH, '--doctor', projectDir], { encoding: 'utf8' });
    assert.equal(doctorPremature.status, 1);
    assert.match(doctorPremature.stdout, /Acceptance Criteria remain unchecked/i);

    // 7b. Check off all ACs -> Hash MUST STILL BE VALID (canonical hash ignores [x] vs [ ]) and Doctor passes 100%!
    const fullyVerified = fs
      .readFileSync(specAbsPath, 'utf8')
      .replace(/^- \[ \] \*\*AC-/gm, '- [x] **AC-');
    fs.writeFileSync(specAbsPath, fullyVerified, 'utf8');

    const doctorFinal = spawnSync(process.execPath, [CLI_PATH, '--doctor', projectDir], { encoding: 'utf8' });
    assert.equal(doctorFinal.status, 0);
    assert.match(doctorFinal.stdout.replace(/\x1b\[[0-9;]*m/g, ''), /0 warnings, 0 failed/);
  });

  test('Git Pre-commit Hook blocks un-spec’d changes in src/ and permits approved changes', () => {
    // 1. Initialize git repo and set git user config
    spawnSync('git', ['init'], { cwd: projectDir });
    spawnSync('git', ['config', 'user.email', 'test@nexuskit.dev'], { cwd: projectDir });
    spawnSync('git', ['config', 'user.name', 'Nexus Tester'], { cwd: projectDir });

    // 2. Scaffold with CLI and install hooks
    const initProc = spawnSync(process.execPath, [CLI_PATH, '.', '--with-hooks'], { cwd: projectDir, encoding: 'utf8' });
    assert.equal(initProc.status, 0);

    const hookFile = path.join(projectDir, '.git/hooks/pre-commit');
    assert.ok(fs.existsSync(hookFile));

    // 3. Stage changes outside src/ (e.g. README) -> Pre-commit hook allows immediately
    fs.writeFileSync(path.join(projectDir, 'README.md'), '# Updated Docs', 'utf8');
    spawnSync('git', ['add', 'README.md'], { cwd: projectDir });
    const commitDocs = spawnSync('git', ['commit', '-m', 'docs: update readme'], { cwd: projectDir, encoding: 'utf8' });
    assert.equal(commitDocs.status, 0);

    // 4. Stage vibe-coded file in src/ without spec -> Pre-commit hook MUST BLOCK
    fs.writeFileSync(path.join(projectDir, 'src/unauthorized.js'), 'export const bad = true;', 'utf8');
    spawnSync('git', ['add', 'src/unauthorized.js'], { cwd: projectDir });

    const commitVibe = spawnSync('git', ['commit', '-m', 'feat: unauthorized vibe code'], { cwd: projectDir, encoding: 'utf8' });
    assert.notEqual(commitVibe.status, 0, 'Commit should have been blocked by pre-commit hook');
    assert.match(commitVibe.stderr + commitVibe.stdout, /NEXUS-KIT HARD GATE VIOLATION/);

    // 5. Add a Draft spec -> Commit MUST STILL BE BLOCKED
    const draftSpec = `# SPEC-001: Authorized Feature\n\n> **Status:** \`Draft\`\n> **Version:** \`1.0.0\`\n> **Target Path:** \`src/unauthorized.js\`\n\n## 1. Overview\nValid feature.`;
    fs.writeFileSync(path.join(projectDir, '.specify/tasks/001-feature-spec.md'), draftSpec, 'utf8');

    const commitDraft = spawnSync('git', ['commit', '-m', 'feat: still draft'], { cwd: projectDir, encoding: 'utf8' });
    assert.notEqual(commitDraft.status, 0, 'Commit should be blocked when spec is Draft');
    assert.match(commitDraft.stderr + commitDraft.stdout, /NEXUS-KIT HARD GATE VIOLATION/);

    // 6. Approve the spec -> Pre-commit hook MUST SUCCEED
    const approveProc = spawnSync(process.execPath, [CLI_PATH, '--approve', '.specify/tasks/001-feature-spec.md'], { cwd: projectDir, encoding: 'utf8' });
    assert.equal(approveProc.status, 0);

    spawnSync('git', ['add', '.specify/tasks/001-feature-spec.md'], { cwd: projectDir });
    const commitApproved = spawnSync('git', ['commit', '-m', 'feat: properly specified feature'], { cwd: projectDir, encoding: 'utf8' });
    assert.equal(commitApproved.status, 0, `Commit failed: ${commitApproved.stderr}\n${commitApproved.stdout}`);
    assert.match(commitApproved.stdout + commitApproved.stderr, /Verified 1 staged file\(s\) across 1 approved spec/);

    // 7. Tamper with spec (requirement drift) -> Pre-commit hook MUST BLOCK
    fs.appendFileSync(path.join(projectDir, '.specify/tasks/001-feature-spec.md'), '\nExtra sneaky requirement\n');
    fs.writeFileSync(path.join(projectDir, 'src/unauthorized.js'), 'export const updated = true;', 'utf8');
    spawnSync('git', ['add', 'src/unauthorized.js'], { cwd: projectDir });

    const commitDrifted = spawnSync('git', ['commit', '-m', 'feat: should fail on drift'], { cwd: projectDir, encoding: 'utf8' });
    assert.notEqual(commitDrifted.status, 0, 'Commit should be blocked when spec is drifted');
    assert.match(commitDrifted.stderr + commitDrifted.stdout, /drift detected/i);

    // 8. Scoped Target Path Gate (AC-4):
    // Re-approve the spec so drift is cleared
    const reapprove = spawnSync(process.execPath, [CLI_PATH, '--approve', '.specify/tasks/001-feature-spec.md'], { cwd: projectDir, encoding: 'utf8' });
    assert.equal(reapprove.status, 0);
    spawnSync('git', ['add', '.specify/tasks/001-feature-spec.md'], { cwd: projectDir });

    // Stage an UNCOVERED file in src/ (spec only covers src/unauthorized.js, not src/secret_backdoor.js)
    fs.writeFileSync(path.join(projectDir, 'src/secret_backdoor.js'), 'export const backdoor = true;', 'utf8');
    spawnSync('git', ['add', 'src/secret_backdoor.js'], { cwd: projectDir });

    const commitUncovered = spawnSync('git', ['commit', '-m', 'feat: sneak uncovered file'], { cwd: projectDir, encoding: 'utf8' });
    assert.notEqual(commitUncovered.status, 0, 'Commit should be blocked when staged file in src/ is not covered by Target Path');
    assert.match(commitUncovered.stderr + commitUncovered.stdout, /NOT covered by any approved specification Target Path/i);
    assert.match(commitUncovered.stderr + commitUncovered.stdout, /src\/secret_backdoor\.js/);

    // Unstage the uncovered file -> Commit of covered file succeeds!
    spawnSync('git', ['rm', '--cached', 'src/secret_backdoor.js'], { cwd: projectDir });
    fs.rmSync(path.join(projectDir, 'src/secret_backdoor.js'));

    const commitScopedSuccess = spawnSync('git', ['commit', '-m', 'feat: scoped commit succeeds'], { cwd: projectDir, encoding: 'utf8' });
    assert.equal(commitScopedSuccess.status, 0, `Commit failed: ${commitScopedSuccess.stderr}\n${commitScopedSuccess.stdout}`);
    assert.match(commitScopedSuccess.stdout + commitScopedSuccess.stderr, /Verified 1 staged file/);
  });
});
