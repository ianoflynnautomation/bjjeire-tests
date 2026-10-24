import type { ExecutionRole } from '../domain/execution-role';
import type { TestExecutionResult } from '../domain/execution-result';
import type { TestCaseFormat } from '../domain/gherkin';
import type { TestCaseDefinition, TestCaseStatus, Weight } from '../domain/test-case';

/**
 * Contracts the application layer depends on. Infrastructure implements them;
 * unit tests replace them with in-memory fakes.
 */

export type Logger = Readonly<{
  debug: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string, error?: unknown) => void;
}>;

/**
 * Squash TM ids are all plain numbers on the wire. Branding them makes the
 * compiler reject a swapped argument such as addToTestPlan(testCaseId, iterationId).
 * Ids are minted only where Squash returns them: the repository and the config.
 */
type SquashId<Name extends string> = number & { readonly __brand: Name };
export type TestCaseId = SquashId<'TestCaseId'>;
export type CampaignId = SquashId<'CampaignId'>;
export type IterationId = SquashId<'IterationId'>;
export type TestPlanItemId = SquashId<'TestPlanItemId'>;
export type ExecutionId = SquashId<'ExecutionId'>;

export type RunInfo = Readonly<{
  id: string;
  name: string;
  description: string;
}>;

export type TestCaseState = Readonly<{
  name: string;
  description: string;
  weight: Weight;
  status: TestCaseStatus;
  nature: string;
  type: string;
  automatedTestTechnology: string | null;
  automatedTestReference: string | null;
  /** The human-facing reference shown before the name in Squash: `COMPETITIONS-001`. */
  reference: string;
  /** Fixed when Squash creates the case; the sync creates Gherkin. */
  format: TestCaseFormat;
  /** The Gherkin script; `null` for a case in another format. */
  script: string | null;
}>;

export type SquashTestCase = Readonly<{
  id: TestCaseId;
  /** The automated test reference: the key of the test the case belongs to, if any. */
  key: string | undefined;
  /** Where the case sits in the test case library, `/`-separated; `''` is the project root. */
  folderPath: string;
  state: TestCaseState;
}>;

export type TestSuiteId = SquashId<'TestSuiteId'>;
export type FolderId = SquashId<'FolderId'>;

export type ExecutionTargetSpec =
  /** Publish into the suite's iteration; the suite also decides which tests run. */
  | Readonly<{ kind: 'test-suite'; testSuiteId: TestSuiteId }>
  /** Publish into exactly this iteration (a central pipeline passing its run id). */
  | Readonly<{ kind: 'iteration'; iterationId: IterationId }>
  /**
   * Find or create the campaign, then find or create the named iteration in it;
   * no name means a new iteration per run.
   */
  | Readonly<{ kind: 'campaign'; campaign: CampaignRef; iteration: string | undefined }>;

export type CampaignRef = Readonly<{ id: CampaignId }> | Readonly<{ path: string }>;

export type ExecutionContext = Readonly<{
  iterationId: IterationId;
  label: string;
}>;

export type TestSelection = Readonly<{ folder: string }> | Readonly<{ testSuiteId: TestSuiteId }>;

export type LibraryNode = Readonly<{ kind: 'folder' | 'leaf'; id: number; name: string }>;

/**
 * A Squash library as a tree of folders under the project. Squash keeps one
 * tree for test cases and one for campaigns; both are reached through this.
 */
export type FolderTree = Readonly<{
  /** Direct children of a folder; `undefined` is the library root. */
  children: (folderId: FolderId | undefined) => Promise<readonly LibraryNode[]>;
  createFolder: (parentId: FolderId | undefined, name: string) => Promise<FolderId>;
}>;

export type TestCaseRepository = Readonly<{
  /** Every test case in the project, including manual ones no test claims. */
  listTestCases: () => Promise<readonly SquashTestCase[]>;
  /** Squash's REST API cannot move a test case, so its folder is fixed here, at creation. */
  createTestCase: (
    definition: TestCaseDefinition,
    folderId: FolderId | undefined,
    label: string,
  ) => Promise<TestCaseId>;
  /**
   * PATCHes only the fields that differ from `current`, plus `label` as the reference when
   * given; resolves whether anything changed.
   */
  updateTestCase: (
    current: SquashTestCase,
    definition: TestCaseDefinition,
    label: string | undefined,
  ) => Promise<boolean>;
}>;

/** A Squash test suite: a QA-curated slice of one iteration's test plan. */
export type TestSuite = Readonly<{
  id: TestSuiteId;
  name: string;
  iterationId: IterationId;
  testCaseIds: readonly TestCaseId[];
}>;

/**
 * The newest execution of an item that carries the test case's result.
 * `current` is false when a release execution is newer: Squash shows that
 * newer execution, so patching this one leaves the shown status as the release.
 */
export type TestCaseExecution = Readonly<{ id: ExecutionId; current: boolean }>;

export type ExecutionRepository = Readonly<{
  /** The campaign called `name` directly in the folder (`undefined`: the library root). */
  findCampaign: (folderId: FolderId | undefined, name: string) => Promise<CampaignId | undefined>;
  createCampaign: (folderId: FolderId | undefined, name: string) => Promise<CampaignId>;
  listIterations: (campaignId: CampaignId) => Promise<readonly Readonly<{ id: IterationId; name: string }>[]>;
  createIteration: (campaignId: CampaignId, name: string, description: string) => Promise<IterationId>;
  getTestSuite: (id: TestSuiteId) => Promise<TestSuite>;
  /** The iteration's existing test plan, keyed by the test case each item plans. */
  listTestPlan: (iterationId: IterationId) => Promise<ReadonlyMap<TestCaseId, TestPlanItemId>>;
  addToTestPlan: (iterationId: IterationId, testCaseId: TestCaseId) => Promise<TestPlanItemId>;
  /** The newest execution that is not a release execution, when the item has one. */
  findTestCaseExecution: (itemId: TestPlanItemId) => Promise<TestCaseExecution | undefined>;
  updateExecution: (executionId: ExecutionId, result: TestExecutionResult, run: RunInfo) => Promise<void>;
  /**
   * Creates an execution of the item and sets its status and comment.
   * Squash creates the row as READY; a failed status update names that row.
   */
  recordExecution: (
    itemId: TestPlanItemId,
    result: TestExecutionResult,
    run: RunInfo,
    role: ExecutionRole,
  ) => Promise<ExecutionId>;
}>;

export type SyncSummary = Readonly<{
  created: number;
  updated: number;
  unchanged: number;
  failed: number;
  /** Key → Squash test case id, for every definition that synced. */
  ids: ReadonlyMap<string, TestCaseId>;
  /** Unpinned tests and the `@Squash_<id>` tag that would pin each one. */
  pinSuggestions: readonly PinSuggestion[];
}>;

export type PinSuggestion = Readonly<{ file: string; line: number; name: string; tag: string }>;

export type PublishSummary = Readonly<{
  iterationId: IterationId | undefined;
  recorded: number;
  failed: number;
}>;

export type SquashStrategy = Readonly<{
  name: string;
  syncTestCases: (definitions: readonly TestCaseDefinition[]) => Promise<SyncSummary>;
  publishResults: (results: readonly TestExecutionResult[], run: RunInfo) => Promise<PublishSummary>;
}>;
