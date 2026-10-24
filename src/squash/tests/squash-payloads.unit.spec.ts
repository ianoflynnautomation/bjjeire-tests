import { expect, test } from '@playwright/test';
import type { TestCaseState } from '../application/ports';
import { TestOutcome } from '../domain/execution-result';
import { SquashPayloadBuilder } from '../infrastructure/squash-payloads';
import type { CreateTestCaseBody } from '../infrastructure/squash-wire';
import { definition, projectRun, RUN, stateNamed } from './fakes';

test.describe('SquashPayloadBuilder', { tag: ['@unit'] }, () => {
  test('maps the outcome to a Squash status and escapes error output in the comment', () => {
    const testCase = definition('shows <b>gyms</b>');
    const failed = projectRun('chromium-desktop', TestOutcome.Failed, {
      errors: [{ message: 'boom', stack: '\u001b[31mError: expected <div> & got nothing\u001b[39m' }],
    });

    const payload = new SquashPayloadBuilder().updateExecution(
      { testCase, outcome: TestOutcome.Failed, runs: [failed] },
      RUN,
    );

    expect(payload).toMatchObject({ _type: 'execution', execution_status: 'FAILURE' });
    const { comment } = payload as { comment: string };
    expect(comment).toContain('<pre>Error: expected &lt;div&gt; &amp; got nothing</pre>');
    expect(comment).not.toContain('\u001b');
  });

  test('creates the case under the configured parent with its readable label as the reference', () => {
    const testCase = definition('search', { tags: ['@smoke', '@acceptance'] });

    const payload = new SquashPayloadBuilder().createTestCase(
      testCase,
      { _type: 'test-case-folder', id: 3 },
      'GYMS-001',
    );

    expect(payload).toMatchObject({
      _type: 'scripted-test-case',
      name: 'search',
      reference: 'GYMS-001',
      parent: { _type: 'test-case-folder', id: 3 },
    });
    expect((payload as { description: string }).description).toContain('Tags: @smoke, @acceptance');
  });

  test('creates a test case with its requested fields and its identity as the automated test reference', () => {
    const testCase = definition('search', { fields: { weight: 'HIGH', nature: 'NAT_SECURITY_TESTING' } });

    expect(builder.createTestCase(testCase, PROJECT_ROOT, 'GYMS-001')).toMatchObject({
      name: 'search',
      importance: 'HIGH',
      nature: { code: 'NAT_SECURITY_TESTING' },
      automated_test_technology: 'Playwright',
      automated_test_reference: `${testCase.file}#Gyms UI acceptance › search`,
    });
  });

  test('sends nothing when Squash already holds what the test asks for', () => {
    const testCase = definition('search', { fields: { status: 'APPROVED' } });

    expect(
      builder.updateTestCase(stateOf(builder.createTestCase(testCase, PROJECT_ROOT, 'GYMS-001')), testCase, undefined),
    ).toBeUndefined();
  });

  test('patches only the fields that changed, and leaves fields the test does not set to Squash', () => {
    const before = definition('search');
    const current = stateOf(builder.createTestCase(before, PROJECT_ROOT, 'GYMS-001'));
    const after = definition('search', { fields: { weight: 'VERY_HIGH' } });

    expect(builder.updateTestCase({ ...current, status: 'APPROVED' }, after, undefined)).toEqual({
      _type: 'scripted-test-case',
      importance: 'VERY_HIGH',
    });
  });

  test('creates an automated test as a Gherkin case: describe as Feature, title as Scenario, tags without the pin', () => {
    const testCase = definition('search', { tags: ['@smoke', '@acceptance', '@Squash_12'] });

    expect(builder.createTestCase(testCase, PROJECT_ROOT, 'GYMS-001').script).toBe(
      [
        `# Automated by Playwright: ${testCase.file}`,
        'Feature: Gyms UI acceptance',
        '',
        '  @smoke @acceptance',
        '  Scenario: search',
        '',
      ].join('\n'),
    );
  });

  test('rewrites the script of a synced Gherkin case when the test is renamed, with its own _type', () => {
    const current = stateOf(builder.createTestCase(definition('search'), PROJECT_ROOT, 'GYMS-001'));
    const renamed = definition('search by name', { pinnedId: 1 });

    expect(builder.updateTestCase(current, renamed, undefined)).toMatchObject({
      _type: 'scripted-test-case',
      name: 'search by name',
      script: expect.stringContaining('Scenario: search by name'),
    });
  });

  test('patches a Classic case as a Classic case and never sends it a script', () => {
    const classic = stateNamed('search', { format: 'classic', description: '' });

    const patch = builder.updateTestCase(classic, definition('search', { fields: { weight: 'HIGH' } }), undefined);

    expect(patch).toMatchObject({ _type: 'test-case', importance: 'HIGH' });
    expect(patch).not.toHaveProperty('script');
  });

  test('never overwrites the name or description of a hand-written test case a test is pinned to', () => {
    const manual = stateNamed('Login rejects a missing token', { description: '<p>Written by a tester.</p>' });
    const pinned = definition('client should be rejected without a token', { pinnedId: 1, fields: { weight: 'HIGH' } });

    const patch = builder.updateTestCase(manual, pinned, undefined);

    expect(patch).toMatchObject({ importance: 'HIGH', automated_test_technology: 'Playwright' });
    expect(patch).not.toHaveProperty('name');
    expect(patch).not.toHaveProperty('description');
  });
});

const builder = new SquashPayloadBuilder();
const PROJECT_ROOT = { _type: 'project', id: 1 } as const;

/** The state Squash would report right after `createTestCase` with this body. */
function stateOf(body: CreateTestCaseBody): TestCaseState {
  return {
    name: body.name,
    description: body.description ?? '',
    weight: body.importance ?? 'LOW',
    status: body.status ?? 'WORK_IN_PROGRESS',
    nature: body.nature?.code ?? 'NAT_UNDEFINED',
    type: body.type?.code ?? 'TYP_UNDEFINED',
    automatedTestTechnology: body.automated_test_technology ?? null,
    automatedTestReference: body.automated_test_reference ?? null,
    reference: body.reference ?? '',
    format: 'gherkin',
    script: body.script,
  };
}
