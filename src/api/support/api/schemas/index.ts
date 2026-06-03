import { z } from 'zod';
import type { JsonValue } from '../contracts/openapi-contract';

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

// ─── Enum schemas (strings in OpenAPI) ───────────────────────────────────────

export const countySchema = z.string();
export const gymStatusSchema = z.string();
export const bjjEventTypeSchema = z.number().int();
export const eventStatusSchema = z.number().int();
export const classCategorySchema = z.string();
export const pricingTypeSchema = z.number().int();
export const dayOfWeekSchema = z.string();

// ─── Sub-entity schemas ──────────────────────────────────────────────────────

export const geoCoordinatesSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]),
  latitude: z.number(),
  longitude: z.number(),
  placeName: z.string().nullable().optional(),
  placeId: z.string().nullable().optional(),
});

export const locationSchema = z.object({
  address: z.string(),
  venue: z.string(),
  coordinates: geoCoordinatesSchema,
});

export const socialMediaSchema = z.object({
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  x: z.string().optional(),
  youTube: z.string().optional(),
});

export const affiliationSchema = z.object({
  name: z.string(),
  website: z.string().optional(),
});

export const trialOfferSchema = z.object({
  isAvailable: z.boolean(),
  freeClasses: z.number().optional(),
  freeDays: z.number().optional(),
  notes: z.string().nullable().optional(),
});

export const organizerSchema = z.object({
  name: z.string(),
  website: z.string(),
});

export const bjjEventHoursSchema = z.object({
  day: dayOfWeekSchema,
  openTime: z.string(),
  closeTime: z.string(),
});

export const bjjEventScheduleSchema = z.object({
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  hours: z.array(bjjEventHoursSchema),
});

export const pricingModelSchema = z.object({
  type: pricingTypeSchema,
  amount: z.number(),
  durationDays: z.number().nullable().optional(),
  currency: z.string(),
});

// ─── Shared fields ───────────────────────────────────────────────────────────

const baseEntityTimestamps = {
  createdOnUtc: z.string().optional(),
  updatedOnUtc: z.string().nullable().optional(),
};

// ─── Pagination ──────────────────────────────────────────────────────────────

export const paginationMetadataSchema = z.object({
  totalItems: z.number().int().nonnegative(),
  currentPage: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
  nextPageUrl: z.string().nullable().optional(),
  previousPageUrl: z.string().nullable().optional(),
});

export function pagedResponseSchema<T extends z.ZodType>(item: T) {
  return z.object({
    data: z.array(item),
    pagination: paginationMetadataSchema,
  });
}

// ─── Base entity ─────────────────────────────────────────────────────────────

export const baseEntitySchema = z.object({
  id: z.string().optional(),
});

// ─── Entity schemas ──────────────────────────────────────────────────────────

export const gymSchema = baseEntitySchema.extend({
  name: z.string(),
  description: z.string().optional(),
  status: gymStatusSchema,
  county: countySchema,
  affiliation: affiliationSchema.optional(),
  trialOffer: trialOfferSchema,
  location: locationSchema,
  socialMedia: socialMediaSchema,
  offeredClasses: z.array(classCategorySchema),
  website: z.string().optional(),
  timetableUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  ...baseEntityTimestamps,
});

export const bjjEventSchema = baseEntitySchema.extend({
  name: z.string(),
  description: z.string().nullable().optional(),
  type: bjjEventTypeSchema,
  organiser: organizerSchema,
  status: eventStatusSchema,
  statusReason: z.string().nullable().optional(),
  socialMedia: socialMediaSchema,
  county: countySchema,
  location: locationSchema,
  schedule: bjjEventScheduleSchema,
  pricing: pricingModelSchema,
  eventUrl: z.string(),
  imageUrl: z.string(),
  ...baseEntityTimestamps,
});

export const competitionSchema = baseEntitySchema.extend({
  slug: z.string(),
  name: z.string(),
  description: z.string().optional(),
  organisation: z.string(),
  country: z.string(),
  websiteUrl: z.string(),
  registrationUrl: z.string().optional(),
  logoUrl: z.string().optional(),
  tags: z.array(z.string()),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean(),
  ...baseEntityTimestamps,
});

export const storeSchema = baseEntitySchema.extend({
  name: z.string(),
  description: z.string().optional(),
  websiteUrl: z.string(),
  logoUrl: z.string().optional(),
  isActive: z.boolean(),
  ...baseEntityTimestamps,
});

export const featureFlagMapSchema = z.record(z.string(), z.boolean());

// ─── Error schemas ───────────────────────────────────────────────────────────

export const problemDetailsSchema = z
  .object({
    type: z.string().optional(),
    title: z.string().optional(),
    status: z.number().optional(),
    detail: z.string().optional(),
    instance: z.string().optional(),
  })
  .loose();

// ─── Inferred types ──────────────────────────────────────────────────────────

export type PaginationMetadata = z.infer<typeof paginationMetadataSchema>;
export type FeatureFlagMap = z.infer<typeof featureFlagMapSchema>;
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
