import type { TestExecutionResult } from '../domain/execution-result';
import type { TestCaseDefinition } from '../domain/test-case';
import type { PublishSummary, RunInfo, SquashStrategy, SyncSummary } from './contracts';
import type { ResultPublisher } from './result-publisher';
import type { TestCaseSynchronizer } from './test-case-synchronizer';

/**
 * Publish mode: syncs test cases, then writes results. Results always sync
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
