import { worstOutcome, type ProjectRun, type TestExecutionResult } from '../domain/execution-result';
import type { TestCaseDefinition } from '../domain/test-case';

type Entry = {
  testCase: TestCaseDefinition;
  runs: Map<string, ProjectRun>;
};

/**
 * Folds every attempt Playwright reports into one result per test case.
 * Within a project the last attempt wins (a retry that passes makes the test
 * pass); across projects the worst outcome wins. Gherkin steps come from any
 * passing run.
 */
export class ResultAggregator {
  private readonly entries = new Map<string, Entry>();

  record(testCase: TestCaseDefinition, run: ProjectRun): void {
    const entry = this.entries.get(testCase.key) ?? { testCase, runs: new Map<string, ProjectRun>() };
    // A failed or skipped run knows no steps; keep the ones a passing run reported.
    entry.testCase = testCase.steps === undefined ? { ...testCase, steps: entry.testCase.steps } : testCase;
    entry.runs.set(run.project, run);
    this.entries.set(testCase.key, entry);
  }

  results(): TestExecutionResult[] {
    return [...this.entries.values()]
      .map(({ testCase, runs }) => {
        const projectRuns = [...runs.values()].sort((a, b) => a.project.localeCompare(b.project));
        return { testCase, outcome: worstOutcome(projectRuns.map(run => run.outcome)), runs: projectRuns };
      })
      .sort((a, b) => a.testCase.name.localeCompare(b.testCase.name));
  }
}
