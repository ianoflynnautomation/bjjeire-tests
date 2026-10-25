import { expect, test } from '@playwright/test';
import type { ExecutionId, IterationId, TestCaseId, TestPlanItemId } from '../application/contracts';
import { ExecutionRole } from '../domain/execution-role';
import { SquashApiError, type SquashClient, type SquashRequest } from '../infrastructure/squash-client';
import { HttpExecutionRepository } from '../infrastructure/squash-execution-repository';
import { HttpFolderTree } from '../infrastructure/squash-folder-tree';
import { HttpTestCaseRepository } from '../infrastructure/squash-test-case-repository';
import { TEST_CASE_FIELDS } from '../infrastructure/rest-schemas';
import { definition, result, RUN, stateNamed } from './fakes';

const PROJECT_ID = 2;
const PAGE_SIZE = 2;
const ITERATION_NUMBER = 5;
const ITERATION_ID = ITERATION_NUMBER as IterationId;
const PLANNED_ITEM_ID = 10;
const MANUAL_ID = 3;
const SYNCED_REFERENCE = 'features/gyms/gyms.ui.acceptance.spec.ts#Gyms UI acceptance › synced';
const ORPHANED_ITEM_ID = 11;

/** Answers each request with the next queued body and records what was asked. */
class ScriptedClient implements SquashClient {
  readonly requests: SquashRequest[] = [];

  constructor(private readonly bodies: unknown[]) {}

  send(request: SquashRequest): Promise<unknown> {
    this.requests.push(request);
    const next = this.bodies.shift();
    if (next instanceof Error) return Promise.reject(next);
    return Promise.resolve(next);
  }
}

function testCasePage(page: number, totalPages: number, testCases: unknown[]): unknown {
  return { _embedded: { 'test-cases': testCases }, page: { number: page, totalPages } };
}

/** A test case as the Squash listing returns it. */
function wireTestCase(
  id: number,
  name: string,
  automationReference: string | null,
  type = 'scripted-test-case',
): unknown {
  return {
    _type: type,
    id,
    name,
    description: '<p>d</p>',
    importance: 'HIGH',
    status: 'WORK_IN_PROGRESS',
    nature: { code: 'NAT_UNDEFINED' },
    type: { code: 'TYP_UNDEFINED' },
    automated_test_technology: null,
    automated_test_reference: automationReference,
    // Squash escapes a slash inside a name.
    path: `/PW Probe/Acceptance/Gyms/${name.replaceAll('/', '\\/')}`,
  };
}

function withPath(body: unknown, path: string): unknown {
  if (typeof body !== 'object' || body === null) throw new Error('expected a test case body');
  return { ...(body as Record<string, unknown>), path };
}

function testCasesOver(client: SquashClient): HttpTestCaseRepository {
  return new HttpTestCaseRepository(client, { projectId: PROJECT_ID, pageSize: PAGE_SIZE });
}

function executionsOver(client: SquashClient): HttpExecutionRepository {
  return new HttpExecutionRepository(client, new HttpFolderTree(client, PROJECT_ID, 'campaign'));
}

test.describe('Squash repositories', { tag: ['@unit'] }, () => {
  test('reads every page of the project, including hand-written cases no test claims', async () => {
    const client = new ScriptedClient([
      testCasePage(0, 2, [wireTestCase(1, 'synced', SYNCED_REFERENCE), wireTestCase(2, 'manual', '')]),
      testCasePage(1, 2, [wireTestCase(MANUAL_ID, 'scanned against WCAG 2.1 A/AA', null, 'test-case')]),
    ]);

    const testCases = await testCasesOver(client).listTestCases();

    expect(testCases.map(({ id, key, folderPath, state }) => [id, key, folderPath, state.name, state.format])).toEqual([
      [1, SYNCED_REFERENCE, 'Acceptance/Gyms', 'synced', 'gherkin'],
      [2, undefined, 'Acceptance/Gyms', 'manual', 'gherkin'],
      [MANUAL_ID, undefined, 'Acceptance/Gyms', 'scanned against WCAG 2.1 A/AA', 'classic'],
    ]);
    expect(testCases[0]?.state).toEqual(
      stateNamed('synced', { description: '<p>d</p>', weight: 'HIGH', automatedTestReference: SYNCED_REFERENCE }),
    );
    expect(client.requests.map(request => request.query)).toEqual([
      { fields: TEST_CASE_FIELDS, page: 0, size: PAGE_SIZE },
      { fields: TEST_CASE_FIELDS, page: 1, size: PAGE_SIZE },
    ]);
  });

  test('unescapes a slash inside a folder name', async () => {
    const body = wireTestCase(1, 'name', null, 'test-case');
    const client = new ScriptedClient([
      testCasePage(0, 1, [withPath(body, '/PW Probe/Acceptance/WCAG 2.1 A\\/AA/name')]),
    ]);

    const [testCase] = await testCasesOver(client).listTestCases();

    expect(testCase?.folderPath).toBe('Acceptance/WCAG 2.1 A/AA');
    expect(testCase?.state.name).toBe('name');
  });

  test('treats an empty project page (no _embedded) as no test cases', async () => {
    const client = new ScriptedClient([{ page: { number: 0, totalPages: 0 } }]);

    await expect(testCasesOver(client).listTestCases()).resolves.toEqual([]);
  });

  test('maps the test plan by test case, skipping items whose test case was deleted', async () => {
    const client = new ScriptedClient([
      {
        _embedded: {
          'test-plan': [
            { id: PLANNED_ITEM_ID, referenced_test_case: { id: 1 } },
            { id: ORPHANED_ITEM_ID, referenced_test_case: null },
          ],
        },
        page: { number: 0, totalPages: 1 },
      },
    ]);

    const plan = await executionsOver(client).listTestPlan(ITERATION_ID);

    expect([...plan]).toEqual([[1, PLANNED_ITEM_ID]]);
    expect(client.requests[0]?.path).toBe(`/iterations/${ITERATION_ID}/test-plan`);
  });

  test('names the READY execution when setting its status fails', async () => {
    const executionId = 42;
    const failure = new SquashApiError({ method: 'PATCH', path: `/executions/${executionId}` }, 500, 'boom', undefined);
    const client = new ScriptedClient([{ id: executionId }, failure]);

    const error: unknown = await executionsOver(client)
      .recordExecution(PLANNED_ITEM_ID as TestPlanItemId, result(definition('search')), RUN, ExecutionRole.Release)
      .then(
        () => undefined,
        (caught: unknown) => caught,
      );

    expect(error).toBeInstanceOf(Error);
    if (!(error instanceof Error)) return;
    expect(error.message).toContain(`Execution ${executionId} was created and left READY`);
    expect(error.message).toContain('500');
    expect(error.message).toContain('boom');
    expect(error.cause).toBe(failure);
    expect(client.requests.map(request => request.method)).toEqual(['POST', 'PATCH']);
    expect(client.requests[1]?.body).toMatchObject({ comment: expect.stringContaining('Release execution') });
  });

  test('patches the test case execution without creating a row', async () => {
    const executionId = 42;
    const client = new ScriptedClient([{}]);

    await executionsOver(client).updateExecution(executionId as ExecutionId, result(definition('search')), RUN);

    expect(client.requests).toEqual([
      expect.objectContaining({
        method: 'PATCH',
        path: `/executions/${executionId}`,
        body: expect.objectContaining({ comment: expect.stringContaining('Test case execution') }),
      }),
    ]);
  });

  test('finds the newest test case execution and stops before older rows', async () => {
    const olderId = 7;
    const newerId = 8;
    const client = new ScriptedClient([
      {
        _embedded: {
          executions: [
            { id: newerId, execution_order: 2 },
            { id: olderId, execution_order: 0 },
          ],
        },
        page: { number: 0, totalPages: 1 },
      },
      { comment: '<p><strong>Test case execution</strong></p>' },
    ]);

    const found = await executionsOver(client).findTestCaseExecution(PLANNED_ITEM_ID as TestPlanItemId);

    expect(found).toEqual({ id: newerId, current: true });
    expect(client.requests.map(request => request.path)).toEqual([
      `/iteration-test-plan-items/${PLANNED_ITEM_ID}/executions`,
      `/executions/${newerId}`,
    ]);
  });

  test('reports a test case execution as not current when a release execution is newer', async () => {
    const testCaseId = 7;
    const releaseId = 8;
    const client = new ScriptedClient([
      {
        _embedded: {
          executions: [
            { id: testCaseId, execution_order: 0 },
            { id: releaseId, execution_order: 1 },
          ],
        },
        page: { number: 0, totalPages: 1 },
      },
      { comment: '<p><strong>Release execution</strong></p>' },
      { comment: '<p>Playwright run</p>' },
    ]);

    const found = await executionsOver(client).findTestCaseExecution(PLANNED_ITEM_ID as TestPlanItemId);

    expect(found).toEqual({ id: testCaseId, current: false });
    expect(client.requests.map(request => request.path)).toEqual([
      `/iteration-test-plan-items/${PLANNED_ITEM_ID}/executions`,
      `/executions/${releaseId}`,
      `/executions/${testCaseId}`,
    ]);
  });

  test('fails loudly when Squash answers with an unexpected shape', async () => {
    const client = new ScriptedClient([{ id: 'not-a-number' }]);

    await expect(executionsOver(client).addToTestPlan(ITERATION_ID, 1 as TestCaseId)).rejects.toThrow(
      /POST \/iterations\/5\/test-plan did not match the expected shape/,
    );
  });
});
