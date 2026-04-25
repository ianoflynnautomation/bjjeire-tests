# Snapshot testing

This repo uses two complementary snapshot kinds:

| Kind | Matcher | What it covers | When to add |
|---|---|---|---|
| **ARIA** | `expect(locator).toMatchAriaSnapshot()` | DOM role / accessible name / hierarchy | Structural regressions on stable regions (page header, list shell, empty state) |
| **Image** | `expect(target).toHaveScreenshot()` | Pixels: layout, spacing, colors | Brand-critical or visually-stable surfaces only |

If an assertion fits in one line of `expect(...)`, **don't snapshot it**. Snapshots earn their cost when they replace many fragile assertions on a stable region.

## File layout

Both kinds are co-located with their spec via `snapshotPathTemplate` / `pathTemplate` in [`src/shared/config/playwright.ts`](../src/shared/config/playwright.ts):

```
tests/features/<feature>/<feature>.snapshot.acceptance.spec.ts
tests/features/<feature>/__screenshots__/<feature>.snapshot.acceptance.spec.ts/*.png
tests/features/<feature>/__aria__/<feature>.snapshot.acceptance.spec.ts/*.aria.yml
```

Image PNGs and ARIA YAML files live next to the spec that owns them. Reviewing a PR diff for that feature shows the snapshot diff right alongside the spec change.

## Running

```sh
npm run test:snapshots          # run snapshot project; fails on diff
npm run snapshots:update        # regenerate snapshots locally
```

The `snapshots` project in [`src/shared/config/playwright.ts`](../src/shared/config/playwright.ts) runs **`chromium-desktop`** at **1440×900** only. We deliberately don't run image snapshots across firefox/webkit/wide — pixel-identical rendering is impossible across engines and the maintenance cost dwarfs the regression-detection value.

ARIA snapshots are also limited to the `snapshots` project. The DOM is identical across engines, so multi-engine ARIA snapshots add zero coverage.

## Writing a snapshot test

Use the screen-object methods, never `page.screenshot` / `expect(page).toHaveScreenshot` directly. The wrappers stabilize the page first (animations off, fonts ready, caret hidden) and pin the snapshot to a named region.

```ts
import { test } from '@ui/fixtures';

test.describe('Gyms snapshot acceptance', { tag: ['@gyms', '@snapshot', '@desktop'] }, () => {
  test('header image snapshot', { tag: '@snapshot' }, async ({ gymsScreen }) => {
    await gymsScreen.navigate();
    await gymsScreen.verifyIsLoaded();
    await gymsScreen.expectScreenshot('gyms-header.png', { region: 'header' });
  });

  test('empty-state ARIA', async ({ gymsScreen }) => {
    await gymsScreen.navigate();
    await gymsScreen.searchFor('zzz-no-match-xyz');
    await gymsScreen.expectNoResults();
    await gymsScreen.stabilize();
    await gymsScreen.expectAriaTree('emptyState', 'gyms-empty-state.aria.yml');
  });
});
```

## Reducing flakiness

The `expectScreenshot` and `expectAriaTree` helpers call [`stabilizeForSnapshot(page)`](../src/ui/support/ui/snapshot.ts) which:

- Emulates `prefers-reduced-motion: reduce`
- Injects CSS that zeros animations, transitions, and caret colour
- Awaits `document.fonts.ready`

For per-test volatile zones, mask them:

```ts
await gymsScreen.expectScreenshot('gyms-list.png', {
  region: 'list',
  mask: [page.getByTestId('relative-time')],
});
```

Global defaults applied via `expect.toHaveScreenshot` in the base config: `animations: 'disabled'`, `caret: 'hide'`, `scale: 'css'`, `maxDiffPixelRatio: 0.01`, `threshold: 0.2`.

## Update workflow

1. Make the UI change on a feature branch
2. Run `npm run snapshots:update`
3. Inspect each modified `*.png` / `*.aria.yml` and confirm the diff is intentional
4. Commit the snapshot updates **in the same PR** as the UI change
5. Reviewer eyeballs the snapshot diff in the GitHub file view (PNGs render inline)

CI never updates snapshots — `updateSnapshots: 'missing'` only creates files that don't yet exist. A diff against an existing snapshot fails the CI run and attaches the diff PNG to the report.

## Caps & maintenance

- **≤2 image snapshots per feature** (one per stable region — header, full page)
- **≤3 ARIA snapshots per feature** (one per logical section)
- Never one snapshot per row / per dataset entry — those will churn on real data changes
- Quarterly: prune any snapshot whose only failures in the last 90 days were flakes (no real diff captured in `playwright-report`)
- When a feature's data shape changes, regenerate ARIA snapshots first; image snapshots only if the visible layout actually moved

## When NOT to snapshot

- Anything driven by live API data (counts, lists, timestamps) — assert on shape via existing `expectCardData` / pagination contract
- Forms during interaction — caret, focus rings, autocomplete create infinite flake potential
- Modals over animated content
- Authenticated dashboards where every user sees different content

## Cleaning up old paths

The legacy paths `tests/snapshots/` and `tests/features/about/about.ui.acceptance.spec.ts-snapshot/` predate this conventions doc. Once the new snapshots are generated under `__screenshots__/` / `__aria__/`, delete the legacy folders.
