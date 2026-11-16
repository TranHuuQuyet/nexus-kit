import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  VERSION,
  PRESETS,
  resolvePreset,
  parseYamlFrontmatter,
  scaffoldProject,
  validateProject,
  installGitPreCommitHook,
  getTasksSummary,
  renderTasksBoard,
  approveSpec,
  extractSectionContent
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
    assert.ok(result.created.includes('.windsurfrules'));
    assert.ok(result.created.includes('.clinerules'));
    assert.ok(fs.existsSync(path.join(tmpDir, '.specify/templates/spec-template.md')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.agents/skills/sdd-verifier/SKILL.md')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.windsurfrules')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.clinerules')));
    const generatedReadme = fs.readFileSync(path.join(tmpDir, 'README.md'), 'utf8');
    assert.match(generatedReadme, /Getting Started/);
    assert.match(generatedReadme, /--approve/);
    assert.match(generatedReadme, /--doctor/);
    assert.match(generatedReadme, /Change Management/);
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
    assert.match(stripAnsi(proc.stdout), /12 passed, 0 warnings, 0 failed/);
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
    const bashReadme = fs.readFileSync(path.join(tmpDir, 'README.md'), 'utf8');
    assert.notEqual(bashReadme, '# Existing User Docs');
    assert.match(bashReadme, /Getting Started/);
    assert.match(bashReadme, /npx create-nexus-kit@latest --approve/);
    assert.ok(fs.existsSync(path.join(tmpDir, '.windsurfrules')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.clinerules')));
  });

  test('--help, --version, and package.json bin aliases are properly configured', () => {
    const helpOut = execFileSync(process.execPath, [CLI_PATH, '--help'], { encoding: 'utf8' });
    assert.match(helpOut, /--force/);
    assert.match(helpOut, /--doctor/);
    assert.match(helpOut, /init-hooks/);
    assert.match(helpOut, /--with-hooks/);
    assert.match(helpOut, /nexus-kit/);

    const verOut = execFileSync(process.execPath, [CLI_PATH, '--version'], { encoding: 'utf8' });
    assert.equal(verOut.trim(), `create-nexus-kit v${VERSION}`);

    const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));
    assert.equal(pkg.version, VERSION);
    assert.equal(pkg.bin['create-nexus-kit'], 'bin/index.js');
    assert.equal(pkg.bin['nexus-kit'], 'bin/index.js');
  });
});

describe('Git Hard Gates & Pre-commit Hook', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('installGitPreCommitHook fails gracefully on non-git directory', () => {
    const res = installGitPreCommitHook(tmpDir);
    assert.equal(res.success, false);
    assert.match(res.reason, /not a Git repository/i);
  });

  test('installGitPreCommitHook creates executable hook in git repository', () => {
    fs.mkdirSync(path.join(tmpDir, '.git'));
    const res = installGitPreCommitHook(tmpDir);
    assert.equal(res.success, true);
    assert.ok(fs.existsSync(res.hookPath));

    const content = fs.readFileSync(res.hookPath, 'utf8');
    assert.match(content, /NEXUS-KIT HARD GATE/);
    assert.match(content, /NO VIBE CODING/);

    // Second call without force skips
    const res2 = installGitPreCommitHook(tmpDir);
    assert.equal(res2.success, false);
    assert.match(res2.reason, /already exists/i);

    // Second call with force overwrites
    const res3 = installGitPreCommitHook(tmpDir, { force: true });
    assert.equal(res3.success, true);
    assert.equal(res3.overwritten, true);
  });

  test('CLI init-hooks installs pre-commit hook into git repo', () => {
    fs.mkdirSync(path.join(tmpDir, '.git'));
    const proc = spawnSync(process.execPath, [CLI_PATH, 'init-hooks', '.'], {
      cwd: tmpDir,
      encoding: 'utf8'
    });
    assert.equal(proc.status, 0);
    assert.match(proc.stdout, /Git hard gate is active/);
    assert.ok(fs.existsSync(path.join(tmpDir, '.git/hooks/pre-commit')));
  });

  test('scaffoldProject with --with-hooks initializes git hook if git is available', () => {
    fs.mkdirSync(path.join(tmpDir, '.git'));
    const result = scaffoldProject(tmpDir, { withHooks: true });
    assert.ok(result.hook);
    assert.equal(result.hook.success, true);
    assert.ok(fs.existsSync(path.join(tmpDir, '.git/hooks/pre-commit')));
  });
});

describe('Tech Stack Presets & Constitution', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('resolvePreset resolves canonical names and aliases', () => {
    assert.equal(resolvePreset('nextjs')?.id, 'nextjs');
    assert.equal(resolvePreset('next')?.id, 'nextjs');
    assert.equal(resolvePreset('fastapi')?.id, 'fastapi');
    assert.equal(resolvePreset('python')?.id, 'fastapi');
    assert.equal(resolvePreset('nestjs')?.id, 'nestjs');
    assert.equal(resolvePreset('nest')?.id, 'nestjs');
    assert.equal(resolvePreset('react')?.id, 'react');
    assert.equal(resolvePreset('vite')?.id, 'react');
    assert.equal(resolvePreset('node')?.id, 'node');
    assert.equal(resolvePreset('minimal')?.id, 'node');
    assert.equal(resolvePreset('unknown-stack'), null);
  });

  test('scaffoldProject applies preset to constitution.md and passes doctor with 0 warnings', () => {
    scaffoldProject(tmpDir, { preset: 'nextjs' });
    const content = fs.readFileSync(path.join(tmpDir, '.specify/constitution.md'), 'utf8');
    assert.match(content, /Next\.js 15 \(App Router\)/);
    assert.doesNotMatch(content, /Người dùng sẽ cập nhật/);

    const report = validateProject(tmpDir);
    assert.ok(report.results.some((r) => r.status === 'PASS' && r.message.includes('constitution.md is present and configured')));
  });

  test('CLI scaffolding handles valid preset and rejects unknown preset with exit 1', () => {
    // Valid preset
    const procValid = spawnSync(process.execPath, [CLI_PATH, tmpDir, '--preset', 'fastapi', '--force'], {
      encoding: 'utf8'
    });
    assert.equal(procValid.status, 0);
    assert.match(procValid.stdout, /\[PRESET\].*Configured.*Python FastAPI/);

    // Invalid preset
    const procInvalid = spawnSync(process.execPath, [CLI_PATH, tmpDir, '--preset', 'invalid-framework', '--force'], {
      encoding: 'utf8'
    });
    assert.equal(procInvalid.status, 1);
    assert.match(procInvalid.stderr, /Unknown preset "invalid-framework"/);
  });

  test('install.sh supports --preset flag', () => {
    const run = spawnSync('bash', [INSTALL_SH_PATH, tmpDir, '--preset', 'nestjs', '--force'], {
      encoding: 'utf8'
    });
    assert.equal(run.status, 0);
    const constContent = fs.readFileSync(path.join(tmpDir, '.specify/constitution.md'), 'utf8');
    assert.match(constContent, /NestJS 10/);
  });
});

describe('Terminal Status Board & Metrics', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('handles empty tasks folder gracefully', () => {
    scaffoldProject(tmpDir);
    const summary = getTasksSummary(tmpDir);
    assert.equal(summary.tasks.length, 0);
    assert.equal(summary.counts.total, 0);

    const boardText = renderTasksBoard(tmpDir);
    assert.match(boardText, /No specifications found/);
  });

  test('parses tasks, computes AC progress, detects drift, and exports JSON', () => {
    scaffoldProject(tmpDir);

    const spec1Path = path.join(tmpDir, '.specify/tasks/001-auth-spec.md');
    fs.writeFileSync(
      spec1Path,
      '# SPEC-001: JWT Authentication\n\n> **Status:** `Draft`\n> **Version:** `1.0.0`\n\n- [x] **AC-1**: Hash password\n- [ ] **AC-2**: Return JWT\n',
      'utf8'
    );

    const spec2Path = path.join(tmpDir, '.specify/tasks/002-payment-spec.md');
    fs.writeFileSync(
      spec2Path,
      '# SPEC-002: Stripe Checkout\n\n> **Status:** `Draft`\n> **Version:** `1.1.0`\n\n- [x] **AC-1**: Charge card\n- [x] **AC-2**: Webhook callback\n',
      'utf8'
    );

    // Approve spec2
    spawnSync(process.execPath, [CLI_PATH, '--approve', spec2Path], { encoding: 'utf8' });

    const summary = getTasksSummary(tmpDir);
    assert.equal(summary.tasks.length, 2);
    assert.equal(summary.counts.total, 2);
    assert.equal(summary.counts.approved, 1);
    assert.equal(summary.counts.draft, 1);

    const task1 = summary.tasks.find((t) => t.id === '001');
    assert.equal(task1.acTotal, 2);
    assert.equal(task1.acDone, 1);
    assert.equal(task1.progressPercent, 50);
    assert.equal(task1.hashStatus, 'UNAPPROVED');

    const task2 = summary.tasks.find((t) => t.id === '002');
    assert.equal(task2.acTotal, 2);
    assert.equal(task2.acDone, 2);
    assert.equal(task2.progressPercent, 100);
    assert.equal(task2.hashStatus, 'VALID');

    // Render board
    const table = renderTasksBoard(tmpDir);
    assert.match(table, /NEXUS KIT SPEC STATUS BOARD/);
    assert.match(table, /001/);
    assert.match(table, /50%/);
    assert.match(table, /002/);
    assert.match(table, /VALID/);

    // Render JSON
    const jsonOutput = renderTasksBoard(tmpDir, { json: true });
    const parsed = JSON.parse(jsonOutput);
    assert.equal(parsed.tasks.length, 2);
    assert.equal(parsed.counts.total, 2);

    // CLI board subcommand
    const cliBoard = spawnSync(process.execPath, [CLI_PATH, 'board', tmpDir], { encoding: 'utf8' });
    assert.equal(cliBoard.status, 0);
    assert.match(cliBoard.stdout, /STATUS BOARD/);

    // CLI board --json
    const cliJson = spawnSync(process.execPath, [CLI_PATH, 'board', tmpDir, '--json'], { encoding: 'utf8' });
    assert.equal(cliJson.status, 0);
    const cliParsed = JSON.parse(cliJson.stdout);
    assert.equal(cliParsed.tasks.length, 2);
  });
});

describe('Security Hardening, Path Boundaries & Parser Safety (v2.1.0)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('approveSpec rejects non-markdown file paths and non-spec filenames', () => {
    const jsonFile = path.join(tmpDir, 'data.json');
    fs.writeFileSync(jsonFile, '{"name": "test"}', 'utf8');

    assert.throws(
      () => approveSpec(jsonFile),
      /Target file must be a specification file/i
    );

    const txtFile = path.join(tmpDir, 'notes.txt');
    fs.writeFileSync(txtFile, 'hello', 'utf8');
    assert.throws(
      () => approveSpec(txtFile),
      /Target file must be a specification file/i
    );
  });

  test('approveSpec rejects files outside .specify/tasks/ directory (e.g. README.md or constitution.md)', () => {
    const readmeFile = path.join(tmpDir, 'README-spec.md');
    fs.writeFileSync(readmeFile, '# SPEC-001: Fake', 'utf8');

    assert.throws(
      () => approveSpec(readmeFile),
      /Specification must be located in \.specify\/tasks\/ directory/i
    );

    const specifyDir = path.join(tmpDir, '.specify');
    fs.mkdirSync(specifyDir, { recursive: true });
    const constFile = path.join(specifyDir, 'constitution.md');
    fs.writeFileSync(constFile, '# Core Constitution', 'utf8');

    assert.throws(
      () => approveSpec(constFile),
      /Target file must be a specification file/i
    );
  });

  test('approveSpec rejects spec file missing # SPEC-[ID]: [Title] heading', () => {
    const tasksDir = path.join(tmpDir, '.specify/tasks');
    fs.mkdirSync(tasksDir, { recursive: true });
    const invalidSpec = path.join(tasksDir, '001-invalid-spec.md');
    fs.writeFileSync(invalidSpec, 'Just some notes without spec heading', 'utf8');

    assert.throws(
      () => approveSpec(invalidSpec),
      /Invalid specification content: Missing "# SPEC-\[ID\]: \[Title\]" heading/i
    );
  });

  test('approveSpec succeeds for valid spec file inside .specify/tasks/', () => {
    const tasksDir = path.join(tmpDir, '.specify/tasks');
    fs.mkdirSync(tasksDir, { recursive: true });
    const validSpec = path.join(tasksDir, '001-auth-spec.md');
    fs.writeFileSync(validSpec, '# SPEC-001: Authentication Module\n\n> **Status:** `Draft`\n\nContent here.', 'utf8');

    const result = approveSpec(validSpec, { by: 'Human Lead' });
    assert.equal(result.status, 'Approved');
    assert.equal(result.approvedBy, 'Human Lead');
    assert.ok(result.hash.startsWith('sha256:'));

    const updated = fs.readFileSync(validSpec, 'utf8');
    assert.match(updated, /> \*\*Status:\*\* `Approved`/);
    assert.match(updated, /> \*\*Approved-Hash:\*\* `sha256:/);
  });

  test('extractSectionContent properly terminates on H1 and H2 headings', () => {
    const docWithH1 = `## Workflow\nLine 1\nLine 2\n# Overview\nLine 3`;
    const content = extractSectionContent(docWithH1, 'Workflow');
    assert.equal(content, 'Line 1\nLine 2');
  });
});
