import { expect, type Locator } from '@playwright/test';

export type BjjEventCard = Readonly<{
  name: string;
  type: string;
  county: string;
  pricing: string | null;
  schedule: string | null;
}>;

function stripCountySuffix(raw: string): string {
  return raw.replace(/\s*county$/i, '').trim();
}

export function getEventCardLocators(root: Locator) {
  return {
    root,
    name: root.getByTestId('event-card-name'),
    type: root.getByTestId('event-card-type'),
    county: root.getByTestId('event-card-county'),
    pricing: root.getByTestId('event-card-pricing'),
    schedule: root.getByTestId('event-card-schedule'),
    expectVisible: async () => await expect(root).toBeVisible(),
  };
}

export async function readEventCard(root: Locator): Promise<BjjEventCard> {
  const locators = getEventCardLocators(root);

  const [name, type, county, pricing, schedule] = await Promise.all([
    locators.name.innerText(),
    locators.type.innerText(),
    locators.county.innerText(),
    locators.pricing.isVisible().then(visible => (visible ? locators.pricing.innerText() : null)),
    locators.schedule.isVisible().then(visible => (visible ? locators.schedule.innerText() : null)),
  ]);

  return {
    name: name.trim(),
    type: type.trim(),
    county: stripCountySuffix(county),
    pricing: pricing?.trim() ?? null,
    schedule: schedule?.trim() ?? null,
  };
}
