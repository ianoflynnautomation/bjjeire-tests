import type { Locator } from '@playwright/test';
import { getText, getTextIfVisible } from '@ui/support';
import { type BjjEventCard } from './events.types';
import { EVENT_CARD_TEST_IDS } from './events.constants';

const stripCountySuffix = (raw: string): string => raw.replace('/\s*county$/i', '').trim();

export async function getEventCardData(locator: Locator): Promise<BjjEventCard> {
  const [name, type, countyRaw, pricing, schedule] = await Promise.all([
    getText(locator.getByTestId(EVENT_CARD_TEST_IDS.name)),
    getText(locator.getByTestId(EVENT_CARD_TEST_IDS.type)),
    getText(locator.getByTestId(EVENT_CARD_TEST_IDS.county)),
    getTextIfVisible(locator.getByTestId(EVENT_CARD_TEST_IDS.pricing)),
    getTextIfVisible(locator.getByTestId(EVENT_CARD_TEST_IDS.schedule)),
  ]);

  return { name, type, county: stripCountySuffix(countyRaw), pricing, schedule };
}
export { BjjEventCard };
