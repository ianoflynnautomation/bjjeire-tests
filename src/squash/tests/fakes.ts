import type {
  CampaignId,
  ExecutionId,
  ExecutionRepository,
  FolderId,
  FolderTree,
  IterationId,
  LibraryNode,
  Logger,
  RunInfo,
  SquashTestCase,
  TestCaseId,
  TestCaseRepository,
  TestCaseState,
  TestPlanItemId,
  TestSuite,
  TestSuiteId,
} from '../application/ports';
import { TestOutcome, type ProjectRun, type TestExecutionResult } from '../domain/execution-result';
import { automationReference, type TestCaseDefinition } from '../domain/test-case';

export const RUN: RunInfo = { id: 'local-1', name: 'Playwright local local-1', description: 'unit test run' };

export function definition(name: string, overrides: Partial<TestCaseDefinition> = {}): TestCaseDefinition {
  return {
    key: automationReference('features/gyms/gyms.ui.acceptance.spec.ts', ['Gyms UI acceptance', name]),
    automationReference: automationReference('features/gyms/gyms.ui.acceptance.spec.ts', ['Gyms UI acceptance', name]),
    name,
    file: 'features/gyms/gyms.ui.acceptance.spec.ts',
    titles: ['Gyms UI acceptance', name],
    line: 1,
    tags: ['@acceptance'],
    pinnedId: undefined,
    fields: {},
    steps: undefined,
    ...overrides,
  };
}

export function projectRun(project: string, outcome: TestOutcome, overrides: Partial<ProjectRun> = {}): ProjectRun {
  return { project, outcome, durationMs: 1200, attempts: 1, errors: [], ...overrides };
}

export function result(testCase: TestCaseDefinition, outcome: TestOutcome = TestOutcome.Passed): TestExecutionResult {
  return { testCase, outcome, runs: [projectRun('chromium-desktop', outcome)] };
}

export class RecordingLogger implements Logger {
  readonly lines: string[] = [];

  debug(message: string): void {
    this.lines.push(`debug ${message}`);
  }

  info(message: string): void {
    this.lines.push(`info ${message}`);
  }

  warn(message: string): void {
    this.lines.push(`warn ${message}`);
  }

  error(message: string, error?: unknown): void {
    this.lines.push(`error ${message}${error instanceof Error ? `: ${error.message}` : ''}`);
  }
}

type Execution = Readonly<{ id: ExecutionId; itemId: TestPlanItemId; outcome: TestOutcome }>;

/** One Squash project in memory, behind both repository ports. */
export class InMemorySquash implements TestCaseRepository, ExecutionRepository {
  readonly testCases = new Map<TestCaseId, SquashTestCase>();
  readonly campaigns = new Map<CampaignId, { folderId: FolderId | undefined; name: string }>();
  readonly iterations = new Map<IterationId, { campaignId: CampaignId; name: string }>();
  readonly testPlan = new Map<TestPlanItemId, { iterationId: IterationId; testCaseId: TestCaseId }>();
  readonly suites = new Map<TestSuiteId, TestSuite>();
  readonly executions: Execution[] = [];
  readonly failCreateFor = new Set<string>();
  /** The folder each created test case was created in (`undefined`: the project root). */
  readonly createdIn = new Map<TestCaseId, FolderId | undefined>();
  /** Squash hands out ids from one sequence; so does the fake. */
  private sequence = 1;
  private planAddsInFlight = 0;

  /** A test case as Squash holds it; `key` undefined models a hand-written case with no reference. */
  seedTestCase(
    key: string | undefined,
    name: string,
    folderPath = '',
    overrides: Partial<TestCaseState> = {},
  ): TestCaseId {
    const id = this.sequence++ as TestCaseId;
    this.testCases.set(id, { id, key, folderPath, state: stateNamed(name, overrides) });
    return id;
  }

  seedIteration(campaignId: CampaignId, name = 'seeded'): IterationId {
    const id = this.sequence++ as IterationId;
    this.iterations.set(id, { campaignId, name });
    return id;
  }

  seedSuite(iterationId: IterationId, testCaseIds: readonly TestCaseId[]): TestSuiteId {
    const id = this.sequence++ as TestSuiteId;
    this.suites.set(id, { id, name: 'Smoke', iterationId, testCaseIds });
    return id;
  }

  listTestCases(): Promise<readonly SquashTestCase[]> {
    return Promise.resolve([...this.testCases.values()]);
  }

  createTestCase(testCase: TestCaseDefinition, folderId: FolderId | undefined, label: string): Promise<TestCaseId> {
    if (this.failCreateFor.has(testCase.key)) return Promise.reject(new Error('Squash said no'));
    const id = this.seedTestCase(testCase.key, testCase.name);
    this.relabel(id, label);
    this.createdIn.set(id, folderId);
    return Promise.resolve(id);
  }

  /** Field-level diffing belongs to the payload builder (tested there); the fake diffs the name only. */
  updateTestCase(current: SquashTestCase, testCase: TestCaseDefinition, label: string | undefined): Promise<boolean> {
    if (current.state.name === testCase.name && label === undefined) return Promise.resolve(false);
    this.testCases.set(current.id, { ...current, state: { ...current.state, name: testCase.name } });
    if (label !== undefined) this.relabel(current.id, label);
    return Promise.resolve(true);
  }

  /** Sets a case's reference (and, for seeding, its description). */
  relabel(id: TestCaseId, reference: string, description?: string): void {
    const testCase = this.testCases.get(id);
    if (!testCase) return;
    const state = { ...testCase.state, reference, ...(description === undefined ? {} : { description }) };
    this.testCases.set(id, { ...testCase, state });
  }

  findCampaign(folderId: FolderId | undefined, name: string): Promise<CampaignId | undefined> {
    const match = [...this.campaigns].find(([, campaign]) => campaign.folderId === folderId && campaign.name === name);
    return Promise.resolve(match?.[0]);
  }

  createCampaign(folderId: FolderId | undefined, name: string): Promise<CampaignId> {
    const id = this.sequence++ as CampaignId;
    this.campaigns.set(id, { folderId, name });
    return Promise.resolve(id);
  }

  listIterations(campaignId: CampaignId): Promise<readonly Readonly<{ id: IterationId; name: string }>[]> {
    const inCampaign = [...this.iterations].filter(([, iteration]) => iteration.campaignId === campaignId);
    return Promise.resolve(inCampaign.map(([id, { name }]) => ({ id, name })));
  }

  createIteration(campaignId: CampaignId, name: string): Promise<IterationId> {
    return Promise.resolve(this.seedIteration(campaignId, name));
  }

  getTestSuite(id: TestSuiteId): Promise<TestSuite> {
    const suite = this.suites.get(id);
    return suite ? Promise.resolve(suite) : Promise.reject(new Error(`no test suite ${id}`));
  }

  listTestPlan(iterationId: IterationId): Promise<ReadonlyMap<TestCaseId, TestPlanItemId>> {
    const plan = new Map<TestCaseId, TestPlanItemId>();
    for (const [itemId, item] of this.testPlan) {
      if (item.iterationId === iterationId) plan.set(item.testCaseId, itemId);
    }
    return Promise.resolve(plan);
  }

  /** Like Squash TM, overlapping adds to the test plan fail (unique list-order constraint). */
  async addToTestPlan(iterationId: IterationId, testCaseId: TestCaseId): Promise<TestPlanItemId> {
    this.planAddsInFlight++;
    await new Promise(resolve => setImmediate(resolve));
    this.planAddsInFlight--;
    if (this.planAddsInFlight > 0) throw new Error('duplicate key value violates "uc_item_test_plan_list_order"');
    const id = this.sequence++ as TestPlanItemId;
    this.testPlan.set(id, { iterationId, testCaseId });
    return id;
  }

  recordExecution(itemId: TestPlanItemId, executionResult: TestExecutionResult): Promise<ExecutionId> {
    const id = this.sequence++ as ExecutionId;
    this.executions.push({ id, itemId, outcome: executionResult.outcome });
    return Promise.resolve(id);
  }
}

/**
 * A Squash library tree in memory. Like an HTTP response, a listing reflects
 * the tree when it was requested, so callers racing on the same path really
 * can both miss a folder and create it twice.
 */
export class InMemoryFolderTree implements FolderTree {
  readonly folders = new Map<FolderId, { parentId: FolderId | undefined; name: string }>();
  createCalls = 0;
  private sequence = 1000;

  async children(folderId: FolderId | undefined): Promise<readonly LibraryNode[]> {
    const snapshot = [...this.folders]
      .filter(([, folder]) => folder.parentId === folderId)
      .map(([id, { name }]) => ({ kind: 'folder' as const, id, name }));
    await new Promise(resolve => setImmediate(resolve));
    return snapshot;
  }

  createFolder(parentId: FolderId | undefined, name: string): Promise<FolderId> {
    this.createCalls++;
    const id = this.sequence++ as FolderId;
    this.folders.set(id, { parentId, name });
    return Promise.resolve(id);
  }

  /** The folder path of `id`, for assertions: `Acceptance/Gyms`; `''` is the root. */
  pathOf(id: FolderId | undefined): string {
    const folder = id === undefined ? undefined : this.folders.get(id);
    if (!folder) return '';
    return folder.parentId === undefined ? folder.name : `${this.pathOf(folder.parentId)}/${folder.name}`;
  }
}

export function stateNamed(name: string, overrides: Partial<TestCaseState> = {}): TestCaseState {
  return {
    name,
    description: '',
    weight: 'LOW',
    status: 'WORK_IN_PROGRESS',
    nature: 'NAT_UNDEFINED',
    type: 'TYP_UNDEFINED',
    automatedTestTechnology: null,
    automatedTestReference: null,
    reference: '',
    format: 'gherkin',
    script: null,
    ...overrides,
  };
}
