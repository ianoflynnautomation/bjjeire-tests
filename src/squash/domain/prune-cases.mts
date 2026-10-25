/**
 * Which listed test cases `squash:prune` may delete. Dependency-free ESM:
 * the prune command imports this module directly.
 */
import { caseNameFromPath, folderPathOf } from './case-path.mts';
import { OWNERSHIP_MARKER } from './ownership-marker.mts';
import { parseListedPage, readEveryPage } from './paged-list.mts';

const PROJECT_ROOT = '/';

export type PruneCase = Readonly<{ id: number; folder: string; name: string; owned: boolean }>;

/** A listed test case as prune sees it. Empty descriptions are not sync-owned. */
export function pruneCaseOf(raw: unknown): PruneCase {
  if (!isRecord(raw) || typeof raw['id'] !== 'number') throw new Error('test case listing is missing a numeric id');
  const path = typeof raw['path'] === 'string' ? raw['path'] : '';
  const description = typeof raw['description'] === 'string' ? raw['description'] : '';
  return {
    id: raw['id'],
    folder: folderPathOf(path),
    name: caseNameFromPath(path),
    owned: description.startsWith(OWNERSHIP_MARKER),
  };
}

export async function readListedCases(readPage: (page: number) => Promise<unknown>, key: string): Promise<PruneCase[]> {
  const listed = await readEveryPage(async page => parseListedPage(await readPage(page), key));
  return listed.map(pruneCaseOf);
}

/** `folder` is `/` for the project root, otherwise a path below it. Subfolders count. */
export function inFolder(folderPath: string, folder: string): boolean {
  if (folder === PROJECT_ROOT) return folderPath === '';
  return folderPath === folder || folderPath.startsWith(`${folder}/`);
}

export function casesInFolders<T extends Readonly<{ folder: string }>>(
  cases: readonly T[],
  folders: readonly string[],
): T[] {
  return cases.filter(testCase => folders.some(folder => inFolder(testCase.folder, folder)));
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null;
}
