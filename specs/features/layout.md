# Acceptance spec: App shell and layout

**App spec**: `bjjeire-java/specs/system-architecture.md` (SPA shell, routing, feature flags)
**Slice**: `tests/layout/` · `src/ui/pages/sections/` · `src/ui/fixtures/base.ts`
**Agent seed**: `tests/agents/seed.spec.ts` (project `agent-seed`: signed in, flags pinned on, shell mounted)
**Seeded**: none (the shell needs no data; list pages wait for their route anchor)
**Status**: living · **Reconciled with tests**: 2026-11-10

Cross-cutting behaviour of the shell every feature shares: header and footer navigation,
the mobile menu, routing defaults, document titles, themes, page structure and reflow,
and what a disabled feature does to the shell. These specs import `@ui/fixtures`, never a
feature's fixtures. There are no AC-IDs for the shell in the app repo; `Covers` is `none`
throughout and the risk is named instead.

## Scenarios (must match test titles)

### UI

1. visitor should open <path> by selecting "<name>" in the header · none (one test per header link)
2. visitor should open <path> by selecting "<name>" in the footer · none (one test per footer quick link)
3. visitor should see every section link after opening the mobile menu · none
4. visitor should open <path> and close the menu by selecting "<name>" in the mobile menu · none (one test per header link)
5. visitor should be redirected to the default page from an unknown URL · none
6. visitor should see the default page when opening the root URL · none
7. <Route> page should have a document title and description · none (one test per route)
8. visitor should see the tab title change when moving to another page · none
9. visitor should see the site in dark mode by default · none
10. visitor should keep competition mode after reloading the page · none
11. visitor should keep light mode after reloading the page · none
12. visitor should return to dark mode after cycling through every theme · none
13. <Route> page should have one main heading · none (one test per route)
14. visitor should not need to scroll <Route> sideways on the narrowest phone · none (one test per route, 320px)
15. visitor should not need to scroll sideways at common screen widths · none
16. visitor should land on an enabled feature when opening the disabled stores page · none (flag fail-closed)
17. visitor should not be offered stores in the header when the feature is disabled · none
18. header logo link should keep its accessible structure (`@smoke`) · none (aria baseline)
19. footer quick links should keep their accessible structure (`@smoke`) · none (aria baseline)
20. footer copyright should keep its accessible structure · none (aria baseline)

Files: 1 `header.ui`, 2 `footer.ui`, 3–4 `mobile-nav.ui`, 5–6 `routing.ui`, 7–8 `seo.ui`,
9–12 `theme.ui`, 13–15 `page-structure.ui`, 16–17 `feature-flags.ui` (file-scoped
`featureFlagOverrides` with `Stores: false`), 18 `header.snapshot`, 19–20 `footer.snapshot`,
all `*.acceptance.spec.ts` under `tests/layout/`.

## Constraints

- Navigate with `gotoAppShell`; the shell is mounted before any route anchor exists.
- Header link names and paths come from `src/ui/pages/sections/header.constants.ts`
  (the footer reuses them), so a renamed section changes one table and every
  data-driven title with it. The route tables for titles, headings and the a11y sweep
  are local to their spec files; keep them in step with the header links.
- Feature flags are pinned on by the auto fixture. Only 16–17 vary them, at file scope.
- Reflow is asserted with `expectNoSidewaysScroll`; a long seeded name that breaks a card
  is a feature finding (see `specs/exploration/2026-10-31-stores-review.md` F2, F3).
- Aria snapshots are platform-independent; screenshots, where added, are per platform.

## Planned

Scenarios 1–20 predate the Planned convention. New scenarios get a block here first.

## Rejected

- `visitor should see the About page when opening it` here · Why not: owned by
  `specs/features/about.md`; the shell spec does not list feature pages.
