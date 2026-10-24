import type { TestExecutionResult } from '../domain/execution-result';
import { forEachConcurrent } from './concurrency';
import type { ExecutionContextResolver } from './execution-context-resolver';
import type {
  ExecutionRepository,
  ExecutionTargetSpec,
  IterationId,
  Logger,
  PublishSummary,
  RunInfo,
  TestCaseId,
  TestPlanItemId,
} from './ports';

const CONCURRENCY = 4;

type PlannedResult = Readonly<{ result: TestExecutionResult; itemId: TestPlanItemId }>;

/**
 * Records one Squash execution per test case in the iteration the execution
 * context resolves to, adding test plan items for cases it does not yet plan.
 */
export class ResultPublisher {
  constructor(
    private readonly repository: ExecutionRepository,
    private readonly context: ExecutionContextResolver,
    private readonly target: ExecutionTargetSpec,
    private readonly logger: Logger,
  ) {}

  async publish(
    results: readonly TestExecutionResult[],
    testCaseIds: ReadonlyMap<string, TestCaseId>,
    run: RunInfo,
  ): Promise<PublishSummary> {
    const { iterationId, label } = await this.context.resolve(this.target, run);
    this.logger.info(`Publishing into ${label} (iteration ${iterationId}).`);
    const planned = await this.planItems(iterationId, results, testCaseIds);
    let recorded = 0;

    await forEachConcurrent(planned, CONCURRENCY, async ({ result, itemId }) => {
      try {
        const executionId = await this.repository.recordExecution(itemId, result, run);
        this.logger.debug(`Execution ${executionId}: ${result.outcome} "${result.testCase.name}"`);
        recorded += 1;
      } catch (error) {
        this.logger.error(`Could not record the result of "${result.testCase.name}"`, error);
      }
    });

    const failed = results.length - recorded;
    this.logger.info(`Iteration ${iterationId}: ${recorded} executions recorded, ${failed} failed.`);
    return { iterationId, recorded, failed };
  }

  /**
   * Serial on purpose: Squash numbers a new test plan item max(order) + 1
   * inside the insert, so concurrent adds to one iteration collide on a unique
   * constraint and fail with HTTP 500.
   */
  private async planItems(
    iterationId: IterationId,
    results: readonly TestExecutionResult[],
    testCaseIds: ReadonlyMap<string, TestCaseId>,
  ): Promise<PlannedResult[]> {
    const plan = await this.repository.listTestPlan(iterationId);
    const planned: PlannedResult[] = [];
    for (const result of results) {
      // A case without an id failed to sync; the synchronizer logged why.
      const testCaseId = testCaseIds.get(result.testCase.key);
      if (testCaseId === undefined) continue;
      try {
        const itemId = plan.get(testCaseId) ?? (await this.repository.addToTestPlan(iterationId, testCaseId));
        planned.push({ result, itemId });
      } catch (error) {
        this.logger.error(`Could not add "${result.testCase.name}" to iteration ${iterationId}`, error);
      }
    }
    return planned;
  }
}
