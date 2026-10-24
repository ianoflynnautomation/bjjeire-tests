import type {
  CampaignId,
  ExecutionId,
  ExecutionRepository,
  FolderId,
  IterationId,
  RunInfo,
  TestCaseId,
  TestPlanItemId,
  TestCaseExecution,
  TestSuite,
  TestSuiteId,
} from '../application/ports';
import { ExecutionRole, executionRoleOf } from '../domain/execution-role';
import type { TestExecutionResult } from '../domain/execution-result';
import { describeError } from './logger';
import type { SquashClient } from './squash-client';
import type { HttpFolderTree } from './squash-folder-tree';
import { SquashPayloadBuilder } from './squash-payloads';
import { collectPages, createResource, DEFAULT_PAGE_SIZE } from './squash-requests';
import {
  executionCommentSchema,
  executionPageSchema,
  iterationPageSchema,
  parseWire,
  testPlanPageSchema,
  testSuiteSchema,
} from './squash-wire';

export class HttpExecutionRepository implements ExecutionRepository {
  constructor(
    private readonly client: SquashClient,
    /** The campaign library, where campaigns and their folders live. */
    private readonly campaigns: HttpFolderTree,
    private readonly payloads = new SquashPayloadBuilder(),
  ) {}

  async findCampaign(folderId: FolderId | undefined, name: string): Promise<CampaignId | undefined> {
    const match = (await this.campaigns.children(folderId)).find(node => node.kind === 'leaf' && node.name === name);
    return match === undefined ? undefined : (match.id as CampaignId);
  }

  async createCampaign(folderId: FolderId | undefined, name: string): Promise<CampaignId> {
    const body = this.payloads.createCampaign(this.campaigns.parentOf(folderId), name);
    return (await createResource(this.client, '/campaigns', body)) as CampaignId;
  }

  async listIterations(campaignId: CampaignId): Promise<readonly Readonly<{ id: IterationId; name: string }>[]> {
    const path = `/campaigns/${campaignId}/iterations`;
    const iterations = await collectPages(this.client, { path, pageSize: DEFAULT_PAGE_SIZE }, body => {
      const page = parseWire(iterationPageSchema, body, `GET ${path}`);
      return { items: page._embedded?.iterations ?? [], totalPages: page.page.totalPages };
    });
    return iterations.map(({ id, name }) => ({ id: id as IterationId, name }));
  }

  async createIteration(campaignId: CampaignId, name: string, description: string): Promise<IterationId> {
    const path = `/campaigns/${campaignId}/iterations`;
    return (await createResource(this.client, path, this.payloads.createIteration(name, description))) as IterationId;
  }

  async getTestSuite(id: TestSuiteId): Promise<TestSuite> {
    const path = `/test-suites/${id}`;
    const suite = parseWire(testSuiteSchema, await this.client.send({ method: 'GET', path }), `GET ${path}`);
    const plan = await this.testPlanAt(`${path}/test-plan`);
    return { id, name: suite.name, iterationId: suite.parent.id as IterationId, testCaseIds: [...plan.keys()] };
  }

  listTestPlan(iterationId: IterationId): Promise<ReadonlyMap<TestCaseId, TestPlanItemId>> {
    return this.testPlanAt(`/iterations/${iterationId}/test-plan`);
  }

  async addToTestPlan(iterationId: IterationId, testCaseId: TestCaseId): Promise<TestPlanItemId> {
    const path = `/iterations/${iterationId}/test-plan`;
    return (await createResource(this.client, path, this.payloads.addToTestPlan(testCaseId))) as TestPlanItemId;
  }

  /**
   * The newest execution whose comment is not a release marker. Reading stops
   * at that row: the list omits comments, so each candidate is fetched from
   * the newest backwards. `current` is false when a release row is newer,
   * because Squash shows the latest execution as the item's status.
   */
  async findTestCaseExecution(itemId: TestPlanItemId): Promise<TestCaseExecution | undefined> {
    const executionIds = await this.listExecutions(itemId);
    const latest = executionIds.at(-1);
    if (latest === undefined) return undefined;
    for (const executionId of executionIds.slice().reverse()) {
      const comment = await this.readExecutionComment(executionId);
      if (executionRoleOf(comment) === ExecutionRole.Release) continue;
      return { id: executionId, current: executionId === latest };
    }
    return undefined;
  }

  updateExecution(executionId: ExecutionId, result: TestExecutionResult, run: RunInfo): Promise<void> {
    return this.setExecutionStatus(executionId, result, run, ExecutionRole.TestCase);
  }

  async recordExecution(
    itemId: TestPlanItemId,
    result: TestExecutionResult,
    run: RunInfo,
    role: ExecutionRole,
  ): Promise<ExecutionId> {
    const executionId = (await createResource(
      this.client,
      `/iteration-test-plan-items/${itemId}/executions`,
    )) as ExecutionId;
    try {
      await this.setExecutionStatus(executionId, result, run, role);
    } catch (error) {
      throw new Error(
        `Execution ${executionId} was created and left READY; setting its status failed: ${describeError(error)}`,
        { cause: error },
      );
    }
    return executionId;
  }

  private async setExecutionStatus(
    executionId: ExecutionId,
    result: TestExecutionResult,
    run: RunInfo,
    role: ExecutionRole,
  ): Promise<void> {
    await this.client.send({
      method: 'PATCH',
      path: `/executions/${executionId}`,
      body: this.payloads.updateExecution(result, run, role),
    });
  }

  /** Oldest first. Squash treats the last row as the status the test case shows. */
  private async listExecutions(itemId: TestPlanItemId): Promise<readonly ExecutionId[]> {
    const path = `/iteration-test-plan-items/${itemId}/executions`;
    const executions = await collectPages(this.client, { path, pageSize: DEFAULT_PAGE_SIZE }, body => {
      const page = parseWire(executionPageSchema, body, `GET ${path}`);
      return { items: page._embedded?.executions ?? [], totalPages: page.page.totalPages };
    });
    return executions
      .slice()
      .sort((left, right) => left.execution_order - right.execution_order)
      .map(execution => execution.id as ExecutionId);
  }

  private async readExecutionComment(executionId: ExecutionId): Promise<string> {
    const path = `/executions/${executionId}`;
    const execution = parseWire(executionCommentSchema, await this.client.send({ method: 'GET', path }), `GET ${path}`);
    return execution.comment ?? '';
  }

  /** Test plan items keyed by the test case they plan; items whose case was deleted are skipped. */
  private async testPlanAt(path: string): Promise<Map<TestCaseId, TestPlanItemId>> {
    const items = await collectPages(this.client, { path, pageSize: DEFAULT_PAGE_SIZE }, body => {
      const page = parseWire(testPlanPageSchema, body, `GET ${path}`);
      return { items: page._embedded?.['test-plan'] ?? [], totalPages: page.page.totalPages };
    });
    const plan = new Map<TestCaseId, TestPlanItemId>();
    for (const item of items) {
      if (item.referenced_test_case) plan.set(item.referenced_test_case.id as TestCaseId, item.id as TestPlanItemId);
    }
    return plan;
  }
}
