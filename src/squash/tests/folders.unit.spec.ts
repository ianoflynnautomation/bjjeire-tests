import { expect, test } from '@playwright/test';
import { FolderPathResolver } from '../application/folder-path-resolver';
import { TestCaseSynchronizer } from '../application/test-case-synchronizer';
import { folderFor, type FolderPlacement } from '../domain/folder-placement';
import { OWNERSHIP_MARKER } from '../domain/reference-label';
import { definition, InMemoryFolderTree, InMemorySquash, RecordingLogger } from './fakes';

/** Playwright, Features, Gyms and Stores. */
const FOLDERS_ON_BOTH_PATHS = 4;

const PLACEMENT: FolderPlacement = {
  defaultFolder: 'Playwright',
  rules: [
    { path: 'features/gyms/', tag: '@api', folder: 'Playwright/API/Gyms' },
    { path: 'features/gyms/', folder: 'Playwright/Features/Gyms' },
    { tag: '@a11y', folder: 'Playwright/Accessibility' },
  ],
};

test.describe('folderFor', { tag: ['@unit'] }, () => {
  test('uses the first rule whose path prefix and tag both match, else the default folder', () => {
    const gymsUi = definition('ui', { file: 'features/gyms/gyms.ui.acceptance.spec.ts' });
    const gymsApi = definition('api', { file: 'features/gyms/gyms.api.acceptance.spec.ts', tags: ['@api'] });
    const a11y = definition('a11y', { file: 'accessibility/routes.a11y.acceptance.spec.ts', tags: ['@a11y'] });
    const layout = definition('layout', { file: 'layout/header.ui.acceptance.spec.ts' });

    expect([gymsUi, gymsApi, a11y, layout].map(test => folderFor(test, PLACEMENT))).toEqual([
      'Playwright/Features/Gyms',
      'Playwright/API/Gyms',
      'Playwright/Accessibility',
      'Playwright',
    ]);
    expect(folderFor(layout, { defaultFolder: undefined, rules: [] })).toBeUndefined();
  });
});

test.describe('FolderPathResolver', { tag: ['@unit'] }, () => {
  test('creates each missing folder once, even when many callers race for the same path', async () => {
    const tree = new InMemoryFolderTree();
    const resolver = new FolderPathResolver(tree);

    const ids = await Promise.all([
      resolver.ensure('Playwright/Features/Gyms'),
      resolver.ensure('Playwright/Features/Gyms'),
      resolver.ensure('Playwright/Features/Stores'),
    ]);

    expect(tree.createCalls).toBe(FOLDERS_ON_BOTH_PATHS);
    expect(ids[0]).toBe(ids[1]);
    expect(ids.map(id => (id === undefined ? '' : tree.pathOf(id)))).toEqual([
      'Playwright/Features/Gyms',
      'Playwright/Features/Gyms',
      'Playwright/Features/Stores',
    ]);
  });

  test('reuses folders that already exist and treats no path as the library root', async () => {
    const tree = new InMemoryFolderTree();
    const existing = await tree.createFolder(undefined, 'Playwright');
    const resolver = new FolderPathResolver(tree);

    await expect(resolver.ensure('Playwright')).resolves.toBe(existing);
    await expect(resolver.ensure(undefined)).resolves.toBeUndefined();
    expect(tree.createCalls).toBe(1);
  });
});

test.describe('TestCaseSynchronizer placement', { tag: ['@unit'] }, () => {
  test('creates new cases in their rule folder and warns about synced cases outside theirs', async () => {
    const squash = new InMemorySquash();
    const tree = new InMemoryFolderTree();
    const logger = new RecordingLogger();
    const moved = definition('moved by hand', { file: 'features/gyms/gyms.ui.acceptance.spec.ts' });
    squash.seedTestCase(moved.key, moved.name, 'Somewhere/Else');
    const added = definition('added', { file: 'features/gyms/gyms.ui.acceptance.spec.ts' });

    await new TestCaseSynchronizer(squash, new FolderPathResolver(tree), PLACEMENT, logger).sync([moved, added]);

    const [[, folderId] = []] = [...squash.createdIn];
    expect(squash.createdIn.size).toBe(1);
    expect(tree.pathOf(folderId)).toBe('Playwright/Features/Gyms');
    expect(logger.lines).toContain(
      'warn 1 synced test cases are not in the folder their rule gives them. ' +
        'Squash cannot move test cases over its API: move them in the Squash UI (debug log lists them).',
    );
  });

  test('warns that synced Classic cases cannot become Gherkin, naming the folders to prune', async () => {
    const squash = new InMemorySquash();
    const logger = new RecordingLogger();
    const synced = definition('synced before Gherkin', { file: 'features/gyms/gyms.ui.acceptance.spec.ts' });
    const owned = { format: 'classic', description: OWNERSHIP_MARKER } as const;
    squash.seedTestCase(synced.key, synced.name, 'Playwright/Features/Gyms', owned);
    // A hand-written Classic case a test is pinned to is fine: manual cases stay Classic.
    const manualId = squash.seedTestCase(undefined, 'manual', 'QA', {
      format: 'classic',
      description: '<p>By QA.</p>',
    });
    const manual = definition('manual', { pinnedId: manualId });

    await new TestCaseSynchronizer(squash, new FolderPathResolver(new InMemoryFolderTree()), PLACEMENT, logger).sync([
      synced,
      manual,
    ]);

    const warnings = logger.lines.filter(line => line.includes('not Gherkin'));
    expect(warnings).toEqual([
      "warn 1 synced test cases are not Gherkin, and Squash cannot change a case's format. " +
        'To recreate them as Gherkin (their execution history goes with them): ' +
        'npm run squash:prune -- --folder "Playwright/Features/Gyms". ' +
        'Re-run that command with --yes, then sync again.',
    ]);
  });
});
