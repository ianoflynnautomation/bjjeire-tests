export const TEST_IDS = {
  cardName: 'competition-card-name',
  clearSearchButton: 'search-clear-button',
  emptyState: 'no-data-state',
  emptyStateMessageLine1: 'no-data-state-message-line1',
  emptyStateMessageLine2: 'no-data-state-message-line2',
  emptyStateTitle: 'no-data-state-title',
  header: 'competitions-page-header',
  headerTitle: 'competitions-page-header-title',
  list: 'competitions-list',
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

export const EMPTY_STATE = {
  title: 'No Results Found',
  messageLine1: 'No competitions matched your search. Try different keywords.',
  messageLine2: 'Try adjusting your filters or check back later.',
} as const;

export const NO_DATA_COPY = {
  title: 'No Competitions Found',
  line1: 'No competitions are available right now.',
  line2: 'Check back later.',
} as const;
