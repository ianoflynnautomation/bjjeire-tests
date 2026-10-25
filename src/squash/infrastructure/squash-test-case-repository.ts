import type { FolderId, SquashTestCase, TestCaseId, TestCaseRepository, TestCaseState } from '../application/contracts';
import { folderPathOf } from '../domain/case-path.mts';
import type { TestCaseFormat } from '../domain/gherkin';
import type { TestCaseDefinition } from '../domain/test-case';
import { collectPages, DEFAULT_PAGE_SIZE } from './collect-pages';
import { createResource } from './create-resource';
import { SquashPayloadBuilder } from './payload-builder';
import type { SquashClient } from './squash-client';
import {
  parseWire,
  TEST_CASE_FIELDS,
  TEST_CASE_TYPE_BY_FORMAT,
  testCasePageSchema,
  type TestCaseParent,
  type WireTestCase,
} from './rest-schemas';

const FORMAT_BY_TEST_CASE_TYPE = Object.fromEntries(
  Object.entries(TEST_CASE_TYPE_BY_FORMAT).map(([format, type]) => [type, format as TestCaseFormat]),
) as Readonly<Record<WireTestCase['_type'], TestCaseFormat>>;

export type TestCaseRepositoryOptions = Readonly<{ projectId: number; pageSize?: number }>;

/**
 * `TestCaseRepository` over the Squash TM REST API. This is the boundary where
 * Squash's numeric ids become branded ids, after the response is validated.
 */
export class HttpTestCaseRepository implements TestCaseRepository {
  constructor(
    private readonly client: SquashClient,
    private readonly options: TestCaseRepositoryOptions,
    private readonly payloads = new SquashPayloadBuilder(),
  ) {}

  async listTestCases(): Promise<readonly SquashTestCase[]> {
    const path = `/projects/${this.options.projectId}/test-cases`;
    const request = { path, query: { fields: TEST_CASE_FIELDS }, pageSize: this.options.pageSize ?? DEFAULT_PAGE_SIZE };
    const testCases = await collectPages(this.client, request, body => {
      const page = parseWire(testCasePageSchema, body, `GET ${path}`);
      return { items: page._embedded?.['test-cases'] ?? [], totalPages: page.page.totalPages };
    });
    return testCases.map(testCase => ({
      id: testCase.id as TestCaseId,
      // Manual cases often hold '' rather than null.
      key: testCase.automated_test_reference === '' ? undefined : (testCase.automated_test_reference ?? undefined),
      folderPath: folderPathOf(testCase.path),
      state: stateOf(testCase),
    }));
  }

  async createTestCase(
    definition: TestCaseDefinition,
    folderId: FolderId | undefined,
    label: string,
  ): Promise<TestCaseId> {
    const parent: TestCaseParent =
      folderId === undefined
        ? { _type: 'project', id: this.options.projectId }
        : { _type: 'test-case-folder', id: folderId };
    const body = this.payloads.createTestCase(definition, parent, label);
    return (await createResource(this.client, '/test-cases', body)) as TestCaseId;
  }

  async updateTestCase(
    current: SquashTestCase,
    definition: TestCaseDefinition,
    label: string | undefined,
  ): Promise<boolean> {
    const body = this.payloads.updateTestCase(current.state, definition, label);
    if (!body) return false;
    await this.client.send({ method: 'PATCH', path: `/test-cases/${current.id}`, body });
    return true;
  }
}

function stateOf(testCase: WireTestCase): TestCaseState {
  return {
    name: testCase.name,
    description: testCase.description ?? '',
    weight: testCase.importance,
    status: testCase.status,
    nature: testCase.nature.code,
    type: testCase.type.code,
    automatedTestTechnology: testCase.automated_test_technology ?? null,
    automatedTestReference: testCase.automated_test_reference ?? null,
    reference: testCase.reference ?? '',
    format: FORMAT_BY_TEST_CASE_TYPE[testCase._type],
    script: testCase.script ?? null,
  };
}
