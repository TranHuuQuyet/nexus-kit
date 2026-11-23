import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

import {
  VERSION,
  scaffoldProject,
  approveSpec
} from '../lib/nexus.js';
import {
  createMcpServer,
  createSpecDraft,
  MCP_TOOLS,
  MCP_RESOURCES,
  MCP_PROMPTS
} from '../lib/mcp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.resolve(__dirname, '../bin/index.js');

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-kit-mcp-test-'));
}

/**
 * Helper to communicate with an MCP server stream synchronously/asynchronously.
 */
function createRpcClient(stdin, stdout) {
  const rl = readline.createInterface({ input: stdout, terminal: false });
  const pendingRequests = new Map();

  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const res = JSON.parse(trimmed);
      if (res.id !== undefined && pendingRequests.has(res.id)) {
        const resolve = pendingRequests.get(res.id);
        pendingRequests.delete(res.id);
        resolve(res);
      }
    } catch (e) {
      // ignore non-json
    }
  });

  return {
    call: (method, params = {}, id = 1) => {
      return new Promise((resolve) => {
        pendingRequests.set(id, resolve);
        const req = JSON.stringify({ jsonrpc: '2.0', id, method, params });
        stdin.write(req + '\n');
      });
    },
    notify: (method, params = {}) => {
      const req = JSON.stringify({ jsonrpc: '2.0', method, params });
      stdin.write(req + '\n');
    },
    close: () => rl.close()
  };
}

describe('Model Context Protocol (MCP) Server', () => {
  let tmpDir;
  let stdin;
  let stdout;
  let server;
  let client;

  beforeEach(() => {
    tmpDir = createTempDir();
    scaffoldProject(tmpDir, { projectName: 'mcp-test-app', preset: 'node' });

    stdin = new PassThrough();
    stdout = new PassThrough();
    server = createMcpServer({ stdin, stdout, targetDir: tmpDir });
    client = createRpcClient(stdin, stdout);
  });

  afterEach(() => {
    try { client.close(); } catch {}
    try { server.close(); } catch {}
    stdin.destroy();
    stdout.destroy();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('handles initialize handshake and ping', async () => {
    const res = await client.call('initialize', {
      protocolVersion: '2024-11-05',
      clientInfo: { name: 'TestClient', version: '1.0.0' },
      capabilities: {}
    }, 1);

    assert.equal(res.id, 1);
    assert.equal(res.jsonrpc, '2.0');
    assert.equal(res.result.protocolVersion, '2024-11-05');
    assert.equal(res.result.serverInfo.name, 'nexus-kit');
    assert.equal(res.result.serverInfo.version, VERSION);
    assert.ok(res.result.capabilities.tools);
    assert.ok(res.result.capabilities.resources);
    assert.ok(res.result.capabilities.prompts);

    // Ping
    const pingRes = await client.call('ping', {}, 2);
    assert.equal(pingRes.id, 2);
    assert.deepEqual(pingRes.result, {});
  });

  test('lists all tools with schemas', async () => {
    const res = await client.call('tools/list', {}, 10);
    assert.equal(res.id, 10);
    assert.ok(Array.isArray(res.result.tools));
    assert.equal(res.result.tools.length, 6);

    const toolNames = res.result.tools.map((t) => t.name);
    assert.ok(toolNames.includes('nexus_check_constitution'));
    assert.ok(toolNames.includes('nexus_get_specs'));
    assert.ok(toolNames.includes('nexus_verify_spec'));
    assert.ok(toolNames.includes('nexus_doctor'));
    assert.ok(toolNames.includes('nexus_create_spec'));
    assert.ok(toolNames.includes('nexus_audit_compliance'));
    assert.equal(toolNames.includes('nexus_approve_spec'), false);
  });

  test('executes nexus_check_constitution tool', async () => {
    const res = await client.call('tools/call', {
      name: 'nexus_check_constitution',
      arguments: {}
    }, 20);

    assert.equal(res.id, 20);
    assert.ok(res.result.content);
    const parsed = JSON.parse(res.result.content[0].text);
    assert.equal(parsed.exists, true);
    assert.equal(parsed.noVibeCodingEnforced, true);
    assert.equal(parsed.techStackConfigured, true);
  });

  test('executes nexus_create_spec, anti-self-approval gate, and nexus_verify_spec lifecycle', async () => {
    // 1. Create a spec
    const createRes = await client.call('tools/call', {
      name: 'nexus_create_spec',
      arguments: {
        id: '010',
        title: 'User Profile Settings',
        author: 'ai-architect',
        targetPath: 'src/profile/'
      }
    }, 30);

    assert.equal(createRes.id, 30);
    const createData = JSON.parse(createRes.result.content[0].text);
    assert.equal(createData.success, true);
    assert.equal(createData.filename, '010-user-profile-settings-spec.md');
    assert.ok(fs.existsSync(createData.filePath));

    // 2. Verify status before approval (should be UNAPPROVED)
    const verifyDraftRes = await client.call('tools/call', {
      name: 'nexus_verify_spec',
      arguments: {
        specPath: createData.filePath
      }
    }, 31);

    const verifyDraft = JSON.parse(verifyDraftRes.result.content[0].text);
    assert.equal(verifyDraft.status, 'UNAPPROVED');
    assert.equal(verifyDraft.valid, false);

    // 3. AI calling nexus_approve_spec MUST FAIL (Anti-Self-Approval gate)
    const approveAiRes = await client.call('tools/call', {
      name: 'nexus_approve_spec',
      arguments: {
        specPath: createData.filePath,
        by: 'AI Bot'
      }
    }, 32);
    assert.equal(approveAiRes.result.isError, true);
    assert.match(approveAiRes.result.content[0].text, /AI Self-Approval is prohibited/i);

    // 4. Human approves spec via CLI / approveSpec
    const approveData = approveSpec(createData.filePath, { by: 'Alice Lead' });
    assert.equal(approveData.status, 'Approved');
    assert.equal(approveData.approvedBy, 'Alice Lead');
    assert.ok(approveData.hash.startsWith('sha256:'));

    // 5. Verify spec after approval (should be VALID)
    const verifyValidRes = await client.call('tools/call', {
      name: 'nexus_verify_spec',
      arguments: {
        specPath: createData.filePath
      }
    }, 33);

    const verifyValid = JSON.parse(verifyValidRes.result.content[0].text);
    assert.equal(verifyValid.status, 'VALID');
    assert.equal(verifyValid.valid, true);

    // 5. Simulate requirement drift (modify spec content)
    fs.appendFileSync(createData.filePath, '\n## 7. Sneaky Scope Creep\nUnapproved extra work\n');

    const verifyDriftRes = await client.call('tools/call', {
      name: 'nexus_verify_spec',
      arguments: {
        specPath: createData.filePath
      }
    }, 34);

    const verifyDrift = JSON.parse(verifyDriftRes.result.content[0].text);
    assert.equal(verifyDrift.status, 'DRIFTED');
    assert.equal(verifyDrift.valid, false);
    assert.equal(verifyDriftRes.result.isError, true);
  });

  test('executes nexus_doctor tool and returns diagnostic report', async () => {
    const res = await client.call('tools/call', {
      name: 'nexus_doctor',
      arguments: {}
    }, 40);

    assert.equal(res.id, 40);
    const parsed = JSON.parse(res.result.content[0].text);
    assert.equal(parsed.exitCode, 0);
    assert.ok(parsed.summary.passed >= 10);
    assert.equal(parsed.summary.failures, 0);
  });

  test('executes nexus_get_specs tool', async () => {
    // Add one spec
    createSpecDraft({
      id: '001',
      title: 'Auth Spec',
      targetDir: tmpDir
    });

    const res = await client.call('tools/call', {
      name: 'nexus_get_specs',
      arguments: {}
    }, 50);

    assert.equal(res.id, 50);
    const parsed = JSON.parse(res.result.content[0].text);
    assert.equal(parsed.counts.total, 1);
    assert.equal(parsed.tasks[0].id, '001');
  });

  test('lists and reads MCP resources', async () => {
    const listRes = await client.call('resources/list', {}, 60);
    assert.equal(listRes.id, 60);
    assert.equal(listRes.result.resources.length, 3);
    const uris = listRes.result.resources.map((r) => r.uri);
    assert.ok(uris.includes('nexus://constitution'));
    assert.ok(uris.includes('nexus://specs'));
    assert.ok(uris.includes('nexus://board'));

    // Read nexus://constitution
    const constRes = await client.call('resources/read', { uri: 'nexus://constitution' }, 61);
    assert.equal(constRes.id, 61);
    assert.equal(constRes.result.contents[0].uri, 'nexus://constitution');
    assert.match(constRes.result.contents[0].text, /NO VIBE CODING/);

    // Read nexus://board
    const boardRes = await client.call('resources/read', { uri: 'nexus://board' }, 62);
    assert.equal(boardRes.id, 62);
    assert.match(boardRes.result.contents[0].text, /NEXUS KIT SPEC STATUS BOARD/);
  });

  test('lists and gets MCP prompts', async () => {
    const listRes = await client.call('prompts/list', {}, 70);
    assert.equal(listRes.id, 70);
    const promptNames = listRes.result.prompts.map((p) => p.name);
    assert.ok(promptNames.includes('sdd_plan'));
    assert.ok(promptNames.includes('sdd_implement'));
    assert.ok(promptNames.includes('sdd_verify'));

    // Get sdd_plan
    const planRes = await client.call('prompts/get', { name: 'sdd_plan', arguments: { featureTitle: 'OAuth' } }, 71);
    assert.equal(planRes.id, 71);
    assert.match(planRes.result.messages[0].content.text, /OAuth/);
    assert.match(planRes.result.messages[0].content.text, /sdd-planner/);
    assert.match(planRes.result.messages[0].content.text, /nexus:\/\/board/);
    assert.match(planRes.result.messages[0].content.text, /nexus-kit board/);

    // Get sdd_implement
    const implRes = await client.call('prompts/get', { name: 'sdd_implement', arguments: { specId: '001' } }, 72);
    assert.equal(implRes.id, 72);
    assert.match(implRes.result.messages[0].content.text, /001/);
    assert.match(implRes.result.messages[0].content.text, /sdd-coder/);
    assert.match(implRes.result.messages[0].content.text, /nexus:\/\/board/);

    // Get sdd_verify
    const verifyRes = await client.call('prompts/get', { name: 'sdd_verify', arguments: { specId: '001' } }, 73);
    assert.equal(verifyRes.id, 73);
    assert.match(verifyRes.result.messages[0].content.text, /sdd-verifier/);
    assert.match(verifyRes.result.messages[0].content.text, /Spec Status Board/);
    assert.match(verifyRes.result.messages[0].content.text, /nexus:\/\/board/);
  });

  test('handles JSON-RPC protocol edge cases and errors gracefully', async () => {
    // 1. Unknown method
    const unknownRes = await client.call('non_existent_method', {}, 80);
    assert.equal(unknownRes.id, 80);
    assert.equal(unknownRes.error.code, -32601);
    assert.match(unknownRes.error.message, /Method not found/);

    // 2. Unknown tool
    const unknownTool = await client.call('tools/call', { name: 'fake_tool' }, 81);
    assert.equal(unknownTool.id, 81);
    assert.equal(unknownTool.result.isError, true);
    assert.match(unknownTool.result.content[0].text, /Unknown tool/);

    // 3. Unknown resource
    const unknownResUri = await client.call('resources/read', { uri: 'nexus://non-existent' }, 82);
    assert.equal(unknownResUri.id, 82);
    assert.equal(unknownResUri.error.code, -32602);
    assert.match(unknownResUri.error.message, /Resource not found/);

    // 4. Missing tool name
    const missingParam = await client.call('tools/call', {}, 83);
    assert.equal(missingParam.id, 83);
    assert.equal(missingParam.error.code, -32602);

    // 5. Malformed JSON input
    const badJsonPromise = new Promise((resolve) => {
      const tempRl = readline.createInterface({ input: stdout, terminal: false });
      tempRl.on('line', (line) => {
        try {
          const parsed = JSON.parse(line);
          if (parsed.error?.code === -32700) {
            tempRl.close();
            resolve(parsed);
          }
        } catch (e) {}
      });
      stdin.write('{ invalid json\n');
    });

    const badJsonRes = await badJsonPromise;
    assert.equal(badJsonRes.error.code, -32700);
    assert.match(badJsonRes.error.message, /Parse error/);
  });

  test('createSpecDraft non-overwrite protection and path traversal bounds', async () => {
    // 1. Path traversal attempt in ID
    assert.throws(
      () => createSpecDraft({ id: '../../hack', title: 'Malicious', targetDir: tmpDir }),
      /Directory traversal detected|must contain at least one/
    );

    // 2. Non-overwrite safety (AC-2)
    const draft1 = createSpecDraft({ id: '020', title: 'Payment Gateway', targetDir: tmpDir });
    assert.ok(fs.existsSync(draft1.filePath));

    // Calling again without force: true MUST THROW
    assert.throws(
      () => createSpecDraft({ id: '020', title: 'Payment Gateway', targetDir: tmpDir }),
      /Specification file already exists: 020-payment-gateway-spec.md\. Pass force: true to overwrite/
    );

    // Calling with force: true succeeds
    const draftForced = createSpecDraft({ id: '020', title: 'Payment Gateway', targetDir: tmpDir, force: true });
    assert.equal(draftForced.success, true);

    // 3. AI calling nexus_approve_spec is rejected with FORBIDDEN error
    const approveBad = await client.call('tools/call', {
      name: 'nexus_approve_spec',
      arguments: { specPath: draft1.filePath }
    }, 90);

    assert.equal(approveBad.id, 90);
    assert.equal(approveBad.result.isError, true);
    assert.match(approveBad.result.content[0].text, /AI Self-Approval is prohibited/i);

    // 4. MCP nexus_create_spec rejects duplicate without force and succeeds with force: true
    const mcpDupRes = await client.call('tools/call', {
      name: 'nexus_create_spec',
      arguments: { id: '020', title: 'Payment Gateway' }
    }, 91);
    assert.equal(mcpDupRes.result.isError, true);
    assert.match(mcpDupRes.result.content[0].text, /already exists/i);

    const mcpForceRes = await client.call('tools/call', {
      name: 'nexus_create_spec',
      arguments: { id: '020', title: 'Payment Gateway', force: true }
    }, 92);
    assert.ok(!mcpForceRes.result.isError);
    const mcpForceData = JSON.parse(mcpForceRes.result.content[0].text);
    assert.equal(mcpForceData.success, true);
  });

  test('nexus_verify_spec validates In Progress specs consistently with CLI (v2.1.1)', async () => {
    const draft = createSpecDraft({ id: '030', title: 'In Progress Feature', targetDir: tmpDir });
    approveSpec(draft.filePath, { by: 'Lead' });

    // Transition status to In Progress
    const updated = fs.readFileSync(draft.filePath, 'utf8').replace('> **Status:** `Approved`', '> **Status:** `In Progress`');
    fs.writeFileSync(draft.filePath, updated, 'utf8');

    const verifyValidRes = await client.call('tools/call', {
      name: 'nexus_verify_spec',
      arguments: { specPath: draft.filePath }
    }, 95);
    const verifyValid = JSON.parse(verifyValidRes.result.content[0].text);
    assert.equal(verifyValid.status, 'VALID');
    assert.equal(verifyValid.specStatus, 'In Progress');
    assert.equal(verifyValid.valid, true);
    assert.equal(verifyValidRes.result.isError, false);

    // Tamper while In Progress -> DRIFTED
    fs.appendFileSync(draft.filePath, '\nUnapproved change during implementation\n');
    const verifyDriftRes = await client.call('tools/call', {
      name: 'nexus_verify_spec',
      arguments: { specPath: draft.filePath }
    }, 96);
    const verifyDrift = JSON.parse(verifyDriftRes.result.content[0].text);
    assert.equal(verifyDrift.status, 'DRIFTED');
    assert.equal(verifyDrift.valid, false);
    assert.equal(verifyDriftRes.result.isError, true);
  });
});

describe('CLI mcp subcommand', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
    scaffoldProject(tmpDir, { projectName: 'cli-mcp-app', preset: 'minimal' });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('boots via CLI and communicates over real stdio process', (t, done) => {
    const child = spawn(process.execPath, [CLI_PATH, 'mcp', tmpDir], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const rl = readline.createInterface({ input: child.stdout, terminal: false });
    const timer = setTimeout(() => {
      rl.close();
      child.kill('SIGKILL');
      done(new Error('MCP stdio process timed out after 5000ms'));
    }, 5000);

    rl.on('line', (line) => {
      clearTimeout(timer);
      const res = JSON.parse(line);
      assert.equal(res.id, 999);
      assert.equal(res.result.protocolVersion, '2024-11-05');
      assert.equal(res.result.serverInfo.name, 'nexus-kit');
      assert.equal(res.result.serverInfo.version, VERSION);

      rl.close();
      child.kill('SIGTERM');
      done();
    });

    const initReq = JSON.stringify({
      jsonrpc: '2.0',
      id: 999,
      method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {} }
    }) + '\n';

    child.stdin.write(initReq);
  });
});
