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
  signUpLink: 'tournament-sign-up-link',
  mySignUpsLink: 'tournament-my-sign-ups-link',
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
  signUp: 'Sign up',
  feeNote: 'per division',
  windowSeparator: 'to',
  timeZoneNote: 'Irish time',
  opensOnPrefix: 'Registration opens on',
  closed: 'Registration is closed.',
} as const;

/** Where the sign-up control leads, relative to the site. */
export const tournamentSignUpPath = (slug: string): string => `/tournaments/${slug}/signup`;

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

/** Any control named like a sign-up, a net wider than the app's own `signUpLink`. */
export const SIGN_UP_CONTROL_PATTERN = /\bsign[ -]?up\b|\bregister\b|\benrol(l|ment)?\b|\benter now\b|\bpay\b/i;

/** The header total's wording, from the app's `pageTitle` copy: "Found 1 tournament." / "Found 3 tournaments.". */
export const HEADER_TOTAL_COPY = { prefix: 'Found', singular: 'tournament.', plural: 'tournaments.' } as const;

/** The list call only: `/api/v1/tournament` with or without a query, never `/tournament/<slug>`. */
export const TOURNAMENTS_LIST_API_ROUTE = /\/api\/v[12]\/tournament(?:\?|$)/i;

export const COMPETITOR_SIGN_IN_TEST_IDS = {
  root: 'competitor-sign-in',
  email: 'competitor-sign-in-email',
  button: 'competitor-sign-in-button',
} as const;

export const COMPETITOR_SIGN_IN_COPY = {
  heading: 'Competitor sign-in',
  emailLabel: 'Email (local sign-in)',
} as const;

export const SIGN_UP_PAGE_TEST_IDS = {
  root: 'sign-up-page',
  heading: 'sign-up-page-heading',
  divisionOption: 'sign-up-page-division-option',
  fee: 'sign-up-page-fee',
  under18: 'sign-up-page-under-18',
  submit: 'sign-up-page-submit',
} as const;

export const SIGN_UP_PAGE_COPY = {
  headingPrefix: 'Sign up for',
  underEighteen: 'You must be 18 or over on the tournament day to compete in this tournament.',
} as const;

/** Where the SPA keeps a local competitor session (`LOCAL_COMPETITOR_SESSION_KEY` in the app's `competitor-auth.ts`). */
/** Set once `startSignedIn` has seeded a tab, so a reload does not seed the same session again. */
export const SESSION_SEEDED_MARKER = 'pw.localCompetitorSessionSeeded';

export const LOCAL_COMPETITOR_SESSION_KEY = 'bjjeire.localCompetitorSession';

/** The two requests that take a place or open payment. No UI test may send them (data policy rule 5). */
export const SIGN_UP_SUBMIT_ROUTES = /\/api\/v[12]\/registration(?:\/[^/?]+\/checkout)?(?:\?|$)/i;

export const MY_SIGN_UPS_TEST_IDS = {
  root: 'my-sign-ups-page',
  empty: 'my-sign-ups-empty',
  row: 'my-sign-ups-row',
} as const;

export const MY_SIGN_UPS_COPY = {
  heading: 'My sign-ups',
  empty: 'You have not signed up for a tournament yet.',
} as const;

export const COMPETITOR_PROFILE_TEST_IDS = {
  accountLink: 'competitor-account-link',
  root: 'competitor-profile-page',
  email: 'competitor-profile-email',
  form: 'competitor-profile-form',
  submit: 'competitor-profile-submit',
  formNotice: 'competitor-profile-form-notice',
  academySearch: 'competitor-profile-academy-search',
  academyOption: 'competitor-profile-academy-option',
  academySelected: 'competitor-profile-academy-selected',
  historyGold: 'competitor-history-gold',
  historySilver: 'competitor-history-silver',
  historyBronze: 'competitor-history-bronze',
  historyEmpty: 'competitor-history-empty',
  historyRow: 'competitor-history-row',
  signOut: 'competitor-sign-out',
  delete: 'competitor-delete-account',
  deleteConfirm: 'competitor-delete-account-confirm',
} as const;

/** From the app's `uiContent.competitor` (`config/content/competitor.ts`). */
export const COMPETITOR_PROFILE_COPY = {
  createHeading: 'Create your competitor profile',
  savedHeading: 'My competitor profile',
  saved: 'Profile saved.',
  emailLabel: 'Signed in as',
  historyEmpty: 'You have not entered a tournament yet. Your medals will appear here.',
  academySelected: 'Selected',
  academyDirectory: 'My academy is in the BJJ Éire gym directory',
  academyTyped: 'My academy is not listed',
  academyNone: 'No academy',
  academySearch: 'Search the gym directory',
  academyName: 'Academy name',
  affiliation: 'Affiliation (optional)',
  firstName: 'First name',
  lastName: 'Last name',
  nationality: 'Nationality',
  dateOfBirth: 'Date of birth',
  gender: 'Gender',
  belt: 'Belt',
  signOut: 'Sign out',
  deleteAccount: 'Delete my account',
  deleteConfirm: 'Yes, delete my account',
} as const;

export const COMPETITOR_SIGN_IN_PROMPT = { button: 'Sign in or create an account' } as const;

/** The competitor's own sign-ups call (`GET /api/v1/registration/me`), with or without a query. */
export const OWN_SIGN_UPS_API_ROUTE = /\/api\/v[12]\/registration\/me(?:\?|$)/i;

/** The competitor's own profile call (`/api/v1/competitor/me`), with or without a query. */
export const OWN_COMPETITOR_API_ROUTE = /\/api\/v[12]\/competitor\/me(?:\?|$)/i;
