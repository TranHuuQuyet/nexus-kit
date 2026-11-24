/**
 * Nexus Kit — Enterprise CI/CD Spec Enforcement Gate (nexus-guard)
 * Enforces Spec-Driven Development (SDD) gates on Git pull requests,
 * preventing Vibe Coding, Hash Drift, and Scope Leaks.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { computeSpecHash, parseSpecMetadata, getTasksSummary } from './nexus.js';

/**
 * Executes full CI/CD spec enforcement audit on a git repository.
 *
 * @param {Object} options
 * @param {string} [options.targetDir] - Project root directory (defaults to cwd)
 * @param {string} [options.baseRef] - Git base branch/ref to diff against
 * @param {string} [options.headRef] - Git head ref (defaults to HEAD)
 * @param {boolean} [options.strict=true] - Exit with code 1 if violations found
 * @param {boolean} [options.warnOnly=false] - Only warn, never fail
 * @param {boolean} [options.json=false] - Output JSON to stdout
 * @param {string} [options.summaryFile] - File path to write Markdown summary (e.g. GITHUB_STEP_SUMMARY)
 * @param {boolean} [options.commentPr=false] - Post/update sticky comment on PR
 * @param {string} [options.githubToken] - GitHub API token
 * @returns {Promise<Object>} GuardResult
 */
export async function runGuardAudit(options = {}) {
  const targetDir = path.resolve(options.targetDir || process.cwd());
  const strict = options.strict !== false && !options.warnOnly;
  const warnOnly = Boolean(options.warnOnly);
  const headRef = options.headRef || 'HEAD';
  const summaryFile = options.summaryFile || process.env.GITHUB_STEP_SUMMARY;
  const commentPr = Boolean(options.commentPr);
  const githubToken = options.githubToken || process.env.GITHUB_TOKEN;

  // 1. Verify Git Repository
  let isGitRepo = false;
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd: targetDir, stdio: 'pipe' });
    isGitRepo = true;
  } catch {
    isGitRepo = false;
  }

  if (!isGitRepo) {
    const md = '### ⚠️ Nexus Kit Spec Enforcement Guard\n\nWorkspace is not a Git repository. Guard check skipped.\n';
    return {
      passed: true,
      bypassed: false,
      bypassReason: '',
      baseRef: '',
      headRef,
      totalChangedFiles: 0,
      changedFiles: [],
      speccedFiles: [],
      unspeccedFiles: [],
      activeSpecs: [],
      violations: [],
      summaryMarkdown: md
    };
  }

  // 2. Resolve Base Ref
  let resolvedBase = options.baseRef || process.env.GITHUB_BASE_REF || 'origin/main';
  try {
    execSync(`git rev-parse --verify "${resolvedBase}"`, { cwd: targetDir, stdio: 'pipe' });
  } catch {
    try {
      execSync('git rev-parse --verify main', { cwd: targetDir, stdio: 'pipe' });
      resolvedBase = 'main';
    } catch {
      try {
        execSync('git rev-parse --verify HEAD~1', { cwd: targetDir, stdio: 'pipe' });
        resolvedBase = 'HEAD~1';
      } catch {
        resolvedBase = '';
      }
    }
  }

  // 3. Check for [skip-spec] bypass in commit messages
  let bypassed = false;
  let bypassReason = '';
  try {
    const logCmd = resolvedBase
      ? `git log "${resolvedBase}..${headRef}" --oneline`
      : `git log -n 5 --oneline`;
    const commitLogs = execSync(logCmd, { cwd: targetDir, encoding: 'utf8' });
    if (/\[skip-spec\]/i.test(commitLogs)) {
      bypassed = true;
      bypassReason = 'Commit log contains [skip-spec] directive';
    }
  } catch {
    // ignore
  }

  // 4. Collect changed files from git diff
  let changedFiles = [];
  if (resolvedBase) {
    try {
      const diffOut = execSync(`git diff --name-only "${resolvedBase}...${headRef}"`, {
        cwd: targetDir,
        encoding: 'utf8'
      });
      changedFiles = diffOut.split('\n').map((f) => f.trim()).filter(Boolean);
    } catch {
      try {
        const diffOut = execSync(`git diff --name-only "${resolvedBase}" "${headRef}"`, {
          cwd: targetDir,
          encoding: 'utf8'
        });
        changedFiles = diffOut.split('\n').map((f) => f.trim()).filter(Boolean);
      } catch {
        changedFiles = [];
      }
    }
  } else {
    try {
      const statusOut = execSync('git status --porcelain', { cwd: targetDir, encoding: 'utf8' });
      changedFiles = statusOut
        .split('\n')
        .map((l) => l.slice(3).trim())
        .filter(Boolean);
    } catch {
      changedFiles = [];
    }
  }

  // 5. Load and index all specifications
  const tasksDir = path.join(targetDir, '.specify/tasks');
  const allSpecs = [];
  if (fs.existsSync(tasksDir)) {
    const specFiles = fs.readdirSync(tasksDir).filter((f) => f.endsWith('-spec.md') || f.endsWith('.spec.md'));
    for (const f of specFiles) {
      const fullPath = path.join(tasksDir, f);
      const content = fs.readFileSync(fullPath, 'utf8');
      const meta = parseSpecMetadata(content);
      const computedHash = computeSpecHash(content);
      const approvedHash = meta['Approved-Hash'] || '';
      const status = meta['Status'] || 'Draft';
      const rawTargetPaths = meta['Target Path'] || '';
      const targetPaths = rawTargetPaths
        .split(',')
        .map((p) => p.trim().replace(/^`+|`+$/g, ''))
        .filter(Boolean);

      let integrity = 'UNAPPROVED';
      if (status === 'Approved' || status === 'Completed' || status === 'In Progress') {
        integrity = approvedHash && approvedHash === computedHash ? 'VALID' : 'DRIFT';
      }

      allSpecs.push({
        id: f.replace(/-spec\.md$|\.spec\.md$/, ''),
        file: f,
        fullPath,
        status,
        approvedHash,
        computedHash,
        integrity,
        targetPaths
      });
    }
  }

  // Path categorization helpers
  const isGuardedPath = (file) => {
    return (
      file.startsWith('src/') ||
      file.startsWith('lib/') ||
      file.startsWith('create-nexus-kit/lib/')
    );
  };

  const matchesTargetPath = (file, targetPaths) => {
    return targetPaths.some((tp) => {
      if (tp.endsWith('/')) {
        return file.startsWith(tp);
      }
      return file === tp || file.startsWith(tp + '/');
    });
  };

  const violations = [];
  const speccedFiles = [];
  const unspeccedFiles = [];

  // 6. Audit changed files against specifications
  for (const file of changedFiles) {
    if (file.startsWith('.specify/tasks/')) {
      const specObj = allSpecs.find(
        (s) => path.join('.specify/tasks', s.file) === file || s.file === path.basename(file)
      );
      if (specObj && specObj.integrity === 'DRIFT') {
        violations.push({
          type: 'HASH_DRIFT',
          file,
          specId: specObj.id,
          message: `Specification ${specObj.file} has hash drift (Expected ${specObj.approvedHash}, got ${specObj.computedHash})`
        });
      }
      continue;
    }

    if (!isGuardedPath(file)) {
      continue;
    }

    const coveringSpecs = allSpecs.filter((s) => matchesTargetPath(file, s.targetPaths));
    if (coveringSpecs.length === 0) {
      unspeccedFiles.push(file);
      violations.push({
        type: 'UNSPECCED_CODE',
        file,
        message: `File ${file} was modified without an approved task specification covering its path`
      });
    } else {
      speccedFiles.push(file);
      for (const cs of coveringSpecs) {
        if (cs.integrity === 'DRIFT') {
          violations.push({
            type: 'HASH_DRIFT',
            file,
            specId: cs.id,
            message: `File ${file} belongs to spec ${cs.file} which has hash drift`
          });
        }
        if (cs.status === 'Draft' || cs.status === 'In Review') {
          violations.push({
            type: 'UNAPPROVED_SPEC',
            file,
            specId: cs.id,
            message: `File ${file} belongs to spec ${cs.file} which is still in '${cs.status}' status`
          });
        }
      }
    }
  }

  // Active specs involved in this changeset
  const activeSpecs = allSpecs.filter((s) => {
    return (
      changedFiles.includes(path.join('.specify/tasks', s.file)) ||
      s.targetPaths.some((tp) => changedFiles.some((f) => matchesTargetPath(f, [tp])))
    );
  });

  // 7. Scope leak check for In Progress specs
  for (const spec of activeSpecs) {
    if (spec.status === 'In Progress') {
      const leaks = changedFiles.filter(
        (f) =>
          isGuardedPath(f) &&
          !matchesTargetPath(f, spec.targetPaths) &&
          !allSpecs.some(
            (other) =>
              other.id !== spec.id &&
              matchesTargetPath(f, other.targetPaths) &&
              (other.status === 'Approved' || other.status === 'Completed')
          )
      );
      for (const leak of leaks) {
        if (!violations.some((v) => v.type === 'SCOPE_LEAK' && v.file === leak)) {
          violations.push({
            type: 'SCOPE_LEAK',
            file: leak,
            specId: spec.id,
            message: `File ${leak} leaked outside declared Target Path for spec ${spec.file}`
          });
        }
      }
    }
  }

  const passed = bypassed || warnOnly || violations.length === 0;

  // 8. Generate Markdown Summary
  let md = '';
  md += `## 🛡️ Nexus Kit Spec Enforcement Guard\n\n`;
  if (bypassed) {
    md += `> **Status:** ⚠️ **BYPASSED** (${bypassReason})\n\n`;
  } else if (passed) {
    md += `> **Status:** ✅ **PASSED** (100% SDD Compliant)\n\n`;
  } else {
    md += `> **Status:** ❌ **FAILED** (${violations.length} SDD Violation${violations.length > 1 ? 's' : ''} detected)\n\n`;
  }

  md += `- **Base Reference:** \`${resolvedBase || 'N/A'}\`\n`;
  md += `- **Head Reference:** \`${headRef}\`\n`;
  md += `- **Total Changed Files:** ${changedFiles.length}\n`;
  md += `- **Specced Code Files:** ${speccedFiles.length}\n`;
  md += `- **Unspecced Code Files:** ${unspeccedFiles.length}\n\n`;

  if (violations.length > 0) {
    md += `### 🚨 Violations Detected\n\n`;
    md += `| Type | File | Message |\n`;
    md += `| :--- | :--- | :--- |\n`;
    for (const v of violations) {
      md += `| \`${v.type}\` | \`${v.file}\` | ${v.message} |\n`;
    }
    md += `\n`;
  }

  // Append Spec Status Board
  try {
    const summaryData = getTasksSummary(targetDir);
    if (summaryData.tasks && summaryData.tasks.length > 0) {
      md += `### 📋 Spec Status Board\n\n`;
      md += `| ID | Ver | Status | Integrity | Criteria | Progress | Title |\n`;
      md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
      for (const t of summaryData.tasks) {
        md += `| ${t.id} | ${t.version} | ${t.status} | ${t.integrity} | [${t.acCompleted}/${t.acTotal}] | ${t.progress}% | ${t.title} |\n`;
      }
      md += `\n`;
    }
  } catch {
    // ignore
  }

  // 9. Write to GitHub Step Summary if applicable
  if (summaryFile) {
    try {
      fs.appendFileSync(summaryFile, md, 'utf8');
    } catch (err) {
      console.warn(`[WARN] Could not write to summary file ${summaryFile}: ${err.message}`);
    }
  }

  // 10. Post or update PR sticky comment
  if (commentPr && githubToken) {
    await postOrUpdatePrComment(md, githubToken);
  }

  return {
    passed,
    bypassed,
    bypassReason,
    baseRef: resolvedBase,
    headRef,
    totalChangedFiles: changedFiles.length,
    changedFiles,
    speccedFiles,
    unspeccedFiles,
    activeSpecs,
    violations,
    summaryMarkdown: md
  };
}

/**
 * Posts or updates a sticky comment on the GitHub PR using native fetch.
 */
async function postOrUpdatePrComment(markdownContent, token) {
  try {
    const eventPath = process.env.GITHUB_EVENT_PATH;
    const repoSlug = process.env.GITHUB_REPOSITORY;
    if (!eventPath || !repoSlug || !fs.existsSync(eventPath)) {
      return;
    }

    const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
    const prNumber = eventData.pull_request?.number;
    if (!prNumber) {
      return;
    }

    const headers = {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'nexus-kit-guard'
    };

    // Find existing sticky comment
    const listRes = await fetch(`https://api.github.com/repos/${repoSlug}/issues/${prNumber}/comments`, {
      headers
    });

    if (!listRes.ok) {
      return;
    }

    const comments = await listRes.json();
    const existing = Array.isArray(comments)
      ? comments.find((c) => c.body && c.body.includes('Nexus Kit Spec Enforcement Guard'))
      : null;

    if (existing) {
      await fetch(`https://api.github.com/repos/${repoSlug}/issues/comments/${existing.id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: markdownContent })
      });
    } else {
      await fetch(`https://api.github.com/repos/${repoSlug}/issues/${prNumber}/comments`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: markdownContent })
      });
    }
  } catch (err) {
    console.warn(`[WARN] PR comment posting skipped: ${err.message}`);
  }
}
