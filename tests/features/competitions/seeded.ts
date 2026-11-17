import type { CompetitionDto } from '@api/features/competitions/competitions.types';
import type { FeaturedCompetitionExpectation } from '@ui/pages/competitions/competitions.types';
import type {
  BjjEireCompetition,
  BjjEireCompetitionsPage,
  BjjEireLeaderboard,
} from '@api/features/competitions/bjjeire-competitions.schemas';
import type { CompetitionId } from '@shared/types';
import { partialNameOf } from '../common/testdata/seeded/partial-name';
import { registrationOpensSentence, type RegistrationWindow } from './seed-facts';

const competitionId = (id: string): CompetitionId => id as CompetitionId;

export const SEEDED_COMPETITION_ATHLONE_INVITATIONAL: CompetitionDto = {
  id: competitionId('acce77000000000000000001'),
  slug: 'athlone-grappling-invitational',
  name: 'Athlone Grappling Invitational',
  description: 'Midlands gi and no-gi invitational held in Athlone.',
  organisation: 'Athlone Grappling',
  country: 'Ireland',
  websiteUrl: 'https://athlone-grappling.example.ie/invitational',
  registrationUrl: 'https://athlone-grappling.example.ie/invitational/register',
  tags: ['gi', 'no-gi', 'invitational'],
  isActive: true,
};

export const SEEDED_COMPETITION_WICKLOW_NO_GI: CompetitionDto = {
  id: competitionId('acce77000000000000000002'),
  slug: 'wicklow-no-gi-open',
  name: 'Wicklow No-Gi Open',
  description: 'One-day no-gi submission-only open in Wicklow.',
  organisation: 'Wicklow BJJ',
  country: 'Ireland',
  websiteUrl: 'https://wicklowbjj.example.ie/no-gi-open',
  registrationUrl: 'https://wicklowbjj.example.ie/no-gi-open/register',
  tags: ['no-gi', 'submission-only', 'open'],
  isActive: true,
};

export const SEEDED_COMPETITION_SHANNONSIDE_CHAMPIONSHIP: CompetitionDto = {
  id: competitionId('acce77000000000000000003'),
  slug: 'shannonside-bjj-championship',
  name: 'Shannonside BJJ Championship',
  description: 'Regional gi championship along the Shannon.',
  organisation: 'Shannonside Grappling',
  country: 'Ireland',
  websiteUrl: 'https://shannonside-grappling.example.ie/championship',
  registrationUrl: 'https://shannonside-grappling.example.ie/championship/register',
  tags: ['gi', 'championship'],
  isActive: true,
};

export const SEEDED_COMPETITION_DONEGAL_GI_CLASSIC: CompetitionDto = {
  id: competitionId('acce77000000000000000004'),
  slug: 'donegal-winter-gi-classic',
  name: 'Donegal Winter Gi Classic',
  description: 'North-west winter gi competition in Letterkenny.',
  organisation: 'Donegal BJJ',
  country: 'Ireland',
  websiteUrl: 'https://donegalbjj.example.ie/winter-gi-classic',
  registrationUrl: 'https://donegalbjj.example.ie/winter-gi-classic/register',
  tags: ['gi', 'winter'],
  isActive: true,
};

export const SEEDED_COMPETITION_DONEGAL_GI_CLASSIC_PARTIAL_NAME = partialNameOf(
  SEEDED_COMPETITION_DONEGAL_GI_CLASSIC,
  'Donegal Winter',
);

export const SEEDED_COMPETITION_FINISHED_KERRY_COAST: CompetitionDto = {
  id: competitionId('acce77000000000000000005'),
  slug: 'kerry-coast-open-mat',
  name: 'Kerry Coast Open Mat',
  description:
    'Casual coastal open-mat gathering — already finished, used to prove past competitions are excluded from the published listing.',
  organisation: 'Kerry Coast BJJ',
  country: 'Ireland',
  websiteUrl: 'https://kerrycoastbjj.example.ie/open-mat',
  tags: ['open-mat', 'social'],
  isActive: true,
};

export const SEEDED_COMPETITIONS_BY_START_DATE: readonly CompetitionDto[] = [
  SEEDED_COMPETITION_ATHLONE_INVITATIONAL,
  SEEDED_COMPETITION_WICKLOW_NO_GI,
  SEEDED_COMPETITION_SHANNONSIDE_CHAMPIONSHIP,
  SEEDED_COMPETITION_DONEGAL_GI_CLASSIC,
];

/**
 * Seeded acceptance BJJ Éire competitions (bjjeire-java seeder data-test), earliest day first.
 * Only `acceptance-open` (opens 7 days before the seed run, closes 30 days after it, so "Open" for about 30 days after
 * a seed) and `acceptance-closed` (closed the day before the seed run, so "Closed" from then on) are seed-relative.
 * `acceptance-opens-later` has a fixed window in 2035 (1 to 25 May), so its "Not open yet" badge does not roll.
 */
export const SEEDED_FEATURED_COMPETITIONS = [
  {
    name: 'Acceptance Open',
    date: '2 June 2035',
    venue: 'National Indoor Arena',
    fee: '€25.00',
    divisions: '5 divisions',
    status: 'Open',
  },
  {
    name: 'Acceptance Opens Later',
    date: '2 June 2035',
    venue: 'National Indoor Arena',
    fee: '€25.00',
    divisions: '5 divisions',
    status: 'Not open yet',
  },
  {
    name: 'Acceptance Closed',
    date: '14 July 2035',
    venue: 'UL Sport Arena',
    fee: '€30.00',
    divisions: '5 divisions',
    status: 'Closed',
  },
] as const satisfies readonly FeaturedCompetitionExpectation[];

/**
 * Seeded BJJ Éire competitions whose page offers no sign-up. Each is outside its registration window by
 * construction: `acceptance-opens-later` has a fixed window in 2035 (opens 1 May 2035) and `acceptance-closed` closed the
 * day before the seed run. The not-open-yet sentence names the seeded opening instant, read from the API at run time
 * and shown on the Irish clock; the closed sentence is fixed copy.
 */
export const SEEDED_REGISTRATION_NOT_OFFERED = [
  {
    state: 'not open yet',
    slug: 'acceptance-opens-later',
    name: 'Acceptance Opens Later',
    badge: 'Not open yet',
    sentenceLabel: 'when registration opens, in Irish time',
    sentence: registrationOpensSentence,
  },
  {
    state: 'closed',
    slug: 'acceptance-closed',
    name: 'Acceptance Closed',
    badge: 'Closed',
    sentenceLabel: 'that registration is closed',
    sentence: (): string => 'Registration is closed.',
  },
] as const satisfies readonly {
  state: string;
  slug: string;
  name: string;
  badge: string;
  sentenceLabel: string;
  sentence: (window: RegistrationWindow) => string;
}[];

/**
 * The seeded finished BJJ Éire competition (fixed: its dates and results do not roll). Its recorded podium
 * in the Gi female adult blue -64 kg division is written out from the seed files, not read from the page.
 */
export const SEEDED_FINISHED_COMPETITION = {
  slug: 'acceptance-finished',
  name: 'Acceptance Finished',
  badge: 'Finished',
  sentence: 'This competition has finished.',
  podiumDivision: 'Gi · Female · Adult · Blue · -64 kg',
  podiumGold: 'Aoife Ní Bhriain',
} as const;

/**
 * The seeded finished competition's confirmed competitors in two divisions, written out from the seeder
 * (listed by display name, as the competitors endpoint returns them) with `academy · affiliation` as shown.
 */
export const SEEDED_FINISHED_COMPETITORS = {
  white76: {
    heading: 'Gi · Male · Adult · White · -76 kg (4 competitors)',
    competitors: [
      { name: 'Cian Walsh', team: 'Liffey BJJ · Atlantic Alliance' },
      { name: 'Darragh Kelly', team: 'No academy' },
      { name: 'Oisín Byrne', team: 'Shannon Combat Club' },
      { name: 'Seán Murphy', team: 'Lee Valley Jiu-Jitsu · Celtic Collective' },
    ],
  },
  brown943: {
    heading: 'Gi · Male · Adult · Brown · -94.3 kg (1 competitor)',
    competitors: [{ name: 'Tadhg Quinn', team: 'Shannon Combat Club' }],
  },
} as const;

/**
 * The seeded finished competition's one-competitor division: Tadhg Quinn alone, recorded as gold. The note is the
 * product spec's copy for a division with fewer than two competitors.
 */
export const SEEDED_ONE_COMPETITOR_PODIUM = {
  division: 'Gi · Male · Adult · Brown · -94.3 kg',
  gold: 'Tadhg Quinn',
  note: 'Only one competitor took part, so this division adds no team points.',
} as const;

type SeededUpcomingBjjEireCompetition = Pick<
  BjjEireCompetitionsPage['data'][number],
  'slug' | 'name' | 'date' | 'entryFeeCents' | 'currency' | 'registrationState' | 'divisionCount'
> & { venue: string; registrationStateRolls: boolean };

/**
 * The three upcoming acceptance BJJ Éire competitions, written from the bjjeire-java seeder
 * (`seeder/data-test/bjjeire-competitions/`): slug, day, venue, fee in euro cents, currency, division count and
 * registration state. Days are the seed's fixed ISO dates. Only `acceptance-open`'s window is relative to the seed run
 * (opens 7 days before it, closes 30 days after it), so its state is `registrationStateRolls`: checked against the enum
 * only, and a test that must not take a place reads the live state first. `acceptance-opens-later` has a fixed window
 * in 2035 (NOT_OPEN until 1 May 2035) and `acceptance-closed` closed the day before the seed run (CLOSED from then on),
 * so both are asserted exactly. It has its own day, venue and fee, so a card showing another competition's values is caught.
 */
export const SEEDED_BJJEIRE_OPEN = {
  slug: 'acceptance-open',
  date: '2035-06-02',
  registrationState: 'OPEN',
  registrationStateRolls: true,
  name: 'Acceptance Open',
  venue: 'National Indoor Arena',
  entryFeeCents: 2500,
  currency: 'EUR',
  divisionCount: 5,
} as const satisfies SeededUpcomingBjjEireCompetition;

export const SEEDED_BJJEIRE_OPENS_LATER = {
  slug: 'acceptance-opens-later',
  date: '2035-06-02',
  registrationState: 'NOT_OPEN',
  registrationStateRolls: false,
  name: 'Acceptance Opens Later',
  venue: 'National Indoor Arena',
  entryFeeCents: 2500,
  currency: 'EUR',
  divisionCount: 5,
} as const satisfies SeededUpcomingBjjEireCompetition;

export const SEEDED_BJJEIRE_CLOSED = {
  slug: 'acceptance-closed',
  date: '2035-07-14',
  registrationState: 'CLOSED',
  registrationStateRolls: false,
  name: 'Acceptance Closed',
  venue: 'UL Sport Arena',
  entryFeeCents: 3000,
  currency: 'EUR',
  divisionCount: 5,
} as const satisfies SeededUpcomingBjjEireCompetition;

/** The API oracle for the upcoming listing: the three above, earliest day then name. */
export const SEEDED_UPCOMING_BJJEIRE_COMPETITIONS = [
  SEEDED_BJJEIRE_OPEN,
  SEEDED_BJJEIRE_OPENS_LATER,
  SEEDED_BJJEIRE_CLOSED,
] as const;

/** `acceptance-open`'s five divisions by discipline and gender, as its page groups them, from the seed file. */
export const SEEDED_BJJEIRE_OPEN_DIVISION_GROUPS = [
  { label: 'Gi · Male', rows: 2 },
  { label: 'Gi · Female', rows: 1 },
  { label: 'No-Gi · Male', rows: 1 },
  { label: 'No-Gi · Female', rows: 1 },
] as const;

/**
 * The one `acceptance-open` division a white-belt adult man may enter, as the sign-up page words it
 * (`<discipline> · <gender> · <age> · <belt> · <weight>`), from the seed file.
 */
export const SEEDED_BJJEIRE_OPEN_WHITE_BELT_MALE_DIVISIONS = ['Gi · Male · Adult · White · -76 kg'] as const;

/** `acceptance-open`'s one division for a blue-belt adult man, in the sign-up page's wording. */
export const SEEDED_BJJEIRE_OPEN_BLUE_BELT_MALE_DIVISIONS = ['Gi · Male · Adult · Blue · -82.3 kg'] as const;

/** `acceptance-open`'s other four divisions: another gender, belt or age category than a blue-belt adult man. */
export const SEEDED_BJJEIRE_OPEN_OTHER_DIVISIONS = [
  'Gi · Male · Adult · White · -76 kg',
  'Gi · Female · Adult · White · -64 kg',
  'No-Gi · Male · Master 1 · Purple · -85.5 kg',
  'No-Gi · Female · Adult · Blue · -66.5 kg',
] as const;

/**
 * A gym from the gym directory, for the competitor profile's academy picker. Recorded here, not imported, because a
 * feature never imports another feature: it is `SEEDED_GYM_BLACKWATER_VALLEY` in `tests/features/gyms/seeded.ts`,
 * from the app's test dataset (`bjjeire-java/seeder/data-test/gyms/`). Update both when the seed changes.
 */
export const SEEDED_DIRECTORY_GYM_NAME = 'Blackwater Valley BJJ';
export const SEEDED_DIRECTORY_GYM_PARTIAL_NAME = partialNameOf({ name: SEEDED_DIRECTORY_GYM_NAME }, 'Blackwater');

/** The seeded open competition (`acceptance-open`): upcoming, with no recorded result. Its id is fixed in the seeder. */
export const SEEDED_OPEN_COMPETITION_ID = competitionId('acce88000000000000000001');

/**
 * `acceptance-open`'s five division ids in the competition's order, from the seeder. The seed holds no sign-up for it,
 * so a freshly seeded stack lists each with no competitor (a hand-made confirmed sign-up shows up until a reseed).
 */
export const SEEDED_OPEN_DIVISION_IDS = [
  'acce99000000000000000101',
  'acce99000000000000000102',
  'acce99000000000000000103',
  'acce99000000000000000104',
  'acce99000000000000000105',
] as const;

/**
 * The seeded finished competition's details and divisions, written out from the seeder (fixed dates; the
 * registration window is in the past, so state CLOSED does not roll). Divisions are in seeded order.
 */
export const SEEDED_FINISHED_COMPETITION_DETAIL = {
  id: competitionId('acce88000000000000000004'),
  slug: 'acceptance-finished',
  name: 'Acceptance Finished',
  date: '2026-03-14',
  venue: 'University of Galway Sports Centre',
  entryFeeCents: 3000,
  currency: 'EUR',
  competitorLimit: 64,
  placesTaken: 13,
  status: 'FINISHED',
  registrationState: 'CLOSED',
  divisions: [
    {
      id: 'acce99000000000000000401',
      discipline: 'GI',
      gender: 'MALE',
      ageCategory: 'ADULT',
      belt: 'WHITE',
      weightClass: '-76 kg',
    },
    {
      id: 'acce99000000000000000402',
      discipline: 'GI',
      gender: 'FEMALE',
      ageCategory: 'ADULT',
      belt: 'BLUE',
      weightClass: '-64 kg',
    },
    {
      id: 'acce99000000000000000403',
      discipline: 'NO_GI',
      gender: 'MALE',
      ageCategory: 'MASTER_1',
      belt: 'PURPLE',
      weightClass: '-85.5 kg',
    },
    {
      id: 'acce99000000000000000404',
      discipline: 'NO_GI',
      gender: 'FEMALE',
      ageCategory: 'ADULT',
      belt: 'BLUE',
      weightClass: '-64 kg',
    },
    {
      id: 'acce99000000000000000405',
      discipline: 'GI',
      gender: 'MALE',
      ageCategory: 'ADULT',
      belt: 'BROWN',
      weightClass: '-94.3 kg',
    },
  ],
} as const satisfies Omit<
  BjjEireCompetition,
  'venue' | 'description' | 'registrationOpensAt' | 'registrationClosesAt'
> & {
  venue: string;
};

/**
 * The API oracle for the competitors endpoint, from the bjjeire-java seeder (`acceptance-finished` registrations,
 * CONFIRMED only: the cancelled Fionn Daly is not listed). Keyed by division id, listed by display name. A missing
 * academy or affiliation is a key the entry does not carry.
 */
export const SEEDED_FINISHED_COMPETITORS_BY_DIVISION: Readonly<
  Record<string, readonly Readonly<{ displayName: string; academy?: string; affiliation?: string }>[]>
> = {
  acce99000000000000000401: [
    { displayName: 'Cian Walsh', academy: 'Liffey BJJ', affiliation: 'Atlantic Alliance' },
    { displayName: 'Darragh Kelly' },
    { displayName: 'Oisín Byrne', academy: 'Shannon Combat Club' },
    { displayName: 'Seán Murphy', academy: 'Lee Valley Jiu-Jitsu', affiliation: 'Celtic Collective' },
  ],
  acce99000000000000000402: [
    { displayName: 'Aoife Ní Bhriain', academy: 'Liffey BJJ', affiliation: 'Atlantic Alliance' },
    { displayName: 'Niamh Brennan', academy: 'Lee Valley Jiu-Jitsu', affiliation: 'Celtic Collective' },
    { displayName: 'Róisín Doyle', academy: 'Corrib Grappling', affiliation: 'Atlantic Alliance' },
  ],
  acce99000000000000000403: [
    { displayName: "Ciarán O'Neill", academy: 'Shannon Combat Club' },
    { displayName: 'Eoin Fitzgerald', academy: 'Corrib Grappling', affiliation: 'Atlantic Alliance' },
    { displayName: 'Pádraig Ryan', academy: 'Lee Valley Jiu-Jitsu', affiliation: 'Celtic Collective' },
  ],
  acce99000000000000000404: [
    { displayName: 'Aoife Ní Bhriain', academy: 'Liffey BJJ', affiliation: 'Atlantic Alliance' },
    { displayName: 'Niamh Brennan', academy: 'Lee Valley Jiu-Jitsu', affiliation: 'Celtic Collective' },
  ],
  acce99000000000000000405: [{ displayName: 'Tadhg Quinn', academy: 'Shannon Combat Club' }],
};

/**
 * The leaderboard oracle for `acceptance-finished`, worked out by hand from the seeded podiums (9 per gold, 3 per
 * silver, 1 per bronze; the one-competitor division 405 adds no points). Not read from a response.
 */
export const SEEDED_FINISHED_LEADERBOARD = {
  academyRanking: [
    { rank: 1, name: 'Lee Valley Jiu-Jitsu', points: 22, gold: 2, silver: 1, bronze: 1 },
    { rank: 2, name: 'Liffey BJJ', points: 15, gold: 1, silver: 2, bronze: 0 },
    { rank: 3, name: 'Corrib Grappling', points: 12, gold: 1, silver: 1, bronze: 0 },
    { rank: 4, name: 'Shannon Combat Club', points: 2, gold: 0, silver: 0, bronze: 2 },
  ],
  affiliationRanking: [
    { rank: 1, name: 'Atlantic Alliance', points: 27, gold: 2, silver: 3, bronze: 0 },
    { rank: 2, name: 'Celtic Collective', points: 22, gold: 2, silver: 1, bronze: 1 },
  ],
  winners: { academies: ['Lee Valley Jiu-Jitsu'], affiliations: ['Atlantic Alliance'] },
  /** Division ids in competition order, with whether points were awarded (false: one competitor, FR-035). */
  pointsAwardedByDivision: [
    ['acce99000000000000000401', true],
    ['acce99000000000000000402', true],
    ['acce99000000000000000403', true],
    ['acce99000000000000000404', true],
    ['acce99000000000000000405', false],
  ],
} as const satisfies Pick<BjjEireLeaderboard, 'academyRanking' | 'affiliationRanking' | 'winners'> & {
  pointsAwardedByDivision: readonly (readonly [string, boolean])[];
};
