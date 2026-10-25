import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import type { FullConfig, Suite, TestCase } from '@playwright/test/reporter';
import type { TestSelector } from '../application/test-selector';
import { PlaywrightTestParser } from '../infrastructure/playwright-test-parser';
import { SquashSelectReporter } from '../reporters/select.reporter';
import { definition, RecordingLogger } from './fakes';

const SPEC = 'features/gyms/gyms.ui.acceptance.spec.ts';

function listed(name: string, line: number, annotations: TestCase['annotations'] = []): TestCase {
  return {
    tags: ['@acceptance'],
    annotations,
    titlePath: () => ['', 'chromium-desktop', SPEC, 'Gyms UI acceptance', name],
    location: { file: SPEC, line, column: 1 },
  } as unknown as TestCase;
}

function suiteOf(tests: readonly TestCase[]): Suite {
  return { allTests: () => [...tests] } as unknown as Suite;
}

function reporterFor(outputPath: string, onSelect: () => void, tests: readonly TestCase[]) {
  const logger = new RecordingLogger();
  let selections = 0;
  const selector = {
    select: () => {
      selections += 1;
      onSelect();
      return Promise.resolve({ definitions: [definition('search')], label: 'folder "Acceptance/Gyms"' });
    },
  } as unknown as TestSelector;
  const reporter = new SquashSelectReporter({
    selector,
    selection: { folder: 'Acceptance/Gyms' },
    parser: new PlaywrightTestParser('@acceptance'),
    logger,
    outputPath,
  });
  reporter.onBegin({} as FullConfig, suiteOf(tests));
  return { reporter, logger, selections: () => selections };
}

test.describe('SquashSelectReporter', { tag: ['@unit'] }, () => {
  test('fails when two tests share an identity and writes no test list', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'squash-select-'));
    const outputPath = join(directory, 'list.txt');
    const firstLine = 10;
    const secondLine = 30;
    const { reporter, logger, selections } = reporterFor(outputPath, () => undefined, [
      listed('search', firstLine),
      listed('search', secondLine),
    ]);

    try {
      await expect(reporter.onEnd()).resolves.toEqual({ status: 'failed' });
      expect(selections()).toBe(0);
      expect(() => readFileSync(outputPath, 'utf8')).toThrow();
      const logged = logger.lines.join('\n');
      expect(logged).toContain('Not selecting a test Squash cannot identify');
      expect(logged).toContain(`${SPEC}:${firstLine}`);
      expect(logged).toContain(`${SPEC}:${secondLine}`);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  test('fails when an annotation is invalid and writes no test list', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'squash-select-'));
    const outputPath = join(directory, 'list.txt');
    const line = 6;
    const { reporter, logger, selections } = reporterFor(outputPath, () => undefined, [
      listed('search', line, [{ type: 'squash:weigth', description: 'high' }]),
    ]);

    try {
      await expect(reporter.onEnd()).resolves.toEqual({ status: 'failed' });
      expect(selections()).toBe(0);
      expect(logger.lines.join('\n')).toContain("unknown annotation 'squash:weigth'");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  test('writes the test list when every in-scope test can be identified', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'squash-select-'));
    const outputPath = join(directory, 'list.txt');
    const line = 6;
    const { reporter, selections } = reporterFor(outputPath, () => undefined, [listed('search', line)]);

    try {
      await expect(reporter.onEnd()).resolves.toBeUndefined();
      expect(selections()).toBe(1);
      expect(readFileSync(outputPath, 'utf8')).toContain(
        'features/gyms/gyms.ui.acceptance.spec.ts › Gyms UI acceptance › search',
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
