import { createHash } from 'node:crypto';

const TITLE_SEPARATOR = ' › ';
const PIN_TAG_PREFIX = '@Squash_';
const PIN_TAG = /^@squash_(\d+)$/i;

/** Squash TM rejects test case names longer than this. */
const MAX_TEST_CASE_NAME_LENGTH = 255;
/** Squash TM rejects an automated test reference longer than this (measured on 8.1.1). */
const MAX_AUTOMATION_REFERENCE_LENGTH = 512;
const OVERFLOW_HASH_LENGTH = 12;

/** Squash "Weight" (wire name: importance). */
export const Weight = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
  VeryHigh: 'VERY_HIGH',
} as const;

export type Weight = (typeof Weight)[keyof typeof Weight];

export const TestCaseStatus = {
  WorkInProgress: 'WORK_IN_PROGRESS',
  UnderReview: 'UNDER_REVIEW',
  Approved: 'APPROVED',
  Obsolete: 'OBSOLETE',
  ToBeUpdated: 'TO_BE_UPDATED',
} as const;

export type TestCaseStatus = (typeof TestCaseStatus)[keyof typeof TestCaseStatus];

/**
 * Squash fields a test sets through `squash:*` annotations. A field left out
 * is owned by Squash: the sync never touches it, so edits made in the UI stay.
 * Nature and type are info-list codes (`NAT_…`, `TYP_…`) that each Squash
 * project can customise, so Squash validates them, not this code.
 */
export type TestCaseFields = Readonly<{
  weight?: Weight;
  status?: TestCaseStatus;
  nature?: string;
  type?: string;
}>;

/**
 * A Playwright test as Squash TM should know it. `key` identifies it within a
 * run. A pinned test (`@Squash_<id>` tag) maps straight to that Squash test
 * case; an unpinned one is matched through the case's automated test
 * reference, which is also its key.
 */
export type TestCaseDefinition = Readonly<{
  key: string;
  /** `spec#describe › title`: written to the case's "Automated test reference". */
  automationReference: string;
  pinnedId: number | undefined;
  name: string;
  /** Spec path relative to the Playwright test dir, `/`-separated. */
  file: string;
  /** Describe titles then the test title, untruncated: what `--test-list` matches on. */
  titles: readonly string[];
  line: number;
  tags: readonly string[];
  fields: TestCaseFields;
  /**
   * The Given/When/Then steps a passing run executed, for the Gherkin script.
   * `undefined` when unknown (`--list` cannot see steps): the script keeps the
   * steps Squash already holds.
   */
  steps: readonly string[] | undefined;
}>;

/**
 * `file#describe › title`. Renaming or moving the test changes it, so Squash
 * gets a new case unless the test is pinned. Past Squash's length limit the
 * end is replaced by a hash so two long references stay distinct.
 */
export function automationReference(file: string, titles: readonly string[]): string {
  const full = `${file}#${titles.join(TITLE_SEPARATOR)}`;
  if (full.length <= MAX_AUTOMATION_REFERENCE_LENGTH) return full;
  const digest = createHash('sha256').update(full).digest('hex').slice(0, OVERFLOW_HASH_LENGTH);
  return `${full.slice(0, MAX_AUTOMATION_REFERENCE_LENGTH - OVERFLOW_HASH_LENGTH - 1)}~${digest}`;
}

export function testCaseName(titles: readonly string[]): string {
  return titles.join(TITLE_SEPARATOR).slice(0, MAX_TEST_CASE_NAME_LENGTH);
}

export function pinTag(id: number): string {
  return `${PIN_TAG_PREFIX}${id}`;
}

export function pinnedIdFrom(tags: readonly string[]): number | undefined {
  const ids = [...new Set(tags.flatMap(tag => PIN_TAG.exec(tag)?.slice(1) ?? []))].map(Number);
  if (ids.length > 1)
    throw new Error(`a test can be pinned to one Squash test case, found ${ids.map(pinTag).join(', ')}`);
  return ids[0];
}
