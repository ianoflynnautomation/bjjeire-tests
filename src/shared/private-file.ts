import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const PRIVATE_FILE_MODE = 0o600;

/**
 * Writes a credential artefact owner-only (0600) via write-then-rename, so a
 * parallel worker reading the path never sees a half-written file.
 */
export function writePrivateJsonFile(path: string, value: unknown): void {
  const tmpPath = `${path}.${process.pid}.tmp`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(tmpPath, JSON.stringify(value, null, 2), { mode: PRIVATE_FILE_MODE });
  renameSync(tmpPath, path);
}
