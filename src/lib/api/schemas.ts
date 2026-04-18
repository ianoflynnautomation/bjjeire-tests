import { z } from 'zod';

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

export function pagedResponseSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item),
    pagination: paginationMetadataSchema,
  });
}

export const baseEntitySchema = z.object({
  id: z.string(),
});

export const gymSchema = baseEntitySchema.extend({
  name: z.string(),
  county: z.string().nullable().optional(),
});

export const bjjEventSchema = baseEntitySchema.extend({
  name: z.string(),
  county: z.string().nullable().optional(),
});

export const storeSchema = baseEntitySchema.extend({
  name: z.string(),
});

export const competitionSchema = baseEntitySchema.extend({
  name: z.string(),
});

export const featureFlagMapSchema = z.record(z.string(), z.boolean());

export const problemDetailsSchema = z
  .object({
    type: z.string().optional(),
    title: z.string().optional(),
    status: z.number().optional(),
    detail: z.string().optional(),
    instance: z.string().optional(),
  })
  .passthrough();

export type PaginationMetadata = z.infer<typeof paginationMetadataSchema>;
export type GymDto = z.infer<typeof gymSchema>;
export type BjjEventDto = z.infer<typeof bjjEventSchema>;
export type StoreDto = z.infer<typeof storeSchema>;
export type CompetitionDto = z.infer<typeof competitionSchema>;
export type FeatureFlagMap = z.infer<typeof featureFlagMapSchema>;
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
export type PagedResponse<T> = { data: T[]; pagination: PaginationMetadata };
