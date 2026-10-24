import type { TestExecutionResult } from '../domain/execution-result';
import { ExecutionRole } from '../domain/execution-role';
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

type PublishOptions = Readonly<{ logger: Logger; release: boolean }>;

export class ResultPublisher {
  private readonly logger: Logger;
  private readonly release: boolean;

  constructor(
    private readonly repository: ExecutionRepository,
    private readonly context: ExecutionContextResolver,
    private readonly target: ExecutionTargetSpec,
    options: PublishOptions,
  ) {
    this.logger = options.logger;
    this.release = options.release;
  }

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
        await this.writeResult(itemId, result, run);
        recorded += 1;
      } catch (error) {
        this.logger.error(`Could not record the result of "${result.testCase.name}"`, error);
      }
    });

    const failed = results.length - recorded;
    const releases = this.release ? `, ${recorded} release executions created` : '';
    this.logger.info(`Iteration ${iterationId}: ${recorded} results published${releases}, ${failed} failed.`);
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

  /**
   * Squash shows the latest execution as the test case's status. An ordinary
   * publish patches that execution when it is the test case's own row, and
   * creates one when the latest row is a release execution so the release
   * record stays as it was written. A release patches the test case execution
   * when one exists, then creates the release execution.
   */
  private async writeResult(itemId: TestPlanItemId, result: TestExecutionResult, run: RunInfo): Promise<void> {
    const testCaseExecution = await this.repository.findTestCaseExecution(itemId);
    if (this.release) {
      if (testCaseExecution) {
        await this.repository.updateExecution(testCaseExecution.id, result, run);
        this.logger.debug(
          `Updated test case execution ${testCaseExecution.id}: ${result.outcome} "${result.testCase.name}"`,
        );
      }
      const releaseId = await this.repository.recordExecution(itemId, result, run, ExecutionRole.Release);
      this.logger.debug(`Release execution ${releaseId}: ${result.outcome} "${result.testCase.name}"`);
      return;
    }
    if (testCaseExecution?.current) {
      await this.repository.updateExecution(testCaseExecution.id, result, run);
      this.logger.debug(
        `Updated test case execution ${testCaseExecution.id}: ${result.outcome} "${result.testCase.name}"`,
      );
      return;
    }
    const executionId = await this.repository.recordExecution(itemId, result, run, ExecutionRole.TestCase);
    this.logger.debug(`Test case execution ${executionId}: ${result.outcome} "${result.testCase.name}"`);
  }
}
