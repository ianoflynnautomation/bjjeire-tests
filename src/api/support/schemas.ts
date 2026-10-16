import { expect } from '@playwright/test';
import { z, type ZodType } from 'zod';
import { fromError } from 'zod-validation-error';
import type { Pagination, PaginatedResponse } from './types';

/* eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-unused-vars -- Playwright merges custom matchers into PlaywrightTest.Matchers */
declare global {
  namespace PlaywrightTest {
    interface Matchers<R, T = unknown> {
      toMatchSchema<S>(schema: ZodType<S>): R;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace, @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-unused-vars */

expect.extend({
  toMatchSchema(received: unknown, schema: ZodType) {
    const parsed = schema.safeParse(received);
    const detail = parsed.success ? 'response matches the OpenAPI schema' : fromError(parsed.error).message;
    return {
      pass: parsed.success,
      message: () => detail,
    };
  },
});

/** Contract assertion. Returns the parsed value for the business assertions that follow. */
export function expectSchema<T>(schema: ZodType<T>, data: unknown): T {
  expect(data).toMatchSchema(schema);
  return schema.parse(data);
}

/** Parse gate for mocked bodies. Specs use {@link expectSchema} so the contract check is an assertion. */
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
