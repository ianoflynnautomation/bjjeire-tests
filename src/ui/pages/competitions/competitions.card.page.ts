import type { Locator } from '@playwright/test';
import { getText, getTextIfVisible } from '@ui/support';
import { readTaggedItemsIfVisible } from '../common/card.page';
import { COMPETITION_CARD_TEST_IDS } from './competitions.constants';
import { type CompetitionCard } from './competitions.types';

export type { CompetitionCard } from './competitions.types';

export async function getCompetitionCardData(locator: Locator): Promise<CompetitionCard> {
  const tagsContainer = locator.getByTestId(COMPETITION_CARD_TEST_IDS.tags);

  const [name, organisation, date, description, tags] = await Promise.all([
    getText(locator.getByTestId(COMPETITION_CARD_TEST_IDS.name)),
    getTextIfVisible(locator.getByTestId(COMPETITION_CARD_TEST_IDS.organisation)),
    getTextIfVisible(locator.getByTestId(COMPETITION_CARD_TEST_IDS.date)),
    getTextIfVisible(locator.getByTestId(COMPETITION_CARD_TEST_IDS.description)),
    readTaggedItemsIfVisible(tagsContainer, tagsContainer.getByTestId(COMPETITION_CARD_TEST_IDS.tagItem)),
  ]);

  return { name, organisation, date, description, tags };
}
