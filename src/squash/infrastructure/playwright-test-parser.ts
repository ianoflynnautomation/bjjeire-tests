import type { Suite, TestCase, TestResult } from '@playwright/test/reporter';
import { TestOutcome, type ProjectRun, type TestFailure } from '../domain/execution-result';
import {
  automationReference,
  pinnedIdFrom,
  pinTag,
  TestCaseStatus,
  testCaseName,
  Weight,
  type TestCaseDefinition,
  type TestCaseFields,
} from '../domain/test-case';
import { isGherkinStep } from '../domain/gherkin';
import { duplicateIdentityMessage, groupDefinitions } from '../domain/test-identity';

/** Values are case- and separator-insensitive. Nature and type accept a code with or without its `NAT_` / `TYP_` prefix. */
const FIELD_ANNOTATION_PREFIX = 'squash:';
const FIELD_NAMES = ['weight', 'status', 'nature', 'type'] as const satisfies readonly (keyof TestCaseFields)[];
type FieldName = (typeof FIELD_NAMES)[number];
const DEFAULT_PROJECT = 'default';
const UNKNOWN_ERROR = 'Unknown error';

type TestStatus = TestResult['status'];

export type TestIdentity = Readonly<{
  /** `TestCase.titlePath()`: ['', project, file, ...describe titles, test title]. */
  titlePath: readonly string[];
  annotations: readonly Readonly<{ type: string; description?: string }>[];
  line: number;
  tags: readonly string[];
}>;

export class PlaywrightTestParser {
  constructor(private readonly tag: string) {}

  inScope(tags: readonly string[]): boolean {
    return tags.includes(this.tag);
  }

  /** With a result, a passing run's Given/When/Then steps become the Gherkin steps. */
  toDefinition(test: TestCase, result?: TestResult): TestCaseDefinition {
    const definition = definitionOf({
      titlePath: test.titlePath(),
      annotations: test.annotations,
      line: test.location.line,
      tags: test.tags,
    });
    return result === undefined ? definition : { ...definition, steps: gherkinStepsOf(result) };
  }

  /** Two different tests that share an identity are reported and left out. */
  definitionsOf(suite: Suite): { definitions: TestCaseDefinition[]; problems: SquashAnnotationError[] } {
    const parsed: TestCaseDefinition[] = [];
    const problems = new Map<string, SquashAnnotationError>();
    for (const test of suite.allTests()) {
      if (!this.inScope(test.tags)) continue;
      try {
        parsed.push(this.toDefinition(test));
      } catch (error) {
        if (!(error instanceof SquashAnnotationError)) throw error;
        problems.set(error.message, error);
      }
    }
    const grouped = groupDefinitions(parsed);
    for (const collision of grouped.collisions) {
      const message = duplicateIdentityMessage(collision);
      problems.set(message, new SquashAnnotationError(message, ''));
    }
    const definitions = [...grouped.definitions].sort((x, y) => x.name.localeCompare(y.name));
    return { definitions, problems: [...problems.values()] };
  }

  toProjectRun(test: TestCase, result: TestResult): ProjectRun {
    return {
      project: nonEmpty(test.parent.project()?.name) ?? DEFAULT_PROJECT,
      outcome: outcomeOf(result.status, test.expectedStatus),
      durationMs: result.duration,
      attempts: result.retry + 1,
      errors: result.errors.map((error): TestFailure => ({
        message: error.message ?? error.value ?? UNKNOWN_ERROR,
        ...(error.stack ? { stack: error.stack } : {}),
      })),
    };
  }
}

/** A `@Squash_<id>` tag or `squash:*` annotation the sync cannot use. Names the spec location. */
export class SquashAnnotationError extends Error {
  /** An empty `problem` means `location` is already the whole message. */
  constructor(location: string, problem: string) {
    super(problem === '' ? location : `${location}: ${problem}`);
    this.name = 'SquashAnnotationError';
  }
}

/** @throws {SquashAnnotationError} for a malformed pin tag or `squash:*` annotation. */
export function definitionOf(test: TestIdentity): TestCaseDefinition {
  const [, , rawFile = '', ...titles] = test.titlePath;
  // Windows reports `\`; the key must be identical on every runner.
  const file = rawFile.replaceAll('\\', '/');
  const location = `${file}:${test.line}`;
  const pinnedId = annotated(location, () => pinnedIdFrom(test.tags));
  return {
    key: pinnedId === undefined ? automationReference(file, titles) : pinTag(pinnedId),
    automationReference: automationReference(file, titles),
    pinnedId,
    name: testCaseName(titles),
    file,
    titles,
    line: test.line,
    tags: test.tags,
    fields: annotated(location, () => fieldsOf(test.annotations)),
    steps: undefined,
  };
}

/**
 * The top-level Given/When/Then `test.step` titles of a passing run. A failed
 * or skipped run stops part-way, so it says nothing about the scenario's steps.
 */
export function gherkinStepsOf(result: Pick<TestResult, 'status' | 'steps'>): readonly string[] | undefined {
  if (result.status !== 'passed') return undefined;
  return result.steps
    .filter(step => step.category === 'test.step' && isGherkinStep(step.title))
    .map(step => step.title);
}

function fieldsOf(annotations: TestIdentity['annotations']): TestCaseFields {
  let fields: TestCaseFields = {};
  for (const { type, description } of annotations) {
    if (!type.startsWith(FIELD_ANNOTATION_PREFIX)) continue;
    const field = type.slice(FIELD_ANNOTATION_PREFIX.length);
    if (!isFieldName(field)) {
      const known = FIELD_NAMES.map(name => `${FIELD_ANNOTATION_PREFIX}${name}`).join(', ');
      throw new Error(`unknown annotation '${type}'; use ${known}`);
    }
    const value = nonEmpty(description?.trim());
    if (value === undefined) throw new Error(`annotation '${type}' needs a value in its description`);
    fields = { ...fields, ...parseField(field, value) };
  }
  return fields;
}

function parseField(field: FieldName, value: string): TestCaseFields {
  switch (field) {
    case 'weight':
      return { weight: oneOf(Weight, value) };
    case 'status':
      return { status: oneOf(TestCaseStatus, value) };
    case 'nature':
      return { nature: withPrefix('NAT_', value) };
    case 'type':
      return { type: withPrefix('TYP_', value) };
  }
}

function isFieldName(name: string): name is FieldName {
  return FIELD_NAMES.some(field => field === name);
}

/** `very high`, `Very-High` and `VERY_HIGH` all name the same value. */
function normalised(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

function oneOf<T extends string>(values: Readonly<Record<string, T>>, raw: string): T {
  const allowed = Object.values(values);
  const match = allowed.find(value => value === normalised(raw));
  if (match === undefined) throw new Error(`'${raw}' is not one of ${allowed.join(', ')}`);
  return match;
}

function withPrefix(prefix: string, raw: string): string {
  const value = normalised(raw);
  return value.startsWith(prefix) ? value : `${prefix}${value}`;
}

function annotated<T>(location: string, read: () => T): T {
  try {
    return read();
  } catch (error) {
    throw new SquashAnnotationError(location, error instanceof Error ? error.message : String(error));
  }
}

/** Expected outcomes pass, including a `test.fail()` test that failed as declared. */
export function outcomeOf(status: TestStatus, expectedStatus: TestStatus): TestOutcome {
  if (status === 'skipped') return TestOutcome.Skipped;
  if (status === 'interrupted') return TestOutcome.Interrupted;
  return status === expectedStatus ? TestOutcome.Passed : TestOutcome.Failed;
}

/** Playwright uses '' for "no name" (an unnamed project, a blank description), which `??` would keep. */
function nonEmpty(value: string | undefined): string | undefined {
  return value === '' ? undefined : value;
}
