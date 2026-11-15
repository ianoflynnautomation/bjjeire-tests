import type { Locator } from '@playwright/test';
import { getText, getTextIfPresent } from '@ui/support';
import { TEST_IDS, TOURNAMENT_CARD_TEST_IDS } from './tournaments.constants';
import type { TournamentCard } from './tournaments.types';

/** The badge is upper-cased by CSS, which `innerText` follows; the wording is the source text. */
async function readBadge(badge: Locator): Promise<string | null> {
  const field = badge.first();
  return (await field.isVisible()) ? ((await field.textContent()) ?? '').trim() : null;
}

export async function getTournamentCardData(locator: Locator): Promise<TournamentCard> {
  const [name, state, date, venue, fee, divisionCount] = await Promise.all([
    getText(locator.getByTestId(TEST_IDS.cardName)),
    readBadge(locator.getByTestId(TOURNAMENT_CARD_TEST_IDS.state)),
    getTextIfPresent(locator.getByTestId(TOURNAMENT_CARD_TEST_IDS.date)),
    getTextIfPresent(locator.getByTestId(TOURNAMENT_CARD_TEST_IDS.venue)),
    getTextIfPresent(locator.getByTestId(TOURNAMENT_CARD_TEST_IDS.fee)),
    getTextIfPresent(locator.getByTestId(TOURNAMENT_CARD_TEST_IDS.divisionCount)),
  ]);

  return { name, state, date, venue, fee, divisionCount };
}
