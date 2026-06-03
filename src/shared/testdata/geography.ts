/**
 * Geographic reference points used by factory builders. Centralising these
 * keeps tests visually grounded in real Irish geography while avoiding the
 * `no-magic-numbers` flagging of inline lat/long pairs.
 *
 * Coordinates are O'Connell Bridge, Dublin (sufficient precision for
 * map-rendering and proximity-search test scenarios).
 */
export const DUBLIN_CITY_CENTRE = Object.freeze({
  latitude: 53.3418,
  longitude: -6.2395,
});

/** GeoJSON `[longitude, latitude]` order — note the inversion from the lat/long pair above. */
export const DUBLIN_CITY_CENTRE_GEOJSON: readonly [number, number] = [
  DUBLIN_CITY_CENTRE.longitude,
  DUBLIN_CITY_CENTRE.latitude,
];
