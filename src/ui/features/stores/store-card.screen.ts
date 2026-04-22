import { expect, type Locator } from '@playwright/test';

export type StoreCard = Readonly<{
  name: string;
  description: string | null;
}>;

export function getStoreCardLocators(root: Locator) {
  return {
    root,
    name: root.getByTestId('store-card-name'),
    description: root.getByTestId('store-card-description'),
    expectVisible: async () => await expect(root).toBeVisible(),
  };
}

export async function readStoreCard(root: Locator): Promise<StoreCard> {
  const locators = getStoreCardLocators(root);

  const [name, description] = await Promise.all([
    locators.name.innerText(),
    locators.description.isVisible().then(visible => (visible ? locators.description.innerText() : null)),
  ]);

  return {
    name: name.trim(),
    description: description?.trim() ?? null,
  };
}
