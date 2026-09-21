import type { Page } from '@playwright/test';
import { mockNetworkError, mockServerError, mockServerErrorOnce, type MockRoute } from '@ui/mocks/failure.mock';
import { mockFixture } from './mock-fixture';

export type FailureMocks = {
  mockNetworkError: () => Promise<void>;
  mockServerError: (status?: number) => Promise<void>;
  mockServerErrorOnce: (status?: number) => Promise<void>;
};

/**
 * The three failure mocks bound to one feature's route, so a spec writes
 * `await mockServerError()` instead of naming its own feature again. Spread into
 * the feature's own `test`: nothing central knows the route.
 */
export function failureMockFixtures(route: MockRoute) {
  return {
    mockNetworkError: mockFixture((page: Page) => mockNetworkError(page, route)),
    mockServerError: mockFixture((page: Page, status?: number) => mockServerError(page, route, status)),
    mockServerErrorOnce: mockFixture((page: Page, status?: number) => mockServerErrorOnce(page, route, status)),
  };
}
