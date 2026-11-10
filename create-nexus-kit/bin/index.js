#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import {
  VERSION,
  approveSpec,
  verifySpecForCoding,
  scaffoldProject,
  validateProject
} from '../lib/nexus.js';

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

const BANNER = `
${c.cyan}${c.bold}  _  _                     _  ___ _   
 | \\| |_____ ___  _ ___   | |/ (_) |_ 
 | .\` / -_) \\ / || (_-<   | ' <| |  _|
 |_|\\_\\___/_\\_\\\\_,_/__/   |_|\\_\\_|\\__|${c.reset}
${c.magenta}${c.bold}  Spec-Driven Development (SDD) for AI Agents${c.reset}
`;

function printHelp() {
  console.log(BANNER);
  console.log(`
${c.bold}Usage:${c.reset}
  npx create-nexus-kit@latest [project-name] [options]
  npx create-nexus-kit@latest --doctor [target-dir]
  npx create-nexus-kit@latest --approve <spec-file> [--by <reviewer>]
  npx create-nexus-kit@latest --verify-spec <spec-file>
  ${c.dim}(Or use the short command 'nexus-kit' after 'npm i -g create-nexus-kit')${c.reset}

${c.bold}Arguments:${c.reset}
  [project-name]     Name of the directory to create (default: nexus-kit-app)

${c.bold}Options:${c.reset}
  -f, --force             Overwrite existing files if they already exist
  --doctor, --check       Run full integrity & lifecycle validation on a project
  --approve <spec-file>   Approve a spec and stamp its canonical SHA-256 hash
  --by <name>             Reviewer name when using --approve
  --verify-spec <file>    Verify spec is Approved and not stale/modified since approval
  -h, --help              Show this help message
  -v, --version           Show version number

${c.bold}Examples:${c.reset}
  ${c.dim}$${c.reset} npx create-nexus-kit@latest my-awesome-app
  ${c.dim}$${c.reset} npx create-nexus-kit@latest . --force
  ${c.dim}$${c.reset} npx create-nexus-kit@latest --approve .specify/tasks/001-auth-spec.md
  ${c.dim}$${c.reset} npx create-nexus-kit@latest --verify-spec .specify/tasks/001-auth-spec.md
  ${c.dim}$${c.reset} npx create-nexus-kit@latest --doctor
`);
}

function runDoctor(targetDir) {
  console.log(BANNER);
  console.log(`${c.blue}ℹ${c.reset} Running Nexus Kit Integrity Validator at ${c.dim}${targetDir}${c.reset}\n`);

  const report = validateProject(targetDir);

  for (const item of report.results) {
    if (item.status === 'PASS') {
      console.log(`  ${c.green}[PASS]${c.reset} ${item.message}`);
    } else if (item.status === 'WARN') {
      console.log(`  ${c.yellow}[WARN]${c.reset} ${item.message}`);
    } else {
      console.log(`  ${c.red}[FAIL]${c.reset} ${item.message}`);
    }
  }

  console.log(`\n${c.bold}Summary:${c.reset} ${c.green}${report.passCount} passed${c.reset}, ${c.yellow}${report.warnCount} warnings${c.reset}, ${c.red}${report.failCount} failed${c.reset}\n`);

  if (report.failCount > 0) {
    console.log(`${c.red}${c.bold}✘ Integrity check failed:${c.reset} Resolve [FAIL] items above before proceeding.\n`);
  } else if (report.warnCount > 0) {
    console.log(`${c.yellow}${c.bold}! Integrity check passed with warnings:${c.reset} Core structure is valid; review [WARN] suggestions above.\n`);
  } else {
    console.log(`${c.green}${c.bold}✔ All integrity checks passed!${c.reset} Nexus Kit environment is healthy.\n`);
  }

  process.exit(report.exitCode);
}

function runApprove(specFileArg, approverName) {
  if (!specFileArg || specFileArg.startsWith('-')) {
    console.error(`${c.red}[FAIL]${c.reset} Please specify a spec file path: --approve <spec-file>`);
    process.exit(1);
  }

  const fullPath = path.resolve(process.cwd(), specFileArg);
  try {
    const res = approveSpec(fullPath, { by: approverName });
    console.log(BANNER);
    console.log(`${c.green}[PASS]${c.reset} Specification approved and stamped!`);
    console.log(`  ${c.dim}File:${c.reset}        ${res.specPath}`);
    console.log(`  ${c.dim}Status:${c.reset}      ${c.green}${res.status}${c.reset}`);
    console.log(`  ${c.dim}Approved-By:${c.reset} ${res.approvedBy}`);
    console.log(`  ${c.dim}Hash:${c.reset}        ${c.cyan}${res.hash}${c.reset}\n`);
    process.exit(0);
  } catch (err) {
    console.error(`${c.red}[FAIL]${c.reset} ${err.message}`);
    process.exit(1);
  }
}

function runVerifySpec(specFileArg) {
  if (!specFileArg || specFileArg.startsWith('-')) {
    console.error(`${c.red}[FAIL]${c.reset} Please specify a spec file path: --verify-spec <spec-file>`);
    process.exit(1);
  }

  const fullPath = path.resolve(process.cwd(), specFileArg);
  const res = verifySpecForCoding(fullPath);

  if (res.ready) {
    console.log(`${c.green}[PASS]${c.reset} Spec ready for sdd-coder (${res.metadata.Status}, ${res.hash})`);
    process.exit(0);
  } else {
    console.error(`${c.red}[FAIL]${c.reset} Spec blocked for coding: ${res.reason}`);
    process.exit(1);
  }
}

function run() {
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help')) {
    printHelp();
    process.exit(0);
  }

  if (args.includes('-v') || args.includes('--version')) {
    console.log(`create-nexus-kit v${VERSION}`);
    process.exit(0);
  }

  const approveIdx = args.indexOf('--approve');
  if (approveIdx !== -1) {
    const byIdx = args.indexOf('--by');
    const approver = byIdx !== -1 ? args[byIdx + 1] : undefined;
    runApprove(args[approveIdx + 1], approver);
    return;
  }

  const verifyIdx = args.indexOf('--verify-spec');
  if (verifyIdx !== -1) {
    runVerifySpec(args[verifyIdx + 1]);
    return;
  }

  const doctorIndex = args.findIndex((a) => a === '--doctor' || a === '--check');
  if (doctorIndex !== -1) {
    const nextArg = args[doctorIndex + 1];
    const target = nextArg && !nextArg.startsWith('-') ? path.resolve(process.cwd(), nextArg) : process.cwd();
    runDoctor(target);
    return;
  }

  const force = args.includes('-f') || args.includes('--force');
  const positionalArgs = args.filter((a) => !a.startsWith('-'));
  const rawName = positionalArgs[0] || 'nexus-kit-app';
  const isCurrentDir = rawName === '.';
  const projectDir = isCurrentDir ? process.cwd() : path.resolve(process.cwd(), rawName);
  const projectName = isCurrentDir ? path.basename(projectDir) : rawName;

  console.log(BANNER);
  console.log(`${c.blue}ℹ${c.reset} Initializing ${c.bold}${projectName}${c.reset} at ${c.dim}${projectDir}${c.reset}${force ? ` ${c.yellow}(--force)${c.reset}` : ''}\n`);

  const result = scaffoldProject(projectDir, { force, projectName });

  for (const relPath of result.created) {
    console.log(`  ${c.green}[CREATED]${c.reset}     ${relPath}`);
  }
  for (const relPath of result.overwritten) {
    console.log(`  ${c.yellow}[OVERWRITTEN]${c.reset} ${relPath}`);
  }
  for (const relPath of result.skipped) {
    console.log(`  ${c.dim}[SKIPPED]${c.reset}     ${relPath} ${c.dim}(already exists)${c.reset}`);
  }

  if (result.skipped.length > 0) {
    console.log(`\n${c.yellow}ℹ Skipped ${result.skipped.length} existing file(s) to protect your data.${c.reset}`);
    console.log(`  ${c.dim}Run with ${c.cyan}--force${c.dim} if you intentionally want to overwrite existing files.${c.reset}`);
  }

  console.log(`\n${c.green}${c.bold}✔ Success! Nexus Kit scaffolding completed.${c.reset}\n`);
  console.log(`${c.bold}Next steps:${c.reset}`);
  if (!isCurrentDir) {
    console.log(`  1. ${c.cyan}cd ${projectName}${c.reset}`);
    console.log(`  2. Open the project in your AI editor (Antigravity, Claude Code, Cursor, GitHub Copilot)`);
  } else {
    console.log(`  1. Open the project in your AI editor (Antigravity, Claude Code, Cursor, GitHub Copilot)`);
  }
  console.log(`  3. Update technology guidelines in ${c.cyan}.specify/constitution.md${c.reset}`);
  console.log(`  4. Approve specs with ${c.cyan}npx create-nexus-kit --approve <spec-file>${c.reset}`);
  console.log(`  5. Run ${c.cyan}npx create-nexus-kit --doctor${c.reset} anytime for full integrity checks\n`);
}

run();
