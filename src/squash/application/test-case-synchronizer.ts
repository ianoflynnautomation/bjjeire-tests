import { folderFor, type FolderPlacement } from '../domain/folder-placement';
import { TestCaseFormat } from '../domain/gherkin';
import { isSyncOwned, labelPrefix, needsLabel, ReferenceLabeller } from '../domain/reference-label';
import { duplicateIdentityMessage, groupDefinitions } from '../domain/test-identity';
import { pinTag, type TestCaseDefinition } from '../domain/test-case';
import { forEachConcurrent } from './concurrency';
import type { FolderPathResolver } from './folder-path-resolver';
import type { Logger, PinSuggestion, SquashTestCase, SyncSummary, TestCaseId, TestCaseRepository } from './ports';
import { duplicateReferenceMessage, groupCasesByKey } from './test-case-identity';

const CONCURRENCY = 4;

type SyncAction = Readonly<{ kind: 'created' | 'updated' | 'unchanged'; id: TestCaseId }>;

/** What one definition needs, decided before any write. */
type SyncStep =
  | Readonly<{ kind: 'create'; definition: TestCaseDefinition; label: string }>
  | Readonly<{ kind: 'update'; definition: TestCaseDefinition; current: SquashTestCase; label: string | undefined }>
  | Readonly<{ kind: 'invalid'; definition: TestCaseDefinition; error: unknown }>;

/** Never deletes or moves a case. A shared identity is not written: the sync fails instead of keeping one of them. */
export class TestCaseSynchronizer {
  constructor(
    private readonly repository: TestCaseRepository,
    private readonly folders: FolderPathResolver,
    private readonly placement: FolderPlacement,
    private readonly logger: Logger,
  ) {}

  async sync(definitions: readonly TestCaseDefinition[]): Promise<SyncSummary> {
    const grouped = groupDefinitions(definitions);
    const existing = await this.repository.listTestCases();
    const steps = this.plan(grouped.definitions, existing);
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

    counts.failed += this.reportCollisions(grouped.collisions);
    counts.failed += this.reportDuplicateReferences(existing, grouped.definitions);
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
    const byKey = groupCasesByKey(existing);
    const labeller = new ReferenceLabeller(existing.map(testCase => testCase.state.reference));
    return [...definitions].sort(byLocation).map(definition => this.stepFor(definition, byId, byKey, labeller));
  }

  private stepFor(
    definition: TestCaseDefinition,
    byId: ReadonlyMap<number, SquashTestCase>,
    byKey: ReadonlyMap<string, readonly SquashTestCase[]>,
    labeller: ReferenceLabeller,
  ): SyncStep {
    const { pinnedId } = definition;
    if (pinnedId !== undefined) {
      const current = byId.get(pinnedId);
      if (!current) {
        const error = new Error(`${pinTag(pinnedId)} does not match a test case in this Squash project`);
        return { kind: 'invalid', definition, error };
      }
      return this.updateOf(definition, current, labeller);
    }
    const matches = byKey.get(definition.key) ?? [];
    if (matches.length > 1)
      return { kind: 'invalid', definition, error: new Error(duplicateReferenceMessage(matches)) };
    const current = matches[0];
    if (!current) return { kind: 'create', definition, label: this.labelFor(definition, undefined, labeller) };
    return this.updateOf(definition, current, labeller);
  }

  private updateOf(definition: TestCaseDefinition, current: SquashTestCase, labeller: ReferenceLabeller): SyncStep {
    const { description, reference } = current.state;
    const relabel = isSyncOwned(description) && needsLabel(reference);
    return {
      kind: 'update',
      definition,
      current,
      label: relabel ? this.labelFor(definition, current.folderPath, labeller) : undefined,
    };
  }

  private labelFor(
    definition: TestCaseDefinition,
    folderPath: string | undefined,
    labeller: ReferenceLabeller,
  ): string {
    return labeller.next(labelPrefix(folderFor(definition, this.placement) ?? folderPath));
  }

  /** Test-side collisions were removed before planning, so each group fails the sync once. */
  private reportCollisions(collisions: readonly (readonly TestCaseDefinition[])[]): number {
    for (const collision of collisions) {
      this.logger.error('Not syncing a test Squash cannot identify', new Error(duplicateIdentityMessage(collision)));
    }
    return collisions.length;
  }

  /**
   * A duplicate automated reference with no unpinned test aimed at it still
   * fails the sync. A pin may update its own id, but the duplicate stays a failure.
   */
  private reportDuplicateReferences(
    existing: readonly SquashTestCase[],
    definitions: readonly TestCaseDefinition[],
  ): number {
    const targeted = new Set(
      definitions.filter(definition => definition.pinnedId === undefined).map(definition => definition.key),
    );
    let failed = 0;
    for (const cases of groupCasesByKey(existing).values()) {
      if (cases.length < 2) continue;
      const key = cases[0]?.key;
      if (key !== undefined && targeted.has(key)) continue;
      failed += 1;
      this.logger.error('Not syncing a test Squash cannot identify', new Error(duplicateReferenceMessage(cases)));
    }
    return failed;
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
        `npm run squash:prune -- ${folders.map(folder => `--folder "${folder}"`).join(' ')}. ` +
        'Re-run that command with --yes, then sync again.',
    );
    for (const testCase of cases) {
      this.logger.debug(`  ${testCase.state.format}: ${testCase.id} ${testCase.state.name}`);
    }
  }

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
