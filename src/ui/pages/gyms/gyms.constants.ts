import { EMPTY_LINE2 } from '../common/empty.page';

export const GYM_CARD_TEST_IDS = {
  classes: 'gym-card-classes',
  classesItem: 'gym-card-classes-item',
  county: 'gym-card-county',
  name: 'gym-card-name',
  status: 'gym-card-status-badge',
  trialOffer: 'gym-card-trial-offer',
} as const;

export const NO_DATA_COPY = {
  title: 'No Gyms Found',
  line1: 'No gyms match your current filters.',
  line2: 'Try a different county or check back later.',
} as const;

export const NO_SEARCH_RESULTS_COPY = {
  title: 'No gyms match your search',
  line1: 'Try a different search term or clear the filter.',
  line2: EMPTY_LINE2,
} as const;

export const MAP_TEST_IDS = {
  map: 'gym-map',
  pin: 'gym-map-pin',
  popup: 'gym-map-popup',
  popupName: 'gym-map-popup-name',
  popupCounty: 'gym-map-popup-county',
  popupAddress: 'gym-map-popup-address',
  popupWebsiteLink: 'gym-map-popup-website-link',
  popupDirectionsLink: 'gym-map-popup-directions-link',
  noticeTilesFailed: 'gym-map-notice-tiles-failed',
  viewSwitch: 'gyms-view-switch',
  viewSwitchList: 'gyms-view-switch-list',
  viewSwitchMap: 'gyms-view-switch-map',
} as const;

/** Filtering must move the two Cork pins at least this much further apart (observed: ~20 px before, ~320 px after). */
export const MIN_PIN_SPREAD_PX = 100;

/** Dublin vs Cork on screen: true geography gives ~1.08 (planner measured ~1.07); swapped lat/lng gives ~1.53. */
export const NORTH_EAST_RATIO_BOUNDS = { min: 0.95, max: 1.2 } as const;

/** A single searched gym is fitted to the map, so its pin sits this close to the map's centre on each axis. */
export const MAP_CENTRE_TOLERANCE_PX = 40;

/** One result zooms to street-level context (FR-012): from this OSM tile zoom, below the maximum of 19 (the app uses 15). */
export const STREET_ZOOM_BOUNDS = { min: 13, max: 19 } as const;

/** Leaflet's popup container, which carries the fade-in opacity. It has no test id. */
export const MAP_POPUP_CONTAINER_SELECTOR = '.leaflet-popup';

/** Leaflet's tile images, which publish no test id. */
export const MAP_TILE_SELECTOR = 'img.leaflet-tile';

/** localStorage key the app reads the chosen theme from (`bjjeire-app` `useTheme`). */
export const THEME_STORAGE_KEY = 'bjjeire-theme';

/** The app loads tiles from `tile.openstreetmap.org` only (`OSM_TILE_URL`); the pattern also covers `a|b|c.` subdomains. */
export const MAP_TILE_URL_PATTERN = /^https:\/\/(?:[a-c]\.)?tile\.openstreetmap\.org\//;

/** The lazy map chunk (.js and .css) of a built image. A dev server names its modules differently. */
export const MAP_CHUNK_URL_PATTERN = /\/assets\/gym-map-[^/]+\.(?:js|css)(?:\?|$)/;

export const MAP_REGION_NAME = 'Map of Brazilian Jiu-Jitsu gyms in Ireland';

export const TILES_FAILED_COPY = {
  message: 'The map background could not be loaded. The pins are still available.',
  listLink: 'View the gym list',
} as const;

export const TEST_IDS = {
  cardAddressLink: 'gym-card-address-link',
  cardName: GYM_CARD_TEST_IDS.name,
  cardWebsiteLink: 'gym-card-website-link',
  countySelect: 'select-filter-select',
  emptyState: 'no-data-state',
  header: 'gyms-page-header',
  headerTitle: 'gyms-page-header-title',
  listItem: 'gyms-list-item',
  search: 'gyms-page-search',
  searchInput: 'search-input',
} as const;
