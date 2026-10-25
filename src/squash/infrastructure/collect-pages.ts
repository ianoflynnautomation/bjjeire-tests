import { readEveryPage, type ListedPage } from '../domain/paged-list.mts';
import type { SquashClient } from './squash-client';

export const DEFAULT_PAGE_SIZE = 200;

/** Reads every page of a Squash list endpoint (0-based `page`, `size`). */
export async function collectPages<T>(
  client: SquashClient,
  request: Readonly<{ path: string; query?: Readonly<Record<string, string>>; pageSize: number }>,
  parse: (body: unknown) => ListedPage<T>,
): Promise<T[]> {
  return readEveryPage(async page => {
    const query = { ...request.query, page, size: request.pageSize };
    return parse(await client.send({ method: 'GET', path: request.path, query }));
  });
}
