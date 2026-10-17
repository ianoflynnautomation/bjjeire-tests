export type PaginationQuery = Readonly<{
  page?: number;
  pageSize?: number;
}>;

/**
 * Counties in the gyms and events select (`bjjeire-app` `constants/counties.ts`).
 * The OpenAPI enum also lists `None` and the six NI counties. The select does not.
 */
export const County = {
  Dublin: 'Dublin',
  Cork: 'Cork',
  Galway: 'Galway',
  Limerick: 'Limerick',
  Waterford: 'Waterford',
  Kilkenny: 'Kilkenny',
  Wexford: 'Wexford',
  Kerry: 'Kerry',
  Tipperary: 'Tipperary',
  Clare: 'Clare',
  Mayo: 'Mayo',
  Donegal: 'Donegal',
  Sligo: 'Sligo',
  Louth: 'Louth',
  Meath: 'Meath',
  Kildare: 'Kildare',
  Wicklow: 'Wicklow',
  Laois: 'Laois',
  Offaly: 'Offaly',
  Westmeath: 'Westmeath',
  Carlow: 'Carlow',
  Leitrim: 'Leitrim',
  Roscommon: 'Roscommon',
  Longford: 'Longford',
  Cavan: 'Cavan',
  Monaghan: 'Monaghan',
} as const;
export type County = (typeof County)[keyof typeof County];

export type CountyFilter = 'all' | County;

export type Pagination = Readonly<{
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
  pagination: Pagination;
}>;

export type BaseApiEntityModel<TId extends string = string> = Readonly<{
  id?: TId;
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
  instagram?: string | null;
  facebook?: string | null;
  x?: string | null;
  youTube?: string | null;
}>;

export type LocationDto = Readonly<{
  address: string;
  venue: string;
  coordinates: GeoCoordinatesDto;
}>;
