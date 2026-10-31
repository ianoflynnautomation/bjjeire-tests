import { expect, type Locator, type Page } from '@playwright/test';
import type { County } from '@api/support';
import { expectNoDataState } from '../common/empty.page';
import { ListPage } from '../common/list-page';
import { getGymCardData } from './gyms.card.page';
import { GYM_CARD_TEST_IDS, NO_DATA_COPY, NO_SEARCH_RESULTS_COPY, TEST_IDS } from './gyms.constants';
import type { GymCard, GymCardLinks } from './gyms.types';

const ALL_COUNTIES_OPTION = 'all';

export class GymsPage extends ListPage<GymCard> {
  constructor(page: Page) {
    super(page, { route: '/gyms', testIds: TEST_IDS, noDataCopy: NO_DATA_COPY });
  }

  protected readCardData(card: Locator): Promise<GymCard> {
    return getGymCardData(card);
  }

  override async expectNoResults(): Promise<void> {
    await super.expectNoResults();
    await expectNoDataState(this.page, NO_SEARCH_RESULTS_COPY);
  }

  private get countySelect(): Locator {
    return this.page.getByTestId(TEST_IDS.countySelect);
  }

  async filterByCounty(county: County): Promise<void> {
    await this.selectFilter(this.countySelect, county);
  }

  async expectOnlyCountyListed(county: County): Promise<void> {
    await this.expectAllCardsMatchField(GYM_CARD_TEST_IDS.county, county);
  }

  async expectCountyChosen(county: County): Promise<void> {
    await expect(this.countySelect).toHaveValue(county);
  }

  async expectTrialOffer(name: string, offer: string): Promise<void> {
    await expect(this.card(name).getByTestId(GYM_CARD_TEST_IDS.trialOffer)).toHaveText(offer);
  }

  async resetCountyFilter(): Promise<void> {
    await this.resetFilter(this.countySelect, ALL_COUNTIES_OPTION);
  }

  async expectCardLinks(expected: GymCardLinks): Promise<void> {
    const card = this.card(expected.name);
    await expect(card.getByTestId(TEST_IDS.cardWebsiteLink)).toHaveAttribute('href', expected.website);
    await expect(card.getByTestId(TEST_IDS.cardAddressLink)).toHaveAttribute('href', expected.map);
  }
}
