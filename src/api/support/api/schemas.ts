import { z } from 'zod';

// ─── Enum schemas (strings in OpenAPI) ───────────────────────────────────────

export const countySchema = z.string();
export const gymStatusSchema = z.string();
export const bjjEventTypeSchema = z.string();
export const eventStatusSchema = z.string();
export const classCategorySchema = z.string();
export const pricingTypeSchema = z.string();
export const dayOfWeekSchema = z.string();

// ─── Sub-entity schemas ──────────────────────────────────────────────────────

export const geoCoordinatesSchema = z.object({
  type: z.string().optional(),
  coordinates: z.array(z.unknown()).optional(),
  latitude: z.unknown().optional(),
  longitude: z.unknown().optional(),
  placeName: z.string().nullable().optional(),
  placeId: z.string().nullable().optional(),
});

export const locationSchema = z.object({
  address: z.string().optional(),
  venue: z.string().optional(),
  coordinates: geoCoordinatesSchema.optional(),
});

export const socialMediaSchema = z.object({
  instagram: z.string().nullable().optional(),
  facebook: z.string().nullable().optional(),
  x: z.string().nullable().optional(),
  youTube: z.string().nullable().optional(),
});

export const affiliationSchema = z.object({
  name: z.string().optional(),
  website: z.string().nullable().optional(),
});

export const trialOfferSchema = z.object({
  isAvailable: z.boolean().optional(),
  freeClasses: z.unknown().optional(),
  freeDays: z.unknown().optional(),
  notes: z.string().nullable().optional(),
});

export const organizerSchema = z.object({
  name: z.string().optional(),
  website: z.string().optional(),
});

export const bjjEventHoursSchema = z.object({
  day: dayOfWeekSchema.optional(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
});

export const bjjEventScheduleSchema = z.object({
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  hours: z.array(bjjEventHoursSchema).nullable().optional(),
});

export const pricingModelSchema = z.object({
  type: pricingTypeSchema.optional(),
  amount: z.unknown().optional(),
  durationDays: z.unknown().optional(),
  currency: z.string().nullable().optional(),
});

// ─── Shared fields ───────────────────────────────────────────────────────────

const baseEntityTimestamps = {
  createdOnUtc: z.string().optional(),
  updatedOnUtc: z.string().nullable().optional(),
};

// ─── Pagination ──────────────────────────────────────────────────────────────

export const paginationMetadataSchema = z.object({
  totalItems: z.unknown(),
  currentPage: z.unknown(),
  pageSize: z.unknown(),
  totalPages: z.unknown(),
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
  id: z.string(),
});

// ─── Entity schemas ──────────────────────────────────────────────────────────

export const gymSchema = baseEntitySchema.extend({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  status: gymStatusSchema.optional(),
  county: countySchema.optional(),
  affiliation: z.unknown().optional(),
  trialOffer: trialOfferSchema.optional(),
  location: locationSchema.optional(),
  socialMedia: socialMediaSchema.optional(),
  offeredClasses: z.array(classCategorySchema).optional(),
  website: z.string().nullable().optional(),
  timetableUrl: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  ...baseEntityTimestamps,
});

export const bjjEventSchema = baseEntitySchema.extend({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  type: bjjEventTypeSchema.optional(),
  organiser: organizerSchema.optional(),
  status: eventStatusSchema.optional(),
  statusReason: z.string().nullable().optional(),
  socialMedia: socialMediaSchema.optional(),
  county: countySchema.optional(),
  location: locationSchema.optional(),
  schedule: bjjEventScheduleSchema.optional(),
  pricing: pricingModelSchema.optional(),
  eventUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  ...baseEntityTimestamps,
});

export const competitionSchema = baseEntitySchema.extend({
  slug: z.string().optional(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  organisation: z.string().optional(),
  country: z.string().optional(),
  websiteUrl: z.string().optional(),
  registrationUrl: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  ...baseEntityTimestamps,
});

export const storeSchema = baseEntitySchema.extend({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  websiteUrl: z.string().optional(),
  logoUrl: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
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
  .passthrough();

// ─── Inferred types ──────────────────────────────────────────────────────────

export type PaginationMetadata = z.infer<typeof paginationMetadataSchema>;
export type FeatureFlagMap = z.infer<typeof featureFlagMapSchema>;
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
