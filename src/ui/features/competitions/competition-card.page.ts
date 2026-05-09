import type { Locator } from '@playwright/test';
import { readTaggedItemsIfVisible, readText, readTextIfVisible, type CardFieldTestIds } from '@ui/support/ui';

export type CompetitionCard = Readonly<{
  name: string;
  organisation: string | null;
  date: string | null;
  description: string | null;
  tags: string[];
}>;

const COMPETITION_CARD_TEST_IDS = {
  date: 'competition-card-date',
  description: 'competition-card-description',
  name: 'competition-card-name',
  organisation: 'competition-card-organisation',
  tags: 'competition-card-tags',
} as const satisfies CardFieldTestIds<CompetitionCard>;

const COMPETITION_CARD_TAG_ITEM_TEST_ID = 'competition-card-tag-item';

export async function readCompetitionCard(root: Locator): Promise<CompetitionCard> {
  const tagsContainer = root.getByTestId(COMPETITION_CARD_TEST_IDS.tags);

  const [name, organisation, date, description, tags] = await Promise.all([
    readText(root.getByTestId(COMPETITION_CARD_TEST_IDS.name)),
    readTextIfVisible(root.getByTestId(COMPETITION_CARD_TEST_IDS.organisation)),
    readTextIfVisible(root.getByTestId(COMPETITION_CARD_TEST_IDS.date)),
    readTextIfVisible(root.getByTestId(COMPETITION_CARD_TEST_IDS.description)),
    readTaggedItemsIfVisible(tagsContainer, tagsContainer.getByTestId(COMPETITION_CARD_TAG_ITEM_TEST_ID)),
  ]);

  return { name, organisation, date, description, tags };
}
