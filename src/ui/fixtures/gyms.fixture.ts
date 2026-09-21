import { mockGyms } from '@ui/mocks/gyms.mock';
import { GymsPage } from '@ui/pages/gyms/gyms.page';
import { mockFixture, pageFixture } from './mock-fixture';

export type { GymsPage };
export type MockGyms = (body: unknown) => Promise<void>;

export const gymsPageFixture = pageFixture(GymsPage);
export const mockGymsFixture = mockFixture(mockGyms);
