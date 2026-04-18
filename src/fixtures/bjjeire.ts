import { test as base } from './base';
import { createNavBar, type NavBar } from '@lib/ui';
import { createAboutPage, type AboutPage } from '@features/about/about.page';
import { createCompetitionsPage, type CompetitionsPage } from '@features/competitions/competitions.page';
import { createEventsPage, type EventsPage } from '@features/events/events.page';
import { createGymsPage, type GymsPage } from '@features/gyms/gyms.page';
import { createStoresPage, type StoresPage } from '@features/stores/stores.page';

export type BjjEireFixtures = {
  aboutPage: AboutPage;
  competitionsPage: CompetitionsPage;
  eventsPage: EventsPage;
  gymsPage: GymsPage;
  storesPage: StoresPage;
  navBar: NavBar;
};

export const test = base.extend<BjjEireFixtures>({
  aboutPage: async ({ page }, use) => {
    await use(createAboutPage(page));
  },
  competitionsPage: async ({ page }, use) => {
    await use(createCompetitionsPage(page));
  },
  eventsPage: async ({ page }, use) => {
    await use(createEventsPage(page));
  },
  gymsPage: async ({ page }, use) => {
    await use(createGymsPage(page));
  },
  storesPage: async ({ page }, use) => {
    await use(createStoresPage(page));
  },
  navBar: async ({ page }, use) => {
    await use(createNavBar(page));
  },
});

export { expect } from './base';
