import { expect, test } from '@playwright/test';
import { folderPathOf } from '../domain/case-path.mts';
import { OWNERSHIP_MARKER } from '../domain/ownership-marker.mts';
import { pruneCaseOf, readListedCases } from '../domain/prune-cases.mts';

test.describe('prune cases', { tag: ['@unit'] }, () => {
  test('reads every page, unescapes a slash inside a folder, and refuses a page with no totalPages', async () => {
    const pages = [
      {
        _embedded: {
          'test-cases': [
            {
              id: 1,
              path: '/PW Probe/Acceptance/WCAG 2.1 A\\/AA/name',
              description: `${OWNERSHIP_MARKER}<p>Spec: …</p>`,
            },
          ],
        },
        page: { totalPages: 2 },
      },
      {
        _embedded: {
          'test-cases': [{ id: 2, path: '/PW Probe/Acceptance/WCAG 2.1 A\\/AA/manual', description: '<p>By QA.</p>' }],
        },
        page: { totalPages: 2 },
      },
    ];

    const cases = await readListedCases(page => Promise.resolve(pages[page]), 'test-cases');

    expect(cases).toEqual([
      { id: 1, folder: 'Acceptance/WCAG 2.1 A/AA', name: 'name', owned: true },
      { id: 2, folder: 'Acceptance/WCAG 2.1 A/AA', name: 'manual', owned: false },
    ]);
    await expect(
      readListedCases(() => Promise.resolve({ _embedded: { 'test-cases': [{ id: 1 }] } }), 'test-cases'),
    ).rejects.toThrow(/totalPages/);
  });

  test('does not treat an empty description or the marker prefix alone as sync-owned', () => {
    expect(pruneCaseOf({ id: 1, path: '/Project/Folder/Name', description: '' }).owned).toBe(false);
    expect(
      pruneCaseOf({ id: 1, path: '/Project/Folder/Name', description: '<p>Managed by the Playwright sync.' }).owned,
    ).toBe(false);
    expect(folderPathOf('/Project/Name')).toBe('');
  });

  test('stops after the reported last page', async () => {
    let calls = 0;

    const cases = await readListedCases(() => {
      calls += 1;
      return Promise.resolve({ _embedded: { 'test-cases': [] }, page: { totalPages: 0 } });
    }, 'test-cases');

    expect(cases).toEqual([]);
    expect(calls).toBe(1);
  });
});
