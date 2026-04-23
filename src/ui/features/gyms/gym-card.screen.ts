import type { Locator } from '@playwright/test';

export type GymCard = Readonly<{
  name: string;
  status: string | null;
  county: string;
  classes: string[];
}>;

async function readClasses(root: Locator): Promise<string[]> {
  const classes = root.getByTestId('gym-card-classes');
  if (!(await classes.isVisible())) return [];
  return classes.getByTestId('gym-card-classes-item').allInnerTexts();
}

export async function readGymCard(root: Locator): Promise<GymCard> {
  const status = root.getByTestId('gym-card-status-badge');

  const [name, statusText, county, classes] = await Promise.all([
    root.getByTestId('gym-card-name').innerText(),
    status.isVisible().then(visible => (visible ? status.innerText() : null)),
    root.getByTestId('gym-card-county').innerText(),
    readClasses(root),
  ]);

  return {
    name: name.trim(),
    status: statusText?.trim() ?? null,
    county: county.trim(),
    classes,
  };
}
