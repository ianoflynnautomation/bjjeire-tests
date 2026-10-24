import { expect, test } from '@playwright/test';
import type { TestResult } from '@playwright/test/reporter';
import { ResultAggregator } from '../application/result-aggregator';
import { TestOutcome } from '../domain/execution-result';
import { stepsOf } from '../domain/gherkin';
import { gherkinStepsOf } from '../infrastructure/playwright-test-parser';
import { SquashPayloadBuilder } from '../infrastructure/squash-payloads';
import { definition, projectRun, stateNamed } from './fakes';

const GIVEN = 'Given an environment that enforces API authorization';
const WHEN = 'When a client requests the gym directory without a bearer token';
const THEN = 'Then the request is rejected as unauthorized';

/** The parts of a Playwright result `gherkinStepsOf` reads. */
function result(status: TestResult['status'], steps: readonly { category: string; title: string }[]) {
  return { status, steps: steps as unknown as TestResult['steps'] };
}

test.describe('Gherkin steps', { tag: ['@unit'] }, () => {
  test('takes the top-level Given/When/Then test.step titles of a passing run, in order', () => {
    const passed = result('passed', [
      { category: 'hook', title: 'Before Hooks' },
      { category: 'test.step', title: GIVEN },
      { category: 'test.step', title: 'Open the directory' },
      { category: 'test.step', title: WHEN },
      { category: 'test.step', title: THEN },
      { category: 'pw:api', title: 'Then-looking API call' },
    ]);

    expect(gherkinStepsOf(passed)).toEqual([GIVEN, WHEN, THEN]);
  });

  test('knows no steps from a failed or skipped run, which stop part-way', () => {
    const steps = [{ category: 'test.step', title: GIVEN }];

    expect(gherkinStepsOf(result('failed', steps))).toBeUndefined();
    expect(gherkinStepsOf(result('skipped', steps))).toBeUndefined();
  });

  test('writes the steps under the Scenario, and a sync that cannot see steps keeps them', () => {
    const builder = new SquashPayloadBuilder();
    const run = definition('rejected without a token', { steps: [GIVEN, WHEN, THEN] });
    const script = builder.createTestCase(run, { _type: 'project', id: 1 }, 'API-001').script;

    expect(script).toContain(`  Scenario: rejected without a token\n    ${GIVEN}\n    ${WHEN}\n    ${THEN}\n`);

    const current = stateNamed(run.name, { description: '', script });
    const listed = definition('rejected without a token');
    expect(stepsOf(current.script)).toEqual([GIVEN, WHEN, THEN]);
    expect(builder.updateTestCase(current, listed, undefined)).not.toHaveProperty('script');
  });

  test('rewrites the script when a passing run reports different steps', () => {
    const builder = new SquashPayloadBuilder();
    const before = definition('rejected without a token', { steps: [GIVEN, WHEN, THEN] });
    const script = builder.createTestCase(before, { _type: 'project', id: 1 }, 'API-001').script;
    const after = definition('rejected without a token', {
      steps: [GIVEN, WHEN, 'Then the response is a 401 problem'],
    });

    const patch = builder.updateTestCase(stateNamed(after.name, { description: '', script }), after, undefined);

    expect(patch?.script).toContain('    Then the response is a 401 problem\n');
    expect(patch?.script).not.toContain(THEN);
  });

  test('keeps the steps of a passing project when another project fails', () => {
    const aggregator = new ResultAggregator();
    aggregator.record(definition('t', { steps: [GIVEN, THEN] }), projectRun('chromium', TestOutcome.Passed));
    aggregator.record(definition('t'), projectRun('webkit', TestOutcome.Failed));

    expect(aggregator.results()[0]?.testCase.steps).toEqual([GIVEN, THEN]);
  });
});
