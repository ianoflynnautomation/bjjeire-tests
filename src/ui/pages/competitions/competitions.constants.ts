export const TEST_IDS = {
  cardName: 'competition-card-name',
  emptyState: 'no-data-state',
  header: 'competitions-page-header',
  headerTitle: 'competitions-page-header-title',
  headerTotal: 'competitions-page-header-total',
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
  websiteButton: 'competition-card-website-button',
  registerButton: 'competition-card-register-button',
} as const;

export const WEBSITE_UNAVAILABLE_COPY = 'Website Unavailable';

export const NO_SEARCH_RESULTS_COPY = {
  title: 'No Results Found',
  line1: 'No competitions matched your search. Try different keywords.',
  line2: 'Check the spelling or try fewer words.',
} as const;

export const NO_DATA_COPY = {
  title: 'No Competitions Found',
  line1: 'No competitions are available right now.',
  line2: 'Check back later.',
} as const;
