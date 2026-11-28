#!/usr/bin/env node
// Stop hook: runs npm run lint, plus typecheck when code changed and spec:check when
// specs changed. Skips read-only turns. A failure blocks the end of the turn once.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

// Prevent infinite loops if already continuing from a Stop hook block
if (input.stop_hook_active === true) process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
if (!existsSync(path.join(root, 'package.json'))) process.exit(0);

// -uall lists files inside new untracked folders (e.g. a new tests/features/<f>/), which
// plain --porcelain collapses to the folder name and the .ts patterns below would miss.
// Note: this checks the whole dirty tree, not only this session's edits, so it also runs
// (and can fail on pre-existing problems) in Q&A turns while uncommitted work is present.
const diff = spawnSync('git', ['status', '--porcelain', '-uall'], { cwd: root, encoding: 'utf8' });
if (diff.status !== 0 || !diff.stdout) process.exit(0);

const changedFiles = diff.stdout
  .split('\n')
  .map(line => line.slice(3).trim().split(' -> ').pop() ?? '')
  .filter(Boolean)
  .map(p => p.split(path.sep).join('/'));

const touchedCode = changedFiles.some(f => /^(tests|src)\/.*\.(ts|mts|js|mjs)$/.test(f));
const touchedSpecs = changedFiles.some(f => /^specs\/features\/.*\.md$/.test(f));
// Same set CI lints: Oxlint on script files, Prettier on those plus json, markdown and yaml.
const touchedLint = changedFiles.some(f => /\.(ts|mts|cts|js|mjs|cjs|json|md|yml|yaml)$/.test(f));

if (!touchedCode && !touchedSpecs && !touchedLint) process.exit(0);

const errors = [];

if (touchedLint) {
  // Same checks as `npm run lint` (oxlint, then prettier --check). Run them
  // separately so a machine without the oxlint binary still fails on Prettier.
  const output = [];
  const oxlint = path.join(root, 'node_modules', '.bin', 'oxlint');
  const prettier = path.join(root, 'node_modules', '.bin', 'prettier');
  if (existsSync(oxlint)) {
    const ox = spawnSync(oxlint, ['.'], { cwd: root, encoding: 'utf8' });
    const text = `${ox.stdout ?? ''}${ox.stderr ?? ''}`;
    if (ox.status !== 0 && ox.status !== null && !text.includes('Cannot find native binding')) {
      output.push(text.trim());
    }
  }
  if (existsSync(prettier)) {
    const formatted = spawnSync(prettier, ['--check', '.'], { cwd: root, encoding: 'utf8' });
    if (formatted.status !== 0 && formatted.status !== null) {
      output.push(`${formatted.stdout ?? ''}${formatted.stderr ?? ''}`.trim());
    }
  }
  if (output.length > 0) {
    errors.push(`Lint failed before completion:\n${output.join('\n\n')}`);
  }
}

if (touchedCode) {
  const tc = spawnSync('npm', ['run', 'typecheck'], { cwd: root, encoding: 'utf8' });
  if (tc.status !== 0) {
    errors.push(`Typecheck failed before completion:\n${tc.stdout}${tc.stderr}`.trim());
  }
}

if (touchedSpecs) {
  const sc = spawnSync('npm', ['run', 'spec:check'], { cwd: root, encoding: 'utf8' });
  if (sc.status !== 0) {
    errors.push(`Spec check failed before completion:\n${sc.stdout}${sc.stderr}`.trim());
  }
}

if (errors.length === 0) process.exit(0);

process.stderr.write(`${errors.join('\n\n')}\n`);
process.exit(2);
