import { expect, test } from '@playwright/test';
import { ExecutionContextResolver } from '../application/execution-context-resolver';
import { FolderPathResolver } from '../application/folder-path-resolver';
import type { CampaignId, IterationId } from '../application/ports';
import { TestSelector } from '../application/test-selector';
import { testListOf } from '../reporters/squash-select.reporter';
import { definition, InMemoryFolderTree, InMemorySquash, RecordingLogger, RUN } from './fakes';

const CAMPAIGN_NUMBER = 7;
const ITERATION_NUMBER = 41;

function resolverOver(squash: InMemorySquash, tree = new InMemoryFolderTree()): ExecutionContextResolver {
  return new ExecutionContextResolver(squash, new FolderPathResolver(tree), new RecordingLogger());
}

test.describe('ExecutionContextResolver', { tag: ['@unit'] }, () => {
  test('creates a missing campaign path and named iteration, then reuses both on the next run', async () => {
    const squash = new InMemorySquash();
    const tree = new InMemoryFolderTree();
    const spec = { kind: 'campaign', campaign: { path: 'Releases/2.4' }, iteration: 'Nightly #128' } as const;

    const first = await resolverOver(squash, tree).resolve(spec, RUN);
    const second = await resolverOver(squash, tree).resolve(spec, RUN);

    expect(second.iterationId).toBe(first.iterationId);
    expect([...squash.campaigns.values()].map(({ name }) => name)).toEqual(['2.4']);
    expect([...tree.folders.values()].map(({ name }) => name)).toEqual(['Releases']);
    expect(first.label).toBe('"Releases/2.4" › Nightly #128');
  });

  test('creates a new iteration per run when the campaign is given without an iteration name', async () => {
    const squash = new InMemorySquash();
    const campaignId = await squash.createCampaign(undefined, 'Regression');

    const context = await resolverOver(squash).resolve(
      { kind: 'campaign', campaign: { id: campaignId }, iteration: undefined },
      RUN,
    );

    expect(squash.iterations.get(context.iterationId)).toEqual({ campaignId, name: RUN.name });
  });

  test('uses an iteration id from the pipeline exactly as given, touching nothing else', async () => {
    const squash = new InMemorySquash();
    const iterationId = ITERATION_NUMBER as IterationId;

    await expect(resolverOver(squash).resolve({ kind: 'iteration', iterationId }, RUN)).resolves.toMatchObject({
      iterationId,
    });
    expect(squash.campaigns.size + squash.iterations.size).toBe(0);
  });

  test("publishes a test suite's run into the suite's own iteration", async () => {
    const squash = new InMemorySquash();
    const iterationId = squash.seedIteration(CAMPAIGN_NUMBER as CampaignId);
    const testSuiteId = squash.seedSuite(iterationId, []);

    await expect(resolverOver(squash).resolve({ kind: 'test-suite', testSuiteId }, RUN)).resolves.toMatchObject({
      iterationId,
      label: `test suite "Smoke" (${testSuiteId})`,
    });
  });

  test('resolves once per run, however many results ask', async () => {
    const squash = new InMemorySquash();
    const resolver = resolverOver(squash);
    const spec = { kind: 'campaign', campaign: { path: 'Nightly' }, iteration: undefined } as const;

    const [a, b] = await Promise.all([resolver.resolve(spec, RUN), resolver.resolve(spec, RUN)]);

    expect(a).toBe(b);
    expect(squash.iterations.size).toBe(1);
  });
});

test.describe('TestSelector', { tag: ['@unit'] }, () => {
  test('selects tests whose Squash cases sit in the folder or below, by derived key or by pin', async () => {
    const squash = new InMemorySquash();
    const logger = new RecordingLogger();
    const keyed = definition('keyed');
    const pinnedId = squash.seedTestCase(undefined, 'manual', 'Acceptance/Gyms/Search');
    const pinned = definition('pinned', { pinnedId, key: `@Squash_${pinnedId}` });
    const elsewhere = definition('elsewhere');
    squash.seedTestCase(keyed.key, keyed.name, 'Acceptance/Gyms');
    squash.seedTestCase(elsewhere.key, elsewhere.name, 'Acceptance/Gyms Archive');
    squash.seedTestCase(undefined, 'never automated', 'Acceptance/Gyms');

    const selected = await new TestSelector(squash, squash, logger).select([keyed, pinned, elsewhere], {
      folder: 'Acceptance/Gyms',
    });

    expect(selected.definitions.map(({ name }) => name)).toEqual(['keyed', 'pinned']);
    expect(logger.lines).toContain(
      'warn 1 test cases in folder "Acceptance/Gyms" have no Playwright test here and will not run.',
    );
  });

  test("selects a test suite's cases", async () => {
    const squash = new InMemorySquash();
    const inSuite = definition('in suite');
    const outside = definition('outside');
    const suiteCase = squash.seedTestCase(inSuite.key, inSuite.name);
    squash.seedTestCase(outside.key, outside.name);
    const testSuiteId = squash.seedSuite(squash.seedIteration(CAMPAIGN_NUMBER as CampaignId), [suiteCase]);

    const selected = await new TestSelector(squash, squash, new RecordingLogger()).select([inSuite, outside], {
      testSuiteId,
    });

    expect(selected.definitions).toEqual([inSuite]);
  });

  test('writes the selection in the format Playwright --test-list reads', () => {
    expect(testListOf([definition('search finds a gym')], 'folder "Acceptance/Gyms"')).toBe(
      '# Selected from Squash TM folder "Acceptance/Gyms"\n' +
        'features/gyms/gyms.ui.acceptance.spec.ts › Gyms UI acceptance › search finds a gym\n',
    );
  });
});
