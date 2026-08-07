import type { Locator } from '@playwright/test';
import { getText, getTextIfPresent } from '@ui/support';
import { type BjjEventCard } from './events.types';
import { EVENT_CARD_TEST_IDS } from './events.constants';

const stripCountySuffix = (raw: string): string => raw.replace(/\s*county$/i, '').trim();

async function getJoinedText(locator: Locator, separator: string): Promise<string | null> {
  const texts = await locator.allInnerTexts();
  if (texts.length === 0) return null;
  return texts.map(text => text.trim()).join(separator);
}

export async function getEventCardData(locator: Locator): Promise<BjjEventCard> {
  const [name, type, countyRaw, pricing, schedule] = await Promise.all([
    getText(locator.getByTestId(EVENT_CARD_TEST_IDS.name)),
    getJoinedText(locator.getByTestId(EVENT_CARD_TEST_IDS.type), ' '),
    getText(locator.getByTestId(EVENT_CARD_TEST_IDS.county)),
    getJoinedText(locator.getByTestId(EVENT_CARD_TEST_IDS.pricing), ' | '),

    getTextIfPresent(locator.getByTestId(EVENT_CARD_TEST_IDS.schedule)),
  ]);

  return { name, type: type ?? '', county: stripCountySuffix(countyRaw), pricing, schedule };
}
