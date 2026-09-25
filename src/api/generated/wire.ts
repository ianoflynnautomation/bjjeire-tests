import { z, type ZodObject, type ZodRawShape, type ZodType } from 'zod';
import { zPaginationMetadata } from './zod.gen';

// PaginationMetadata is an optional string in the served spec. Jackson still
// writes JSON null for an absent link because those two fields are
// @JsonInclude(ALWAYS), which overrides the API's non_null default.
const paginationSchema = zPaginationMetadata.extend({
  nextPageUrl: z.string().nullish(),
  previousPageUrl: z.string().nullish(),
});

export function openApiPageSchema<T extends ZodRawShape>(schema: ZodObject<T>): ZodType {
  return schema.extend({
    pagination: paginationSchema.optional(),
  });
}
