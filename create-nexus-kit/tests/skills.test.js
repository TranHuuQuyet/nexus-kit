import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

test('AC-1: sdd-planner and templates have Socratic Probing and Pre-flight checks', () => {
  const plannerPath = path.join(rootDir, '.agents/skills/sdd-planner/SKILL.md');
  const plannerContent = fs.readFileSync(plannerPath, 'utf8');

  // Verify Socratic probing rules
  assert.match(plannerContent, /Socratic/i, 'Planner must mention Socratic probing');
  assert.match(plannerContent, /\[Option A/i, 'Planner must provide concrete option patterns');
  assert.match(plannerContent, /Pre-flight/i, 'Planner must include pre-flight codebase audit');

  // Verify templates.js parity
  const templatesPath = path.join(rootDir, 'create-nexus-kit/lib/templates.js');
  const templatesContent = fs.readFileSync(templatesPath, 'utf8');
  assert.match(templatesContent, /Socratic/i, 'templates.js must include Socratic probing in plannerSkill');

  // Verify install.sh parity
  const installPath = path.join(rootDir, 'create-nexus-kit/install.sh');
  const installContent = fs.readFileSync(installPath, 'utf8');
  assert.match(installContent, /Socratic/i, 'install.sh must include Socratic probing in embedded planner');
});

test('AC-2: spec-template.md and templates have Non-Functional Requirements (NFRs)', () => {
  const specTemplatePath = path.join(rootDir, '.specify/templates/spec-template.md');
  const specContent = fs.readFileSync(specTemplatePath, 'utf8');

  assert.match(specContent, /Non-Functional Requirements \(NFRs\)/i, 'spec-template.md must include NFR section');
  assert.match(specContent, /Performance Budget/i, 'spec-template.md must include Performance Budget');
  assert.match(specContent, /Security & Privacy/i, 'spec-template.md must include Security & Privacy');
  assert.match(specContent, /Backward Compatibility/i, 'spec-template.md must include Backward Compatibility');

  // Verify templates.js parity
  const templatesPath = path.join(rootDir, 'create-nexus-kit/lib/templates.js');
  const templatesContent = fs.readFileSync(templatesPath, 'utf8');
  assert.match(templatesContent, /Non-Functional Requirements \(NFRs\)/i, 'templates.js must include NFRs in specTemplate');

  // Verify install.sh parity
  const installPath = path.join(rootDir, 'create-nexus-kit/install.sh');
  const installContent = fs.readFileSync(installPath, 'utf8');
  assert.match(installContent, /Non-Functional Requirements \(NFRs\)/i, 'install.sh must include NFRs in embedded specTemplate');
});

test('AC-3: sdd-coder enforces TDD Red-Green-Refactor Loop and Bounded Self-Healing', () => {
  const coderPath = path.join(rootDir, '.agents/skills/sdd-coder/SKILL.md');
  const coderContent = fs.readFileSync(coderPath, 'utf8');

  assert.match(coderContent, /TDD Red-Green-Refactor/i, 'Coder must enforce TDD Red-Green loop');
  assert.match(coderContent, /Red Phase/i, 'Coder must define Red phase (test first)');
  assert.match(coderContent, /Green Phase/i, 'Coder must define Green phase (minimal code)');
  assert.match(coderContent, /Bounded Self-Healing/i, 'Coder must enforce bounded self-healing');
  assert.match(coderContent, /3/i, 'Coder must limit self-healing iterations to 3');

  // Verify templates.js parity
  const templatesPath = path.join(rootDir, 'create-nexus-kit/lib/templates.js');
  const templatesContent = fs.readFileSync(templatesPath, 'utf8');
  assert.match(templatesContent, /TDD Red-Green-Refactor/i, 'templates.js must include TDD in coderSkill');

  // Verify install.sh parity
  const installPath = path.join(rootDir, 'create-nexus-kit/install.sh');
  const installContent = fs.readFileSync(installPath, 'utf8');
  assert.match(installContent, /TDD Red-Green-Refactor/i, 'install.sh must include TDD in embedded coder');
});

test('AC-4: sdd-verifier enforces Anti-Fake Test and Git Diff Scope Leak Checks', () => {
  const verifierPath = path.join(rootDir, '.agents/skills/sdd-verifier/SKILL.md');
  const verifierContent = fs.readFileSync(verifierPath, 'utf8');

  assert.match(verifierContent, /Anti-Fake Test/i, 'Verifier must include anti-fake test audit');
  assert.match(verifierContent, /Scope & Dependency Leak/i, 'Verifier must include scope leak check');

  // Verify templates.js parity
  const templatesPath = path.join(rootDir, 'create-nexus-kit/lib/templates.js');
  const templatesContent = fs.readFileSync(templatesPath, 'utf8');
  assert.match(templatesContent, /Anti-Fake Test/i, 'templates.js must include anti-fake in verifierSkill');

  // Verify install.sh parity
  const installPath = path.join(rootDir, 'create-nexus-kit/install.sh');
  const installContent = fs.readFileSync(installPath, 'utf8');
  assert.match(installContent, /Anti-Fake Test/i, 'install.sh must include anti-fake in embedded verifier');
});

test('AC-5: dist/agensi/nexus-kit/SKILL.md is updated with TDD, NFR and Anti-Fake test audit', () => {
  const distSkillPath = path.join(rootDir, 'dist/agensi/nexus-kit/SKILL.md');
  if (fs.existsSync(distSkillPath)) {
    const distContent = fs.readFileSync(distSkillPath, 'utf8');
    assert.match(distContent, /TDD/i, 'dist SKILL.md must include TDD');
    assert.match(distContent, /Non-Functional Requirements|NFR/i, 'dist SKILL.md must include NFRs');
    assert.match(distContent, /Anti-Fake/i, 'dist SKILL.md must include Anti-Fake test check');
  }
});
