#!/usr/bin/env node
// PostToolUse: formats an edited file with Prettier, runs Oxlint --fix on .ts/.mts,
// and spec:check on an edited feature spec. Reports whatever those cannot fix.
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
const prettierTargets = absPaths.filter(abs => /\.(ts|mts|cts|js|mjs|cjs|json|md|yml|yaml)$/.test(abs));
const specTargets = absPaths.filter(abs => {
  const rel = path.relative(root, abs).split(path.sep).join('/');
  return /^specs\/features\/.*\.md$/.test(rel);
});

const failures = [];

const prettier = path.join(root, 'node_modules', '.bin', 'prettier');
if (prettierTargets.length > 0 && existsSync(prettier)) {
  const run = spawnSync(prettier, ['--write', '--ignore-unknown', ...prettierTargets], {
    cwd: root,
    encoding: 'utf8',
  });
  // A missing or wrong-platform binary fails to spawn (status null). Skip, as with Oxlint.
  if (run.status !== 0 && run.status !== null) {
    const relTargets = prettierTargets.map(t => path.relative(root, t)).join(', ');
    failures.push(`Prettier failed on ${relTargets}:\n${run.stdout ?? ''}${run.stderr ?? ''}`.trim());
  }
}

const oxlint = path.join(root, 'node_modules', '.bin', 'oxlint');
if (tsTargets.length > 0 && existsSync(oxlint)) {
  const run = spawnSync(oxlint, ['--fix', '--no-error-on-unmatched-pattern', ...tsTargets], {
    cwd: root,
    encoding: 'utf8',
  });
  const output = `${run.stdout ?? ''}${run.stderr ?? ''}`;
  // node_modules in this repo is the Linux dev-container volume. On the Mac the
  // binary can be present without its native binding; skip, as with a missing tool.
  if (run.status !== 0 && !output.includes('Cannot find native binding')) {
    const relTargets = tsTargets.map(t => path.relative(root, t)).join(', ');
    failures.push(`Oxlint found problems in ${relTargets} after --fix:\n${output}`.trim());
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
