import { test as base, expect } from '@playwright/test';
import { aboutPageFixture, type AboutPage } from './about.fixture';
import { competitionsPageFixture, type CompetitionsPage } from './competitions.fixture';
import { eventsPageFixture, type EventsPage } from './events.fixture';
import { gymsPageFixture, type GymsPage } from './gyms.fixture';
import { storesPageFixture, type StoresPage } from './stores.fixture';
import { templatePageFixture, type TemplatePage } from './_template.fixture';

export type UiFixtures = {
  aboutPage: AboutPage;
  competitionsPage: CompetitionsPage;
  eventsPage: EventsPage;
  gymsPage: GymsPage;
  storesPage: StoresPage;
  templatePage: TemplatePage;
};

export const test = base.extend<UiFixtures>({
  aboutPage: aboutPageFixture,
  competitionsPage: competitionsPageFixture,
  eventsPage: eventsPageFixture,
  gymsPage: gymsPageFixture,
  storesPage: storesPageFixture,
  templatePage: templatePageFixture,
});

export { expect };
