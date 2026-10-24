import type { SquashTestCase } from './ports';

export function groupCasesByKey(cases: readonly SquashTestCase[]): Map<string, SquashTestCase[]> {
  const byKey = new Map<string, SquashTestCase[]>();
  for (const testCase of cases) {
    if (testCase.key === undefined) continue;
    const group = byKey.get(testCase.key) ?? [];
    group.push(testCase);
    byKey.set(testCase.key, group);
  }
  return byKey;
}

/** Names every case id, so a duplicate reference is never resolved by keeping one of them. */
export function duplicateReferenceMessage(cases: readonly SquashTestCase[]): string {
  const listed = [...cases]
    .sort((left, right) => left.id - right.id)
    .map(testCase => `${testCase.id} "${testCase.state.name}"`)
    .join(' and ');
  return `Squash holds more than one test case for automated reference "${cases[0]?.key ?? ''}": ${listed}`;
}
