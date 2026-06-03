import { quickLink } from './footer.locators';
import type { FooterQuickLinkName } from './footer.types';

export async function clickFooterQuickLink(name: FooterQuickLinkName): Promise<void> {
  await quickLink(name).click();
}
