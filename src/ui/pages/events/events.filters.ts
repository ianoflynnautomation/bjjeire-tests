import type { Locator, Page } from '@playwright/test';
import type { BjjEventType } from '@api/features/events/events.types';
import { EVENT_TYPE_FILTER_LABELS, TEST_IDS } from './events.constants';

/**
 * The Events filter controls, shared by the list and map page objects. Each page object
 * keeps its own wait: the list waits for cards, the map does not show any.
 */
export function eventFilters(page: Page): Locator {
  return page.getByTestId(TEST_IDS.filters);
}

export function eventCountySelect(page: Page): Locator {
  return eventFilters(page).getByTestId(TEST_IDS.countySelect);
}

export function eventTypeFilterButton(page: Page, type: BjjEventType): Locator {
  return eventFilters(page).getByRole('button', { name: EVENT_TYPE_FILTER_LABELS[type], exact: true });
}
