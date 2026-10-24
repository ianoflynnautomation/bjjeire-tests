import { expect, test } from '@playwright/test';
import { FolderPathResolver } from '../application/folder-path-resolver';
import { TestCaseSynchronizer } from '../application/test-case-synchronizer';
import type { FolderPlacement } from '../domain/folder-placement';
import { labelPrefix, needsLabel, OWNERSHIP_MARKER, ReferenceLabeller } from '../domain/reference-label';
import { definition, InMemoryFolderTree, InMemorySquash, RecordingLogger } from './fakes';

const PLACEMENT: FolderPlacement = {
  defaultFolder: 'Playwright',
  rules: [
    { path: 'features/competitions/', folder: 'Playwright/Features/Competitions' },
    { path: 'features/events/', folder: 'Playwright/Features/Events' },
  ],
};

test.describe('Reference labels', { tag: ['@unit'] }, () => {
  test('take their prefix from the feature folder', () => {
    expect(
      ['Playwright/Features/Competitions', 'Playwright/API', 'Playwright/Mobile Nav', undefined].map(labelPrefix),
    ).toEqual(['COMPETITIONS', 'API', 'MOBILE-NAV', 'PLAYWRIGHT']);
  });

  test('continue after the highest existing number per prefix, three digits wide', () => {
    const labeller = new ReferenceLabeller(['EVENTS-009', 'EVENTS-002', 'GYMS-001', 'REQ-7a', '']);

    expect([labeller.next('EVENTS'), labeller.next('EVENTS'), labeller.next('STORES')]).toEqual([
      'EVENTS-010',
      'EVENTS-011',
      'STORES-001',
    ]);
  });

  test('replace only an empty reference or a legacy PW- hash, never one a person chose', () => {
    expect(['', 'PW-0e3e88214e0a', 'EVENTS-001', 'REQ-12', 'PW-release'].map(needsLabel)).toEqual([
      true,
      true,
      false,
      false,
      false,
    ]);
  });
});

test.describe('TestCaseSynchronizer labelling', { tag: ['@unit'] }, () => {
  test('labels new cases by feature in spec order, and migrates legacy PW- cases it owns', async () => {
    const squash = new InMemorySquash();
    const file = (feature: string): string => `features/${feature}/${feature}.ui.acceptance.spec.ts`;
    const events2 = definition('second', { file: file('events'), line: 20 });
    const events1 = definition('first', { file: file('events'), line: 10 });
    const competition = definition('legacy', { file: file('competitions'), line: 5 });
    const legacyId = squash.seedTestCase(competition.key, competition.name);
    squash.relabel(legacyId, 'PW-0e3e88214e0a', `${OWNERSHIP_MARKER}<p>Spec: …</p>`);
    const manualId = squash.seedTestCase(undefined, 'Hand-written');
    squash.relabel(manualId, 'PW-0e3e88214e0b', '<p>Written by a tester.</p>');
    const pinnedManual = definition('pinned', {
      file: file('events'),
      line: 30,
      pinnedId: manualId,
      key: `@Squash_${manualId}`,
    });

    const synchronizer = new TestCaseSynchronizer(
      squash,
      new FolderPathResolver(new InMemoryFolderTree()),
      PLACEMENT,
      new RecordingLogger(),
    );
    const summary = await synchronizer.sync([events2, competition, events1, pinnedManual]);

    const referenceOf = (key: string): string | undefined =>
      squash.testCases.get(summary.ids.get(key) ?? legacyId)?.state.reference;
    expect([events1.key, events2.key, competition.key].map(referenceOf)).toEqual([
      'EVENTS-001',
      'EVENTS-002',
      'COMPETITIONS-001',
    ]);
    expect(squash.testCases.get(manualId)?.state.reference).toBe('PW-0e3e88214e0b');
  });
});
