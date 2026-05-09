import type { Locator } from '@playwright/test';
import { readText, readTextIfVisible, type CardFieldTestIds } from '@ui/support/ui';

export type BjjEventCard = Readonly<{
  name: string;
  type: string;
  county: string;
  pricing: string | null;
  schedule: string | null;
}>;

const COUNTY_SUFFIX = /\s*county$/i;

const EVENT_CARD_TEST_IDS = {
  county: 'event-card-county',
  name: 'event-card-name',
  pricing: 'event-card-pricing',
  schedule: 'event-card-schedule',
  type: 'event-card-type',
} as const satisfies CardFieldTestIds<BjjEventCard>;

const stripCountySuffix = (raw: string): string => raw.replace(COUNTY_SUFFIX, '').trim();

export async function readEventCard(root: Locator): Promise<BjjEventCard> {
  const [name, type, countyRaw, pricing, schedule] = await Promise.all([
    readText(root.getByTestId(EVENT_CARD_TEST_IDS.name)),
    readText(root.getByTestId(EVENT_CARD_TEST_IDS.type)),
    readText(root.getByTestId(EVENT_CARD_TEST_IDS.county)),
    readTextIfVisible(root.getByTestId(EVENT_CARD_TEST_IDS.pricing)),
    readTextIfVisible(root.getByTestId(EVENT_CARD_TEST_IDS.schedule)),
  ]);

  return { name, type, county: stripCountySuffix(countyRaw), pricing, schedule };
}
