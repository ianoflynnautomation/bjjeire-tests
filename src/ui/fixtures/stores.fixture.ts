import { mockStores } from '@ui/mocks/stores.mock';
import { StoresPage } from '@ui/pages/stores/stores.page';
import { mockFixture, pageFixture } from './mock-fixture';

export type { StoresPage };
export type MockStores = (body: unknown) => Promise<void>;

export const storesPageFixture = pageFixture(StoresPage);
export const mockStoresFixture = mockFixture(mockStores);
