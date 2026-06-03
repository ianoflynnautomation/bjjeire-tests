export const FOOTER_QUICK_LINKS = [
  { name: 'Gyms', path: '/gyms' },
  { name: 'Competitions', path: '/competitions' },
  { name: 'Stores', path: '/stores' },
  { name: 'About', path: '/about' },
] as const;

export type FooterQuickLink = (typeof FOOTER_QUICK_LINKS)[number];
export type FooterQuickLinkName = FooterQuickLink['name'];
