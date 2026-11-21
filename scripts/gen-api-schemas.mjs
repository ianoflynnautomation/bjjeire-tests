#!/usr/bin/env node
// openapi-ts reads the TypeScript compiler API. TypeScript 7 has none, so this
// links TypeScript 6.0.3 where that package resolves it. `tsc` stays on 7.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tsVersion = '6.0.3';
const prefix = path.join(os.homedir(), '.cache', 'bjjeire-tests', `typescript-${tsVersion}`);
const tsRoot = path.join(prefix, 'node_modules', 'typescript');
const tsPackage = path.join(tsRoot, 'package.json');

const alreadyInstalled = existsSync(tsPackage) && JSON.parse(readFileSync(tsPackage, 'utf8')).version === tsVersion;
if (!alreadyInstalled) {
  const install = spawnSync(
    'npm',
    ['install', '--prefix', prefix, '--ignore-scripts', '--no-package-lock', `typescript@${tsVersion}`],
    { stdio: 'inherit' },
  );
  if (install.status !== 0) process.exit(install.status ?? 1);
}

const link = path.join(root, 'node_modules', '@hey-api', 'openapi-ts', 'node_modules', 'typescript');
mkdirSync(path.dirname(link), { recursive: true });
rmSync(link, { recursive: true, force: true });
symlinkSync(tsRoot, link);

const run = spawnSync(path.join(root, 'node_modules', '.bin', 'openapi-ts'), ['-f', 'openapi-ts.config.ts'], {
  cwd: root,
  stdio: 'inherit',
});
process.exit(run.status ?? 1);
