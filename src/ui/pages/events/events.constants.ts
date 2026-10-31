import { BjjEventType } from '@api/features/events/events.types';
import { EMPTY_LINE2 } from '../common/empty.page';

export const EVENT_TYPE_FILTER_LABELS = {
  [BjjEventType.OpenMat]: 'Open Mat',
  [BjjEventType.Seminar]: 'Seminar',
  [BjjEventType.Camp]: 'Camp',
  [BjjEventType.Other]: 'Other',
} as const satisfies Record<BjjEventType, string>;

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
