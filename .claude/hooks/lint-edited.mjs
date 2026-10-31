#!/usr/bin/env node
// PostToolUse: run ESLint (with Prettier via its plugin) on the TypeScript file just
// edited, apply safe fixes, and hand any remaining errors back to the agent so it
// fixes them in the same turn instead of at the end. Silent when the file is clean.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8'));
const filePath = input.tool_input?.file_path;
if (typeof filePath !== 'string' || !/\.(ts|mts)$/.test(filePath)) process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const eslint = path.join(root, 'node_modules', '.bin', 'eslint');
if (!existsSync(eslint) || !existsSync(filePath)) process.exit(0);

const run = spawnSync(eslint, ['--fix', '--no-warn-ignored', '--format', 'stylish', filePath], {
  cwd: root,
  encoding: 'utf8',
});
if (run.status === 0) process.exit(0);

process.stderr.write(
  `ESLint found problems in ${path.relative(root, filePath)} after --fix:\n${run.stdout}${run.stderr}`,
);
process.exit(2);
