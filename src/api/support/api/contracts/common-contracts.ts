export type HateoasPagination = Readonly<{
  totalItems: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPageUrl?: string | null;
  previousPageUrl?: string | null;
}>;

export type PaginatedResponse<T> = Readonly<{
  data: readonly T[];
  pagination: HateoasPagination;
}>;

export type BaseApiEntityModel = Readonly<{
  id?: string;
  createdOnUtc?: string | null;
  updatedOnUtc?: string | null;
}>;

export type GeoCoordinatesDto = Readonly<{
  type: 'Point';
  coordinates: readonly [number, number];
  latitude: number;
  longitude: number;
  placeName?: string | null;
  placeId?: string | null;
}>;

export type SocialMediaDto = Readonly<{
  instagram?: string;
  facebook?: string;
  x?: string;
  youTube?: string;
}>;

export type LocationDto = Readonly<{
  address: string;
  venue: string;
  coordinates: GeoCoordinatesDto;
}>;
