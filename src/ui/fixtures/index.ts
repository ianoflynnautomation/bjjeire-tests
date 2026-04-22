import { mergeTests } from '@playwright/test';
import { test as appTest, expect } from '@api/fixtures/app-fixtures';
import { test as aboutTest } from '@ui/features/about/about.fixture';
import { test as competitionsTest } from '@ui/features/competitions/competitions.fixture';
import { test as eventsTest } from '@ui/features/events/events.fixture';
import { test as gymsTest } from '@ui/features/gyms/gyms.fixture';
import { test as navigationTest } from '@ui/features/navigation/navigation.fixture';
import { test as storesTest } from '@ui/features/stores/stores.fixture';

export const test = mergeTests(appTest, aboutTest, competitionsTest, eventsTest, gymsTest, navigationTest, storesTest);

export { expect };
