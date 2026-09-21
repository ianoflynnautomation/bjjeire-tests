Use this slice as the starting point for every new feature (scaffold with `/add-feature`).
Add or update `specs/features/<feature>.md` in the same change — Playwright titles
must match the acceptance scenarios listed there.

Layout:

- `tests/features/<feature>/` for the specs and their `fixtures.ts`
- `src/ui/pages/<feature>/<feature>.page.ts` for the page object class — extend
  `ListPage` (see `gyms.page.ts`) when the feature is a card list — plus
  `<feature>.constants.ts` for test IDs and copy
- `tests/features/<feature>/fixtures.ts` extends the core test with this feature's
  page object and route mocks and exports its own `test` plus a named
  `<Feature>UiFixtures` type; the feature's specs import `./fixtures`. Nothing
  central needs editing
- `fixtures.ts` also exports `<feature>TestConfig`, and every one of the feature's
  UI specs calls `test.use(<feature>TestConfig)`. It starts empty. When the feature
  later needs an option for all of its specs (`viewport`, `colorScheme`,
  `featureFlagOverrides`, `timezoneId`, …) it goes in that one object and every
  spec picks it up — no spec file is edited. A single spec that needs something
  different still calls `test.use({ ... })` in its own file, which wins over the
  feature config
- `src/api/features/<feature>/` holds `<feature>.api.ts` (typed client),
  `<feature>.types.ts` (DTOs mirroring the app repo) and `<feature>.schemas.ts` (Zod
  wire schemas — also used by the mock drift guard). The app is read-only, so there
  are no entity builders: `tests/features/<feature>/seeded.ts` is the data.
- `tests/features/<feature>/seeded.ts` for DTO-typed seeded fixtures and
  `SEEDED_*_PARTIAL_NAME` search terms (guarded by `partialNameOf`)
- `tests/features/<feature>/*.json` for UI route interception only — bodies are validated
  against the feature's Zod page schema at mock time
- `tests/features/<feature>/*.json` also holds API expected responses

For this template specifically:

- keep `_template.ui.acceptance.spec.ts` and `_template.api.acceptance.spec.ts` in `tests/features/_template`
- keep `_template.page.ts` in `src/ui/pages/_template`
- keep `fixtures.ts` in `tests/features/_template`

Acceptance test naming:

- name suites `<Feature> <UI|API|snapshot> acceptance`
- name scenarios `Given <context>, when <action>, then <business outcome>`
- use domain vocabulary and user roles such as `visitor` or `client`
- describe observable outcomes, not selectors, helpers, DTO types, or status codes
- keep endpoint paths only when they distinguish otherwise similar API scenarios

Tags: every test carries `@acceptance`; add `@smoke` only to the critical happy path.
Suite-level tags on `describe`: feature tag, `@ui`/`@api`/`@snapshot`, and `@desktop`
or `@mobile`.
