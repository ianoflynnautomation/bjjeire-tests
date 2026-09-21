import { mockNetworkError, mockServerError, mockServerErrorOnce, type ApiResource } from '@ui/mocks/failure.mock';
import { mockFixture } from './mock-fixture';

export type MockNetworkError = (resource: ApiResource) => Promise<void>;
export type MockServerError = (resource: ApiResource, status?: number) => Promise<void>;
export type MockServerErrorOnce = (resource: ApiResource, status?: number) => Promise<void>;

export const mockNetworkErrorFixture = mockFixture(mockNetworkError);
export const mockServerErrorFixture = mockFixture(mockServerError);
export const mockServerErrorOnceFixture = mockFixture(mockServerErrorOnce);
