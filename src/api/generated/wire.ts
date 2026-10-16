import { z, type ZodObject, type ZodRawShape, type ZodType } from 'zod';
import type { PaginatedResponse } from '@api/support/types';
import { zPaginationMetadata } from './zod.gen';

// PaginationMetadata is an optional string in the served spec. Jackson still
// writes JSON null for an absent link because those two fields are
// @JsonInclude(ALWAYS), which overrides the API's non_null default.
const paginationSchema = zPaginationMetadata.extend({
  nextPageUrl: z.string().nullish(),
  previousPageUrl: z.string().nullish(),
});

/**
 * The served page schema, typed as the hand-written DTO page. The type is
 * asserted, not inferred: the spec marks most fields optional, so the inferred
 * type is looser than `TDto` and the runtime check is only as strict as the spec.
 */
export function openApiPageSchema<TDto>(schema: ZodObject<ZodRawShape>): ZodType<PaginatedResponse<TDto>> {
  return schema.extend({
    pagination: paginationSchema.optional(),
  }) as unknown as ZodType<PaginatedResponse<TDto>>;
}
