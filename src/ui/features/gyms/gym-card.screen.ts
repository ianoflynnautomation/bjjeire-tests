import { expect, type Locator } from '@playwright/test';

export type GymCard = Readonly<{
  name: string;
  status: string | null;
  county: string;
  classes: string[];
}>;

export function getGymCardLocators(root: Locator) {
  return {
    root,
    name: root.getByTestId('gym-card-name'),
    status: root.getByTestId('gym-card-status-badge'),
    county: root.getByTestId('gym-card-county'),
    classes: root.getByTestId('gym-card-classes'),
    expectVisible: async () => await expect(root).toBeVisible(),
  };
}

async function readGymCardClasses(root: Locator): Promise<string[]> {
  const locators = getGymCardLocators(root);
  if (!(await locators.classes.isVisible())) {
    return [];
  }

  return locators.classes.getByTestId('gym-card-classes-item').allInnerTexts();
}

export async function readGymCard(root: Locator): Promise<GymCard> {
  const locators = getGymCardLocators(root);

  const [name, status, county, classes] = await Promise.all([
    locators.name.innerText(),
    locators.status.isVisible().then(visible => (visible ? locators.status.innerText() : null)),
    locators.county.innerText(),
    readGymCardClasses(root),
  ]);

  return {
    name: name.trim(),
    status: status?.trim() ?? null,
    county: county.trim(),
    classes,
  };
}
