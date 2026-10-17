import { expect, type APIResponse } from '@playwright/test';
import { z } from 'zod';
import { expectSchema } from './schemas';

/** Problem `type` URIs (`bjjeire-java` `ProblemTypes`). Clients match on `type`, so specs assert it with the status. */
export const ProblemType = {
  BadRequest: 'urn:bjjeire:bad-request',
  Unauthorized: 'urn:bjjeire:unauthorized',
  Forbidden: 'urn:bjjeire:forbidden',
  NotFound: 'urn:bjjeire:not-found',
  MethodNotAllowed: 'urn:bjjeire:method-not-allowed',
  Conflict: 'urn:bjjeire:conflict',
  Validation: 'urn:bjjeire:validation-error',
  RateLimit: 'urn:bjjeire:rate-limit-exceeded',
  Internal: 'urn:bjjeire:internal-error',
} as const;
export type ProblemType = (typeof ProblemType)[keyof typeof ProblemType];

export const ValidationErrorCode = {
  InvalidFormat: 'INVALID_FORMAT',
  ValueOutOfRange: 'VALUE_OUT_OF_RANGE',
} as const;

// The published OpenAPI contract lists only 200 responses, so error bodies have no generated
// schema. This one mirrors the RFC 9457 document `ApiExceptionHandler` writes (see TODO.md).
const validationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  errorCode: z.string(),
});

export const problemDetailSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string(),
  instance: z.string(),
  traceId: z.string().min(1),
  errors: z.array(validationErrorSchema).optional(),
});
export type ProblemDetail = z.infer<typeof problemDetailSchema>;

/** Error contract assertion: status, problem schema, and problem type. Returns the body for field checks. */
export async function expectProblem(response: APIResponse, status: number, type: ProblemType): Promise<ProblemDetail> {
  expect(response.status(), `${response.url()} status`).toBe(status);
  const problem = expectSchema(problemDetailSchema, await response.json());
  expect(problem).toMatchObject({ status, type });
  return problem;
}
