import assert from 'node:assert/strict';

export function expectObjectSubset<TActual extends object>(
  actual: TActual,
  expected: Partial<TActual>,
  label: string,
): void {
  for (const fieldName of Object.keys(expected) as (keyof TActual)[]) {
    assert.deepStrictEqual(
      actual[fieldName],
      expected[fieldName],
      `Expected ${label} field "${String(fieldName)}" to match`,
    );
  }
}
