#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import { VERSION, scaffoldProject, validateProject } from '../lib/nexus.js';

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
  npx create-nexus-kit [project-name] [options]
  npx create-nexus-kit --doctor [target-dir]

${c.bold}Arguments:${c.reset}
  [project-name]     Name of the directory to create (default: nexus-kit-app)

${c.bold}Options:${c.reset}
  -f, --force        Overwrite existing files if they already exist
  --doctor, --check  Run deep validation checks on an existing Nexus Kit project
  -h, --help         Show this help message
  -v, --version      Show version number

${c.bold}Examples:${c.reset}
  ${c.dim}$${c.reset} npx create-nexus-kit my-awesome-app
  ${c.dim}$${c.reset} npx create-nexus-kit .
  ${c.dim}$${c.reset} npx create-nexus-kit . --force
  ${c.dim}$${c.reset} npx create-nexus-kit --doctor
`);
}

function runDoctor(targetDir) {
  console.log(BANNER);
  console.log(`${c.blue}ℹ${c.reset} Running Nexus Kit Validator at ${c.dim}${targetDir}${c.reset}\n`);

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
    console.log(`${c.red}${c.bold}✘ Validation failed:${c.reset} Resolve [FAIL] items above before proceeding.\n`);
  } else if (report.warnCount > 0) {
    console.log(`${c.yellow}${c.bold}! Validation passed with warnings:${c.reset} Core structure is valid; review [WARN] suggestions above.\n`);
  } else {
    console.log(`${c.green}${c.bold}✔ All checks passed!${c.reset} Nexus Kit environment is fully configured.\n`);
  }

  process.exit(report.exitCode);
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
  console.log(`  4. Run ${c.cyan}npx create-nexus-kit --doctor${c.reset} anytime to validate configuration`);
  console.log(`  5. Plan via ${c.yellow}sdd-planner${c.reset}, build via ${c.yellow}sdd-coder${c.reset}, and audit via ${c.yellow}sdd-verifier${c.reset}\n`);
}

run();
