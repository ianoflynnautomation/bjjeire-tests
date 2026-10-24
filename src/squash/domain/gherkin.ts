import { pinnedIdFrom, type TestCaseDefinition } from './test-case';

/**
 * Squash test case formats. Automated tests are synced as Gherkin; Classic and
 * Exploratory are for manual testing, and Keyword (BDD) builds steps from
 * Squash's action-word library. A case's format is fixed when Squash creates
 * it, so a case in another format is never converted.
 */
export const TestCaseFormat = {
  Classic: 'classic',
  Gherkin: 'gherkin',
  Keyword: 'keyword',
  Exploratory: 'exploratory',
} as const;

export type TestCaseFormat = (typeof TestCaseFormat)[keyof typeof TestCaseFormat];

const INDENT = '  ';
const STEP_INDENT = INDENT.repeat(2);
/** A `test.step` title that is a Gherkin step. */
const GHERKIN_STEP = /^(Given|When|Then|And|But) \S/;
const TITLE_SEPARATOR = ' › ';

/**
 * The Gherkin script of an automated test: the top `describe` is the Feature,
 * the rest of the title path is the Scenario, and the test's tags (less its
 * project-specific pin) tag the scenario.
 *
 *   # Automated by Playwright: features/gyms/gyms.ui.acceptance.spec.ts
 *   Feature: Gyms UI acceptance
 *
 *     @smoke @acceptance
 *     Scenario: visitor should see the gym list when opening Gyms
 *       Given …
 *
 * The steps are the test's Given/When/Then `test.step` titles (see
 * `TestCaseDefinition.steps`).
 */
export function gherkinScript(definition: TestCaseDefinition, steps: readonly string[]): string {
  const [feature, ...scenario] =
    definition.titles.length > 1 ? definition.titles : [definition.file, ...definition.titles];
  const tags = definition.tags.filter(tag => pinnedIdFrom([tag]) === undefined);
  return [
    `# Automated by Playwright: ${definition.file}`,
    `Feature: ${feature ?? definition.file}`,
    '',
    ...(tags.length > 0 ? [`${INDENT}${tags.join(' ')}`] : []),
    `${INDENT}Scenario: ${scenario.join(TITLE_SEPARATOR)}`,
    ...steps.map(step => `${STEP_INDENT}${step}`),
    '',
  ].join('\n');
}

export function isGherkinStep(title: string): boolean {
  return GHERKIN_STEP.test(title);
}

/** The steps a script already holds, so a run that cannot see steps keeps them. */
export function stepsOf(script: string | null): readonly string[] {
  return (script ?? '')
    .split('\n')
    .map(line => line.trim())
    .filter(isGherkinStep);
}
