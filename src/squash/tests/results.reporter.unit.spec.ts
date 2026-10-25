import { expect, test } from '@playwright/test';
import type { TestCase, TestResult } from '@playwright/test/reporter';
import type { PublishSummary, SquashStrategy } from '../application/contracts';
import { ResultAggregator } from '../application/result-aggregator';
import { TestOutcome, type TestExecutionResult } from '../domain/execution-result';
import { PlaywrightTestParser, SquashAnnotationError } from '../infrastructure/playwright-test-parser';
import { SquashResultsReporter } from '../reporters/results.reporter';
import { definition, projectRun, RecordingLogger, RUN } from './fakes';

/** A strategy whose publish returns, or throws, what the test says. */
function strategyAnswering(answer: PublishSummary | Error): SquashStrategy & { publishCalls: number } {
  const strategy = {
    name: 'fake',
    publishCalls: 0,
    syncTestCases: () => Promise.reject(new Error('not used')),
    publishResults: () => {
      strategy.publishCalls++;
      return answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer);
    },
  };
  return strategy;
}

/** A parser whose every test carries a broken `squash:*` annotation. */
class BrokenAnnotationParser extends PlaywrightTestParser {
  override toDefinition(): never {
    throw new SquashAnnotationError('api/x.spec.ts:3', "unknown annotation 'squash:weigth'");
  }
}

function reporter(
  strategy: SquashStrategy,
  options: { failOnError: boolean; withResult: boolean; parser?: PlaywrightTestParser },
) {
  const aggregator = new ResultAggregator();
  if (options.withResult) aggregator.record(definition('search'), projectRun('chromium-desktop', TestOutcome.Passed));
  return new SquashResultsReporter({
    strategy,
    aggregator,
    parser: options.parser ?? new PlaywrightTestParser('@acceptance'),
    logger: new RecordingLogger(),
    failOnError: options.failOnError,
    run: RUN,
  });
}

const PUBLISHED: PublishSummary = { iterationId: undefined, recorded: 1, failed: 0 };
const PARTLY_FAILED: PublishSummary = { iterationId: undefined, recorded: 0, failed: 1 };

test.describe('SquashResultsReporter', { tag: ['@unit'] }, () => {
  test('does not publish, or create an empty iteration, when no test ran', async () => {
    const strategy = strategyAnswering(PUBLISHED);

    await expect(reporter(strategy, { failOnError: true, withResult: false }).onEnd()).resolves.toBeUndefined();
    expect(strategy.publishCalls).toBe(0);
  });

  test('leaves the run status alone when publishing fails, unless failOnError is set', async () => {
    const outage = strategyAnswering(new Error('Squash is down'));

    await expect(reporter(outage, { failOnError: false, withResult: true }).onEnd()).resolves.toBeUndefined();
    await expect(reporter(outage, { failOnError: true, withResult: true }).onEnd()).resolves.toEqual({
      status: 'failed',
    });
  });

  test('fails the run for partially failed publishing only when failOnError is set', async () => {
    const partial = strategyAnswering(PARTLY_FAILED);

    await expect(reporter(partial, { failOnError: false, withResult: true }).onEnd()).resolves.toBeUndefined();
    await expect(reporter(partial, { failOnError: true, withResult: true }).onEnd()).resolves.toEqual({
      status: 'failed',
    });
  });

  test('fails the run for an invalid squash annotation only when failOnError is set, and still publishes the rest', async () => {
    // Only `tags` is read before the parser runs; a real TestCase cannot be built outside a run.
    const test = { tags: ['@acceptance'] } as unknown as TestCase;
    const strategy = strategyAnswering(PUBLISHED);
    const parser = new BrokenAnnotationParser('@acceptance');
    const lenient = reporter(strategy, { failOnError: false, withResult: true, parser });
    const strict = reporter(strategy, { failOnError: true, withResult: true, parser });

    lenient.onTestEnd(test, {} as TestResult);
    strict.onTestEnd(test, {} as TestResult);

    await expect(lenient.onEnd()).resolves.toBeUndefined();
    await expect(strict.onEnd()).resolves.toEqual({ status: 'failed' });
    expect(strategy.publishCalls).toBe(2);
  });

  test('publishes one result when the same test runs in two projects', async () => {
    const published: TestExecutionResult[][] = [];
    const reporter = new SquashResultsReporter({
      strategy: strategyRecording(published),
      aggregator: new ResultAggregator(),
      parser: new PlaywrightTestParser('@acceptance'),
      logger: new RecordingLogger(),
      failOnError: false,
      run: RUN,
    });
    const line = 8;

    reporter.onTestEnd(playwrightTest('search', line, 'chromium-desktop'), passed(['Given a gym']));
    reporter.onTestEnd(playwrightTest('search', line, 'firefox-desktop'), passed(['When the gym is open']));

    await expect(reporter.onEnd()).resolves.toBeUndefined();
    expect(published[0]).toHaveLength(1);
    expect(published[0]?.[0]?.runs.map(run => run.project).sort()).toEqual(['chromium-desktop', 'firefox-desktop']);
  });

  test('fails the run when two tests share a Squash id, even if failOnError is off, and still publishes the rest', async () => {
    const published: TestExecutionResult[][] = [];
    const logger = new RecordingLogger();
    const reporter = new SquashResultsReporter({
      strategy: strategyRecording(published),
      aggregator: new ResultAggregator(),
      parser: new PlaywrightTestParser('@acceptance'),
      logger,
      failOnError: false,
      run: RUN,
    });
    const firstLine = 10;
    const secondLine = 20;
    const keptLine = 4;

    reporter.onTestEnd(playwrightTest('one', firstLine, 'chromium-desktop', ['@acceptance', '@Squash_10']), passed());
    reporter.onTestEnd(playwrightTest('two', secondLine, 'chromium-desktop', ['@acceptance', '@Squash_10']), passed());
    reporter.onTestEnd(playwrightTest('kept', keptLine, 'chromium-desktop'), passed());

    await expect(reporter.onEnd()).resolves.toEqual({ status: 'failed' });
    expect(published[0]?.map(entry => entry.testCase.name)).toEqual(['Gyms UI acceptance › kept']);
    const logged = logger.lines.join('\n');
    expect(logged).toContain('Not publishing a test Squash cannot identify');
    expect(logged).toContain(`:${firstLine}`);
    expect(logged).toContain(`:${secondLine}`);
  });
});

const SPEC = 'features/gyms/gyms.ui.acceptance.spec.ts';

function strategyRecording(into: TestExecutionResult[][]): SquashStrategy {
  return {
    name: 'fake',
    syncTestCases: () => Promise.reject(new Error('not used')),
    publishResults: results => {
      into.push([...results]);
      return Promise.resolve(PUBLISHED);
    },
  };
}

function playwrightTest(
  name: string,
  line: number,
  project: string,
  tags: readonly string[] = ['@acceptance'],
): TestCase {
  return {
    tags,
    annotations: [],
    expectedStatus: 'passed',
    titlePath: () => ['', project, SPEC, 'Gyms UI acceptance', name],
    location: { file: SPEC, line, column: 1 },
    parent: { project: () => ({ name: project }) },
  } as unknown as TestCase;
}

function passed(titles: readonly string[] = []): TestResult {
  return {
    status: 'passed',
    duration: 0,
    retry: 0,
    errors: [],
    steps: titles.map(title => ({ category: 'test.step', title })),
  } as unknown as TestResult;
}
