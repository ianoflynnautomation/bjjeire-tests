import { expect, test } from '@playwright/test';
import { ResultAggregator } from '../application/result-aggregator';
import { ResultPublisher } from '../application/result-publisher';
import { DryRunStrategy, RemoteStrategy } from '../application/strategies';
import { TestCaseSynchronizer } from '../application/test-case-synchronizer';
import { TestOutcome } from '../domain/execution-result';
import { ExecutionContextResolver } from '../application/execution-context-resolver';
import { FolderPathResolver } from '../application/folder-path-resolver';
import type { CampaignId, ExecutionTargetSpec, Logger } from '../application/ports';
import type { FolderPlacement } from '../domain/folder-placement';
import { definition, InMemoryFolderTree, InMemorySquash, projectRun, RecordingLogger, result, RUN } from './fakes';

const CAMPAIGN_NUMBER = 7;
const CAMPAIGN_ID = CAMPAIGN_NUMBER as CampaignId;
const NO_PLACEMENT: FolderPlacement = { defaultFolder: undefined, rules: [] };

function synchronizerFor(
  squash: InMemorySquash,
  logger: Logger,
  placement = NO_PLACEMENT,
  tree = new InMemoryFolderTree(),
): TestCaseSynchronizer {
  return new TestCaseSynchronizer(squash, new FolderPathResolver(tree), placement, logger);
}

function publisherFor(squash: InMemorySquash, logger: Logger, target: ExecutionTargetSpec): ResultPublisher {
  const context = new ExecutionContextResolver(squash, new FolderPathResolver(new InMemoryFolderTree()), logger);
  return new ResultPublisher(squash, context, target, logger);
}
const FLAKY_ATTEMPTS = 2;
const MISSING_TEST_CASE = 999;

test.describe('ResultAggregator', { tag: ['@unit'] }, () => {
  test('keeps the last attempt per project and the worst outcome across projects', () => {
    const aggregator = new ResultAggregator();
    const search = definition('search finds a gym');

    aggregator.record(search, projectRun('chromium-desktop', TestOutcome.Failed));
    aggregator.record(search, projectRun('chromium-desktop', TestOutcome.Passed, { attempts: FLAKY_ATTEMPTS }));
    aggregator.record(search, projectRun('webkit-desktop', TestOutcome.Failed));

    const [aggregated] = aggregator.results();
    expect(aggregated?.outcome).toBe(TestOutcome.Failed);
    expect(aggregated?.runs.map(run => [run.project, run.outcome])).toEqual([
      ['chromium-desktop', TestOutcome.Passed],
      ['webkit-desktop', TestOutcome.Failed],
    ]);
  });

  test('treats a test that passed on retry as passed', () => {
    const aggregator = new ResultAggregator();
    const search = definition('search finds a gym');

    aggregator.record(search, projectRun('chromium-desktop', TestOutcome.Failed));
    aggregator.record(search, projectRun('chromium-desktop', TestOutcome.Passed, { attempts: FLAKY_ATTEMPTS }));

    expect(aggregator.results()[0]?.outcome).toBe(TestOutcome.Passed);
  });
});

test.describe('TestCaseSynchronizer', { tag: ['@unit'] }, () => {
  test('creates missing cases, keeps existing ones and suggests a pin tag for each unpinned test', async () => {
    const repository = new InMemorySquash();
    const kept = definition('kept', { line: 7 });
    const added = definition('added', { line: 3 });
    const keptId = repository.seedTestCase(kept.key, kept.name);
    repository.relabel(keptId, 'PLAYWRIGHT-004');

    const summary = await synchronizerFor(repository, new RecordingLogger()).sync([kept, added]);

    expect(summary).toMatchObject({ created: 1, updated: 0, unchanged: 1, failed: 0 });
    const addedId = summary.ids.get(added.key);
    expect(repository.testCases.get(addedId ?? keptId)?.state.reference).toBe('PLAYWRIGHT-005');
    expect(summary.ids.get(kept.key)).toBe(keptId);
    expect(summary.pinSuggestions.map(({ tag, line }) => [tag, line])).toEqual([
      [`@Squash_${addedId}`, added.line],
      [`@Squash_${keptId}`, kept.line],
    ]);
  });

  test('follows a @Squash_<id> pin to a hand-written case, renames it and suggests nothing', async () => {
    const repository = new InMemorySquash();
    const manualId = repository.seedTestCase(undefined, 'Login rejects a missing token');
    const pinned = definition('renamed in Playwright', { pinnedId: manualId, key: `Squash_${manualId}` });

    const summary = await synchronizerFor(repository, new RecordingLogger()).sync([pinned]);

    expect(summary).toMatchObject({ created: 0, updated: 1, failed: 0, pinSuggestions: [] });
    expect(summary.ids.get(pinned.key)).toBe(manualId);
    expect(repository.testCases.get(manualId)?.state.name).toBe('renamed in Playwright');
  });

  test('never creates a case for a pin that matches nothing, and reports where the tag is', async () => {
    const repository = new InMemorySquash();
    const logger = new RecordingLogger();
    const dangling = definition('dangling', { pinnedId: MISSING_TEST_CASE, key: `Squash_${MISSING_TEST_CASE}` });

    const summary = await synchronizerFor(repository, logger).sync([dangling]);

    expect(summary).toMatchObject({ created: 0, failed: 1 });
    expect(repository.testCases.size).toBe(0);
    expect(logger.lines).toContain(
      `error Could not sync "dangling" (${dangling.file}:${dangling.line}): ` +
        `@Squash_${MISSING_TEST_CASE} does not match a test case in this Squash project`,
    );
  });

  test('logs and counts a case Squash rejects, and still syncs the others', async () => {
    const repository = new InMemorySquash();
    const logger = new RecordingLogger();
    const rejected = definition('rejected');
    repository.failCreateFor.add(rejected.key);

    const summary = await synchronizerFor(repository, logger).sync([rejected, definition('accepted')]);

    expect(summary).toMatchObject({ created: 1, failed: 1 });
    expect(logger.lines).toContain(
      `error Could not sync "rejected" (${rejected.file}:${rejected.line}): Squash said no`,
    );
  });
});

test.describe('RemoteStrategy', { tag: ['@unit'] }, () => {
  test('creates one iteration per run in the campaign and records an execution per test case', async () => {
    const repository = new InMemorySquash();
    const logger = new RecordingLogger();
    const strategy = new RemoteStrategy(
      synchronizerFor(repository, logger),
      publisherFor(repository, logger, { kind: 'campaign', campaign: { id: CAMPAIGN_ID }, iteration: undefined }),
    );
    const results = [result(definition('passes')), result(definition('fails'), TestOutcome.Failed)];

    const summary = await strategy.publishResults(results, RUN);

    expect(summary).toMatchObject({ recorded: 2, failed: 0 });
    expect([...repository.iterations.values()]).toEqual([{ campaignId: CAMPAIGN_ID, name: RUN.name }]);
    expect(repository.executions.map(execution => execution.outcome).sort()).toEqual([
      TestOutcome.Failed,
      TestOutcome.Passed,
    ]);
  });

  test('reuses an existing test plan item in a fixed iteration', async () => {
    const repository = new InMemorySquash();
    const logger = new RecordingLogger();
    const iterationId = repository.seedIteration(CAMPAIGN_ID);
    const planned = definition('already planned');
    const itemId = await repository.addToTestPlan(iterationId, repository.seedTestCase(planned.key, planned.name));
    const strategy = new RemoteStrategy(
      synchronizerFor(repository, logger),
      publisherFor(repository, logger, { kind: 'iteration', iterationId }),
    );

    await strategy.publishResults([result(planned)], RUN);

    expect(repository.testPlan.size).toBe(1);
    expect(repository.executions).toEqual([expect.objectContaining({ itemId })]);
  });
});

test.describe('DryRunStrategy', { tag: ['@unit'] }, () => {
  test('summarises what it would publish without touching Squash', async () => {
    const logger = new RecordingLogger();

    const summary = await new DryRunStrategy(logger).publishResults(
      [result(definition('a')), result(definition('b'), TestOutcome.Failed)],
      RUN,
    );

    expect(summary).toEqual({ iterationId: undefined, recorded: 0, failed: 0 });
    expect(logger.lines).toContain(
      `info [dry-run] Would publish 2 results as "${RUN.name}": 1 passed, 1 failed, 0 interrupted, 0 skipped.`,
    );
  });
});
