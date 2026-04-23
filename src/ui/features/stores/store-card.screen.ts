import type { Locator } from '@playwright/test';

export type StoreCard = Readonly<{
  name: string;
  description: string | null;
}>;

export async function readStoreCard(root: Locator): Promise<StoreCard> {
  const description = root.getByTestId('store-card-description');

  const [name, descriptionText] = await Promise.all([
    root.getByTestId('store-card-name').innerText(),
    description.isVisible().then(v => (v ? description.innerText() : null)),
  ]);

  return {
    name: name.trim(),
    description: descriptionText?.trim() ?? null,
  };
}
