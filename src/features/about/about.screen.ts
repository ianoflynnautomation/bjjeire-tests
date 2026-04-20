import type { Page } from '@playwright/test';
import { createScreenDriver } from '@shared/ui';

export type AboutScreen = Readonly<{
  navigate: () => Promise<void>;
  verifyIsLoaded: () => Promise<void>;
  verifyOurMissionSection: () => Promise<void>;
}>;

export const ABOUT_TEST_IDS = {
  missionHeading: 'about-mission-heading',
} as const;

export function createAboutScreen(page: Page): AboutScreen {
  const screen = createScreenDriver(page);
  const main = page.getByRole('main');
  const missionHeading = page.getByTestId(ABOUT_TEST_IDS.missionHeading);

  return {
    async navigate() {
      await screen.actions.navigate('/about');
    },
    async verifyIsLoaded() {
      await screen.assertions.expectToHaveURL(/\/about$/);
      await screen.assertions.expectElementVisible(main);
    },
    async verifyOurMissionSection() {
      await screen.assertions.expectToHaveText(missionHeading, 'Our Mission');
    },
  };
}
