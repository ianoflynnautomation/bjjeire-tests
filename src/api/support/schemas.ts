import { z, type ZodType } from 'zod';
import type { GeoCoordinatesDto, LocationDto, Pagination, PaginatedResponse, SocialMediaDto } from './types';

export const featureFlagMapSchema = z.record(z.string(), z.boolean());

export const problemDetailsSchema = z
  .object({
    type: z.string().optional(),
    title: z.string().optional(),
    status: z.number().optional(),
    detail: z.string().optional(),
    instance: z.string().optional(),
  })
  .loose();

export type FeatureFlagMap = z.infer<typeof featureFlagMapSchema>;
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;

type LoosenOptional<T> = T extends string | number | boolean | null | undefined
  ? T
  : T extends object
    ? { [K in keyof T]: LoosenOptional<T[K]> | undefined }
    : T;

export function schemaFor<T>(schema: ZodType<LoosenOptional<T>>): ZodType<T> {
  return schema as unknown as ZodType<T>;
}

export function entityIdSchema<TId extends string>(): ZodType<TId> {
  return z.string() as unknown as ZodType<TId>;
}

export function baseApiEntityFields<TId extends string>() {
  return {
    id: entityIdSchema<TId>().optional(),
    createdOnUtc: z.string().nullable().optional(),
    updatedOnUtc: z.string().nullable().optional(),
  };
}

export const geoCoordinatesSchema = schemaFor<GeoCoordinatesDto>(
  z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
    latitude: z.number(),
    longitude: z.number(),
    placeName: z.string().nullable().optional(),
    placeId: z.string().nullable().optional(),
  }),
);

export const socialMediaSchema = schemaFor<SocialMediaDto>(
  z.object({
    instagram: z.string().nullable().optional(),
    facebook: z.string().nullable().optional(),
    x: z.string().nullable().optional(),
    youTube: z.string().nullable().optional(),
  }),
);

export const locationSchema = schemaFor<LocationDto>(
  z.object({
    address: z.string(),
    venue: z.string(),
    coordinates: geoCoordinatesSchema,
  }),
);

export const paginationSchema = schemaFor<Pagination>(
  z.object({
    totalItems: z.number(),
    currentPage: z.number(),
    pageSize: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
    nextPageUrl: z.string().nullable().optional(),
    previousPageUrl: z.string().nullable().optional(),
  }),
);

export function paginatedResponseSchema<T>(item: ZodType<T>): ZodType<PaginatedResponse<T>> {
  return z.object({ data: z.array(item), pagination: paginationSchema });
}
