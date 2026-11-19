export type Place = Readonly<{ latitude: number; longitude: number }>;
export type RatioBounds = Readonly<{ min: number; max: number }>;

const HALF_TURN_DEGREES = 180;
const QUARTER_TURN_RADIANS = Math.atan(1);
const RATIO_TOLERANCE = 0.1;

const radians = (degrees: number): number => (degrees * Math.PI) / HALF_TURN_DEGREES;

/** Web Mercator's vertical axis (the map's projection), in radians of longitude-equivalent distance. */
const mercatorY = (latitude: number): number => Math.log(Math.tan(QUARTER_TURN_RADIANS + radians(latitude) / 2));

/**
 * The vertical / horizontal distance between two places on a Web Mercator map, as a band of plus or minus 10%.
 * It is independent of zoom and screen size. Swapped latitude and longitude lands well outside it.
 */
export function onScreenRatioBounds(from: Place, to: Place): RatioBounds {
  const vertical = Math.abs(mercatorY(from.latitude) - mercatorY(to.latitude));
  const horizontal = Math.abs(radians(from.longitude) - radians(to.longitude));
  const ratio = vertical / horizontal;
  return { min: ratio * (1 - RATIO_TOLERANCE), max: ratio * (1 + RATIO_TOLERANCE) };
}
