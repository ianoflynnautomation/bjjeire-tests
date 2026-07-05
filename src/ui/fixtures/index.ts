import { test as base, expect } from '@playwright/test';
import { aboutPageFixture, type AboutPage } from './about.fixture';
import {
  competitionsPageFixture,
  mockCompetitionsFixture,
  mockCompetitionsPagesFixture,
  type CompetitionsPage,
  type MockCompetitions,
  type MockCompetitionsPages,
} from './competitions.fixture';
import { eventsPageFixture, mockBjjEventsFixture, type EventsPage, type MockBjjEvents } from './events.fixture';
import { gymsPageFixture, mockGymsFixture, type GymsPage, type MockGyms } from './gyms.fixture';
import { storesPageFixture, mockStoresFixture, type StoresPage, type MockStores } from './stores.fixture';
import {
  mockNetworkErrorFixture,
  mockServerErrorFixture,
  type MockNetworkError,
  type MockServerError,
} from './failure.fixture';
import { templatePageFixture, type TemplatePage } from './_template.fixture';

export type UiFixtures = {
  aboutPage: AboutPage;
  competitionsPage: CompetitionsPage;
  eventsPage: EventsPage;
  gymsPage: GymsPage;
  mockBjjEvents: MockBjjEvents;
  mockCompetitions: MockCompetitions;
  mockCompetitionsPages: MockCompetitionsPages;
  mockGyms: MockGyms;
  mockNetworkError: MockNetworkError;
  mockServerError: MockServerError;
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
  mockCompetitionsPages: mockCompetitionsPagesFixture,
  mockGyms: mockGymsFixture,
  mockNetworkError: mockNetworkErrorFixture,
  mockServerError: mockServerErrorFixture,
  mockStores: mockStoresFixture,
  storesPage: storesPageFixture,
  templatePage: templatePageFixture,
});

export { expect };
