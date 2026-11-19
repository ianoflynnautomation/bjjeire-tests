import { SHOP_NAV_LINK } from '../sections/header.constants';

export const NO_DATA_COPY = {
  title: 'No Stores Found',
  line1: 'No stores are available right now.',
  line2: 'Check back later.',
} as const;

export const NO_SEARCH_RESULTS_COPY = {
  title: 'No Results Found',
  line1: 'No stores matched your search. Try different keywords.',
  line2: 'Check the spelling or try fewer words.',
} as const;

export const TEST_IDS = {
  cardName: 'store-card-name',
  description: 'store-card-description',
  emptyState: 'no-data-state',
  header: 'stores-page-header',
  headerTitle: 'stores-page-header-title',
  logo: 'store-card-logo',
  logoFallback: 'store-card-logo-fallback',
  listItem: 'stores-list-item',
  search: 'stores-page-search',
  searchInput: 'search-input',
} as const;

/** The section's name and address in the navigation (`#4005`); the old name is the one that must be gone. */
export const SHOP_NAV = { ...SHOP_NAV_LINK, retiredName: 'Stores' } as const;

/** Accessible name of a card's website link: "Visit Website for <store>". */
export const websiteLinkName = (storeName: string): string => `Visit Website for ${storeName}`;
