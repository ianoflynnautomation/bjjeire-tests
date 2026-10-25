import { expect, test } from '@playwright/test';
import type { FullConfig, Suite, TestCase } from '@playwright/test/reporter';
import type { SquashStrategy } from '../application/contracts';
import type { TestCaseDefinition } from '../domain/test-case';
import { PlaywrightTestParser } from '../infrastructure/playwright-test-parser';
import { SquashSyncReporter, formatPinSuggestions } from '../reporters/sync.reporter';
import { RecordingLogger } from './fakes';

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

const GYM_SPEC = 'features/gyms/gyms.ui.acceptance.spec.ts';

function listed(name: string, line: number): TestCase {
  return {
    tags: ['@acceptance'],
    annotations: [],
    titlePath: () => ['', 'chromium-desktop', GYM_SPEC, 'Gyms UI acceptance', name],
    location: { file: GYM_SPEC, line, column: 1 },
  } as unknown as TestCase;
}

test.describe('SquashSyncReporter', { tag: ['@unit'] }, () => {
  test('fails the sync and leaves out tests that share an identity', async () => {
    const received: TestCaseDefinition[][] = [];
    const strategy: SquashStrategy = {
      name: 'fake',
      syncTestCases: definitions => {
        received.push([...definitions]);
        return Promise.resolve({
          created: 0,
          updated: 0,
          unchanged: 0,
          failed: 0,
          ids: new Map(),
          pinSuggestions: [],
        });
      },
      publishResults: () => Promise.reject(new Error('not used')),
    };
    const logger = new RecordingLogger();
    const reporter = new SquashSyncReporter({
      strategy,
      parser: new PlaywrightTestParser('@acceptance'),
      logger,
      failOnError: false,
    });
    const firstLine = 10;
    const secondLine = 30;
    const otherLine = 12;

    reporter.onBegin(
      {} as FullConfig,
      {
        allTests: () => [listed('search', firstLine), listed('search', secondLine), listed('other', otherLine)],
      } as unknown as Suite,
    );
    await expect(reporter.onEnd()).resolves.toEqual({ status: 'failed' });

    expect(received[0]?.map(definition => definition.name)).toEqual(['Gyms UI acceptance › other']);
    const logged = logger.lines.join('\n');
    expect(logged).toContain('Not syncing a test Squash cannot identify');
    expect(logged).toContain(`${GYM_SPEC}:${firstLine}`);
    expect(logged).toContain(`${GYM_SPEC}:${secondLine}`);
  });
});
