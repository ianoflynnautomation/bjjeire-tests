import { expect, type Locator, type Page } from '@playwright/test';
import { waitForListOrEmpty } from '@ui/support';
import { ListPage } from '../common/list-page';
import { getGymCardData } from './gyms.card.page';
import { GYM_CARD_TEST_IDS, NO_DATA_COPY, TEST_IDS } from './gyms.constants';
import type { GymCard } from './gyms.types';

const ALL_COUNTIES_OPTION = 'all';

export class GymsPage extends ListPage<GymCard> {
  constructor(page: Page) {
    super(page, { route: '/gyms', testIds: TEST_IDS, noDataCopy: NO_DATA_COPY });
  }

  protected readCardData(card: Locator): Promise<GymCard> {
    return getGymCardData(card);
  }

  private get countySelect(): Locator {
    return this.page.getByTestId(TEST_IDS.countySelect);
  }

  async filterByCounty(county: string): Promise<void> {
    await this.selectFilter(this.countySelect, county, GYM_CARD_TEST_IDS.county);
  }

  async resetCountyFilter(): Promise<void> {
    await waitForListOrEmpty(this.listItems, this.emptyState);
    await this.countySelect.selectOption(ALL_COUNTIES_OPTION);
    await expect(this.countySelect).toHaveValue(ALL_COUNTIES_OPTION);
    await waitForListOrEmpty(this.listItems, this.emptyState);
  }

  async expectCardLinks(name: string, links: { website: string; googleMaps: string }): Promise<void> {
    const card = this.card(name);
    await expect(card.getByTestId(TEST_IDS.cardWebsiteLink)).toHaveAttribute('href', links.website);
    await expect(card.getByTestId(TEST_IDS.cardAddressLink)).toHaveAttribute('href', links.googleMaps);
  }
}
