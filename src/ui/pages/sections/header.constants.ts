export const HEADER_TEST_IDS = {
  logoLink: 'navigation-logo-link',
  navigation: 'navigation',
  desktopLinks: 'navigation-desktop-links',
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

/**
 * The retired name of BJJ Éire competitions (ADR-0015). No header entry may carry it, whatever the flags
 * (merge spec FR-005, `#3015`); the word is fixed here, not read from the app.
 */
export const RETIRED_NAME_ENTRY_PATTERN = /tournament/i;
export const ACCOUNT_ENTRY_PATTERN =
  /sign[ -]?in|sign[ -]?up|log[ -]?in|log[ -]?out|register|registration|account|profile|competitor|my |user menu/i;

/** The navigation buttons a visitor sees on desktop: the theme toggle and Support, nothing else. */
export const HEADER_BUTTON_NAMES = { themeToggle: /^Switch to \w+ mode$/, support: 'Support' } as const;
