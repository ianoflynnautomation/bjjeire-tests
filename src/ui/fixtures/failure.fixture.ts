import type { Page } from '@playwright/test';
import { mockNetworkError, mockServerError, mockServerErrorOnce, type MockRoute } from '@ui/mocks/failure.mock';
import { mockFixture } from './mock-fixture';

export type FailureMocks = {
  mockNetworkError: () => Promise<void>;
  mockServerError: (status?: number) => Promise<void>;
  mockServerErrorOnce: (status?: number) => Promise<void>;
};

export function failureMockFixtures(route: MockRoute) {
  return {
    mockNetworkError: mockFixture((page: Page) => mockNetworkError(page, route)),
    mockServerError: mockFixture((page: Page, status?: number) => mockServerError(page, route, status)),
    mockServerErrorOnce: mockFixture((page: Page, status?: number) => mockServerErrorOnce(page, route, status)),
  };
}
