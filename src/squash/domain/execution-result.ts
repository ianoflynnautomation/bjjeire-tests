import type { TestCaseDefinition } from './test-case';

export const TestOutcome = {
  Passed: 'passed',
  Failed: 'failed',
  Interrupted: 'interrupted',
  Skipped: 'skipped',
} as const;

export type TestOutcome = (typeof TestOutcome)[keyof typeof TestOutcome];

/** Least to most severe: one failing project fails the whole test case. */
const SEVERITY: readonly TestOutcome[] = [
  TestOutcome.Skipped,
  TestOutcome.Passed,
  TestOutcome.Interrupted,
  TestOutcome.Failed,
];

export function worstOutcome(outcomes: readonly TestOutcome[]): TestOutcome {
  return outcomes.reduce<TestOutcome>(
    (worst, outcome) => (SEVERITY.indexOf(outcome) > SEVERITY.indexOf(worst) ? outcome : worst),
    TestOutcome.Skipped,
  );
}

export type TestFailure = Readonly<{
  message: string;
  stack?: string;
}>;

export type ProjectRun = Readonly<{
  project: string;
  outcome: TestOutcome;
  durationMs: number;
  attempts: number;
  errors: readonly TestFailure[];
}>;

export type TestExecutionResult = Readonly<{
  testCase: TestCaseDefinition;
  outcome: TestOutcome;
  runs: readonly ProjectRun[];
}>;
