import type { BjjEventDto } from '@api/features/events/events.types';
import { API_ROUTES, DEFAULT_PAGE_SIZE, type PaginatedResponse } from '@api/support';
import type { EventId } from '@shared/types';
import { paginatePages } from '@ui/mocks/paginate.mock';
import { SEEDED_EVENT_LEINSTER_OPEN_MAT } from '../seeded';

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
      name: `${SEEDED_EVENT_LEINSTER_OPEN_MAT.name} ${i + 1}`,
    };
  });
  const firstPage = paginatePages(events, pageSize, API_ROUTES.bjjEvents)[1];
  if (!firstPage) throw new Error(`no first page for ${total} events`);
  return firstPage;
}
