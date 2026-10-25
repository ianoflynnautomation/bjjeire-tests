import { TestOutcome, type TestExecutionResult } from '../domain/execution-result';
import type { TestCaseDefinition } from '../domain/test-case';
import type { Logger, PublishSummary, RunInfo, SquashStrategy, SyncSummary } from './contracts';

/** Local default: reports what a publish would do and makes no network call. */
export class DryRunStrategy implements SquashStrategy {
  readonly name = 'dry-run';

  constructor(
    private readonly logger: Logger,
    private readonly release = false,
  ) {}

  syncTestCases(definitions: readonly TestCaseDefinition[]): Promise<SyncSummary> {
    for (const definition of definitions) {
      this.logger.debug(`[dry-run] ${definition.key}  ${definition.name}  (${definition.file}:${definition.line})`);
    }
    this.logger.info(`[dry-run] Would sync ${definitions.length} test cases to Squash TM.`);
    return Promise.resolve({ created: 0, updated: 0, unchanged: 0, failed: 0, ids: new Map(), pinSuggestions: [] });
  }

  publishResults(results: readonly TestExecutionResult[], run: RunInfo): Promise<PublishSummary> {
    const tally = Object.values(TestOutcome)
      .map(outcome => `${results.filter(result => result.outcome === outcome).length} ${outcome}`)
      .join(', ');
    for (const result of results) {
      this.logger.debug(`[dry-run] ${result.outcome}: ${result.testCase.name}`);
    }
    const releaseNote = this.release ? ' A release execution is created for each result.' : '';
    this.logger.info(`[dry-run] Would publish ${results.length} results as "${run.name}": ${tally}.${releaseNote}`);
    return Promise.resolve({ iterationId: undefined, recorded: 0, failed: 0 });
  }
}
