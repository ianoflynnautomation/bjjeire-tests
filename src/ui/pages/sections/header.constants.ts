export const HEADER_TEST_IDS = {
  logoLink: 'navigation-logo-link',
  navigation: 'navigation',
  supportButton: 'navigation-support-button',
  supportModalContent: 'support-modal-content',
} as const;

export const HEADER_NAV_LINKS = [
  { name: 'Events', path: '/events' },
  { name: 'Gyms', path: '/gyms' },
  { name: 'Competitions', path: '/competitions' },
  { name: 'Stores', path: '/stores' },
  { name: 'About', path: '/about' },
] as const;
