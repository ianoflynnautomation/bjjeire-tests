import { TestOutcome, type TestExecutionResult } from '../domain/execution-result';
import type { TestCaseDefinition } from '../domain/test-case';
import type { Logger, PublishSummary, RunInfo, SquashStrategy, SyncSummary } from './ports';
import type { ResultPublisher } from './result-publisher';
import type { TestCaseSynchronizer } from './test-case-synchronizer';

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

/**
 * CI behaviour: syncs test cases, then writes results. Results always sync
 * their own test cases first, so a run never depends on `squash:sync` having
 * been run beforehand.
 */
export class RemoteStrategy implements SquashStrategy {
  readonly name = 'publish';

  constructor(
    private readonly synchronizer: TestCaseSynchronizer,
    private readonly publisher: ResultPublisher | undefined,
  ) {}

  syncTestCases(definitions: readonly TestCaseDefinition[]): Promise<SyncSummary> {
    return this.synchronizer.sync(definitions);
  }

  async publishResults(results: readonly TestExecutionResult[], run: RunInfo): Promise<PublishSummary> {
    if (!this.publisher) {
      throw new Error('No Squash TM iteration or campaign is configured to publish results to.');
    }
    const synced = await this.synchronizer.sync(results.map(result => result.testCase));
    return this.publisher.publish(results, synced.ids, run);
  }
}
