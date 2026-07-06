Use this slice as the starting point for every new feature (scaffold with `/add-feature`).

Layout:

- `tests/features/<feature>/*.spec.ts` for runnable specs only
- `src/ui/pages/<feature>/<feature>.page.ts` for page objects — pure functions taking
  `page: Page` first — plus `<feature>.constants.ts` for test IDs and copy
- `src/ui/fixtures/<feature>.fixture.ts` binds the page module via `bindPage`; register
  it in `src/ui/fixtures/index.ts` or specs cannot see it
- `src/api/features/<feature>/` holds `<feature>.api.ts` (typed client),
  `<feature>.types.ts` (DTOs mirroring the app repo), `<feature>.schemas.ts` (Zod wire
  schemas — also used by the mock drift guard), and `<feature>.builder.ts` (test data
  builders)
- `tests/testdata/seeded/<feature>.ts` for DTO-typed seeded fixtures and
  `SEEDED_*_PARTIAL_NAME` search terms (guarded by `partialNameOf`)
- `tests/testdata/mocks/*.json` for UI route interception only — bodies are validated
  against the feature's Zod page schema at mock time
- `tests/testdata/expected/*.json` for API expected responses only

For this template specifically:

- keep `_template.ui.acceptance.spec.ts` and `_template.api.acceptance.spec.ts` in `tests/features/_template`
- keep `_template.page.ts` in `src/ui/pages/_template`
- keep `_template.fixture.ts` in `src/ui/fixtures`
- keep `_template.builder.ts` in `src/api/features/_template`

Acceptance test naming:

- name suites `<Feature> <UI|API|snapshot> acceptance`
- name scenarios `Given <context>, when <action>, then <business outcome>`
- use domain vocabulary and user roles such as `visitor` or `client`
- describe observable outcomes, not selectors, helpers, DTO types, or status codes
- keep endpoint paths only when they distinguish otherwise similar API scenarios

Tags: every test carries `@acceptance`; add `@smoke` only to the critical happy path.
Suite-level tags on `describe`: feature tag, `@ui`/`@api`/`@snapshot`, and `@desktop`
or `@mobile`.
