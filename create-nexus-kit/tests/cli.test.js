import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  VERSION,
  parseYamlFrontmatter,
  scaffoldProject,
  validateProject
} from '../lib/nexus.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.resolve(__dirname, '../bin/index.js');
const INSTALL_SH_PATH = path.resolve(__dirname, '../install.sh');

const stripAnsi = (str) => str.replace(/\x1b\[[0-9;]*m/g, '');

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-kit-test-'));
}

describe('parseYamlFrontmatter', () => {
  test('parses valid single-line and multiline YAML frontmatter', () => {
    const raw = `---\nname: sdd-planner\ndescription: >-\n  Generate specs\n  deterministically.\nalwaysApply: true\n---\n# Title\nBody text`;
    const result = parseYamlFrontmatter(raw);
    assert.equal(result.valid, true);
    assert.equal(result.data.name, 'sdd-planner');
    assert.equal(result.data.description, 'Generate specs deterministically.');
    assert.equal(result.data.alwaysApply, true);
    assert.ok(result.body.startsWith('# Title'));
  });

  test('fails on missing opening delimiter', () => {
    const result = parseYamlFrontmatter('name: test\n---\n# Title');
    assert.equal(result.valid, false);
    assert.match(result.error, /opening/i);
  });

  test('fails on missing closing delimiter', () => {
    const result = parseYamlFrontmatter('---\nname: test\n# Title');
    assert.equal(result.valid, false);
    assert.match(result.error, /closing/i);
  });
});

describe('scaffoldProject & Non-Overwrite Safety (P0)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('creates full structure including AGENTS.md and IDE adapters in empty dir', () => {
    const result = scaffoldProject(tmpDir, { projectName: 'my-app' });
    assert.equal(result.skipped.length, 0);
    assert.equal(result.overwritten.length, 0);
    assert.ok(result.created.includes('AGENTS.md'));
    assert.ok(result.created.includes('CLAUDE.md'));
    assert.ok(result.created.includes('.cursor/rules/nexus-kit.mdc'));
    assert.ok(result.created.includes('.github/copilot-instructions.md'));
    assert.ok(fs.existsSync(path.join(tmpDir, '.specify/templates/spec-template.md')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.agents/skills/sdd-verifier/SKILL.md')));
  });

  test('does NOT overwrite existing files by default and reports skipped files', () => {
    const customReadme = '# Existing Custom Project README\nDo not delete me!';
    const customClaude = '# Custom Claude Instructions';
    fs.writeFileSync(path.join(tmpDir, 'README.md'), customReadme, 'utf8');
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), customClaude, 'utf8');

    const proc = spawnSync(process.execPath, [CLI_PATH, '.'], {
      cwd: tmpDir,
      encoding: 'utf8'
    });

    assert.equal(proc.status, 0);
    assert.match(proc.stdout, /\[SKIPPED\].*README\.md/);
    assert.match(proc.stdout, /\[SKIPPED\].*CLAUDE\.md/);
    assert.match(proc.stdout, /--force/);
    assert.equal(fs.readFileSync(path.join(tmpDir, 'README.md'), 'utf8'), customReadme);
    assert.equal(fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8'), customClaude);
    // Missing files were still created safely
    assert.ok(fs.existsSync(path.join(tmpDir, 'AGENTS.md')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.specify/constitution.md')));
  });

  test('overwrites existing files when --force is passed', () => {
    const customReadme = '# Old Readme';
    fs.writeFileSync(path.join(tmpDir, 'README.md'), customReadme, 'utf8');

    const proc = spawnSync(process.execPath, [CLI_PATH, '.', '--force'], {
      cwd: tmpDir,
      encoding: 'utf8'
    });

    assert.equal(proc.status, 0);
    assert.match(proc.stdout, /\[OVERWRITTEN\].*README\.md/);
    assert.notEqual(fs.readFileSync(path.join(tmpDir, 'README.md'), 'utf8'), customReadme);
  });
});

describe('validateProject & CLI --doctor (P1)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('fresh scaffold passes with warnings for unconfigured TECH STACK and 0 specs', () => {
    scaffoldProject(tmpDir, { projectName: 'fresh-app' });
    const report = validateProject(tmpDir);
    assert.equal(report.failCount, 0);
    assert.equal(report.exitCode, 0);
    assert.equal(report.warnCount, 2);
  });

  test('fully configured project yields 0 failures and 0 warnings', () => {
    scaffoldProject(tmpDir, { projectName: 'prod-app' });
    const constPath = path.join(tmpDir, '.specify/constitution.md');
    const updatedConst = fs
      .readFileSync(constPath, 'utf8')
      .replace('[Người dùng sẽ cập nhật công nghệ cụ thể tại đây]', 'TypeScript + Node.js 20');
    fs.writeFileSync(constPath, updatedConst, 'utf8');

    const specPath = path.join(tmpDir, '.specify/tasks/001-init-spec.md');
    fs.writeFileSync(
      specPath,
      '# SPEC-001: Init\n\n> **Status:** `Draft`\n> **Version:** `1.0.0`\n\n- [ ] **AC-1**: Initial setup.\n',
      'utf8'
    );
    const approveProc = spawnSync(process.execPath, [CLI_PATH, '--approve', specPath], { encoding: 'utf8' });
    assert.equal(approveProc.status, 0);

    const proc = spawnSync(process.execPath, [CLI_PATH, '--doctor', tmpDir], { encoding: 'utf8' });
    assert.equal(proc.status, 0);
    assert.match(stripAnsi(proc.stdout), /10 passed, 0 warnings, 0 failed/);
  });

  test('fails when constitution.md lacks mandatory laws or skill chain is broken', () => {
    scaffoldProject(tmpDir, { projectName: 'broken-laws-app' });
    fs.writeFileSync(path.join(tmpDir, '.specify/constitution.md'), '# Loose rules only\n', 'utf8');
    fs.writeFileSync(
      path.join(tmpDir, '.agents/skills/sdd-coder/SKILL.md'),
      '---\nname: sdd-coder\ndescription: Missing chain references\n---\n## When to use\nAlways\n## Workflow\nJust write code.\n',
      'utf8'
    );

    const report = validateProject(tmpDir);
    assert.equal(report.exitCode, 1);
    assert.ok(report.results.some((r) => r.status === 'FAIL' && r.category === 'constitution'));
    assert.ok(report.results.some((r) => r.status === 'FAIL' && r.category === 'skill:sdd-coder' && r.message.includes('Broken workflow chain')));
  });

  test('fails with exit code 1 when mandatory files are missing', () => {
    const proc = spawnSync(process.execPath, [CLI_PATH, '--doctor', tmpDir], { encoding: 'utf8' });
    assert.equal(proc.status, 1);
    assert.match(proc.stdout, /\[FAIL\].*Missing \.specify\/constitution\.md/);
  });

  test('fails when SKILL.md has invalid YAML frontmatter or mismatched name', () => {
    scaffoldProject(tmpDir, { projectName: 'bad-skill-app' });
    fs.writeFileSync(
      path.join(tmpDir, '.agents/skills/sdd-planner/SKILL.md'),
      '---\nname: wrong-name\ndescription: Too short\n---\n## When to use\nTest\n## Workflow\n1. Do it\n',
      'utf8'
    );

    const report = validateProject(tmpDir);
    assert.equal(report.exitCode, 1);
    assert.ok(report.results.some((r) => r.status === 'FAIL' && r.message.includes("must match directory 'sdd-planner'")));
  });

  test('fails when SKILL.md is missing required Workflow section content', () => {
    scaffoldProject(tmpDir, { projectName: 'empty-section-app' });
    fs.writeFileSync(
      path.join(tmpDir, '.agents/skills/sdd-coder/SKILL.md'),
      '---\nname: sdd-coder\ndescription: Valid long description for coder skill\n---\n## When to use\nAlways\n',
      'utf8'
    );

    const report = validateProject(tmpDir);
    assert.equal(report.exitCode, 1);
    assert.ok(report.results.some((r) => r.status === 'FAIL' && r.message.includes('## Workflow')));
  });

  test('warns when IDE adapters lack cross-references or Cursor misses alwaysApply: true', () => {
    scaffoldProject(tmpDir, { projectName: 'bad-adapter-app' });
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), '# Empty Claude file without references', 'utf8');
    fs.writeFileSync(
      path.join(tmpDir, 'AGENTS.md'),
      '---\ntitle: invalid frontmatter\n---\n# AGENTS',
      'utf8'
    );
    fs.writeFileSync(
      path.join(tmpDir, '.cursor/rules/nexus-kit.mdc'),
      '---\ndescription: Missing alwaysApply\n---\n# Cursor rules',
      'utf8'
    );

    const report = validateProject(tmpDir);
    assert.ok(report.results.some((r) => r.status === 'WARN' && r.category === 'adapter:claude' && r.message.includes('cross-references')));
    assert.ok(report.results.some((r) => r.status === 'WARN' && r.category === 'adapter:agents' && r.message.includes('YAML frontmatter')));
    assert.ok(report.results.some((r) => r.status === 'WARN' && r.category === 'adapter:cursor' && r.message.includes('alwaysApply: true')));
  });
});

describe('install.sh parity & CLI flags', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('install.sh respects existing files unless --force is passed', () => {
    fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Existing User Docs', 'utf8');

    const run1 = spawnSync('bash', [INSTALL_SH_PATH, tmpDir], { encoding: 'utf8' });
    assert.equal(run1.status, 0);
    assert.equal(fs.readFileSync(path.join(tmpDir, 'README.md'), 'utf8'), '# Existing User Docs');
    assert.ok(fs.existsSync(path.join(tmpDir, 'AGENTS.md')));

    const run2 = spawnSync('bash', [INSTALL_SH_PATH, tmpDir, '--force'], { encoding: 'utf8' });
    assert.equal(run2.status, 0);
    assert.notEqual(fs.readFileSync(path.join(tmpDir, 'README.md'), 'utf8'), '# Existing User Docs');
  });

  test('--help and --version print expected output', () => {
    const helpOut = execFileSync(process.execPath, [CLI_PATH, '--help'], { encoding: 'utf8' });
    assert.match(helpOut, /--force/);
    assert.match(helpOut, /--doctor/);

    const verOut = execFileSync(process.execPath, [CLI_PATH, '--version'], { encoding: 'utf8' });
    assert.equal(verOut.trim(), `create-nexus-kit v${VERSION}`);
  });
});
