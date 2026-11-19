import type { BjjEventDto } from '@api/features/events/events.types';
import { API_ROUTES, DEFAULT_PAGE_SIZE, type PaginatedResponse } from '@api/support';
import type { EventId } from '@shared/types';
import { paginatePages } from '@ui/mocks/paginate.mock';
import { SEEDED_EVENT_LEINSTER_OPEN_MAT, SEEDED_EVENT_REBEL_COUNTY_SEMINAR } from '../seeded';

const HEX = 16;
const ID_SUFFIX_LENGTH = 4;

/**
 * First page of a listing that spans several pages: `total` distinct events derived from
 * a seeded one, paged at the app's page size. Only the page-1 body is served, which is all
 * the header total and the first page of cards need. The map loads one page of `pageSize` 100.
 */
export function firstPageOfManyEvents(
  total: number,
  pageSize: number = DEFAULT_PAGE_SIZE,
): PaginatedResponse<BjjEventDto> {
  const events = Array.from({ length: total }, (_, i): BjjEventDto => {
    const suffix = (i + 1).toString(HEX).padStart(ID_SUFFIX_LENGTH, '0');
    return {
      ...SEEDED_EVENT_LEINSTER_OPEN_MAT,
      id: `acce77e0000000000000${suffix}` as EventId,
      name: `Paged Event ${i + 1}`,
    };
  });
  const firstPage = paginatePages(events, pageSize, API_ROUTES.bjjEvents)[1];
  if (!firstPage) throw new Error(`no first page for ${total} events`);
  return firstPage;
}

const PAGED_EVENT_NAME_DIGITS = 2;
const CORK_RUN = 5;
const COUNTY_CYCLE = 9;

/** Name of the nth paged event (1-based). Zero-padded so a name is never a substring of another (`01` against `10`). */
export function pagedEventName(position: number): string {
  return `Paged Event ${String(position).padStart(PAGED_EVENT_NAME_DIGITS, '0')}`;
}

/**
 * `total` distinct events in listing order, derived from two seeded events so the `county` and `types` filters have
 * something to split: runs of five Cork seminars (from the Cork seeded event) among Dublin open mats. 45 events give 25
 * in Cork and 20 in Dublin.
 */
export function manyEventsInTwoCounties(total: number): BjjEventDto[] {
  return Array.from({ length: total }, (_, i): BjjEventDto => {
    const base = i % COUNTY_CYCLE < CORK_RUN ? SEEDED_EVENT_REBEL_COUNTY_SEMINAR : SEEDED_EVENT_LEINSTER_OPEN_MAT;
    const suffix = (i + 1).toString(HEX).padStart(ID_SUFFIX_LENGTH, '0');
    return { ...base, id: `acce77f0000000000000${suffix}` as EventId, name: pagedEventName(i + 1) };
  });
}

/** The events the real API would return for the request's filters: `county` and `types` (comma separated or repeated). */
export function filterPagedEvents(events: readonly BjjEventDto[], params: URLSearchParams): BjjEventDto[] {
  const county = params.get('county');
  const types = [...params.getAll('types'), ...params.getAll('types[]')].flatMap(value => value.split(','));
  return events.filter(
    event =>
      (!county || event.county === county) && (types.length === 0 || event.types.some(type => types.includes(type))),
  );
}

/** One page of `events` as the request asks for it (`page`, `pageSize`); a page past the end is empty. */
export function pagedEventsResponse(
  events: readonly BjjEventDto[],
  params: URLSearchParams,
): PaginatedResponse<BjjEventDto> {
  const pageNumber = Number(params.get('page') ?? '1');
  const pageSize = Number(params.get('pageSize') ?? DEFAULT_PAGE_SIZE);
  const filtered = filterPagedEvents(events, params);
  return (
    paginatePages(filtered, pageSize, API_ROUTES.bjjEvents)[pageNumber] ?? {
      data: [],
      pagination: {
        totalItems: filtered.length,
        currentPage: pageNumber,
        pageSize,
        totalPages: Math.ceil(filtered.length / pageSize),
        hasNextPage: false,
        hasPreviousPage: pageNumber > 1,
        nextPageUrl: null,
        previousPageUrl: null,
      },
    }
  );
}
