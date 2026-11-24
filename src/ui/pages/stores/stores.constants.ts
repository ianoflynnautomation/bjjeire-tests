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

/** The organiser's shop admin (`/admin/shop`), behind the same organiser sign-in gate as the competition admin. */
export const SHOP_ADMIN = {
  route: '/admin/shop',
  signInTestId: 'bjjeire-competition-admin-sign-in',
  signInHeading: 'Organiser sign-in',
  signInButton: 'Sign in',
  listTestIds: ['merch-admin-list', 'merch-admin-list-item'],
  controlTestIds: ['merch-admin-product-form', 'merch-admin-product-status'],
  controlButtons: ['Save draft', 'Publish'],
  createHeading: 'Add a product',
} as const;

/** The merch section above the directory on Shop (`#6001`); it renders nothing when the catalogue cannot be loaded. */
export const MERCH_SECTION = { testId: 'merch-featured', heading: 'BJJ Éire merch' } as const;

export const MERCH_CARD_TEST_IDS = {
  card: 'merch-featured-card',
  image: 'merch-card-image',
  name: 'merch-card-name',
  price: 'merch-card-price',
  link: 'merch-card-link',
} as const;

export const PRODUCT_PAGE_TEST_IDS = {
  root: 'product-page',
  photos: 'product-page-photos',
  photo: 'product-page-photo',
  sizes: 'product-page-sizes',
  size: 'product-page-size',
  addToBasket: 'product-add-to-basket',
} as const;

export const BASKET_TEST_IDS = {
  badge: 'basket-badge',
  badgeCount: 'basket-badge-count',
  root: 'basket-page',
  line: 'basket-line',
  lineName: 'basket-line-name',
  lineSize: 'basket-line-size',
  lineQuantity: 'basket-line-quantity',
  empty: 'basket-empty',
  checkout: 'basket-checkout',
} as const;

/** The basket address. */
export const BASKET_ROUTE = '/shop/basket';

/** Where the empty basket's link back to Shop leads. */
export const SHOP_ROUTE = '/shop';

/** The merch catalogue list (`GET /api/v1/product`) only, not `/product/photo` or a product page. */
export const PRODUCTS_ROUTE = /\/api\/v[12]\/product(?:\?|$)/i;
