import { expect, test } from '@playwright/test';
import { ResultAggregator } from '../application/result-aggregator';
import { ResultPublisher } from '../application/result-publisher';
import { DryRunStrategy } from '../application/dry-run-strategy';
import { RemoteStrategy } from '../application/remote-strategy';
import { TestCaseSynchronizer } from '../application/test-case-synchronizer';
import { TestOutcome } from '../domain/execution-result';
import { ExecutionContextResolver } from '../application/execution-context-resolver';
import { FolderPathResolver } from '../application/folder-path-resolver';
import type { CampaignId, ExecutionTargetSpec, Logger, TestCaseId } from '../application/contracts';
import { ExecutionRole } from '../domain/execution-role';
import type { FolderPlacement } from '../domain/folder-placement';
import { pinTag } from '../domain/test-case';
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

function publisherFor(
  squash: InMemorySquash,
  logger: Logger,
  target: ExecutionTargetSpec,
  release = false,
): ResultPublisher {
  const context = new ExecutionContextResolver(squash, new FolderPathResolver(new InMemoryFolderTree()), logger);
  return new ResultPublisher(squash, context, target, { logger, release });
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

  test('drops a result so a shared identity is not published', () => {
    const aggregator = new ResultAggregator();
    const search = definition('search finds a gym');

    aggregator.record(search, projectRun('chromium-desktop', TestOutcome.Passed));
    aggregator.drop(search.key);

    expect(aggregator.results()).toEqual([]);
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

  test('fails instead of syncing two tests that share an identity, and still syncs the others', async () => {
    const repository = new InMemorySquash();
    const logger = new RecordingLogger();
    const firstLine = 10;
    const secondLine = 30;
    const first = definition('search', { line: firstLine });
    const second = definition('search', { line: secondLine });

    const summary = await synchronizerFor(repository, logger).sync([first, second, definition('other')]);

    expect(summary).toMatchObject({ created: 1, failed: 1 });
    expect(repository.testCases.size).toBe(1);
    expect(logger.lines.join('\n')).toContain(`${first.file}:${firstLine}`);
    expect(logger.lines.join('\n')).toContain(`${second.file}:${secondLine}`);
    expect(logger.lines.join('\n')).toContain('Not syncing a test Squash cannot identify');
  });

  test('treats the same spec location reported twice as one test', async () => {
    const repository = new InMemorySquash();
    const line = 4;
    const listed = definition('search', { line });

    const summary = await synchronizerFor(repository, new RecordingLogger()).sync([
      listed,
      definition('search', { line, steps: ['Given a gym'] }),
    ]);

    expect(summary).toMatchObject({ created: 1, failed: 0 });
    expect(repository.testCases.size).toBe(1);
  });

  test('does not write a test whose automated reference is already on two Squash cases', async () => {
    const repository = new InMemorySquash();
    const logger = new RecordingLogger();
    const search = definition('search');
    const left = repository.seedTestCase(search.key, 'left');
    const right = repository.seedTestCase(search.key, 'right');

    const summary = await synchronizerFor(repository, logger).sync([search, definition('other')]);

    expect(summary).toMatchObject({ created: 1, failed: 1 });
    expect(repository.testCases.get(left)?.state.name).toBe('left');
    expect(repository.testCases.get(right)?.state.name).toBe('right');
    expect(logger.lines.join('\n')).toContain(`${left} "left"`);
    expect(logger.lines.join('\n')).toContain(`${right} "right"`);
  });

  test('fails when Squash already holds a duplicate reference that no test targets', async () => {
    const repository = new InMemorySquash();
    const logger = new RecordingLogger();
    const left = repository.seedTestCase('shared-ref', 'left');
    const right = repository.seedTestCase('shared-ref', 'right');

    const summary = await synchronizerFor(repository, logger).sync([definition('other')]);

    expect(summary).toMatchObject({ created: 1, failed: 1 });
    expect(logger.lines.join('\n')).toContain('Not syncing a test Squash cannot identify');
    expect(logger.lines.join('\n')).toContain(`${left} "left"`);
    expect(logger.lines.join('\n')).toContain(`${right} "right"`);
  });

  test('still updates a pinned case when another reference is duplicated, and fails the sync', async () => {
    const repository = new InMemorySquash();
    const manualId = repository.seedTestCase(undefined, 'manual');
    repository.seedTestCase('shared-ref', 'left');
    repository.seedTestCase('shared-ref', 'right');
    const pinned = definition('renamed', { pinnedId: manualId, key: pinTag(manualId) });

    const summary = await synchronizerFor(repository, new RecordingLogger()).sync([pinned]);

    expect(summary).toMatchObject({ updated: 1, failed: 1 });
    expect(repository.testCases.get(manualId)?.state.name).toBe('renamed');
  });
});

test.describe('RemoteStrategy', { tag: ['@unit'] }, () => {
  test('creates one iteration per run and the test case execution for each result', async () => {
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
    expect(repository.executions).toEqual([expect.objectContaining({ itemId, role: ExecutionRole.TestCase })]);
  });
});

test.describe('ResultPublisher executions', { tag: ['@unit'] }, () => {
  async function plannedItem(repository: InMemorySquash, name: string) {
    const iterationId = repository.seedIteration(CAMPAIGN_ID);
    const planned = definition(name);
    const testCaseId = repository.seedTestCase(planned.key, planned.name);
    const itemId = await repository.addToTestPlan(iterationId, testCaseId);
    return { iterationId, planned, testCaseId, itemId };
  }

  test('updates the test case execution on the next publish', async () => {
    const repository = new InMemorySquash();
    const { iterationId, planned, testCaseId, itemId } = await plannedItem(repository, 'already planned');
    const publisher = publisherFor(repository, new RecordingLogger(), { kind: 'iteration', iterationId });
    const ids = new Map([[planned.key, testCaseId]]);

    await publisher.publish([result(planned)], ids, RUN);
    await publisher.publish([result(planned, TestOutcome.Failed)], ids, RUN);

    expect(repository.executions).toEqual([
      expect.objectContaining({ itemId, outcome: TestOutcome.Failed, role: ExecutionRole.TestCase }),
    ]);
  });

  test('a release updates the test case execution and creates a release execution', async () => {
    const repository = new InMemorySquash();
    const { iterationId, planned, testCaseId, itemId } = await plannedItem(repository, 'release candidate');
    const ids = new Map<string, TestCaseId>([[planned.key, testCaseId]]);
    const ordinary = publisherFor(repository, new RecordingLogger(), { kind: 'iteration', iterationId });
    const release = publisherFor(repository, new RecordingLogger(), { kind: 'iteration', iterationId }, true);

    await ordinary.publish([result(planned)], ids, RUN);
    await release.publish([result(planned, TestOutcome.Failed)], ids, RUN);

    expect(repository.executions).toEqual([
      expect.objectContaining({ itemId, outcome: TestOutcome.Failed, role: ExecutionRole.TestCase }),
      expect.objectContaining({ itemId, outcome: TestOutcome.Failed, role: ExecutionRole.Release }),
    ]);
  });

  test('a release with no earlier execution creates the release execution', async () => {
    const repository = new InMemorySquash();
    const { iterationId, planned, testCaseId, itemId } = await plannedItem(repository, 'first release');
    const publisher = publisherFor(repository, new RecordingLogger(), { kind: 'iteration', iterationId }, true);

    await publisher.publish([result(planned)], new Map([[planned.key, testCaseId]]), RUN);

    expect(repository.executions).toEqual([
      expect.objectContaining({ itemId, role: ExecutionRole.Release, outcome: TestOutcome.Passed }),
    ]);
  });

  test('an ordinary publish after a release keeps the release execution and starts a test case execution', async () => {
    const repository = new InMemorySquash();
    const { iterationId, planned, testCaseId, itemId } = await plannedItem(repository, 'after release');
    const ids = new Map([[planned.key, testCaseId]]);
    await publisherFor(repository, new RecordingLogger(), { kind: 'iteration', iterationId }, true).publish(
      [result(planned)],
      ids,
      RUN,
    );

    await publisherFor(repository, new RecordingLogger(), { kind: 'iteration', iterationId }).publish(
      [result(planned, TestOutcome.Failed)],
      ids,
      RUN,
    );

    expect(repository.executions).toEqual([
      expect.objectContaining({ itemId, role: ExecutionRole.Release, outcome: TestOutcome.Passed }),
      expect.objectContaining({ itemId, role: ExecutionRole.TestCase, outcome: TestOutcome.Failed }),
    ]);
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

  test('says when a release execution would be created', async () => {
    const logger = new RecordingLogger();

    await new DryRunStrategy(logger, true).publishResults([result(definition('a'))], RUN);

    expect(logger.lines.join('\n')).toContain('A release execution is created for each result.');
  });
});
