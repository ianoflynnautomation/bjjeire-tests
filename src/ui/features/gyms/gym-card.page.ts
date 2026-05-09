import type { Locator } from '@playwright/test';
import { readTaggedItemsIfVisible, readText, readTextIfVisible, type CardFieldTestIds } from '@ui/support/ui';

export type GymCard = Readonly<{
  name: string;
  status: string | null;
  county: string;
  classes: string[];
}>;

const GYM_CARD_TEST_IDS = {
  classes: 'gym-card-classes',
  county: 'gym-card-county',
  name: 'gym-card-name',
  status: 'gym-card-status-badge',
} as const satisfies CardFieldTestIds<GymCard>;

const GYM_CLASS_ITEM_TEST_ID = 'gym-card-classes-item';

export async function readGymCard(root: Locator): Promise<GymCard> {
  const classesContainer = root.getByTestId(GYM_CARD_TEST_IDS.classes);

  const [name, status, county, classes] = await Promise.all([
    readText(root.getByTestId(GYM_CARD_TEST_IDS.name)),
    readTextIfVisible(root.getByTestId(GYM_CARD_TEST_IDS.status)),
    readText(root.getByTestId(GYM_CARD_TEST_IDS.county)),
    readTaggedItemsIfVisible(classesContainer, classesContainer.getByTestId(GYM_CLASS_ITEM_TEST_ID)),
  ]);

  return { name, status, county, classes };
}
