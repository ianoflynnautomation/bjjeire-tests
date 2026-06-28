import type { Page } from '@playwright/test';
import { mockNetworkError, mockServerError, type ApiResource } from '@ui/mocks/failure.mock';

export type MockNetworkError = (resource: ApiResource) => Promise<void>;
export type MockServerError = (resource: ApiResource, status?: number) => Promise<void>;

export async function mockNetworkErrorFixture(
  { page }: { page: Page },
  use: (mock: MockNetworkError) => Promise<void>,
): Promise<void> {
  await use(resource => mockNetworkError(page, resource));
}

export async function mockServerErrorFixture(
  { page }: { page: Page },
  use: (mock: MockServerError) => Promise<void>,
): Promise<void> {
  await use((resource, status) => mockServerError(page, resource, status));
}
