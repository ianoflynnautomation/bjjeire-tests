import { type FOOTER_QUICK_LINKS } from './footer.constants';

export type FooterQuickLink = (typeof FOOTER_QUICK_LINKS)[number];
export type FooterQuickLinkName = FooterQuickLink['name'];
