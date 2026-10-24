import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { FullConfig, FullResult, Reporter, Suite } from '@playwright/test/reporter';
import type { TestCaseDefinition } from '../domain/test-case';
import { createSelectReporterDependencies, type SelectReporterDependencies } from '../composition';
import type { SquashAnnotationError } from '../infrastructure/playwright-test-parser';

/** With no selection configured, writes nothing. A selection that matches no test fails instead of running everything. */
export class SquashSelectReporter implements Reporter {
  private definitions: readonly TestCaseDefinition[] = [];
  private problems: readonly SquashAnnotationError[] = [];

  constructor(private readonly deps: SelectReporterDependencies | undefined) {}

  onBegin(_config: FullConfig, suite: Suite): void {
    if (!this.deps) return;
    ({ definitions: this.definitions, problems: this.problems } = this.deps.parser.definitionsOf(suite));
  }

  async onEnd(): Promise<{ status?: FullResult['status'] } | undefined> {
    if (!this.deps) return undefined;
    const { selector, selection, logger, outputPath } = this.deps;
    for (const problem of this.problems) logger.error('Not selecting a test Squash cannot identify', problem);
    if (this.problems.length > 0) return { status: 'failed' };
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
