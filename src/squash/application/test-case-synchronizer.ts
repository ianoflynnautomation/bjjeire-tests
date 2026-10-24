import { folderFor, type FolderPlacement } from '../domain/folder-placement';
import { TestCaseFormat } from '../domain/gherkin';
import { isSyncOwned, labelPrefix, needsLabel, ReferenceLabeller } from '../domain/reference-label';
import { pinTag, type TestCaseDefinition } from '../domain/test-case';
import { forEachConcurrent } from './concurrency';
import type { FolderPathResolver } from './folder-path-resolver';
import type { Logger, PinSuggestion, SquashTestCase, SyncSummary, TestCaseId, TestCaseRepository } from './ports';

const CONCURRENCY = 4;

type SyncAction = Readonly<{ kind: 'created' | 'updated' | 'unchanged'; id: TestCaseId }>;

/** What one definition needs, decided before any write. */
type SyncStep =
  | Readonly<{ kind: 'create'; definition: TestCaseDefinition; label: string }>
  | Readonly<{ kind: 'update'; definition: TestCaseDefinition; current: SquashTestCase; label: string | undefined }>
  | Readonly<{ kind: 'invalid'; definition: TestCaseDefinition; error: unknown }>;

/**
 * Makes Squash TM hold one test case per definition. A pinned test
 * (`@Squash_<id>`) maps to that test case; an unpinned one is matched by its
 * automated test reference, and created when missing, in the folder the
 * placement rules give it, with a readable reference such as `EVENTS-012`.
 * Existing cases are updated only where a managed field differs. Nothing is
 * ever deleted or moved, so execution history is never lost. One failing case
 * is logged and counted, and the rest still sync.
 */
export class TestCaseSynchronizer {
  constructor(
    private readonly repository: TestCaseRepository,
    private readonly folders: FolderPathResolver,
    private readonly placement: FolderPlacement,
    private readonly logger: Logger,
  ) {}

  async sync(definitions: readonly TestCaseDefinition[]): Promise<SyncSummary> {
    const steps = this.plan(definitions, await this.repository.listTestCases());
    const ids = new Map<string, TestCaseId>();
    const pinSuggestions: PinSuggestion[] = [];
    const counts = { created: 0, updated: 0, unchanged: 0, failed: 0 };
    const misplaced: string[] = [];
    const notGherkin: SquashTestCase[] = [];

    await forEachConcurrent(steps, CONCURRENCY, async step => {
      const { definition } = step;
      try {
        if (step.kind === 'invalid') throw step.error;
        const action = await this.apply(step);
        ids.set(definition.key, action.id);
        counts[action.kind] += 1;
        if (definition.pinnedId === undefined) pinSuggestions.push(suggestionFor(definition, action.id));
        if (step.kind === 'update' && isSyncOwned(step.current.state.description)) {
          if (step.current.state.format !== TestCaseFormat.Gherkin) notGherkin.push(step.current);
        }
        const wanted = folderFor(definition, this.placement);
        if (step.kind === 'update' && definition.pinnedId === undefined && wanted !== undefined) {
          const { current } = step;
          if (current.folderPath !== wanted) {
            misplaced.push(`${current.id} is in "${current.folderPath}", rules say "${wanted}": ${definition.name}`);
          }
        }
      } catch (error) {
        counts.failed += 1;
        this.logger.error(`Could not sync "${definition.name}" (${definition.file}:${definition.line})`, error);
      }
    });

    this.logger.info(
      `Test cases: ${counts.created} created, ${counts.updated} updated, ` +
        `${counts.unchanged} unchanged, ${counts.failed} failed.`,
    );
    this.reportMisplaced(misplaced);
    this.reportNotGherkin(notGherkin);
    return { ...counts, ids, pinSuggestions: sortByLocation(pinSuggestions) };
  }

  /**
   * Serial, in spec order: matches each definition to its case and hands out
   * labels before anything is written, so numbering is stable and no two cases
   * can be given the same label by concurrent writes.
   */
  private plan(definitions: readonly TestCaseDefinition[], existing: readonly SquashTestCase[]): SyncStep[] {
    const byId = new Map<number, SquashTestCase>(existing.map(testCase => [testCase.id, testCase]));
    const byKey = new Map(existing.flatMap(testCase => (testCase.key ? [[testCase.key, testCase] as const] : [])));
    const labeller = new ReferenceLabeller(existing.map(testCase => testCase.state.reference));
    const nextLabel = (definition: TestCaseDefinition, folderPath: string | undefined): string =>
      labeller.next(labelPrefix(folderFor(definition, this.placement) ?? folderPath));

    return [...definitions].sort(byLocation).map((definition): SyncStep => {
      const { pinnedId } = definition;
      if (pinnedId !== undefined && !byId.has(pinnedId)) {
        const error = new Error(`${pinTag(pinnedId)} does not match a test case in this Squash project`);
        return { kind: 'invalid', definition, error };
      }
      const current = pinnedId === undefined ? byKey.get(definition.key) : byId.get(pinnedId);
      if (!current) return { kind: 'create', definition, label: nextLabel(definition, undefined) };
      const { description, reference } = current.state;
      const relabel = isSyncOwned(description) && needsLabel(reference);
      return {
        kind: 'update',
        definition,
        current,
        label: relabel ? nextLabel(definition, current.folderPath) : undefined,
      };
    });
  }

  private async apply(step: Exclude<SyncStep, { kind: 'invalid' }>): Promise<SyncAction> {
    const { definition } = step;
    if (step.kind === 'create') {
      const folder = folderFor(definition, this.placement);
      const id = await this.repository.createTestCase(definition, await this.folders.ensure(folder), step.label);
      this.logger.debug(`Created ${step.label} (${id}) in "${folder ?? '/'}": ${definition.name}`);
      return { kind: 'created', id };
    }
    const { current, label } = step;
    const changed = await this.repository.updateTestCase(current, definition, label);
    if (changed) this.logger.debug(`Updated test case ${current.id} "${definition.name}"`);
    return { kind: changed ? 'updated' : 'unchanged', id: current.id };
  }

  /**
   * Cases the sync created before it created Gherkin. Squash fixes a case's
   * format at creation, so they can only be retired and recreated.
   */
  private reportNotGherkin(cases: readonly SquashTestCase[]): void {
    if (cases.length === 0) return;
    const folders = [...new Set(cases.map(testCase => testCase.folderPath || '/'))].sort();
    this.logger.warn(
      `${cases.length} synced test cases are not Gherkin, and Squash cannot change a case's format. ` +
        `To recreate them as Gherkin (their execution history goes with them): ` +
        `npm run squash:prune -- ${folders.map(folder => `--folder "${folder}"`).join(' ')} --yes, then sync again.`,
    );
    for (const testCase of cases) {
      this.logger.debug(`  ${testCase.state.format}: ${testCase.id} ${testCase.state.name}`);
    }
  }

  /** Squash's REST API cannot move a test case, so a rule change only places new cases. */
  private reportMisplaced(misplaced: readonly string[]): void {
    if (misplaced.length === 0) return;
    this.logger.warn(
      `${misplaced.length} synced test cases are not in the folder their rule gives them. ` +
        'Squash cannot move test cases over its API: move them in the Squash UI (debug log lists them).',
    );
    for (const entry of misplaced) this.logger.debug(`  misplaced: ${entry}`);
  }
}

function suggestionFor(definition: TestCaseDefinition, id: TestCaseId): PinSuggestion {
  return { file: definition.file, line: definition.line, name: definition.name, tag: pinTag(id) };
}

function byLocation(a: Readonly<{ file: string; line: number }>, b: Readonly<{ file: string; line: number }>): number {
  return a.file.localeCompare(b.file) || a.line - b.line;
}

function sortByLocation(suggestions: PinSuggestion[]): PinSuggestion[] {
  return suggestions.sort(byLocation);
}
