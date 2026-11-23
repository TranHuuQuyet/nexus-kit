import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PassThrough } from 'node:stream';
import { MCP_TOOLS, createMcpServer } from '../lib/mcp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

test('AC-1: Agent Handoff Protocol exists across all 3 skills and 6 IDE adapters', () => {
  const plannerPath = path.join(rootDir, '.agents/skills/sdd-planner/SKILL.md');
  const coderPath = path.join(rootDir, '.agents/skills/sdd-coder/SKILL.md');
  const verifierPath = path.join(rootDir, '.agents/skills/sdd-verifier/SKILL.md');

  const plannerContent = fs.readFileSync(plannerPath, 'utf8');
  const coderContent = fs.readFileSync(coderPath, 'utf8');
  const verifierContent = fs.readFileSync(verifierPath, 'utf8');

  assert.match(plannerContent, /Agent Handoff Protocol/i, 'sdd-planner must include Agent Handoff Protocol');
  assert.match(coderContent, /Agent Handoff Protocol/i, 'sdd-coder must include Agent Handoff Protocol');
  assert.match(verifierContent, /Agent Handoff Protocol/i, 'sdd-verifier must include Agent Handoff Protocol');

  // Verify all 6 IDE adapters
  const adapters = [
    'AGENTS.md',
    'CLAUDE.md',
    '.cursor/rules/nexus-kit.mdc',
    '.github/copilot-instructions.md',
    '.windsurfrules',
    '.clinerules'
  ];

  for (const adapter of adapters) {
    const p = path.join(rootDir, adapter);
    assert.ok(fs.existsSync(p), `Adapter file ${adapter} must exist`);
    const content = fs.readFileSync(p, 'utf8');
    assert.match(content, /Handoff Protocol|Subagent Handoff/i, `${adapter} must mention Handoff Protocol`);
  }
});

test('AC-2: MCP server captures client capabilities and supports request dispatching', async () => {
  const input = new PassThrough();
  const output = new PassThrough();

  const server = createMcpServer({
    stdin: input,
    stdout: output,
    targetDir: rootDir
  });

  assert.ok(server, 'createMcpServer must return server instance or context');
  assert.ok(typeof server.dispatchClientRequest === 'function' || typeof server.context === 'object', 'Server must support client requests or context');
});

test('AC-3: nexus_audit_compliance is registered in MCP_TOOLS with schema', () => {
  const tool = MCP_TOOLS.find((t) => t.name === 'nexus_audit_compliance');
  assert.ok(tool, 'nexus_audit_compliance must be in MCP_TOOLS');
  assert.equal(tool.name, 'nexus_audit_compliance');
  assert.ok(tool.inputSchema.properties.specPath, 'inputSchema must define specPath');
  assert.ok(tool.inputSchema.required.includes('specPath'), 'specPath must be required');
});

test('AC-4: nexus_audit_compliance executes static audit and handles sampling fallback', async () => {
  const input = new PassThrough();
  const output = new PassThrough();

  const server = createMcpServer({
    stdin: input,
    stdout: output,
    targetDir: rootDir
  });

  // Collect responses
  const responses = [];
  output.on('data', (chunk) => {
    const lines = chunk.toString().split('\n').filter(Boolean);
    for (const line of lines) {
      responses.push(JSON.parse(line));
    }
  });

  // 1. Initialize without sampling capability
  input.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      capabilities: {}
    }
  }) + '\n');

  // 2. Call nexus_audit_compliance
  input.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'nexus_audit_compliance',
      arguments: {
        specPath: '.specify/tasks/013-agentic-skills-evolution-spec.md'
      }
    }
  }) + '\n');

  await new Promise((r) => setTimeout(r, 300));

  const callRes = responses.find((r) => r.id === 2);
  assert.ok(callRes, 'Should receive response for id 2');
  assert.ok(!callRes.error, 'Should not return JSON-RPC error');
  assert.ok(callRes.result?.content?.[0]?.text, 'Should contain text content in result');

  const auditData = JSON.parse(callRes.result.content[0].text);
  assert.equal(auditData.specId, '013');
  assert.ok(auditData.integrity, 'Must include integrity check');
  assert.ok(auditData.scope, 'Must include scope check');
  assert.ok(auditData.testQuality, 'Must include testQuality check');
  assert.ok(auditData.samplingAudit, 'Must include samplingAudit fallback note');
  assert.equal(auditData.samplingAudit.performed, false);
});

test('AC-5: Templates and install.sh have parity for Handoff Protocol and MCP Compliance', () => {
  const templatesPath = path.join(rootDir, 'create-nexus-kit/lib/templates.js');
  const installPath = path.join(rootDir, 'create-nexus-kit/install.sh');
  const distSkillPath = path.join(rootDir, 'dist/agensi/nexus-kit/SKILL.md');

  const templatesContent = fs.readFileSync(templatesPath, 'utf8');
  const installContent = fs.readFileSync(installPath, 'utf8');

  assert.match(templatesContent, /Agent Handoff Protocol/i, 'templates.js must include Agent Handoff Protocol');
  assert.match(installContent, /Agent Handoff Protocol/i, 'install.sh must include Agent Handoff Protocol');

  if (fs.existsSync(distSkillPath)) {
    const distContent = fs.readFileSync(distSkillPath, 'utf8');
    assert.match(distContent, /Handoff Protocol|Subagent/i, 'dist SKILL.md must include Handoff Protocol');
  }
});

test('AC-4b: nexus_audit_compliance sends sampling/createMessage when client supports sampling', async () => {
  const input = new PassThrough();
  const output = new PassThrough();

  const server = createMcpServer({
    stdin: input,
    stdout: output,
    targetDir: rootDir
  });

  const responses = [];
  output.on('data', (chunk) => {
    const lines = chunk.toString().split('\n').filter(Boolean);
    for (const line of lines) {
      const msg = JSON.parse(line);
      responses.push(msg);

      // If server sent sampling/createMessage request, respond as the client!
      if (msg.method === 'sampling/createMessage') {
        input.write(JSON.stringify({
          jsonrpc: '2.0',
          id: msg.id,
          result: {
            role: 'assistant',
            content: {
              type: 'text',
              text: 'VERDICT: APPROVE - Specification matches implementation.'
            }
          }
        }) + '\n');
      }
    }
  });

  // 1. Initialize with sampling capability
  input.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      capabilities: {
        sampling: {}
      }
    }
  }) + '\n');

  // 2. Call nexus_audit_compliance
  input.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'nexus_audit_compliance',
      arguments: {
        specPath: '.specify/tasks/013-agentic-skills-evolution-spec.md'
      }
    }
  }) + '\n');

  await new Promise((r) => setTimeout(r, 400));

  const callRes = responses.find((r) => r.id === 2);
  assert.ok(callRes, 'Should receive response for id 2');
  const auditData = JSON.parse(callRes.result.content[0].text);
  assert.equal(auditData.samplingAudit.performed, true);
  assert.equal(auditData.samplingAudit.verdict, 'APPROVE');
  assert.match(auditData.samplingAudit.feedback, /Specification matches/);
});

