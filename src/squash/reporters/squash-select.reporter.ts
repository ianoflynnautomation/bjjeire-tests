import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { FullConfig, FullResult, Reporter, Suite } from '@playwright/test/reporter';
import type { TestCaseDefinition } from '../domain/test-case';
import { createSelectReporterDependencies, type SelectReporterDependencies } from '../composition';

/**
 * Selection phase of `npm run squash:run` (or `npm run squash:select` in CI).
 * Rides on `playwright test --list`: Playwright discovers the tests, Squash
 * says which of them are in the configured folder or test suite, and the
 * result is written as a Playwright `--test-list` file for the run to use.
 *
 * With no selection configured it writes nothing, so the run is unfiltered. A
 * selection matching no test fails, rather than silently running everything.
 */
export class SquashSelectReporter implements Reporter {
  private definitions: readonly TestCaseDefinition[] = [];

  constructor(private readonly deps: SelectReporterDependencies | undefined) {}

  onBegin(_config: FullConfig, suite: Suite): void {
    if (!this.deps) return;
    const { definitions, problems } = this.deps.parser.definitionsOf(suite);
    for (const problem of problems)
      this.deps.logger.error('Skipping a test with an invalid Squash annotation', problem);
    this.definitions = definitions;
  }

  async onEnd(): Promise<{ status?: FullResult['status'] } | undefined> {
    if (!this.deps) return undefined;
    const { selector, selection, logger, outputPath } = this.deps;
    try {
      const selected = await selector.select(this.definitions, selection);
      if (selected.definitions.length === 0) {
        logger.error(`No Playwright test matches ${selected.label}; refusing to run an unfiltered suite instead.`);
        return { status: 'failed' };
      }
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, testListOf(selected.definitions, selected.label));
      logger.info(`Wrote ${selected.definitions.length} tests to ${outputPath}.`);
      return undefined;
    } catch (error) {
      logger.error('Selecting tests from Squash TM failed', error);
      return { status: 'failed' };
    }
  }

  printsToStdio(): boolean {
    return true;
  }
}

/** Playwright's `--test-list` format: `file › describe › title`, `#` comments allowed. */
export function testListOf(definitions: readonly TestCaseDefinition[], label: string): string {
  const lines = definitions.map(({ file, titles }) => [file, ...titles].join(' › '));
  return [`# Selected from Squash TM ${label}`, ...lines, ''].join('\n');
}

/** Entry point Playwright instantiates. */
export default class SquashSelectReporterEntry extends SquashSelectReporter {
  constructor() {
    super(createSelectReporterDependencies());
  }
}
