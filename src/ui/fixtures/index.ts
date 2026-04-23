import { mergeTests } from '@playwright/test';
import { test as sharedTest, expect } from '@shared/fixtures';
import { test as aboutTest } from '@ui/features/about/about.fixture';
import { test as competitionsTest } from '@ui/features/competitions/competitions.fixture';
import { test as eventsTest } from '@ui/features/events/events.fixture';
import { test as gymsTest } from '@ui/features/gyms/gyms.fixture';
import { test as storesTest } from '@ui/features/stores/stores.fixture';

export const test = mergeTests(sharedTest, aboutTest, competitionsTest, eventsTest, gymsTest, storesTest);

export { expect };
