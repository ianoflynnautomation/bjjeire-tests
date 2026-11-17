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

/** The app's `bjjEireCompetitionDataTestIds`: the featured section, its list and one card. */
export const FEATURED_TEST_IDS = {
  section: 'bjjeire-competitions-featured',
  list: 'bjjeire-competitions-featured-list',
  card: 'bjjeire-competitions-featured-card',
} as const;

export const FEATURED_COPY = {
  heading: 'BJJ Éire competitions',
  intro: 'Competitions run by BJJ Éire. Sign up online.',
} as const;

export const BJJEIRE_COMPETITION_COPY = {
  notFoundTitle: 'Competition not found',
  notFoundBackLink: 'See all competitions',
  feeNote: 'per division',
  timeZoneNote: 'Irish time',
  viewLinkPrefix: 'View competition: ',
  competitorsTitle: 'Competitors',
  windowSeparator: 'to',
  signUp: 'Sign up',
} as const;

/** `9 November 2026, 16:37 to 16 December 2026, 16:37 (Irish time)`: the seed rolls the dates, so the shape is asserted. */
export const REGISTRATION_WINDOW_PATTERN =
  /^\d{1,2} \p{L}+ \d{4}, \d{2}:\d{2} to \d{1,2} \p{L}+ \d{4}, \d{2}:\d{2} \(Irish time\)$/u;

export const bjjEireCompetitionPath = (slug: string): string => `/competitions/${slug}`;

/** Where a BJJ Éire competition's sign-up control leads, relative to the site. */
export const bjjEireCompetitionSignUpPath = (slug: string): string => `${bjjEireCompetitionPath(slug)}/signup`;

export const BJJEIRE_COMPETITION_TEST_IDS = {
  root: 'bjjeire-competition-page',
  name: 'bjjeire-competition-page-name',
  date: 'bjjeire-competition-page-date',
  venue: 'bjjeire-competition-page-venue',
  fee: 'bjjeire-competition-page-fee',
  window: 'bjjeire-competition-page-registration-window',
  registrationStatus: 'bjjeire-competition-page-registration-status',
  registrationMessage: 'bjjeire-competition-page-registration-message',
  divisionGroup: 'bjjeire-competition-page-division-group',
  divisionRow: 'bjjeire-competition-page-division-row',
  leaderboard: 'bjjeire-competition-leaderboard',
  leaderboardPodium: 'bjjeire-competition-leaderboard-podium',
  leaderboardGold: 'bjjeire-competition-leaderboard-gold',
  leaderboardEmpty: 'bjjeire-competition-leaderboard-empty',
  leaderboardNoPoints: 'bjjeire-competition-leaderboard-no-points',
  competitors: 'bjjeire-competition-competitors',
  competitorsDivision: 'bjjeire-competition-competitors-division',
  competitorsRow: 'bjjeire-competition-competitors-row',
  signUpLink: 'bjjeire-competition-sign-up-link',
  mySignUpsLink: 'bjjeire-competition-my-sign-ups-link',
} as const;

/** The featured call only: `/api/v1/bjjeire-competition` with or without a query, never `/bjjeire-competition/<slug>`. */
export const BJJEIRE_COMPETITIONS_API_ROUTE = /\/api\/v1\/bjjeire-competition(?:\?|$)/i;

/** The Events page's header, the app's default page: where a retired address lands. */
export const DEFAULT_PAGE_HEADER_TEST_ID = 'events-page-header';

/** The organiser's management screen (`/admin/competitions`), behind the organiser sign-in gate. */
export const BJJEIRE_COMPETITION_ADMIN_TEST_IDS = {
  signIn: 'bjjeire-competition-admin-sign-in',
  signInButton: 'bjjeire-competition-admin-sign-in-button',
  list: 'bjjeire-competition-admin-list',
  listItem: 'bjjeire-competition-admin-list-item',
} as const;

export const BJJEIRE_COMPETITION_ADMIN_COPY = {
  route: '/admin/competitions',
  signInHeading: 'Organiser sign-in',
  signInButton: 'Sign in',
} as const;

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
  underEighteen: 'You must be 18 or over on the competition day to compete in this competition.',
} as const;

/** Set once `startSignedIn` has seeded a tab, so a reload does not seed the same session again. */
export const SESSION_SEEDED_MARKER = 'pw.localCompetitorSessionSeeded';

/** Where the SPA keeps a local competitor session (`LOCAL_COMPETITOR_SESSION_KEY` in the app's `competitor-auth.ts`). */
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
  empty: 'You have not signed up for a competition yet.',
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
  historyEmpty: 'You have not entered a competition yet. Your medals will appear here.',
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
