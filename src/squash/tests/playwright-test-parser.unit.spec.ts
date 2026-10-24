import { expect, test } from '@playwright/test';
import { squash } from '../annotations';
import { TestOutcome } from '../domain/execution-result';
import {
  definitionOf,
  outcomeOf,
  PlaywrightTestParser,
  SquashAnnotationError,
  type TestIdentity,
} from '../infrastructure/playwright-test-parser';

const FILE = 'features/gyms/gyms.ui.acceptance.spec.ts';
const LINE = 12;
const PINNED_ID = 151;

function identity(overrides: Partial<TestIdentity> = {}): TestIdentity {
  return {
    titlePath: ['', 'chromium-desktop', FILE, 'Gyms UI acceptance', 'search finds a gym'],
    annotations: [],
    line: LINE,
    tags: ['@acceptance'],
    ...overrides,
  };
}

test.describe('definitionOf', { tag: ['@unit'] }, () => {
  test('derives the same key for a test in every project and on every OS', () => {
    const chromium = definitionOf(identity());
    const webkit = definitionOf(
      identity({ titlePath: ['', 'webkit-desktop', FILE, 'Gyms UI acceptance', 'search finds a gym'] }),
    );
    const windows = definitionOf(
      identity({
        titlePath: ['', 'chromium-desktop', FILE.replaceAll('/', '\\'), 'Gyms UI acceptance', 'search finds a gym'],
      }),
    );

    expect(chromium.key).toBe(`${FILE}#Gyms UI acceptance › search finds a gym`);
    expect(webkit.key).toBe(chromium.key);
    expect(windows).toEqual(chromium);
    expect(chromium).toMatchObject({ name: 'Gyms UI acceptance › search finds a gym', file: FILE, line: LINE });
  });

  test('derives a different key when the test is renamed', () => {
    const renamed = definitionOf(
      identity({ titlePath: ['', 'chromium-desktop', FILE, 'Gyms UI acceptance', 'renamed'] }),
    );

    expect(renamed.key).not.toBe(definitionOf(identity()).key);
  });

  test('reads the fields the squash() helper writes, mapping short names to info-list codes', () => {
    const annotations = squash({
      weight: 'very high',
      status: 'under review',
      nature: 'non functional',
      type: 'end to end',
    });

    expect(definitionOf(identity({ annotations })).fields).toEqual({
      weight: 'VERY_HIGH',
      status: 'UNDER_REVIEW',
      nature: 'NAT_NON_FUNCTIONAL_TESTING',
      type: 'TYP_END_TO_END_TESTING',
    });
    expect(squash({ nature: 'NAT_CONTRACT_TESTING' })).toEqual([
      { type: 'squash:nature', description: 'NAT_CONTRACT_TESTING' },
    ]);
  });

  test('pins a test to a Squash test case with @Squash_<id>, in any letter case', () => {
    const pinned = definitionOf(identity({ tags: ['@acceptance', '@squash_151'] }));

    expect(pinned).toMatchObject({ key: '@Squash_151', pinnedId: PINNED_ID });
  });

  test('rejects a test pinned to two different Squash test cases, naming the spec location', () => {
    expect(() => definitionOf(identity({ tags: ['@Squash_151', '@Squash_152'] }))).toThrow(
      new SquashAnnotationError(
        `${FILE}:${LINE}`,
        'a test can be pinned to one Squash test case, found @Squash_151, @Squash_152',
      ),
    );
  });

  test('reads squash:* annotations into Squash fields, forgiving case, spaces and prefixes', () => {
    const annotated = definitionOf(
      identity({
        annotations: [
          { type: 'squash:weight', description: 'very high' },
          { type: 'squash:status', description: 'Approved' },
          { type: 'squash:nature', description: 'security testing' },
          { type: 'squash:type', description: 'TYP_REGRESSION_TESTING' },
          { type: 'issue', description: 'not a squash annotation' },
        ],
      }),
    );

    expect(annotated.fields).toEqual({
      weight: 'VERY_HIGH',
      status: 'APPROVED',
      nature: 'NAT_SECURITY_TESTING',
      type: 'TYP_REGRESSION_TESTING',
    });
  });

  const invalidAnnotations = [
    { annotation: { type: 'squash:weigth', description: 'high' }, problem: "unknown annotation 'squash:weigth'" },
    { annotation: { type: 'squash:weight', description: 'huge' }, problem: "'huge' is not one of LOW, MEDIUM" },
    { annotation: { type: 'squash:status', description: ' ' }, problem: "annotation 'squash:status' needs a value" },
  ];

  for (const { annotation, problem } of invalidAnnotations) {
    test(`rejects ${annotation.type} "${annotation.description}" before anything reaches Squash`, () => {
      expect(() => definitionOf(identity({ annotations: [annotation] }))).toThrow(problem);
    });
  }
});

test.describe('PlaywrightTestParser scope', { tag: ['@unit'] }, () => {
  test('keeps tests carrying the configured tag and leaves setup steps out', () => {
    const parser = new PlaywrightTestParser('@acceptance');

    expect(parser.inScope(['@smoke', '@acceptance'])).toBe(true);
    expect(parser.inScope([])).toBe(false);
  });
});

test.describe('outcomeOf', { tag: ['@unit'] }, () => {
  const cases = [
    { status: 'passed', expected: 'passed', outcome: TestOutcome.Passed },
    { status: 'failed', expected: 'passed', outcome: TestOutcome.Failed },
    { status: 'timedOut', expected: 'passed', outcome: TestOutcome.Failed },
    { status: 'failed', expected: 'failed', outcome: TestOutcome.Passed },
    { status: 'passed', expected: 'failed', outcome: TestOutcome.Failed },
    { status: 'skipped', expected: 'skipped', outcome: TestOutcome.Skipped },
    { status: 'interrupted', expected: 'passed', outcome: TestOutcome.Interrupted },
  ] as const;

  for (const { status, expected, outcome } of cases) {
    test(`maps ${status} (expected ${expected}) to ${outcome}`, () => {
      expect(outcomeOf(status, expected)).toBe(outcome);
    });
  }
});
