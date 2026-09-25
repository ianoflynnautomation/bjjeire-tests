import { z, type ZodType } from 'zod';
import { fromError } from 'zod-validation-error';
import type { Pagination, PaginatedResponse } from './types';

/**
 * Single parse gate for anything that crosses the wire (API responses, mocked
 * bodies). Zod already proves the shape, so specs assert values — never `typeof`.
 */
export function parseWithSchema<T>(schema: ZodType<T>, data: unknown, subject: string): T {
  const parsed = schema.safeParse(data);
  if (parsed.success) return parsed.data;
  throw new Error(`${subject} failed schema validation: ${fromError(parsed.error).message}`);
}

type LoosenOptional<T> = T extends string | number | boolean | null | undefined
  ? T
  : T extends object
    ? { [K in keyof T]: LoosenOptional<T[K]> | undefined }
    : T;

export function schemaFor<T>(schema: ZodType<LoosenOptional<T>>): ZodType<T> {
  return schema as unknown as ZodType<T>;
}

const paginationSchema = schemaFor<Pagination>(
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
