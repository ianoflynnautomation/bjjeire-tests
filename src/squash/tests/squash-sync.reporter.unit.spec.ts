import { expect, test } from '@playwright/test';
import { formatPinSuggestions } from '../reporters/squash-sync.reporter';

const A11Y_SPEC = 'accessibility/routes.a11y.acceptance.spec.ts';
const LOOP_LINE = 33;
const SINGLE_LINE = 9;

test.describe('formatPinSuggestions', { tag: ['@unit'] }, () => {
  test('gives one tag per test, and groups tests a loop declares on one line', () => {
    const lines = formatPinSuggestions([
      { file: 'api/authorization.api.acceptance.spec.ts', line: SINGLE_LINE, name: 'auth', tag: '@Squash_214' },
      { file: A11Y_SPEC, line: LOOP_LINE, name: 'About page should…', tag: '@Squash_219' },
      { file: A11Y_SPEC, line: LOOP_LINE, name: 'Gyms page should…', tag: '@Squash_220' },
    ]);

    expect(lines).toEqual([
      '  @Squash_214     api/authorization.api.acceptance.spec.ts:9',
      `  ${A11Y_SPEC}:${LOOP_LINE} declares 2 tests in a loop; put each id in the loop data and tag from it:`,
      '    @Squash_219     About page should…',
      '    @Squash_220     Gyms page should…',
    ]);
  });
});
