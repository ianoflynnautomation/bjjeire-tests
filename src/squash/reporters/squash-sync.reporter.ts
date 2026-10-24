import type { FullConfig, FullResult, Reporter, Suite } from '@playwright/test/reporter';
import type { PinSuggestion } from '../application/ports';
import type { TestCaseDefinition } from '../domain/test-case';
import { createSyncReporterDependencies, type SyncReporterDependencies } from '../composition';
import type { SquashAnnotationError } from '../infrastructure/playwright-test-parser';

/** Runs on `playwright test --list`, so nothing is executed. An annotation problem or a shared identity fails the sync. */
export class SquashSyncReporter implements Reporter {
  private definitions: readonly TestCaseDefinition[] = [];
  private problems: readonly SquashAnnotationError[] = [];

  constructor(private readonly deps: SyncReporterDependencies) {}

  onBegin(_config: FullConfig, suite: Suite): void {
    ({ definitions: this.definitions, problems: this.problems } = this.deps.parser.definitionsOf(suite));
  }

  async onEnd(): Promise<{ status?: FullResult['status'] } | undefined> {
    const { strategy, logger } = this.deps;
    for (const problem of this.problems) logger.error('Not syncing a test Squash cannot identify', problem);
    try {
      logger.info(`Syncing ${this.definitions.length} test cases (${strategy.name}).`);
      const summary = await strategy.syncTestCases(this.definitions);
      this.suggestPins(summary.pinSuggestions);
      return summary.failed > 0 || this.problems.length > 0 ? { status: 'failed' } : undefined;
    } catch (error) {
      logger.error('Syncing test cases to Squash TM failed', error);
      return { status: 'failed' };
    }
  }

  printsToStdio(): boolean {
    return true;
  }

  private suggestPins(suggestions: readonly PinSuggestion[]): void {
    if (suggestions.length === 0) return;
    const { logger } = this.deps;
    logger.info(`${suggestions.length} tests are not pinned. Add the tag to keep their Squash history across renames:`);
    for (const line of formatPinSuggestions(suggestions)) logger.info(line);
  }
}

/** Fits `@Squash_` plus a 6-digit id, so the columns line up. */
const PIN_COLUMN_WIDTH = 15;

/**
 * One line per test, except where one source line declares several tests (a
 * `for` loop over data): a tag on that line cannot tell them apart, so those
 * are grouped and named, for the ids to go into the loop's data instead.
 */
export function formatPinSuggestions(suggestions: readonly PinSuggestion[]): string[] {
  const byLocation = new Map<string, PinSuggestion[]>();
  for (const suggestion of suggestions) {
    const location = `${suggestion.file}:${suggestion.line}`;
    byLocation.set(location, [...(byLocation.get(location) ?? []), suggestion]);
  }
  return [...byLocation].flatMap(([location, group]) => {
    const [only] = group;
    if (only && group.length === 1) return [`  ${only.tag.padEnd(PIN_COLUMN_WIDTH)} ${location}`];
    return [
      `  ${location} declares ${group.length} tests in a loop; put each id in the loop data and tag from it:`,
      ...group.map(({ tag, name }) => `    ${tag.padEnd(PIN_COLUMN_WIDTH)} ${name}`),
    ];
  });
}

/** Entry point Playwright instantiates. */
export default class SquashSyncReporterEntry extends SquashSyncReporter {
  constructor() {
    super(createSyncReporterDependencies());
  }
}
