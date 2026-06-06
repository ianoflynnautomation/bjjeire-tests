import { expect, mergeTests } from '@playwright/test';
import { test as aboutTest } from '@ui/features/about/about.fixture';
import { test as competitionsTest } from '@ui/features/competitions/competitions.fixture';
import { test as eventsTest } from '@ui/features/events/events.fixture';
import { test as gymsTest } from '@ui/features/gyms/gyms.fixture';
import { test as storesTest } from '@ui/features/stores/stores.fixture';
import { test as templateTest } from '@ui/features/_template/_template.fixture';

export const test = mergeTests(aboutTest, competitionsTest, eventsTest, gymsTest, storesTest, templateTest);
export { expect };
