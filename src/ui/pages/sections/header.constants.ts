export const HEADER_TEST_IDS = {
  logoLink: 'navigation-logo-link',
  navigation: 'navigation',
  supportButton: 'navigation-support-button',
  supportModalContent: 'support-modal-content',
} as const;

export const Theme = {
  Light: 'light',
  Dark: 'dark',
  Competition: 'competition',
} as const;
export type Theme = (typeof Theme)[keyof typeof Theme];

/**
 * The theme toggle cycles light → dark → competition → light and is labelled
 * with the theme it switches to (`bjjeire-app` `uiContent.navigation.switchTo*`).
 */
export const THEME_SWITCH_LABELS = {
  [Theme.Light]: 'Switch to light mode',
  [Theme.Dark]: 'Switch to dark mode',
  [Theme.Competition]: 'Switch to competition mode',
} as const satisfies Record<Theme, string>;

export const HEADER_NAV_LINKS = [
  { name: 'Events', path: '/events' },
  { name: 'Gyms', path: '/gyms' },
  { name: 'Competitions', path: '/competitions' },
  { name: 'Stores', path: '/stores' },
  { name: 'About', path: '/about' },
] as const;
