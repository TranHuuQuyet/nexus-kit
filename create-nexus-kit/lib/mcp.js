import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { execSync } from 'node:child_process';
import {
  VERSION,
  TEMPLATES,
  validateProject,
  getTasksSummary,
  renderTasksBoard,
  computeSpecHash,
  parseSpecMetadata,
  approveSpec
} from './nexus.js';

export const MCP_PROTOCOL_VERSION = '2024-11-05';
export const MCP_SERVER_NAME = 'nexus-kit';

/**
 * Creates a slugified kebab-case string.
 */
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Helper to create a new task spec draft using the Spec Kit template.
 */
export function createSpecDraft({ id, title, author, targetPath, targetDir = process.cwd(), force = false }) {
  if (!id || !title) {
    throw new Error('Both "id" and "title" are required to create a task specification.');
  }

  if (String(id).includes('/') || String(id).includes('\\') || String(id).includes('..')) {
    throw new Error('Invalid spec id: Directory traversal detected.');
  }

  const rawId = String(id).trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!rawId) {
    throw new Error('Task "id" must contain at least one valid alphanumeric character.');
  }
  const cleanId = rawId.padStart(3, '0');
  const slug = slugify(title);
  if (!slug) {
    throw new Error('Task "title" must contain at least one valid alphanumeric character.');
  }

  const tasksDir = path.resolve(targetDir, '.specify/tasks');
  if (!fs.existsSync(tasksDir)) {
    fs.mkdirSync(tasksDir, { recursive: true });
  }

  const filename = `${cleanId}-${slug}-spec.md`;
  const filePath = path.join(tasksDir, filename);

  if (!filePath.startsWith(tasksDir + path.sep)) {
    throw new Error('Invalid spec path: Directory traversal detected.');
  }

  if (fs.existsSync(filePath) && !force) {
    throw new Error(`Specification file already exists: ${filename}. Pass force: true to overwrite.`);
  }

  const today = new Date().toISOString().split('T')[0];
  const authorName = author || 'sdd-planner';
  const resolvedTarget = targetPath || 'src/...';

  const content = TEMPLATES.specTemplate
    .replace('# [SPEC-ID]: [Feature Title]', `# SPEC-${cleanId}: ${title}`)
    .replace('> **Author:** [AI Agent / Engineer]', `> **Author:** \`${authorName}\``)
    .replace('> **Date:** [YYYY-MM-DD]', `> **Date:** ${today}`)
    .replace('> **Target Path:** `src/...`', `> **Target Path:** \`${resolvedTarget}\``);

  fs.writeFileSync(filePath, content, 'utf8');

  return {
    success: true,
    filePath,
    filename,
    id: cleanId,
    title,
    author: authorName,
    date: today
  };
}

/**
 * MCP Tools definitions exposed to AI Agents.
 */
export const MCP_TOOLS = [
  {
    name: 'nexus_check_constitution',
    description: 'Read and validate project constitution rules and tech stack constraints from .specify/constitution.md.',
    inputSchema: {
      type: 'object',
      properties: {
        targetDir: {
          type: 'string',
          description: 'Target project root directory (defaults to current working directory).'
        }
      }
    }
  },
  {
    name: 'nexus_get_specs',
    description: 'List all task specifications in .specify/tasks/ with statuses, versions, cryptographic integrity states, and Acceptance Criteria progress.',
    inputSchema: {
      type: 'object',
      properties: {
        targetDir: {
          type: 'string',
          description: 'Target project root directory (defaults to current working directory).'
        }
      }
    }
  },
  {
    name: 'nexus_verify_spec',
    description: 'Cryptographically verify the SHA-256 integrity hash of a specific specification file or all specs to prevent requirement drift.',
    inputSchema: {
      type: 'object',
      properties: {
        specPath: {
          type: 'string',
          description: 'Relative or absolute path to the spec markdown file (e.g. .specify/tasks/001-slugify-spec.md).'
        },
        targetDir: {
          type: 'string',
          description: 'Target project root directory if verifying all specs.'
        }
      }
    }
  },
  {
    name: 'nexus_doctor',
    description: 'Run comprehensive Nexus Kit integrity diagnostics across constitution, template, specs, skills, IDE adapters, and Git hooks.',
    inputSchema: {
      type: 'object',
      properties: {
        targetDir: {
          type: 'string',
          description: 'Target project root directory (defaults to current working directory).'
        }
      }
    }
  },
  {
    name: 'nexus_create_spec',
    description: 'Create a new task specification draft in .specify/tasks/ adhering to the official Spec Kit template.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Sequential task ID (e.g. "009").'
        },
        title: {
          type: 'string',
          description: 'Descriptive task title in Title Case.'
        },
        author: {
          type: 'string',
          description: 'Author name or agent role (default: "sdd-planner").'
        },
        targetPath: {
          type: 'string',
          description: 'Target implementation path (e.g. "src/auth/").'
        },
        targetDir: {
          type: 'string',
          description: 'Target project root directory.'
        },
        force: {
          type: 'boolean',
          description: 'Set to true to overwrite existing specification file if it exists (default: false).'
        }
      },
      required: ['id', 'title']
    }
  },
  {
    name: 'nexus_audit_compliance',
    description: 'Run comprehensive compliance audit on an approved spec against current git workspace, validating cryptographic hash integrity, git diff scope leaks, anti-fake test heuristics, and triggering MCP sampling for adversarial semantic review when supported.',
    inputSchema: {
      type: 'object',
      properties: {
        specPath: {
          type: 'string',
          description: 'Relative or absolute path to the target specification markdown file (e.g. .specify/tasks/013-agentic-skills-evolution-spec.md).'
        },
        targetDir: {
          type: 'string',
          description: 'Target project root directory (defaults to current working directory).'
        },
        enableSampling: {
          type: 'boolean',
          description: 'Whether to request MCP sampling from the host AI (default: true).'
        }
      },
      required: ['specPath']
    }
  }
];

/**
 * MCP Resources definitions.
 */
export const MCP_RESOURCES = [
  {
    uri: 'nexus://constitution',
    name: 'Project Constitution',
    description: 'Core engineering guidelines and tech stack constraints (.specify/constitution.md)',
    mimeType: 'text/markdown'
  },
  {
    uri: 'nexus://specs',
    name: 'Task Specifications Summary',
    description: 'Machine-readable JSON array of all project task specs, statuses, and AC completion',
    mimeType: 'application/json'
  },
  {
    uri: 'nexus://board',
    name: 'Status Board',
    description: 'Rendered ASCII status board displaying all tasks and progress bars',
    mimeType: 'text/plain'
  }
];

/**
 * MCP Prompts definitions.
 */
export const MCP_PROMPTS = [
  {
    name: 'sdd_plan',
    description: 'Guided instructions for the SDD Planning phase (sdd-planner).',
    arguments: [
      {
        name: 'featureTitle',
        description: 'Title or concept of the feature to plan',
        required: false
      }
    ]
  },
  {
    name: 'sdd_implement',
    description: 'Guided instructions for strict In-Scope implementation (sdd-coder).',
    arguments: [
      {
        name: 'specId',
        description: 'Task ID or path to the approved spec (e.g. "007" or ".specify/tasks/007-*.md")',
        required: true
      }
    ]
  },
  {
    name: 'sdd_verify',
    description: 'Guided instructions for Acceptance Criteria audit & sign-off (sdd-verifier).',
    arguments: [
      {
        name: 'specId',
        description: 'Task ID or path to the spec to verify',
        required: true
      }
    ]
  }
];

/**
 * Handles MCP tool calls.
 */
export async function handleToolCall(name, args = {}, context = {}) {
  const targetDir = args.targetDir ? path.resolve(args.targetDir) : context.targetDir || process.cwd();

  switch (name) {
    case 'nexus_check_constitution': {
      const constPath = path.join(targetDir, '.specify/constitution.md');
      if (!fs.existsSync(constPath)) {
        return {
          content: [{ type: 'text', text: `[FAIL] Constitution not found at ${constPath}. Run nexus-kit to initialize.` }],
          isError: true
        };
      }
      const raw = fs.readFileSync(constPath, 'utf8');
      const hasNoVibe = /NO VIBE CODING/i.test(raw);
      const isTechConfigured = !/\[Người dùng sẽ cập nhật công nghệ cụ thể tại đây\]/i.test(raw);

      const status = {
        exists: true,
        path: constPath,
        noVibeCodingEnforced: hasNoVibe,
        techStackConfigured: isTechConfigured,
        content: raw
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(status, null, 2) }]
      };
    }

    case 'nexus_get_specs': {
      const summary = getTasksSummary(targetDir);
      return {
        content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }]
      };
    }

    case 'nexus_verify_spec': {
      if (args.specPath) {
        const fullPath = path.isAbsolute(args.specPath) ? args.specPath : path.resolve(targetDir, args.specPath);
        if (!fs.existsSync(fullPath)) {
          return {
            content: [{ type: 'text', text: `[FAIL] Specification file not found: ${args.specPath}` }],
            isError: true
          };
        }
        const content = fs.readFileSync(fullPath, 'utf8');
        const meta = parseSpecMetadata(content);
        const currentHash = computeSpecHash(content);
        const status = meta.Status || 'Draft';
        const approvedHash = meta['Approved-Hash'];

        if (status === 'Draft' || status === 'In Review') {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'UNAPPROVED',
                  specStatus: status,
                  valid: false,
                  message: `Specification is currently in "${status}" state. Must be approved before coding.`,
                  computedHash: currentHash
                }, null, 2)
              }
            ],
            isError: false
          };
        }

        if (status === 'Approved' || status === 'Completed' || status === 'In Progress') {
          const isMatch = approvedHash === currentHash;
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: isMatch ? 'VALID' : 'DRIFTED',
                  specStatus: status,
                  valid: isMatch,
                  approvedHash,
                  computedHash: currentHash,
                  message: isMatch
                    ? 'Cryptographic integrity verified. Ready for implementation.'
                    : 'REQUIREMENT DRIFT DETECTED: Spec modified after approval without change management re-stamp.'
                }, null, 2)
              }
            ],
            isError: !isMatch
          };
        }

        return {
          content: [{ type: 'text', text: JSON.stringify({ status, valid: false, computedHash: currentHash }, null, 2) }]
        };
      }

      // Check all specs
      const summary = getTasksSummary(targetDir);
      return {
        content: [{ type: 'text', text: JSON.stringify({ counts: summary.counts, tasks: summary.tasks }, null, 2) }]
      };
    }

    case 'nexus_doctor': {
      const report = validateProject(targetDir);
      const passed = report.results.filter((r) => r.status === 'PASS').length;
      const warnings = report.results.filter((r) => r.status === 'WARN').length;
      const failures = report.results.filter((r) => r.status === 'FAIL').length;

      const output = {
        exitCode: report.exitCode,
        summary: { passed, warnings, failures },
        results: report.results
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        isError: report.exitCode !== 0
      };
    }

    case 'nexus_create_spec': {
      try {
        const result = createSpecDraft({
          id: args.id,
          title: args.title,
          author: args.author,
          targetPath: args.targetPath,
          targetDir,
          force: Boolean(args.force)
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `[ERROR] Failed to create spec: ${err.message}` }],
          isError: true
        };
      }
    }

    case 'nexus_audit_compliance': {
      if (!args.specPath) {
        return {
          content: [{ type: 'text', text: '[FAIL] "specPath" argument is required.' }],
          isError: true
        };
      }

      const fullPath = path.isAbsolute(args.specPath) ? args.specPath : path.resolve(targetDir, args.specPath);
      if (!fs.existsSync(fullPath)) {
        return {
          content: [{ type: 'text', text: `[FAIL] Specification file not found: ${args.specPath}` }],
          isError: true
        };
      }

      const rawContent = fs.readFileSync(fullPath, 'utf8');
      const meta = parseSpecMetadata(rawContent);
      const liveHash = computeSpecHash(rawContent);
      const approvedHash = meta['Approved-Hash'] || 'Pending';
      const specStatus = meta.Status || 'Draft';
      const isHashValid = approvedHash !== 'Pending' && approvedHash.toLowerCase() === liveHash.toLowerCase();

      // Extract spec ID from filename or title
      const baseName = path.basename(fullPath);
      const idMatch = baseName.match(/^(\d{3})/);
      const specId = idMatch ? idMatch[1] : 'unknown';

      // Target paths from metadata
      const targetPathRaw = meta['Target Path'] || meta['Target-Path'] || 'src/';
      const targetPaths = targetPathRaw
        .split(',')
        .map((p) => p.trim().replace(/[`']/g, ''))
        .filter(Boolean);

      // Scope check via git status
      const leaksDetected = [];
      const changedFiles = [];
      try {
        const gitStatus = execSync('git status --porcelain', { cwd: targetDir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        const lines = gitStatus.split('\n').filter(Boolean);
        for (const line of lines) {
          const filePath = line.substring(3).trim();
          changedFiles.push(filePath);
          const isAllowed = targetPaths.some((tp) => filePath.startsWith(tp)) ||
                            filePath.startsWith('.specify/') ||
                            filePath.startsWith('tests/') ||
                            filePath.startsWith('test/') ||
                            filePath === 'package.json';
          if (!isAllowed) {
            leaksDetected.push(filePath);
          }
        }
      } catch {
        // Non-git directory or git command unavailable
      }

      // Anti-fake test heuristic scan
      const testFilesFound = [];
      const emptyTestsDetected = [];
      const trivialAssertionsDetected = [];

      const scanDir = (dir) => {
        if (!fs.existsSync(dir)) return;
        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
              scanDir(full);
            } else if (entry.isFile() && (entry.name.endsWith('.test.js') || entry.name.endsWith('.spec.js') || entry.name.endsWith('.test.ts'))) {
              testFilesFound.push(path.relative(targetDir, full));
              const fileContent = fs.readFileSync(full, 'utf8');
              if (/\b(?:test|it)\s*\([^,]+,\s*(?:async\s*)?\(\s*\)\s*=>\s*\{\s*\}\s*\)/.test(fileContent)) {
                emptyTestsDetected.push(path.relative(targetDir, full));
              }
              if (/expect\s*\(\s*true\s*\)\s*\.to(?:Be|Equal)\s*\(\s*true\s*\)|assert\s*\.\s*(?:ok|equal)\s*\(\s*true\s*,\s*true\s*\)/.test(fileContent)) {
                trivialAssertionsDetected.push(path.relative(targetDir, full));
              }
            }
          }
        } catch {
          // Directory unreadable
        }
      };

      scanDir(path.join(targetDir, 'tests'));
      scanDir(path.join(targetDir, 'test'));

      // Sampling audit
      let samplingAudit = {
        performed: false,
        reason: 'Client does not support sampling'
      };

      const clientSupportsSampling = Boolean(context.clientCapabilities?.sampling);
      const shouldSample = clientSupportsSampling && args.enableSampling !== false && typeof context.dispatchClientRequest === 'function';

      if (shouldSample) {
        try {
          const sampleRes = await context.dispatchClientRequest('sampling/createMessage', {
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Audit compliance for Spec ${specId} (${baseName}). Target paths: ${targetPaths.join(', ')}. Changed files: ${changedFiles.join(', ')}. Return VERDICT: APPROVE or REJECT with concise rationale.`
                }
              }
            ],
            maxTokens: 500,
            systemPrompt: 'You are an adversarial AI auditor verifying that code strictly implements the approved specification without scope creep.'
          }, 20000);

          const sampledText = sampleRes?.content?.text || (Array.isArray(sampleRes?.content) ? sampleRes.content[0]?.text : null) || 'Sampling completed';
          const verdict = /REJECT/i.test(sampledText) ? 'REJECT' : 'APPROVE';
          samplingAudit = {
            performed: true,
            verdict,
            feedback: sampledText
          };
        } catch (sampleErr) {
          samplingAudit = {
            performed: false,
            reason: sampleErr.message || 'Sampling request failed'
          };
        }
      }

      const isScopeValid = leaksDetected.length === 0;
      const isTestValid = emptyTestsDetected.length === 0 && trivialAssertionsDetected.length === 0;
      let overallStatus = 'PASSED';
      if (!isHashValid || !isScopeValid || !isTestValid || (samplingAudit.performed && samplingAudit.verdict === 'REJECT')) {
        overallStatus = 'FAILED';
      }

      const result = {
        specId,
        specPath: args.specPath,
        overallStatus,
        integrity: {
          status: specStatus,
          approvedHash,
          liveHash,
          valid: isHashValid
        },
        scope: {
          targetPaths,
          changedFiles,
          leaksDetected,
          valid: isScopeValid
        },
        testQuality: {
          testFilesFound,
          emptyTestsDetected,
          trivialAssertionsDetected,
          valid: isTestValid
        },
        samplingAudit
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }

    case 'nexus_approve_spec': {
      return {
        content: [{
          type: 'text',
          text: '[FORBIDDEN] AI Self-Approval is prohibited by Nexus Kit Constitution. Specifications must be reviewed and approved by a human engineer via terminal CLI: `npx create-nexus-kit --approve <spec-file>`'
        }],
        isError: true
      };
    }

    default:
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true
      };
  }
}

/**
 * Handles MCP resource read requests.
 */
export function handleResourceRead(uri, context = {}) {
  const targetDir = context.targetDir || process.cwd();

  switch (uri) {
    case 'nexus://constitution': {
      const constPath = path.join(targetDir, '.specify/constitution.md');
      if (!fs.existsSync(constPath)) {
        throw new Error(`Constitution file not found at ${constPath}`);
      }
      return {
        contents: [
          {
            uri: 'nexus://constitution',
            mimeType: 'text/markdown',
            text: fs.readFileSync(constPath, 'utf8')
          }
        ]
      };
    }

    case 'nexus://specs': {
      const summary = getTasksSummary(targetDir);
      return {
        contents: [
          {
            uri: 'nexus://specs',
            mimeType: 'application/json',
            text: JSON.stringify(summary, null, 2)
          }
        ]
      };
    }

    case 'nexus://board': {
      const boardText = renderTasksBoard(targetDir);
      return {
        contents: [
          {
            uri: 'nexus://board',
            mimeType: 'text/plain',
            text: boardText
          }
        ]
      };
    }

    default:
      throw new Error(`Resource not found: ${uri}`);
  }
}

/**
 * Handles MCP prompt get requests.
 */
export function handlePromptGet(name, args = {}) {
  switch (name) {
    case 'sdd_plan': {
      const titleHint = args.featureTitle ? ` for feature: "${args.featureTitle}"` : '';
      return {
        description: 'Instructions for the SDD Planning phase',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `You are sdd-planner in Nexus Kit${titleHint}.\n\nFollow .agents/skills/sdd-planner/SKILL.md:\n1. Read .specify/constitution.md.\n2. Use .specify/templates/spec-template.md.\n3. Partition into strict In-Scope and Out-of-Scope boundaries.\n4. Define explicit Domain Models and Mermaid sequence diagrams.\n5. Enumerate Edge Cases and Acceptance Criteria.\n6. Save draft in .specify/tasks/ and require human approval before coding.\n7. Display the current Spec Status Board in your response (read nexus://board, run nexus-kit board, or render a Markdown table from .specify/tasks/).`
            }
          }
        ]
      };
    }

    case 'sdd_implement': {
      const specHint = args.specId || '<spec-id>';
      return {
        description: 'Instructions for the SDD Coding phase',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `You are sdd-coder in Nexus Kit implementing spec: ${specHint}.\n\nFollow .agents/skills/sdd-coder/SKILL.md:\n1. Verify spec status is Approved and cryptographic hash is VALID using nexus_verify_spec.\n2. Implement code strictly within In-Scope boundaries in src/.\n3. Handle every documented Edge Case.\n4. Write tests and run npm test to ensure 100% pass.\n5. Never vibe code!\n6. Display the updated Spec Status Board in your response (read nexus://board, run nexus-kit board, or render a Markdown table from .specify/tasks/).`
            }
          }
        ]
      };
    }

    case 'sdd_verify': {
      const specHint = args.specId || '<spec-id>';
      return {
        description: 'Instructions for the SDD Verification phase',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `You are sdd-verifier in Nexus Kit auditing spec: ${specHint}.\n\nFollow .agents/skills/sdd-verifier/SKILL.md:\n1. Verify spec hash integrity with nexus_verify_spec.\n2. Trace implementation against every single Acceptance Criteria.\n3. Run nexus_doctor and automated test suite.\n4. Mark ACs [x] and bump status to Completed only when 100% compliant.\n5. Conclude by displaying the live Spec Status Board in chat (read nexus://board, run nexus-kit board, or render a Markdown table from .specify/tasks/).`
            }
          }
        ]
      };
    }

    default:
      throw new Error(`Prompt not found: ${name}`);
  }
}

/**
 * Creates and starts a newline-delimited JSON-RPC 2.0 MCP server.
 */
export function createMcpServer(options = {}) {
  const stdin = options.stdin || process.stdin;
  const stdout = options.stdout || process.stdout;
  const targetDir = options.targetDir ? path.resolve(options.targetDir) : process.cwd();
  const context = { targetDir, clientCapabilities: {} };
  const pendingRequests = new Map();
  let nextRequestId = 1000;

  function dispatchClientRequest(method, params, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
      const reqId = nextRequestId++;
      const timer = setTimeout(() => {
        pendingRequests.delete(reqId);
        reject(new Error(`Client request timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      pendingRequests.set(reqId, {
        resolve: (val) => {
          clearTimeout(timer);
          resolve(val);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        }
      });

      const payload = JSON.stringify({ jsonrpc: '2.0', id: reqId, method, params });
      stdout.write(payload + '\n');
    });
  }

  context.dispatchClientRequest = dispatchClientRequest;

  const rl = readline.createInterface({
    input: stdin,
    terminal: false
  });

  const sendResponse = (id, result) => {
    const payload = JSON.stringify({ jsonrpc: '2.0', id, result });
    stdout.write(payload + '\n');
  };

  const sendError = (id, code, message, data) => {
    const errorObj = { code, message };
    if (data !== undefined) errorObj.data = data;
    const payload = JSON.stringify({ jsonrpc: '2.0', id: id ?? null, error: errorObj });
    stdout.write(payload + '\n');
  };

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let req;
    try {
      req = JSON.parse(trimmed);
    } catch (parseErr) {
      sendError(null, -32700, 'Parse error: Invalid JSON');
      return;
    }

    if (typeof req !== 'object' || req === null || req.jsonrpc !== '2.0') {
      sendError(req?.id ?? null, -32600, 'Invalid Request: Expected JSON-RPC 2.0 message');
      return;
    }

    // Intercept client responses to server-initiated requests
    if (req.id !== undefined && pendingRequests.has(req.id)) {
      const handler = pendingRequests.get(req.id);
      pendingRequests.delete(req.id);
      if (req.error) {
        handler.reject(new Error(req.error.message || 'Client request rejected'));
      } else {
        handler.resolve(req.result);
      }
      return;
    }

    // Handle notifications (no id)
    if (req.id === undefined) {
      // Notifications require no response (e.g. notifications/initialized)
      return;
    }

    const { id, method, params = {} } = req;

    try {
      switch (method) {
        case 'initialize': {
          context.clientCapabilities = params.capabilities || {};
          sendResponse(id, {
            protocolVersion: MCP_PROTOCOL_VERSION,
            serverInfo: {
              name: MCP_SERVER_NAME,
              version: VERSION
            },
            capabilities: {
              tools: {},
              resources: {},
              prompts: {}
            }
          });
          break;
        }

        case 'ping': {
          sendResponse(id, {});
          break;
        }

        case 'tools/list': {
          sendResponse(id, { tools: MCP_TOOLS });
          break;
        }

        case 'tools/call': {
          if (!params.name) {
            sendError(id, -32602, 'Invalid params: Missing "name" parameter for tools/call');
            break;
          }
          try {
            const result = await handleToolCall(params.name, params.arguments || {}, context);
            sendResponse(id, result);
          } catch (toolErr) {
            sendError(id, -32603, toolErr.message);
          }
          break;
        }

        case 'resources/list': {
          sendResponse(id, { resources: MCP_RESOURCES });
          break;
        }

        case 'resources/read': {
          if (!params.uri) {
            sendError(id, -32602, 'Invalid params: Missing "uri" parameter for resources/read');
            break;
          }
          try {
            const result = handleResourceRead(params.uri, context);
            sendResponse(id, result);
          } catch (resErr) {
            sendError(id, -32602, resErr.message);
          }
          break;
        }

        case 'prompts/list': {
          sendResponse(id, { prompts: MCP_PROMPTS });
          break;
        }

        case 'prompts/get': {
          if (!params.name) {
            sendError(id, -32602, 'Invalid params: Missing "name" parameter for prompts/get');
            break;
          }
          try {
            const result = handlePromptGet(params.name, params.arguments || {});
            sendResponse(id, result);
          } catch (promptErr) {
            sendError(id, -32602, promptErr.message);
          }
          break;
        }

        default: {
          sendError(id, -32601, `Method not found: ${method}`);
          break;
        }
      }
    } catch (err) {
      sendError(id, -32603, `Internal error: ${err.message}`);
    }
  });

  return {
    rl,
    context,
    dispatchClientRequest,
    close: () => rl.close()
  };
}

/**
 * Runs the MCP server in CLI mode over standard stdio streams.
 */
export function runMcpServer(options = {}) {
  const targetDir = options.targetDir || process.cwd();
  
  // Notice output on stderr so stdout is strictly JSON-RPC
  process.stderr.write(`[nexus-kit-mcp] Nexus Kit v${VERSION} MCP Server started on stdio.\n`);
  process.stderr.write(`[nexus-kit-mcp] Target Directory: ${path.resolve(targetDir)}\n`);

  const server = createMcpServer({
    stdin: process.stdin,
    stdout: process.stdout,
    targetDir
  });

  const cleanup = () => {
    server.close();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  return server;
}
