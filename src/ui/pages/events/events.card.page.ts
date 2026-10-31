import type { Locator } from '@playwright/test';
import { getAttributeIfPresent, getText, getTextIfPresent } from '@ui/support';
import { type BjjEventCard } from './events.types';
import { EVENT_CARD_SESSION_TEST_ID, EVENT_CARD_TEST_IDS } from './events.constants';

const stripCountySuffix = (raw: string): string => raw.replace(/\s*county$/i, '').trim();

// Fixed-date sessions render as "November 23, 2026: 10:00 AM–4:00 PM · Day 1 - Gi Camp".
// The seeder places dates relative to seed time, so only the time and title are stable.
const stripSessionDate = (line: string): string => line.replace(/^[A-Z][a-z]+ \d{1,2}, \d{4}: /, '');

async function getJoinedText(locator: Locator, separator: string): Promise<string | null> {
  const texts = await locator.allInnerTexts();
  if (texts.length === 0) return null;
  return texts.map(text => text.trim()).join(separator);
}

export async function getEventCardData(locator: Locator): Promise<BjjEventCard> {
  const [name, type, countyRaw, pricing, schedule, sessions, address, mapUrl, organiserUrl, moreInfoUrl] =
    await Promise.all([
      getText(locator.getByTestId(EVENT_CARD_TEST_IDS.name)),
      getJoinedText(locator.getByTestId(EVENT_CARD_TEST_IDS.type), ' '),
      getText(locator.getByTestId(EVENT_CARD_TEST_IDS.county)),
      getJoinedText(locator.getByTestId(EVENT_CARD_TEST_IDS.pricing), ' | '),
      getTextIfPresent(locator.getByTestId(EVENT_CARD_TEST_IDS.schedule)),
      locator.getByTestId(EVENT_CARD_SESSION_TEST_ID).allInnerTexts(),
      getTextIfPresent(locator.getByTestId(EVENT_CARD_TEST_IDS.address)),
      getAttributeIfPresent(locator.getByTestId(EVENT_CARD_TEST_IDS.addressLink), 'href'),
      getAttributeIfPresent(locator.getByTestId(EVENT_CARD_TEST_IDS.organiserLink), 'href'),
      getAttributeIfPresent(locator.getByTestId(EVENT_CARD_TEST_IDS.moreInfoLink), 'href'),
    ]);

  return {
    name,
    type: type ?? '',
    county: stripCountySuffix(countyRaw),
    pricing,
    schedule,
    sessions: sessions.map(line => stripSessionDate(line.trim())),
    address,
    mapUrl,
    organiserUrl,
    moreInfoUrl,
  };
}
