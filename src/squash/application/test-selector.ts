import type { TestCaseDefinition } from '../domain/test-case';
import type { ExecutionRepository, Logger, SquashTestCase, TestCaseRepository, TestSelection } from './ports';

export type Selected = Readonly<{
  definitions: readonly TestCaseDefinition[];
  /** For logs: `folder "Acceptance/Gyms"`. */
  label: string;
}>;

/**
 * Picks the tests to run from where their Squash test cases live: a folder
 * (as Squash holds it now, so moves made in the UI count) or a test suite.
 * A test matches its case by its `@Squash_<id>` pin, or else by the case's
 * automated test reference. Cases in the selection that no test covers are
 * reported, since they will not run.
 */
export class TestSelector {
  constructor(
    private readonly testCases: TestCaseRepository,
    private readonly executions: ExecutionRepository,
    private readonly logger: Logger,
  ) {}

  async select(definitions: readonly TestCaseDefinition[], selection: TestSelection): Promise<Selected> {
    const all = await this.testCases.listTestCases();
    const { cases, label } = await this.casesIn(all, selection);
    const idByKey = new Map(
      cases.flatMap(testCase => (testCase.key === undefined ? [] : [[testCase.key, testCase.id]])),
    );
    const caseIdOf = (definition: TestCaseDefinition): number | undefined =>
      definition.pinnedId ?? idByKey.get(definition.key);
    const inSelection = new Set<number>(cases.map(testCase => testCase.id));
    const selected = definitions.filter(definition => {
      const caseId = caseIdOf(definition);
      return caseId !== undefined && inSelection.has(caseId);
    });

    const covered = new Set(selected.map(caseIdOf));
    const uncovered = cases.filter(testCase => !covered.has(testCase.id));
    if (uncovered.length > 0) {
      this.logger.warn(`${uncovered.length} test cases in ${label} have no Playwright test here and will not run.`);
      for (const testCase of uncovered) this.logger.debug(`  not automated: ${testCase.id} "${testCase.state.name}"`);
    }
    this.logger.info(`Selected ${selected.length} tests from ${label}.`);
    return { definitions: selected, label };
  }

  private async casesIn(
    all: readonly SquashTestCase[],
    selection: TestSelection,
  ): Promise<{ cases: readonly SquashTestCase[]; label: string }> {
    if ('folder' in selection) {
      const { folder } = selection;
      const cases = all.filter(({ folderPath }) => folderPath === folder || folderPath.startsWith(`${folder}/`));
      return { cases, label: `folder "${folder}"` };
    }
    const suite = await this.executions.getTestSuite(selection.testSuiteId);
    const inSuite = new Set<number>(suite.testCaseIds);
    return { cases: all.filter(({ id }) => inSuite.has(id)), label: `test suite "${suite.name}"` };
  }
}
