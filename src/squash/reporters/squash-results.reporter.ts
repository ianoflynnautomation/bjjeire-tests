import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { createResultsReporterDependencies, type ResultsReporterDependencies } from '../composition';
import type { ProjectRun } from '../domain/execution-result';
import { duplicateIdentityMessage, sameLogicalTest } from '../domain/test-identity';
import type { TestCaseDefinition } from '../domain/test-case';
import { SquashAnnotationError } from '../infrastructure/playwright-test-parser';

/**
 * Collects every test result and publishes them to Squash TM once the run
 * ends. Opt-in: `createBaseConfig` loads it only when `SQUASH_TM_MODE` is set.
 *
 * Squash problems never fail the test run unless `SQUASH_TM_FAIL_ON_ERROR`
 * is set — a Squash outage should not turn a green suite red. Two different
 * tests that share an identity are the exception: neither result is published,
 * and the run fails, because publishing one would record it against the wrong case.
 */
export class SquashResultsReporter implements Reporter {
  /** Annotation problems already logged; a test runs once per project, so each would repeat. */
  private readonly annotationProblems = new Set<string>();
  /** Logical tests already seen for a Squash identity, so a second project is not a collision. */
  private readonly identities = new Map<string, TestCaseDefinition[]>();
  private identityCollision = false;

  constructor(private readonly deps: ResultsReporterDependencies) {}

  onTestEnd(test: TestCase, result: TestResult): void {
    const { parser, logger } = this.deps;
    if (!parser.inScope(test.tags)) return;
    try {
      this.keep(parser.toDefinition(test, result), parser.toProjectRun(test, result));
    } catch (error) {
      if (!(error instanceof SquashAnnotationError)) throw error;
      if (this.annotationProblems.has(error.message)) return;
      this.annotationProblems.add(error.message);
      logger.error('Not publishing a test Squash cannot identify', error);
    }
  }

  async onEnd(): Promise<{ status?: FullResult['status'] } | undefined> {
    const publishFailed = await this.publish();
    if (this.identityCollision) return { status: 'failed' };
    const anyProblem = publishFailed || this.annotationProblems.size > 0;
    return this.deps.failOnError && anyProblem ? { status: 'failed' } : undefined;
  }

  /**
   * The same spec location in another project updates the one result. A
   * different test with the same key drops both, so neither is published.
   */
  private keep(definition: TestCaseDefinition, run: ProjectRun): void {
    const known = this.identities.get(definition.key) ?? [];
    const seen = known.some(candidate => sameLogicalTest(candidate, definition));
    if (!seen) {
      known.push(definition);
      this.identities.set(definition.key, known);
    }
    if (known.length > 1) {
      this.identityCollision = true;
      this.deps.aggregator.drop(definition.key);
      if (!seen) {
        this.deps.logger.error(
          'Not publishing a test Squash cannot identify',
          new Error(duplicateIdentityMessage(known)),
        );
      }
      return;
    }
    this.deps.aggregator.record(definition, run);
  }

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
