import { EMPTY_LINE2 } from '../common/empty.page';

export const TEST_IDS = {
  cardName: 'competition-card-name',
  emptyState: 'no-data-state',
  header: 'competitions-page-header',
  headerTitle: 'competitions-page-header-title',
  listItem: 'competitions-list-item',
  search: 'competitions-page-search',
  searchInput: 'search-input',
} as const;

export const COMPETITION_CARD_TEST_IDS = {
  date: 'competition-card-date',
  description: 'competition-card-description',
  name: 'competition-card-name',
  organisation: 'competition-card-organisation',
  tags: 'competition-card-tags',
  tagItem: 'competition-card-tag-item',
} as const;

export const NO_SEARCH_RESULTS_COPY = {
  title: 'No Results Found',
  line1: 'No competitions matched your search. Try different keywords.',
  line2: EMPTY_LINE2,
} as const;

export const NO_DATA_COPY = {
  title: 'No Competitions Found',
  line1: 'No competitions are available right now.',
  line2: 'Check back later.',
} as const;
