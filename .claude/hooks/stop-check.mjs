#!/usr/bin/env node
// Stop hook: verifies typecheck (and spec:check if specs changed) when code/spec files
// were modified during the session, without slowing down read-only or Q&A turns.
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

if (!touchedCode && !touchedSpecs) process.exit(0);

const errors = [];

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
