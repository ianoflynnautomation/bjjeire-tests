import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { createResultsReporterDependencies, type ResultsReporterDependencies } from '../composition';
import { SquashAnnotationError } from '../infrastructure/playwright-test-parser';

/**
 * Collects every test result and publishes them to Squash TM once the run
 * ends. Opt-in: `createBaseConfig` loads it only when `SQUASH_TM_MODE` is set.
 *
 * Squash problems never fail the test run unless `SQUASH_TM_FAIL_ON_ERROR`
 * is set — a Squash outage should not turn a green suite red.
 */
export class SquashResultsReporter implements Reporter {
  /** Annotation problems already logged; a test runs once per project, so each would repeat. */
  private readonly annotationProblems = new Set<string>();

  constructor(private readonly deps: ResultsReporterDependencies) {}

  onTestEnd(test: TestCase, result: TestResult): void {
    const { parser, aggregator, logger } = this.deps;
    if (!parser.inScope(test.tags)) return;
    try {
      aggregator.record(parser.toDefinition(test, result), parser.toProjectRun(test, result));
    } catch (error) {
      if (!(error instanceof SquashAnnotationError)) throw error;
      if (this.annotationProblems.has(error.message)) return;
      this.annotationProblems.add(error.message);
      logger.error('Not publishing a test with an invalid Squash annotation', error);
    }
  }

  async onEnd(): Promise<{ status?: FullResult['status'] } | undefined> {
    const publishFailed = await this.publish();
    const anyProblem = publishFailed || this.annotationProblems.size > 0;
    return this.deps.failOnError && anyProblem ? { status: 'failed' } : undefined;
  }

  /** Resolves whether anything failed to publish. */
  private async publish(): Promise<boolean> {
    const { strategy, aggregator, run, logger } = this.deps;
    const results = aggregator.results();
    if (results.length === 0) {
      // `--list`, or a grep that matched nothing: an empty iteration is noise.
      logger.info('No test results to publish.');
      return false;
    }
    try {
      logger.info(`Publishing ${results.length} results (${strategy.name}).`);
      const summary = await strategy.publishResults(results, run);
      return summary.failed > 0;
    } catch (error) {
      logger.error('Publishing results to Squash TM failed', error);
      return true;
    }
  }

  printsToStdio(): boolean {
    return false;
  }
}

/** Entry point Playwright instantiates. */
export default class SquashResultsReporterEntry extends SquashResultsReporter {
  constructor() {
    super(createResultsReporterDependencies());
  }
}
