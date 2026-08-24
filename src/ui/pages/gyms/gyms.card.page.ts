import type { Locator } from '@playwright/test';
import { getText, getTextIfPresent } from '@ui/support';
import { readTaggedItemsIfPresent } from '../common/card.page';
import { GYM_CARD_TEST_IDS, GYM_CLASS_ITEM_TEST_ID } from './gyms.constants';
import { type GymCard } from './gyms.types';

export async function getGymCardData(locator: Locator): Promise<GymCard> {
  const classesContainer = locator.getByTestId(GYM_CARD_TEST_IDS.classes);

  const [name, status, county, classes] = await Promise.all([
    getText(locator.getByTestId(GYM_CARD_TEST_IDS.name)),
    getTextIfPresent(locator.getByTestId(GYM_CARD_TEST_IDS.status)),
    getText(locator.getByTestId(GYM_CARD_TEST_IDS.county)),
    readTaggedItemsIfPresent(classesContainer, classesContainer.getByTestId(GYM_CLASS_ITEM_TEST_ID)),
  ]);

  return { name, status, county, classes };
}
