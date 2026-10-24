import type { SquashClient } from './squash-client';
import { createdSchema, parseWire } from './squash-wire';

export const DEFAULT_PAGE_SIZE = 200;

export type Page<T> = Readonly<{ items: readonly T[]; totalPages: number }>;

/** Reads every page of a Squash list endpoint (0-based `page`, `size`). */
export async function collectPages<T>(
  client: SquashClient,
  request: Readonly<{ path: string; query?: Readonly<Record<string, string>>; pageSize: number }>,
  parse: (body: unknown) => Page<T>,
): Promise<T[]> {
  const items: T[] = [];
  for (let page = 0, totalPages = 1; page < totalPages; page++) {
    const query = { ...request.query, page, size: request.pageSize };
    const parsed = parse(await client.send({ method: 'GET', path: request.path, query }));
    items.push(...parsed.items);
    totalPages = parsed.totalPages;
  }
  return items;
}

/** POSTs a new Squash resource and returns the id from the validated response. */
export async function createResource(client: SquashClient, path: string, body?: object): Promise<number> {
  const response = await client.send({ method: 'POST', path, ...(body === undefined ? {} : { body }) });
  return parseWire(createdSchema, response, `POST ${path}`).id;
}
