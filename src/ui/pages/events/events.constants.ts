import { BjjEventType } from '@api/features/events/events.types';
import { EMPTY_LINE2 } from '../common/empty.page';

export const EVENT_TYPE_FILTER_LABELS = {
  [BjjEventType.OpenMat]: 'Open Mat',
  [BjjEventType.Seminar]: 'Seminar',
  [BjjEventType.Camp]: 'Camp',
  [BjjEventType.Other]: 'Other',
} as const satisfies Record<BjjEventType, string>;

export const ALL_TYPES_FILTER_LABEL = 'All Types';

export const EVENT_CARD_TEST_IDS = {
  address: 'event-card-address',
  addressLink: 'event-card-address-link',
  county: 'event-card-county',
  moreInfoLink: 'event-card-button',
  name: 'event-card-name',
  organiserLink: 'event-card-organiser-link',
  pricing: 'event-card-pricing',
  schedule: 'event-card-schedule',
  type: 'event-card-type',
} as const;

/** One per session line: `event-card-schedule-session-0`, `-1`, … */
export const EVENT_CARD_SESSION_TEST_ID = /^event-card-schedule-session-\d+$/;

export const NO_DATA_COPY = {
  title: 'No Events Found',
  line1: 'No events match your current filters.',
  line2: 'Try a different filter to find events.',
} as const;

export const NO_SEARCH_RESULTS_COPY = {
  title: 'No events match your search',
  line1: 'Try a different search term or clear the filter.',
  line2: EMPTY_LINE2,
} as const;

export const TEST_IDS = {
  cardName: 'event-card-name',
  countySelect: 'select-filter-select',
  emptyState: 'no-data-state',
  filters: 'events-page-filters',
  header: 'events-page-header',
  headerTitle: 'events-page-header-title',
  headerTotal: 'events-page-header-total',
  listItem: 'events-list-item',
  search: 'events-page-search',
  searchInput: 'search-input',
} as const;

export const MAP_TEST_IDS = {
  map: 'event-map',
  pin: 'event-map-pin',
  viewSwitch: 'events-view-switch',
  viewSwitchList: 'events-view-switch-list',
  viewSwitchMap: 'events-view-switch-map',
} as const;

export const MAP_REGION_NAME = 'Map of Brazilian Jiu-Jitsu events in Ireland';

export const MAP_NOTICE_TEST_IDS = {
  truncated: 'event-map-notice-truncated',
  unmapped: 'event-map-notice-unmapped',
} as const;

export const UNMAPPED_NOTICE_COPY = {
  singular: 'event is not shown on the map because it has no location.',
  plural: 'events are not shown on the map because they have no location.',
} as const;

/** The API's maximum page size: the most events the map loads. */
export const MAP_EVENT_LIMIT = 100;

export const TRUNCATED_NOTICE_COPY =
  'Not all events are shown on the map. Choose a county or type, or search, to narrow the results.';

export const POPUP_TEST_IDS = {
  popup: 'event-map-popup',
  venue: 'event-map-popup-venue',
  address: 'event-map-popup-address',
  directionsLink: 'event-map-popup-directions-link',
  event: 'event-map-popup-event',
  eventName: 'event-map-popup-event-name',
  eventTypes: 'event-map-popup-event-types',
  eventDates: 'event-map-popup-event-dates',
  eventAddress: 'event-map-popup-event-address',
  eventLink: 'event-map-popup-event-link',
  close: 'event-map-popup-close',
} as const;

/**
 * Galway against Westport on screen: south-east, with the vertical distance about twice the horizontal one
 * (Mercator at 53.5 degrees north gives about 2.05). Wide bounds: any real position passes, swapped
 * latitude and longitude (about 0.5) does not.
 */
export const SOUTH_EAST_RATIO_BOUNDS = { min: 1.5, max: 2.7 } as const;

/** The events list endpoint, with or without a query string. */
export const EVENTS_LIST_API_ROUTE = /\/api\/v[12]\/bjjevent(?:\?|$)/i;
