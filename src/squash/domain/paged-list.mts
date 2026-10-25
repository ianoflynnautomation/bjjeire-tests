/**
 * One page of a Squash HAL listing. Dependency-free ESM: `squash:prune`
 * imports this module directly.
 */

export type ListedPage<T> = Readonly<{ items: readonly T[]; totalPages: number }>;

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

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null;
}

function itemsOf(embedded: unknown, key: string): unknown[] {
  if (!isRecord(embedded)) return [];
  const items = embedded[key];
  return Array.isArray(items) ? items : [];
}
