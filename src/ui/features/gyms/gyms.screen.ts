import type { Page } from '@playwright/test';
import { createListScreen, listScreenTestIds, type ListScreen } from '@ui/support/ui';
import { readGymCard, type GymCard } from './gym-card.screen';

export type GymsScreen = ListScreen<GymCard>;

export function createGymsScreen(page: Page): GymsScreen {
  return createListScreen<GymCard>(page, {
    route: '/gyms',
    testIds: listScreenTestIds('gyms', 'gym'),
    readCard: readGymCard,
  });
}
