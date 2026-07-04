import { test, expect } from '@api/fixtures';
import { getCompetitions, type CompetitionDto } from '@api/features/competitions/competitions.api';

const PUBLISHED_COMPETITIONS_IN_START_ORDER: readonly Pick<CompetitionDto, 'slug' | 'name' | 'organisation'>[] = [
  { slug: 'athlone-grappling-invitational', name: 'Athlone Grappling Invitational', organisation: 'Athlone Grappling' },
  { slug: 'wicklow-no-gi-open', name: 'Wicklow No-Gi Open', organisation: 'Wicklow BJJ' },
  { slug: 'shannonside-bjj-championship', name: 'Shannonside BJJ Championship', organisation: 'Shannonside Grappling' },
  { slug: 'donegal-winter-gi-classic', name: 'Donegal Winter Gi Classic', organisation: 'Donegal BJJ' },
];

const PUBLISHED_SLUGS_IN_ORDER: readonly string[] = PUBLISHED_COMPETITIONS_IN_START_ORDER.map(({ slug }) => slug);
const FINISHED_COMPETITION_SLUG = 'kerry-coast-open-mat';
const FULL_PAGE_SIZE = 50;

test.describe('Competitions API acceptance', { tag: ['@competitions', '@api'] }, () => {
  test(
    'Given competitions are published, when a client opens the listing, then each published competition is returned with its details',
    { tag: ['@smoke', '@acceptance'] },
    async ({ apiClient }) => {
      const { data } = await getCompetitions(apiClient, { page: 1, pageSize: FULL_PAGE_SIZE });

      for (const fixture of PUBLISHED_COMPETITIONS_IN_START_ORDER) {
        const competition = data.find(item => item.slug === fixture.slug);
        expect(competition).toBeDefined();
        expect(competition).toMatchObject({
          slug: fixture.slug,
          name: fixture.name,
          organisation: fixture.organisation,
          country: 'Ireland',
          isActive: true,
        });
      }
    },
  );

  test(
    'Given a competition has finished, when a client opens the listing, then it is not shown',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const { data } = await getCompetitions(apiClient, { page: 1, pageSize: FULL_PAGE_SIZE });
      const slugs = data.map(competition => competition.slug);

      expect(slugs).not.toContain(FINISHED_COMPETITION_SLUG);
    },
  );

  test(
    'Given several competitions are published, when a client opens the listing, then they are ordered by start date',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const { data } = await getCompetitions(apiClient, { page: 1, pageSize: FULL_PAGE_SIZE });

      const seededInResponseOrder = data.map(c => c.slug).filter(slug => PUBLISHED_SLUGS_IN_ORDER.includes(slug));
      expect(seededInResponseOrder).toEqual(PUBLISHED_SLUGS_IN_ORDER);
    },
  );

  test(
    'Given the listing spans more than one page, when a client pages through it, then each page is a distinct slice with correct links',
    { tag: '@acceptance' },
    async ({ apiClient }) => {
      const pageSize = 2;

      const page1 = await getCompetitions(apiClient, { page: 1, pageSize });
      expect(page1.data).toHaveLength(pageSize);
      expect(page1.pagination.totalItems).toBeGreaterThanOrEqual(PUBLISHED_COMPETITIONS_IN_START_ORDER.length);
      expect(page1.pagination.currentPage).toBe(1);
      expect(page1.pagination.pageSize).toBe(pageSize);
      expect(page1.pagination.hasPreviousPage).toBe(false);
      expect(page1.pagination.previousPageUrl).toBeNull();
      expect(page1.pagination.hasNextPage).toBe(true);
      expect(page1.pagination.nextPageUrl).toContain('page=2');

      const page2 = await getCompetitions(apiClient, { page: 2, pageSize });
      expect(page2.data.length).toBeGreaterThan(0);
      expect(page2.pagination.currentPage).toBe(2);
      expect(page2.pagination.hasPreviousPage).toBe(true);
      expect(page2.pagination.previousPageUrl).toContain('page=1');

      const page1Slugs = page1.data.map(c => c.slug);
      expect(page2.data.filter(c => page1Slugs.includes(c.slug))).toEqual([]);
    },
  );
});
