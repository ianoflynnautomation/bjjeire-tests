import type { TestCaseDefinition } from '../domain/test-case';
import type { ExecutionRepository, Logger, SquashTestCase, TestCaseRepository, TestSelection } from './contracts';
import { duplicateReferenceMessage, groupCasesByKey } from './automated-reference';

export type Selected = Readonly<{
  definitions: readonly TestCaseDefinition[];
  label: string;
}>;

/**
 * Matches tests to cases by pin, then by automated reference. The folder is
 * where Squash has the case now, so a move in the UI counts.
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
    this.assertUniqueReferences(cases);
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

  /** Last-write-wins would hide one of the cases, so the selection stops instead. */
  private assertUniqueReferences(cases: readonly SquashTestCase[]): void {
    const duplicates = [...groupCasesByKey(cases).values()].filter(group => group.length > 1);
    if (duplicates.length === 0) return;
    const listed = duplicates.map(group => duplicateReferenceMessage(group)).join('; ');
    throw new Error(`Not selecting a test Squash cannot identify: ${listed}`);
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
