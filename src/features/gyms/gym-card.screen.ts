import type { Locator, Page } from '@playwright/test';
import { createScreenDriver } from '@shared/ui';

/**
 * Mirrors src/constants/gymDataTestIds.ts (GymCardTestIds) in the app.
 * Keep in sync when the frontend constants change.
 */
export const GYM_CARD_IDS = {
  image: 'gym-card-image',
  imageFallback: 'gym-card-image-fallback',
  imageSkeleton: 'gym-card-image-skeleton',
  name: 'gym-card-name',
  statusBadge: 'gym-card-status-badge',
  county: 'gym-card-county',
  address: 'gym-card-address',
  addressLink: 'gym-card-address-link',
  timetable: 'gym-card-timetable',
  timetableLink: 'gym-card-timetable-link',
  classes: 'gym-card-classes',
  classesItem: 'gym-card-classes-item',
  trialOffer: 'gym-card-trial-offer',
  socialMedia: 'gym-card-social-media',
  websiteLink: 'gym-card-website-link',
} as const;

/**
 * Strongly-typed handle over a single gym card. Fields are lazy locators -
 * they don't touch the DOM until you assert or read from them.
 */
export type GymCard = Readonly<{
  root: Locator;
  name: Locator;
  county: Locator;
  statusBadge: Locator;
  image: Locator;
  imageFallback: Locator;
  addressLink: Locator;
  timetableLink: Locator;
  classes: Locator;
  websiteLink: Locator;
  readName: () => Promise<string>;
  readCounty: () => Promise<string>;
  expectVisible: () => Promise<void>;
}>;

function stripCountySuffix(raw: string): string {
  return raw.replace(/\s*county$/i, '').trim();
}

export function wrapGymCard(root: Locator): GymCard {
  const screen = createScreenDriver(root.page());
  const name = root.getByTestId(GYM_CARD_IDS.name);

  return {
    root,
    name,
    county: root.getByTestId(GYM_CARD_IDS.county),
    statusBadge: root.getByTestId(GYM_CARD_IDS.statusBadge),
    image: root.getByTestId(GYM_CARD_IDS.image),
    imageFallback: root.getByTestId(GYM_CARD_IDS.imageFallback),
    addressLink: root.getByTestId(GYM_CARD_IDS.addressLink),
    timetableLink: root.getByTestId(GYM_CARD_IDS.timetableLink),
    classes: root.getByTestId(GYM_CARD_IDS.classes),
    websiteLink: root.getByTestId(GYM_CARD_IDS.websiteLink),

    async readName() {
      return (await name.innerText()).trim();
    },

    async readCounty() {
      const raw = (await root.getByTestId(GYM_CARD_IDS.county).innerText()).trim();
      return stripCountySuffix(raw);
    },

    async expectVisible() {
      await screen.assertions.expectElementVisible(root);
      await screen.assertions.expectElementVisible(name);
    },
  };
}

/**
 * Collection facade over the rendered list of gym cards. Returned by
 * `gymsScreen.cards` - gives tests a single object for card queries without
 * exposing the raw Locator chain.
 */
export type GymCards = Readonly<{
  all: () => GymCard[];
  getAll: () => Promise<GymCard[]>;
  count: () => Promise<number>;
  at: (index: number) => GymCard;
  first: () => GymCard;
  byName: (name: string) => GymCard;
  byNameContaining: (fragment: string) => GymCard;
  readAllCounties: () => Promise<string[]>;
  readAllNames: () => Promise<string[]>;
}>;

export function createGymCards(page: Page, listItemTestId: string): GymCards {
  const items = page.getByTestId(listItemTestId);

  return {
    all() {
      throw new Error('GymCards.all() is async - use getAll()');
    },

    async getAll() {
      const count = await items.count();
      return Array.from({ length: count }, (_, i) => wrapGymCard(items.nth(i)));
    },

    async count() {
      return items.count();
    },

    at(index) {
      return wrapGymCard(items.nth(index));
    },

    first() {
      return wrapGymCard(items.first());
    },

    byName(name) {
      return wrapGymCard(
        items.filter({ has: page.getByTestId(GYM_CARD_IDS.name).and(page.getByText(name, { exact: true })) }),
      );
    },

    byNameContaining(fragment) {
      return wrapGymCard(
        items.filter({ has: page.getByTestId(GYM_CARD_IDS.name).and(page.getByText(fragment, { exact: false })) }),
      );
    },

    async readAllCounties() {
      const cards = await this.getAll();
      return Promise.all(cards.map(c => c.readCounty()));
    },

    async readAllNames() {
      const cards = await this.getAll();
      return Promise.all(cards.map(c => c.readName()));
    },
  };
}
