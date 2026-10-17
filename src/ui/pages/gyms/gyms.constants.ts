import { EMPTY_LINE2 } from '../common/empty.page';

export const GYM_CARD_TEST_IDS = {
  classes: 'gym-card-classes',
  classesItem: 'gym-card-classes-item',
  county: 'gym-card-county',
  name: 'gym-card-name',
  status: 'gym-card-status-badge',
} as const;

export const NO_DATA_COPY = {
  title: 'No Gyms Found',
  line1: 'No gyms match your current filters.',
  line2: 'Try a different county or check back later.',
} as const;

export const NO_SEARCH_RESULTS_COPY = {
  title: 'No gyms match your search',
  line1: 'Try a different search term or clear the filter.',
  line2: EMPTY_LINE2,
} as const;

export const TEST_IDS = {
  cardAddressLink: 'gym-card-address-link',
  cardName: 'gym-card-name',
  cardWebsiteLink: 'gym-card-website-link',
  countySelect: 'select-filter-select',
  emptyState: 'no-data-state',
  header: 'gyms-page-header',
  headerTitle: 'gyms-page-header-title',
  listItem: 'gyms-list-item',
  search: 'gyms-page-search',
  searchInput: 'search-input',
} as const;
