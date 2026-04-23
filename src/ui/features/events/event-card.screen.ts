import type { Locator } from '@playwright/test';

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

export async function readEventCard(root: Locator): Promise<BjjEventCard> {
  const pricing = root.getByTestId('event-card-pricing');
  const schedule = root.getByTestId('event-card-schedule');

  const [name, type, county, pricingText, scheduleText] = await Promise.all([
    root.getByTestId('event-card-name').innerText(),
    root.getByTestId('event-card-type').innerText(),
    root.getByTestId('event-card-county').innerText(),
    pricing.isVisible().then(v => (v ? pricing.innerText() : null)),
    schedule.isVisible().then(v => (v ? schedule.innerText() : null)),
  ]);

  return {
    name: name.trim(),
    type: type.trim(),
    county: stripCountySuffix(county),
    pricing: pricingText?.trim() ?? null,
    schedule: scheduleText?.trim() ?? null,
  };
}
