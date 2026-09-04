import { test as base, expect } from '@playwright/test';
import { cfAccessHeaders } from '@shared/config';
import { buildTraceHeaders, testTraceContext, traceAnnotations } from '@shared/otel/trace-context';
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
import { stubFeatureFlags } from './feature-flags.fixture';
import { gymsPageFixture, mockGymsFixture, type GymsPage, type MockGyms } from './gyms.fixture';
import { storesPageFixture, mockStoresFixture, type StoresPage, type MockStores } from './stores.fixture';
import {
  mockNetworkErrorFixture,
  mockServerErrorFixture,
  mockServerErrorOnceFixture,
  type MockNetworkError,
  type MockServerError,
  type MockServerErrorOnce,
} from './failure.fixture';
import { templatePageFixture, type TemplatePage } from './_template.fixture';

export type UiFixtures = {
  featureFlags: void;
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
  mockServerErrorOnce: MockServerErrorOnce;
  mockStores: MockStores;
  storesPage: StoresPage;
  templatePage: TemplatePage;
};

export const test = base.extend<UiFixtures>({
  extraHTTPHeaders: async ({}, use, testInfo) => {
    const trace = testTraceContext(testInfo.testId, testInfo.retry);
    testInfo.annotations.push(...traceAnnotations(trace));
    await use({ ...cfAccessHeaders(), ...buildTraceHeaders(trace) });
  },

  featureFlags: [
    async ({ page }, use) => {
      await stubFeatureFlags(page);
      await use();
    },
    { auto: true },
  ],
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
  mockServerErrorOnce: mockServerErrorOnceFixture,
  mockStores: mockStoresFixture,
  storesPage: storesPageFixture,
  templatePage: templatePageFixture,
});

export { expect };
