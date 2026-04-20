import { mergeTests } from '@playwright/test';
import { test as appTest, expect } from './app-fixtures';
import { test as aboutTest } from '@features/about/about.fixture';
import { test as competitionsTest } from '@features/competitions/competitions.fixture';
import { test as eventsTest } from '@features/events/events.fixture';
import { test as gymsTest } from '@features/gyms/gyms.fixture';
import { test as navigationTest } from '@features/navigation/navigation.fixture';
import { test as storesTest } from '@features/stores/stores.fixture';

export const test = mergeTests(appTest, aboutTest, competitionsTest, eventsTest, gymsTest, navigationTest, storesTest);

export { expect };
