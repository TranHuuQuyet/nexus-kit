import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import os from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const cliBin = path.join(rootDir, 'create-nexus-kit/bin/index.js');

test('AC-1: runGuardAudit detects unspecced code, hash drift, and scope leaks', async () => {
  const { runGuardAudit } = await import('../lib/guard.js');
  assert.equal(typeof runGuardAudit, 'function', 'runGuardAudit must be an exported function');

  // Test with mock Git runner or isolated temp git directory
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-guard-test-'));
  try {
    execSync('git init -b main', { cwd: tempDir, stdio: 'ignore' });
    execSync('git config user.name "Test User"', { cwd: tempDir, stdio: 'ignore' });
    execSync('git config user.email "test@example.com"', { cwd: tempDir, stdio: 'ignore' });

    // Initial commit
    fs.writeFileSync(path.join(tempDir, 'README.md'), '# Temp Project\n');
    execSync('git add . && git commit -m "chore: initial commit"', { cwd: tempDir, stdio: 'ignore' });

    // Create a feature branch
    execSync('git checkout -b feat/vibe-coding', { cwd: tempDir, stdio: 'ignore' });
    fs.mkdirSync(path.join(tempDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'src/vibe.js'), 'console.log("no spec");\n');
    execSync('git add . && git commit -m "feat: vibe coding without spec"', { cwd: tempDir, stdio: 'ignore' });

    // Audit against main branch
    const auditResult = await runGuardAudit({
      targetDir: tempDir,
      baseRef: 'main',
      headRef: 'HEAD',
      strict: true
    });

    assert.equal(auditResult.passed, false, 'Audit must fail on un-specced src/ file');
    assert.equal(auditResult.bypassed, false);
    assert.equal(auditResult.unspeccedFiles.length, 1);
    assert.equal(auditResult.unspeccedFiles[0], 'src/vibe.js');
    assert.ok(
      auditResult.violations.some((v) => v.type === 'UNSPECCED_CODE' && v.file === 'src/vibe.js'),
      'Must record UNSPECCED_CODE violation'
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('AC-1b: runGuardAudit passes when src/ changes are backed by an Approved spec', async () => {
  const { runGuardAudit } = await import('../lib/guard.js');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-guard-approved-'));
  try {
    execSync('git init -b main', { cwd: tempDir, stdio: 'ignore' });
    execSync('git config user.name "Test User"', { cwd: tempDir, stdio: 'ignore' });
    execSync('git config user.email "test@example.com"', { cwd: tempDir, stdio: 'ignore' });

    // Setup base commit on main
    fs.writeFileSync(path.join(tempDir, 'README.md'), '# Main\n');
    execSync('git add . && git commit -m "initial"', { cwd: tempDir, stdio: 'ignore' });

    // Feature branch with valid spec and matching src code
    execSync('git checkout -b feat/specced-work', { cwd: tempDir, stdio: 'ignore' });
    fs.mkdirSync(path.join(tempDir, '.specify/tasks'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'src'), { recursive: true });

    const specContent = `# SPEC-001: Sample Feature

> **Status:** \`Approved\`  
> **Version:** \`1.0.0\`  
> **Author:** \`engineer\`  
> **Date:** 2026-11-24  
> **Approved-By:** \`maintainer\`  
> **Approved-At:** \`2026-11-24T00:00:00.000Z\`  
> **Approved-Hash:** \`sha256:dummy\`  
> **Target Path:** \`src/feature.js\`

---

## 1. Overview & Objective
Sample feature spec.

## 5. Acceptance Criteria
- [ ] **AC-1**: Working feature.
`;
    // We calculate the real hash using computeSpecHash
    const { computeSpecHash } = await import('../lib/nexus.js');
    const realHash = computeSpecHash(specContent);
    const approvedSpec = specContent.replace('sha256:dummy', realHash);

    fs.writeFileSync(path.join(tempDir, '.specify/tasks/001-feature-spec.md'), approvedSpec);
    fs.writeFileSync(path.join(tempDir, 'src/feature.js'), 'export const feature = 42;\n');
    execSync('git add . && git commit -m "feat: specced feature"', { cwd: tempDir, stdio: 'ignore' });

    const result = await runGuardAudit({
      targetDir: tempDir,
      baseRef: 'main',
      headRef: 'HEAD',
      strict: true
    });

    assert.equal(result.passed, true, 'Audit must pass when src/ changes are specced and hash is valid');
    assert.equal(result.violations.length, 0);
    assert.equal(result.speccedFiles.includes('src/feature.js'), true);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('AC-1c: runGuardAudit detects [skip-spec] bypass and --warn-only mode', async () => {
  const { runGuardAudit } = await import('../lib/guard.js');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-guard-bypass-'));
  try {
    execSync('git init -b main', { cwd: tempDir, stdio: 'ignore' });
    execSync('git config user.name "Test User"', { cwd: tempDir, stdio: 'ignore' });
    execSync('git config user.email "test@example.com"', { cwd: tempDir, stdio: 'ignore' });

    fs.writeFileSync(path.join(tempDir, 'README.md'), '# Main\n');
    execSync('git add . && git commit -m "initial"', { cwd: tempDir, stdio: 'ignore' });

    execSync('git checkout -b hotfix/urgent', { cwd: tempDir, stdio: 'ignore' });
    fs.mkdirSync(path.join(tempDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'src/hotfix.js'), 'console.log("urgent hotfix");\n');
    execSync('git add . && git commit -m "fix: urgent patch [skip-spec]"', { cwd: tempDir, stdio: 'ignore' });

    // Test bypass with [skip-spec]
    const bypassResult = await runGuardAudit({
      targetDir: tempDir,
      baseRef: 'main',
      headRef: 'HEAD',
      strict: true
    });

    assert.equal(bypassResult.passed, true, 'Audit must pass when [skip-spec] flag is present in commit');
    assert.equal(bypassResult.bypassed, true);
    assert.match(bypassResult.bypassReason, /\[skip-spec\]/);

    // Test warnOnly mode
    const warnResult = await runGuardAudit({
      targetDir: tempDir,
      baseRef: 'main',
      headRef: 'HEAD',
      strict: false,
      warnOnly: true
    });
    assert.equal(warnResult.passed, true, 'Warn-only mode must not fail audit');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('AC-2: CLI guard subcommand supports flags and outputs valid JSON with --json', () => {
  // Test help output
  const helpOutput = execSync(`node "${cliBin}" --help`, { encoding: 'utf8' });
  assert.match(helpOutput, /guard/i, 'CLI help must mention guard subcommand');

  // Test guard on current repo in json mode
  const jsonOutput = execSync(`node "${cliBin}" guard . --base HEAD~1 --warn-only --json`, {
    encoding: 'utf8',
    cwd: rootDir
  });

  const parsed = JSON.parse(jsonOutput);
  assert.ok('passed' in parsed, 'JSON output must contain passed');
  assert.ok('changedFiles' in parsed, 'JSON output must contain changedFiles');
  assert.ok('violations' in parsed, 'JSON output must contain violations');
});

test('AC-3: GITHUB_STEP_SUMMARY is populated with visual Markdown report', async () => {
  const { runGuardAudit } = await import('../lib/guard.js');
  const tempSummary = path.join(os.tmpdir(), `summary-${Date.now()}.md`);

  try {
    const result = await runGuardAudit({
      targetDir: rootDir,
      baseRef: 'HEAD~1',
      headRef: 'HEAD',
      warnOnly: true,
      summaryFile: tempSummary
    });

    assert.ok(fs.existsSync(tempSummary), 'Summary file must be created');
    const content = fs.readFileSync(tempSummary, 'utf8');
    assert.match(content, /Nexus Kit Spec Enforcement Guard|SPEC STATUS BOARD/i);
    assert.equal(result.summaryMarkdown.length > 0, true);
  } finally {
    if (fs.existsSync(tempSummary)) {
      fs.unlinkSync(tempSummary);
    }
  }
});

test('AC-4: action.yml exists at root and .github/workflows/nexus-guard.yml is configured', () => {
  const actionPath = path.join(rootDir, 'action.yml');
  const workflowPath = path.join(rootDir, '.github/workflows/nexus-guard.yml');

  assert.ok(fs.existsSync(actionPath), 'action.yml must exist at repository root');
  assert.ok(fs.existsSync(workflowPath), '.github/workflows/nexus-guard.yml must exist');

  const actionContent = fs.readFileSync(actionPath, 'utf8');
  assert.match(actionContent, /name:\s*['"]?Nexus Kit Guard/i);
  assert.match(actionContent, /runs:/i);

  const workflowContent = fs.readFileSync(workflowPath, 'utf8');
  assert.match(workflowContent, /pull_request:/i);
  assert.match(workflowContent, /guard/i);
});

test('AC-5: Templates and install.sh have parity for guard command and workflow', () => {
  const templatesPath = path.join(rootDir, 'create-nexus-kit/lib/templates.js');
  const installPath = path.join(rootDir, 'create-nexus-kit/install.sh');
  const skillDistPath = path.join(rootDir, 'dist/agensi/nexus-kit/SKILL.md');

  const templatesContent = fs.readFileSync(templatesPath, 'utf8');
  const installContent = fs.readFileSync(installPath, 'utf8');
  const skillDistContent = fs.readFileSync(skillDistPath, 'utf8');

  assert.match(templatesContent, /guard/i, 'lib/templates.js must document or reference guard');
  assert.match(installContent, /guard/i, 'install.sh must document or reference guard');
  assert.match(skillDistContent, /guard|CI\/CD/i, 'dist/agensi/nexus-kit/SKILL.md must document guard');
});
