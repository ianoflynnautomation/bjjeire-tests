export const TEST_IDS = {
  cardName: 'tournament-card-name',
  emptyState: 'no-data-state',
  header: 'tournaments-page-header',
  headerTitle: 'tournaments-page-header-title',
  headerTotal: 'tournaments-page-header-total',
  listItem: 'tournaments-list-item',
  search: 'tournaments-page-search',
  searchInput: 'search-input',
} as const;

export const TOURNAMENT_CARD_TEST_IDS = {
  date: 'tournament-card-date',
  venue: 'tournament-card-venue',
  fee: 'tournament-card-fee',
  divisionCount: 'tournament-card-division-count',
  state: 'tournament-card-registration-state',
  link: 'tournament-card-link',
} as const;

/** The badge wording for each registration state the list can show. */
export const REGISTRATION_STATE_LABELS = {
  OPEN: 'Open',
  CLOSED: 'Closed',
  NOT_OPEN: 'Not open yet',
} as const;

export const NO_SEARCH_RESULTS_COPY = {
  title: 'No Results Found',
  line1: 'No tournaments matched your search. Try different keywords.',
  line2: 'Check the spelling or try fewer words.',
} as const;

export const NO_DATA_COPY = {
  title: 'No Tournaments Found',
  line1: 'No tournaments are available right now.',
  line2: 'Check back later.',
} as const;

export const VIEW_TOURNAMENT_LINK_PREFIX = 'View tournament';

export const TOURNAMENT_PAGE_TEST_IDS = {
  root: 'tournament-page',
  notFound: 'tournament-page-not-found',
  name: 'tournament-page-name',
  date: 'tournament-page-date',
  venue: 'tournament-page-venue',
  fee: 'tournament-page-fee',
  window: 'tournament-page-registration-window',
  registrationStatus: 'tournament-page-registration-status',
  registrationMessage: 'tournament-page-registration-message',
  divisions: 'tournament-page-divisions',
  divisionGroup: 'tournament-page-division-group',
  divisionRow: 'tournament-page-division-row',
} as const;

export const TOURNAMENT_PAGE_COPY = {
  feeNote: 'per division',
  windowSeparator: 'to',
  timeZoneNote: 'Irish time',
  opensOnPrefix: 'Registration opens on',
  closed: 'Registration is closed.',
} as const;

export const TOURNAMENT_NOT_FOUND_COPY = {
  title: 'Tournament Not Found',
  backLink: 'See all tournaments',
} as const;

export const TOURNAMENT_ADMIN_TEST_IDS = {
  signIn: 'tournament-admin-sign-in',
  signInButton: 'tournament-admin-sign-in-button',
  list: 'tournament-admin-list',
  listItem: 'tournament-admin-list-item',
} as const;

export const TOURNAMENT_ADMIN_COPY = {
  route: '/admin/tournaments',
  signInHeading: 'Organiser sign-in',
  signInButton: 'Sign in',
} as const;

/** A control named like a sign-up. The app has none yet, so this check cannot fail until one exists. */
export const SIGN_UP_CONTROL_PATTERN = /\bsign[ -]?up\b|\bregister\b|\benrol(l|ment)?\b|\benter now\b|\bpay\b/i;

/** The header total's wording, from the app's `pageTitle` copy: "Found 1 tournament." / "Found 3 tournaments.". */
export const HEADER_TOTAL_COPY = { prefix: 'Found', singular: 'tournament.', plural: 'tournaments.' } as const;

/** The list call only: `/api/v1/tournament` with or without a query, never `/tournament/<slug>`. */
export const TOURNAMENTS_LIST_API_ROUTE = /\/api\/v[12]\/tournament(?:\?|$)/i;
