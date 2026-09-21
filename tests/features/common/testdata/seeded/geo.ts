import type { GeoCoordinatesDto } from '@api/support';

export type GeoPoint = Readonly<{ longitude: number; latitude: number }>;

export function seededCoordinates(point: GeoPoint, placeName: string): GeoCoordinatesDto {
  return {
    type: 'Point',
    coordinates: [point.longitude, point.latitude],
    latitude: point.latitude,
    longitude: point.longitude,
    placeName,
  };
}
