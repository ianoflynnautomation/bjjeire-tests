import { expect, type Locator } from '@playwright/test';

export type CompetitionCard = Readonly<{
  name: string;
  organisation: string;
  date: string | null;
  description: string | null;
  tags: string[];
}>;

export function getCompetitionCardLocators(root: Locator) {
  return {
    root,
    name: root.getByTestId('competition-card-name'),
    organisation: root.getByTestId('competition-card-organisation'),
    date: root.getByTestId('competition-card-date'),
    description: root.getByTestId('competition-card-description'),
    tags: root.getByTestId('competition-card-tags'),
    expectVisible: async () => await expect(root).toBeVisible(),
  };
}

async function readCompetitionCardTags(root: Locator): Promise<string[]> {
  const tagsContainer = root.getByTestId('competition-card-tags');
  if (!(await tagsContainer.isVisible())) return [];
  return tagsContainer.getByTestId('competition-card-tag-item').allInnerTexts();
}

export async function readCompetitionCard(root: Locator): Promise<CompetitionCard> {
  const locators = getCompetitionCardLocators(root);

  const [name, organisation, date, description, tags] = await Promise.all([
    locators.name.innerText(),
    locators.organisation.innerText().catch(() => 'Unknown'),
    locators.date.isVisible().then(v => (v ? locators.date.innerText() : null)),
    locators.description.isVisible().then(v => (v ? locators.description.innerText() : null)),
    readCompetitionCardTags(root),
  ]);

  return {
    name: name.trim(),
    organisation: organisation.trim(),
    date: date?.trim() ?? null,
    description: description?.trim() ?? null,
    tags,
  };
}
