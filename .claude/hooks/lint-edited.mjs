#!/usr/bin/env node
// PostToolUse: runs ESLint --fix on edited .ts/.mts files and spec:check on edited feature specs.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const toolInput = input.tool_input ?? input.toolInput ?? {};
const rawPaths = [
  toolInput.file_path,
  toolInput.path,
  ...(Array.isArray(toolInput.edits) ? toolInput.edits.map(e => e?.file_path ?? e?.path) : []),
].filter(p => typeof p === 'string');

const uniquePaths = [...new Set(rawPaths)];
if (uniquePaths.length === 0) process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const absPaths = uniquePaths.map(p => path.resolve(root, p)).filter(abs => existsSync(abs));

if (absPaths.length === 0) process.exit(0);

const tsTargets = absPaths.filter(abs => /\.(ts|mts)$/.test(abs));
const specTargets = absPaths.filter(abs => {
  const rel = path.relative(root, abs).split(path.sep).join('/');
  return /^specs\/features\/.*\.md$/.test(rel);
});

const failures = [];

const eslint = path.join(root, 'node_modules', '.bin', 'eslint');
if (tsTargets.length > 0 && existsSync(eslint)) {
  const run = spawnSync(eslint, ['--fix', '--no-warn-ignored', '--format', 'stylish', ...tsTargets], {
    cwd: root,
    encoding: 'utf8',
  });
  if (run.status !== 0) {
    const relTargets = tsTargets.map(t => path.relative(root, t)).join(', ');
    failures.push(`ESLint found problems in ${relTargets} after --fix:\n${run.stdout}${run.stderr}`.trim());
  }
}

if (specTargets.length > 0) {
  const specRun = spawnSync('npm', ['run', 'spec:check'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (specRun.status !== 0) {
    failures.push(`Spec contract check failed after editing specs:\n${specRun.stdout}${specRun.stderr}`.trim());
  }
}

if (failures.length === 0) process.exit(0);

process.stderr.write(`${failures.join('\n\n')}\n`);
process.exit(2);
