import { test, gymsTestConfig } from './fixtures';
import type { GymDto } from '@api/features/gyms/gyms.types';
import { API_ROUTES, County, DEFAULT_PAGE_SIZE, type PaginatedResponse } from '@api/support';
import { paginatePages } from '@ui/mocks/paginate.mock';
import { SEEDED_GYM_BLACKWATER_VALLEY, SEEDED_GYM_LIFFEY_GRAPPLING } from './seeded';
import { manyGymsIn } from './testdata/many-gyms';
import { squash } from '@squash/annotations';

test.use(gymsTestConfig);

const TOTAL_PAGES = 3;
const manyGyms = manyGymsIn(County.Cork, DEFAULT_PAGE_SIZE * (TOTAL_PAGES - 1) + 1);
const nameAt = (gyms: readonly GymDto[], index: number): string => {
  const gym = gyms[index];
  if (!gym) throw new Error(`no gym at index ${index}`);
  return gym.name;
};
const firstPageGym = nameAt(manyGyms, 0);
const secondPageGym = nameAt(manyGyms, DEFAULT_PAGE_SIZE);
const dublinGyms = manyGymsIn(County.Dublin, DEFAULT_PAGE_SIZE + 1);
const lastDublinGym = nameAt(dublinGyms, DEFAULT_PAGE_SIZE);
const liffeyGym = SEEDED_GYM_LIFFEY_GRAPPLING;
const corkGym = SEEDED_GYM_BLACKWATER_VALLEY;
const descriptionOnlyWord = 'Zanzibar';
const addressOnlyWord = 'Ormond';
const classCode = 'WomensOnly';
const pageOf = (gym: GymDto): PaginatedResponse<GymDto> => {
  const page = paginatePages([gym], DEFAULT_PAGE_SIZE, API_ROUTES.gyms)[1];
  if (!page) throw new Error('no first page');
  return page;
};
const gymWithHiddenDetails: GymDto = {
  ...liffeyGym,
  description: `Home of ${descriptionOnlyWord} wrestling`,
};

test.describe(
  'Gyms UI acceptance: paging, URL state and search scope',
  { tag: ['@gyms', '@ui', '@desktop', '@squash'] },
  () => {
    test(
      'visitor should reach the next page of gyms',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ mockGymDirectory, gymsPage }) => {
        await test.step('Given there are more gyms than fit on one page', async () => {
          await mockGymDirectory(manyGyms);
        });

        await test.step('When a visitor opens Gyms', async () => {
          await gymsPage.goTo();
        });

        await test.step('And the visitor goes to the next page', async () => {
          await gymsPage.goToNextPage();
        });

        await test.step('Then the next gyms are listed instead of the first ones', async () => {
          await gymsPage.expectCardData({ name: secondPageGym });
          await gymsPage.expectCardAbsent(firstPageGym);
        });
      },
    );

    test(
      'visitor should return to the previous page of gyms with Back',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ mockGymDirectory, gymsPage }) => {
        await test.step('Given there are more gyms than fit on one page', async () => {
          await mockGymDirectory(manyGyms);
        });

        await test.step('When a visitor opens Gyms', async () => {
          await gymsPage.goTo();
        });

        await test.step('And the visitor goes to the next page', async () => {
          await gymsPage.goToNextPage();
        });

        await test.step('And the visitor goes back', async () => {
          await gymsPage.goBack();
        });

        await test.step('Then the first page of gyms is listed again', async () => {
          await gymsPage.expectOnPage(1, TOTAL_PAGES);
          await gymsPage.expectCardData({ name: firstPageGym });
        });
      },
    );

    test(
      'visitor should see the same page of gyms after reloading',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ mockGymDirectory, gymsPage }) => {
        await test.step('Given there are more gyms than fit on one page', async () => {
          await mockGymDirectory(manyGyms);
        });

        await test.step('When a visitor opens Gyms', async () => {
          await gymsPage.goTo();
        });

        await test.step('And the visitor goes to the next page', async () => {
          await gymsPage.goToNextPage();
        });

        await test.step('And the visitor reloads the page', async () => {
          await gymsPage.reload();
        });

        await test.step('Then the same page of gyms is listed', async () => {
          await gymsPage.expectOnPage(2, TOTAL_PAGES);
          await gymsPage.expectCardData({ name: secondPageGym });
        });
      },
    );

    test(
      'visitor should stay within the chosen county when moving to its next page',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ mockGymDirectory, gymsPage }) => {
        await test.step('Given a county has more gyms than fit on one page', async () => {
          await mockGymDirectory([...manyGyms, ...dublinGyms]);
        });

        await test.step('When a visitor opens Gyms', async () => {
          await gymsPage.goTo();
        });

        await test.step(`And the visitor filters by ${County.Dublin}`, async () => {
          await gymsPage.filterByCounty(County.Dublin);
        });

        await test.step('And the visitor goes to the next page', async () => {
          await gymsPage.goToNextPage();
        });

        await test.step(`Then the last gym from ${County.Dublin} is listed and no others`, async () => {
          await gymsPage.expectResultCount(1);
          await gymsPage.expectCardData({ name: lastDublinGym });
          await gymsPage.expectOnlyCountyListed(County.Dublin);
        });
      },
    );

    test(
      'visitor should see the chosen county after reloading',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ gymsPage }) => {
        await test.step('When a visitor opens Gyms', async () => {
          await gymsPage.goTo();
        });

        await test.step(`And the visitor filters by ${corkGym.county}`, async () => {
          await gymsPage.filterByCounty(corkGym.county);
        });

        await test.step('And the visitor reloads the page', async () => {
          await gymsPage.reload();
        });

        await test.step(`Then ${corkGym.county} is still chosen and only its gyms are listed`, async () => {
          await gymsPage.expectCountyChosen(corkGym.county);
          await gymsPage.expectOnlyCountyListed(corkGym.county);
        });
      },
    );

    test(
      'visitor should see only the shared county when opening a shared county link',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ gymsPage }) => {
        await test.step(`When a visitor opens a shared link to gyms in ${corkGym.county}`, async () => {
          await gymsPage.goToWithQuery(`county=${corkGym.county}`);
        });

        await test.step(`Then ${corkGym.county} is chosen and only its gyms are listed`, async () => {
          await gymsPage.expectCountyChosen(corkGym.county);
          await gymsPage.expectOnlyCountyListed(corkGym.county);
        });
      },
    );

    test(
      'visitor should find a gym by its county name',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ gymsPage }) => {
        await test.step('When a visitor opens Gyms', async () => {
          await gymsPage.goTo();
        });

        await test.step(`And the visitor searches for "${corkGym.county}"`, async () => {
          await gymsPage.searchFor(corkGym.county);
        });

        await test.step(`Then gyms from ${corkGym.county} are listed and others are not`, async () => {
          await gymsPage.expectCardData({ name: corkGym.name });
          await gymsPage.expectCardAbsent(liffeyGym.name);
        });
      },
    );

    test(
      'visitor should not find a gym by anything other than its name or county',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ mockGyms, gymsPage }) => {
        await test.step('Given a gym with a description, an address and classes', async () => {
          await mockGyms(pageOf(gymWithHiddenDetails));
        });

        await test.step('When a visitor opens Gyms', async () => {
          await gymsPage.goTo();
        });

        await test.step('And the visitor searches for a word only in its description', async () => {
          await gymsPage.searchFor(descriptionOnlyWord);
        });

        await test.step('Then no gyms are listed', async () => {
          await gymsPage.expectNoResults();
        });

        await test.step('When the visitor searches for a word only in its address', async () => {
          await gymsPage.searchFor(addressOnlyWord);
        });

        await test.step('Then no gyms are listed', async () => {
          await gymsPage.expectNoResults();
        });

        await test.step('When the visitor searches for one of its classes', async () => {
          await gymsPage.searchFor(classCode);
        });

        await test.step('Then no gyms are listed', async () => {
          await gymsPage.expectNoResults();
        });
      },
    );

    test(
      "visitor should see a gym's free trial offer on its card",
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ gymsPage }) => {
        await test.step('When a visitor opens Gyms', async () => {
          await gymsPage.goTo();
        });

        await test.step(`And the visitor searches for "${liffeyGym.name}"`, async () => {
          await gymsPage.searchFor(liffeyGym.name);
        });

        await test.step('Then the free trial offer is shown on its card', async () => {
          await gymsPage.expectResultCount(1);
          await gymsPage.expectTrialOffer(liffeyGym.name, '7 free days. One free trial week.');
        });
      },
    );
  },
);
