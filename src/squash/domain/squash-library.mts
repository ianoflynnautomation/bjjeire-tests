/**
 * Shared by the Squash repositories and `squash:prune`. This file is ESM
 * (`.mts`) because the prune command is native ESM and cannot import the
 * CommonJS `.ts` modules. It stays dependency-free for the same reason.
 */

/** First paragraph of every description the sync writes. Marks a case as sync-owned. */
export const OWNERSHIP_MARKER =
  '<p>Managed by the Playwright sync. Edits to the name or description are overwritten.</p>';

const PATH_SEPARATOR = /(?<!\\)\//;
const PROJECT_ROOT = '/';

export type ListedPage<T> = Readonly<{ items: readonly T[]; totalPages: number }>;

export type PruneCase = Readonly<{ id: number; folder: string; name: string; owned: boolean }>;

/**
 * `/Project/Folder/Sub/Name` → `Folder/Sub`. A case at the project root has folder `''`.
 * Squash escapes a `/` inside a name as `\/`, so only unescaped slashes separate segments.
 */
export function folderPathOf(path: string): string {
  return segmentsOf(path).slice(2, -1).join('/');
}

export function caseNameFromPath(path: string): string {
  return segmentsOf(path).at(-1) ?? '';
}

/**
 * Reads every page. `read` is called with a 0-based page index. A page that
 * does not report a finite `totalPages` throws, so a 2xx body cannot loop forever.
 */
export async function readEveryPage<T>(read: (page: number) => Promise<ListedPage<T>>): Promise<T[]> {
  const items: T[] = [];
  for (let page = 0, totalPages = 1; page < totalPages; page++) {
    const parsed = await read(page);
    if (!Number.isFinite(parsed.totalPages)) throw new Error(`Page ${page} did not report a finite totalPages`);
    items.push(...parsed.items);
    totalPages = parsed.totalPages;
  }
  return items;
}

export function parseListedPage(body: unknown, key: string): ListedPage<unknown> {
  if (!isRecord(body)) throw new Error('list response is not a JSON object');
  const totalPages = isRecord(body['page']) ? body['page']['totalPages'] : undefined;
  if (typeof totalPages !== 'number' || !Number.isFinite(totalPages)) {
    throw new Error('list response has no finite page.totalPages');
  }
  return { items: itemsOf(body['_embedded'], key), totalPages };
}

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

function segmentsOf(path: string): string[] {
  return path.split(PATH_SEPARATOR).map(segment => segment.replaceAll('\\/', '/'));
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null;
}

function itemsOf(embedded: unknown, key: string): unknown[] {
  if (!isRecord(embedded)) return [];
  const items = embedded[key];
  return Array.isArray(items) ? items : [];
}
