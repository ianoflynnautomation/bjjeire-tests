import type { APIRequestContext } from '@playwright/test';
import type { ZodType } from 'zod';
import { env } from '@shared/config/env';
import {
  API_ROUTES,
  APP_ROUTES,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  expectSchema,
  get,
  type PaginatedResponse,
} from '@api/support';
import type { GetStoresPaginationQuery, StoreDto } from './stores.types';

export async function getStores(
  request: APIRequestContext,
  schema: ZodType<PaginatedResponse<StoreDto>>,
  { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE }: GetStoresPaginationQuery = {},
): Promise<PaginatedResponse<StoreDto>> {
  const body = await get(request, API_ROUTES.stores, {
    params: { page, pageSize },
  });
  return expectSchema(schema, body);
}

const DIRECTORY_WALK_PAGE_SIZE = 100;
const DIRECTORY_WALK_MAX_PAGES = 50;

/** Every store the directory lists, walked page by page (`pageSize` 100) while `hasNextPage` holds, with the `totalItems` the first page reported. Fails if the walk exceeds its page bound. */
export async function getAllStores(
  request: APIRequestContext,
  schema: ZodType<PaginatedResponse<StoreDto>>,
): Promise<{ stores: StoreDto[]; reportedTotal: number }> {
  const stores: StoreDto[] = [];
  let reportedTotal = 0;
  for (let page = 1; page <= DIRECTORY_WALK_MAX_PAGES; page++) {
    const result = await getStores(request, schema, { page, pageSize: DIRECTORY_WALK_PAGE_SIZE });
    if (page === 1) reportedTotal = result.pagination.totalItems;
    stores.push(...result.data);
    if (!result.pagination.hasNextPage) return { stores, reportedTotal };
  }
  throw new Error(
    `Store directory still reports a next page after ${DIRECTORY_WALK_MAX_PAGES} pages of ${DIRECTORY_WALK_PAGE_SIZE}; the walk was stopped`,
  );
}

const MAX_CODE_POINT = 0x10ffff;
const XML_COMMENT = /<!--[\s\S]*?-->/g;
// Only an unprefixed `loc` or the sitemap `sm:` prefix is a page address; `image:loc` and the like are not.
const SITEMAP_LOC = /<(?:sm:)?loc\b[^>]*>([\s\S]*?)<\/(?:sm:)?loc\s*>/g;
const CDATA_SPLIT = /(<!\[CDATA\[[\s\S]*?\]\]>)/;
const CDATA = /^<!\[CDATA\[([\s\S]*)\]\]>$/;
const XML_ENTITY = /&(?:(amp|lt|gt|quot|apos)|#(\d+)|#x([0-9a-fA-F]+));/g;
const NAMED_ENTITIES: Readonly<Record<string, string>> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decodeEntities(text: string): string {
  // One pass, so "&amp;lt;" stays "&lt;".
  return text.replace(XML_ENTITY, (whole, named?: string, dec?: string, hex?: string) => {
    if (named) return NAMED_ENTITIES[named] ?? whole;
    const code = dec ? Number.parseInt(dec, 10) : Number.parseInt(hex ?? '', 16);
    return Number.isInteger(code) && code >= 0 && code <= MAX_CODE_POINT ? String.fromCodePoint(code) : whole;
  });
}

function locValue(raw: string): string {
  // CDATA content is literal; entities are decoded only outside it.
  return raw
    .split(CDATA_SPLIT)
    .map(part => CDATA.exec(part)?.[1] ?? decodeEntities(part))
    .join('')
    .trim();
}

function pathOf(raw: string): string {
  const value = locValue(raw);
  try {
    return new URL(value).pathname;
  } catch {
    throw new Error(`Site map has an empty or invalid <loc> entry: ${JSON.stringify(raw)}`);
  }
}

/** The paths in a site map document, from its `<loc>` entries (comments ignored). */
export function parseSitemapPaths(xml: string): string[] {
  return Array.from(xml.replace(XML_COMMENT, '').matchAll(SITEMAP_LOC), match => pathOf(match[1] ?? ''));
}

/** The paths the app's site map lists, parsed from its `<loc>` entries. The host in each entry is the canonical one, so only the path is kept. */
export async function getSitemapPaths(request: APIRequestContext): Promise<string[]> {
  const response = await request.get(`${env.baseUrl}${APP_ROUTES.sitemap}`, { headers: { accept: 'application/xml' } });
  if (!response.ok()) {
    throw new Error(`GET ${APP_ROUTES.sitemap} → ${response.status()} ${response.statusText()}`);
  }
  const contentType = response.headers()['content-type'] ?? '';
  if (!/\bxml\b/i.test(contentType)) {
    throw new Error(
      `GET ${APP_ROUTES.sitemap} did not return XML (content-type "${contentType}"); the app may be serving its HTML fallback`,
    );
  }
  return parseSitemapPaths(await response.text());
}
