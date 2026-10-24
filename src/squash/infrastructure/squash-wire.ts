import { z, type ZodType } from 'zod';
import { TestOutcome } from '../domain/execution-result';
import { TestCaseFormat } from '../domain/gherkin';
import { TestCaseStatus, Weight } from '../domain/test-case';

/**
 * The Squash TM REST contract this integration relies on, checked against
 * Squash TM 8.1.1 (`/api/rest/latest`, HAL+JSON). Field names are Squash's own
 * (snake_case, `_type` discriminators), so they stay confined to this file
 * and the payload builder.
 *
 * Responses declare only the fields we read: unrelated upstream additions never
 * break parsing, while a renamed field we depend on fails loudly instead of
 * yielding `undefined`. Request bodies are declared here too, so the whole wire
 * contract is in one place; the payload builder's types are inferred from them.
 */

const pageSchema = z.object({ number: z.number(), totalPages: z.number() });

const infoListItemSchema = z.object({ code: z.string() });

/** A test case's `_type` is its format (verified on 8.1.1: a PATCH must repeat it). */
export const TEST_CASE_TYPE_BY_FORMAT = {
  [TestCaseFormat.Classic]: 'test-case',
  [TestCaseFormat.Gherkin]: 'scripted-test-case',
  [TestCaseFormat.Keyword]: 'keyword-test-case',
  [TestCaseFormat.Exploratory]: 'exploratory-test-case',
} as const satisfies Readonly<Record<TestCaseFormat, string>>;

const testCaseTypeSchema = z.enum(Object.values(TEST_CASE_TYPE_BY_FORMAT));

const testCaseSchema = z.object({
  _type: testCaseTypeSchema,
  id: z.number(),
  name: z.string(),
  reference: z.string().nullish(),
  description: z.string().nullish(),
  importance: z.enum(Object.values(Weight)),
  status: z.enum(Object.values(TestCaseStatus)),
  nature: infoListItemSchema,
  type: infoListItemSchema,
  automated_test_technology: z.string().nullish(),
  automated_test_reference: z.string().nullish(),
  /** `/<project>/<folder>/…/<name>`. */
  path: z.string(),
  /** Gherkin cases only. */
  script: z.string().nullish(),
});

/** The `fields` query that makes the listing return everything `testCaseSchema` reads. */
export const TEST_CASE_FIELDS = Object.keys(testCaseSchema.shape)
  .filter(field => field !== 'id' && field !== '_type')
  .join(',');

export const testCasePageSchema = z.object({
  _embedded: z.object({ 'test-cases': z.array(testCaseSchema) }).optional(),
  page: pageSchema,
});

export type WireTestCase = z.infer<typeof testCaseSchema>;

const libraryNodeSchema = z.object({ _type: z.string(), id: z.number(), name: z.string() });

/** Library roots and folders list their children under different `_embedded` keys. */
export const LIBRARY_CONTENT_KEYS = {
  testCaseRoot: 'test-case-library-content',
  campaignRoot: 'campaign-library-content',
  folder: 'content',
} as const;

export function libraryPageSchema(contentKey: (typeof LIBRARY_CONTENT_KEYS)[keyof typeof LIBRARY_CONTENT_KEYS]) {
  return z
    .object({ _embedded: z.record(z.string(), z.array(libraryNodeSchema)).optional(), page: pageSchema })
    .transform(page => ({ items: page._embedded?.[contentKey] ?? [], totalPages: page.page.totalPages }));
}

export const iterationPageSchema = z.object({
  _embedded: z.object({ iterations: z.array(z.object({ id: z.number(), name: z.string() })) }).optional(),
  page: pageSchema,
});

export const testSuiteSchema = z.object({
  id: z.number(),
  name: z.string(),
  parent: z.object({ _type: z.literal('iteration'), id: z.number() }),
});

export const executionPageSchema = z.object({
  _embedded: z
    .object({
      executions: z.array(z.object({ id: z.number(), execution_order: z.number() })),
    })
    .optional(),
  page: pageSchema,
});

/** `GET /executions/{id}` returns the comment the execution list leaves out. */
export const executionCommentSchema = z.object({
  comment: z.string().nullish(),
});

export const testPlanPageSchema = z.object({
  _embedded: z
    .object({
      'test-plan': z.array(
        z.object({
          id: z.number(),
          referenced_test_case: z.object({ id: z.number() }).nullish(),
        }),
      ),
    })
    .optional(),
  page: pageSchema,
});

export const createdSchema = z.object({ id: z.number() });

const SquashExecutionStatus = {
  Success: 'SUCCESS',
  Failure: 'FAILURE',
  Blocked: 'BLOCKED',
  Skipped: 'SKIPPED',
} as const;

export const STATUS_BY_OUTCOME = {
  [TestOutcome.Passed]: SquashExecutionStatus.Success,
  [TestOutcome.Failed]: SquashExecutionStatus.Failure,
  [TestOutcome.Interrupted]: SquashExecutionStatus.Blocked,
  [TestOutcome.Skipped]: SquashExecutionStatus.Skipped,
} as const satisfies Readonly<Record<TestOutcome, string>>;

const testCaseParentSchema = z.object({ _type: z.enum(['project', 'test-case-folder']), id: z.number() });

const managedFieldsSchema = z.object({
  name: z.string(),
  reference: z.string(),
  description: z.string(),
  importance: z.enum(Object.values(Weight)),
  status: z.enum(Object.values(TestCaseStatus)),
  nature: infoListItemSchema,
  type: infoListItemSchema,
  automated_test_technology: z.string(),
  automated_test_reference: z.string(),
  script: z.string(),
});

export const createTestCaseBodySchema = managedFieldsSchema.partial().extend({
  _type: z.literal(TEST_CASE_TYPE_BY_FORMAT[TestCaseFormat.Gherkin]),
  name: z.string(),
  parent: testCaseParentSchema,
  script: z.string(),
});

export const updateTestCaseBodySchema = managedFieldsSchema.partial().extend({ _type: testCaseTypeSchema });

const libraryParentSchema = z.object({
  _type: z.enum(['project', 'test-case-folder', 'campaign-folder']),
  id: z.number(),
});

export const createFolderBodySchema = z.object({
  _type: z.enum(['test-case-folder', 'campaign-folder']),
  name: z.string(),
  parent: libraryParentSchema,
});

export const createCampaignBodySchema = z.object({
  _type: z.literal('campaign'),
  name: z.string(),
  parent: libraryParentSchema,
});

export const createIterationBodySchema = z.object({
  _type: z.literal('iteration'),
  name: z.string(),
  description: z.string(),
});

export const addToTestPlanBodySchema = z.object({
  _type: z.literal('iteration-test-plan-item'),
  test_case: z.object({ _type: z.literal('test-case'), id: z.number() }),
});

export const updateExecutionBodySchema = z.object({
  _type: z.literal('execution'),
  execution_status: z.enum(Object.values(SquashExecutionStatus)),
  comment: z.string(),
});

export type TestCaseParent = z.infer<typeof testCaseParentSchema>;
export type ManagedFields = z.infer<typeof managedFieldsSchema>;
export type CreateTestCaseBody = z.infer<typeof createTestCaseBodySchema>;
export type UpdateTestCaseBody = z.infer<typeof updateTestCaseBodySchema>;
export type CreateIterationBody = z.infer<typeof createIterationBodySchema>;
export type LibraryParent = z.infer<typeof libraryParentSchema>;
export type CreateFolderBody = z.infer<typeof createFolderBodySchema>;
export type CreateCampaignBody = z.infer<typeof createCampaignBodySchema>;
export type AddToTestPlanBody = z.infer<typeof addToTestPlanBodySchema>;
export type UpdateExecutionBody = z.infer<typeof updateExecutionBodySchema>;

class SquashContractError extends Error {
  constructor(what: string, detail: string) {
    super(`Squash TM response for ${what} did not match the expected shape:\n${detail}`);
    this.name = 'SquashContractError';
  }
}

/** Squash responses are untrusted input: validate before any field is used. */
export function parseWire<T>(schema: ZodType<T>, body: unknown, what: string): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new SquashContractError(what, z.prettifyError(parsed.error));
  return parsed.data;
}
