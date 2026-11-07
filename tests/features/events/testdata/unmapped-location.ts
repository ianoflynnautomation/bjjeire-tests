import type { BjjEventDto } from '@api/features/events/events.types';
import { API_ROUTES, DEFAULT_PAGE_SIZE } from '@api/support';
import { paginatePages } from '@ui/mocks/paginate.mock';
import { SEEDED_EVENT_SCHEDULE_OFFSETS, SEEDED_UPCOMING_EVENTS } from '../seeded';

/**
 * First page of the seeded upcoming listing with `location.coordinates` removed from the given events.
 * The contract makes coordinates optional, though the DTO type requires them, so the body is untyped
 * and the mock fixture validates it against the generated schema.
 */
export function listingWithoutCoordinates(unmapped: readonly BjjEventDto[]): {
  body: unknown;
  mapped: readonly BjjEventDto[];
} {
  const unmappedIds = new Set(unmapped.map(event => event.id));
  const events = SEEDED_UPCOMING_EVENTS.map((event): unknown => {
    if (!unmappedIds.has(event.id)) return event;
    return { ...event, location: { address: event.location.address, venue: event.location.venue } };
  });
  const page = paginatePages(events, DEFAULT_PAGE_SIZE, API_ROUTES.bjjEvents)[1];
  if (!page) throw new Error('no first page for the listing without coordinates');
  return { body: page, mapped: SEEDED_UPCOMING_EVENTS.filter(event => !unmappedIds.has(event.id)) };
}

const SHARED_LOCATION_DECIMALS = 5;

type Pin = { venue: string; eventCount: number; events: [BjjEventDto, ...BjjEventDto[]] };

const seededStart = new Map(
  SEEDED_EVENT_SCHEDULE_OFFSETS.map(({ event, startOffsetDays }) => [event.id, startOffsetDays]),
);
const startOf = (event: BjjEventDto): number => seededStart.get(event.id) ?? Number.POSITIVE_INFINITY;

/**
 * One pin per spot, grouped by coordinates rounded to 5 decimals as the app does. Each pin's events are
 * sorted by their seeded start, earliest first, and the pin takes its venue from the earliest one, as the app does.
 */
export function pinsFor(events: readonly BjjEventDto[]): Pin[] {
  const groups = new Map<string, BjjEventDto[]>();
  for (const event of events) {
    const { longitude, latitude } = event.location.coordinates;
    const key = `${longitude.toFixed(SHARED_LOCATION_DECIMALS)},${latitude.toFixed(SHARED_LOCATION_DECIMALS)}`;
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  return [...groups.values()].map(group => {
    const [earliest, ...rest] = [...group].sort((a, b) => startOf(a) - startOf(b)) as [BjjEventDto, ...BjjEventDto[]];
    return { venue: earliest.location.venue, eventCount: group.length, events: [earliest, ...rest] };
  });
}
