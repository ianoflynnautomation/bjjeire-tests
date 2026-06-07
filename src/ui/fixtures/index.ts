import { test as base, expect } from '@playwright/test';
import { aboutPageFixture, type AboutPage } from './about.fixture';
import {
  competitionsPageFixture,
  mockCompetitionsFixture,
  type CompetitionsPage,
  type MockCompetitions,
} from './competitions.fixture';
import { eventsPageFixture, mockBjjEventsFixture, type EventsPage, type MockBjjEvents } from './events.fixture';
import { gymsPageFixture, mockGymsFixture, type GymsPage, type MockGyms } from './gyms.fixture';
import { storesPageFixture, mockStoresFixture, type StoresPage, type MockStores } from './stores.fixture';
import { templatePageFixture, type TemplatePage } from './_template.fixture';

export type UiFixtures = {
  aboutPage: AboutPage;
  competitionsPage: CompetitionsPage;
  eventsPage: EventsPage;
  gymsPage: GymsPage;
  mockBjjEvents: MockBjjEvents;
  mockCompetitions: MockCompetitions;
  mockGyms: MockGyms;
  mockStores: MockStores;
  storesPage: StoresPage;
  templatePage: TemplatePage;
};

export const test = base.extend<UiFixtures>({
  aboutPage: aboutPageFixture,
  competitionsPage: competitionsPageFixture,
  eventsPage: eventsPageFixture,
  gymsPage: gymsPageFixture,
  mockBjjEvents: mockBjjEventsFixture,
  mockCompetitions: mockCompetitionsFixture,
  mockGyms: mockGymsFixture,
  mockStores: mockStoresFixture,
  storesPage: storesPageFixture,
  templatePage: templatePageFixture,
});

export { expect };
