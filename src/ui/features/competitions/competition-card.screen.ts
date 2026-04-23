import type { Locator } from '@playwright/test';

export type CompetitionCard = Readonly<{
  name: string;
  organisation: string;
  date: string | null;
  description: string | null;
  tags: string[];
}>;

async function readTags(root: Locator): Promise<string[]> {
  const tags = root.getByTestId('competition-card-tags');
  if (!(await tags.isVisible())) return [];
  return tags.getByTestId('competition-card-tag-item').allInnerTexts();
}

export async function readCompetitionCard(root: Locator): Promise<CompetitionCard> {
  const date = root.getByTestId('competition-card-date');
  const description = root.getByTestId('competition-card-description');

  const [name, organisation, dateText, descriptionText, tags] = await Promise.all([
    root.getByTestId('competition-card-name').innerText(),
    root
      .getByTestId('competition-card-organisation')
      .innerText()
      .catch(() => 'Unknown'),
    date.isVisible().then(v => (v ? date.innerText() : null)),
    description.isVisible().then(v => (v ? description.innerText() : null)),
    readTags(root),
  ]);

  return {
    name: name.trim(),
    organisation: organisation.trim(),
    date: dateText?.trim() ?? null,
    description: descriptionText?.trim() ?? null,
    tags,
  };
}
