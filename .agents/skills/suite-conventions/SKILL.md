---
name: suite-conventions
description: Detailed test conventions for this suite. Covers file naming and titles, the feature slice layout, the data policy (seeded data first, when to mock), assertions, navigation with gotoRoute, API spec shape, negative inputs, page objects, fixtures, pinned feature flags, the mutation fixture and snapshot baselines. Use when writing, healing or reviewing a spec, page object, fixture or mock. For environments, projects and CI use suite-environments.
---

# Suite conventions

These are the detailed rules behind the summary in `AGENTS.md`.

### File naming

- UI: `<feature>.ui.acceptance.spec.ts` · API: `<feature>.api.acceptance.spec.ts`
- Snapshots: `<feature>.snapshot.acceptance.spec.ts` · A11y: `<name>.a11y.acceptance.spec.ts`
- Titles: `<actor> should <outcome> [when <context>]` — the actor is `visitor` (UI) or
  `client` (API); snapshot and a11y tests name the component instead
  (`About page should match the approved image`). Domain vocabulary,
  observable outcomes, no selectors or DTO talk. Given/When/Then belong in
  top-level `test.step` titles (`Given …`, `When …`, `Then …`); a publishing
  Squash run copies them into the case's Gherkin script.

### Feature slice layout

```
tests/features/<feature>/                 # Specs, `fixtures.ts`, `mocks.ts`, `seeded.ts`,
                                          # and the feature's static JSON bodies
src/ui/pages/<feature>/                   # Page object class; list pages extend ListPage
src/api/features/<feature>/               # .service.ts + .types.ts + .schemas.ts
```

See `tests/features/_template/README.md`; scaffold with `/add-feature`.

### Data policy (in priority order)

1. **Real seeded data first.** Acceptance specs assert the seeded fixtures in
   `tests/features/<feature>/seeded.ts` against the real backend (the seeder lives in
   the app repo). Shared helpers — `seededCoordinates`, `partialNameOf` — stay in
   `tests/features/common/testdata/seeded/`.
2. **Environments hold full datasets** (e.g. 61 gyms locally), not just the acceptance
   fixtures — never assert a fixture card is on page 1 of an _unfiltered_ list. Narrow
   the view (search/filter) first, or prove state changes via search. Search is
   client-side on the loaded page: after `searchFor`, assert `expectResultCount(1)`
   (uniqueness), not merely that the card is still visible.
3. **`route.fulfill()` only for hard-to-seed cases**: empty states, error states,
   multi-page pagination, and snapshot determinism. Every mocked body is parsed against
   the feature's Zod page schema (`parseMockBody`) — drifted mocks fail loudly.
4. Partial search terms live next to their DTOs (`SEEDED_*_PARTIAL_NAME`, guarded by
   `partialNameOf`); never derive them with `name.slice(...)` in specs.

### Assertions

- Web-first assertions only (`expect(locator).toBeVisible()`); no `waitForTimeout()`
  (lint error), no polling loops.
- **Never open an app route with a bare `page.goto`** — use `gotoRoute` /
  `gotoAppShell` from `@ui/support`. `goto` resolves on a document lifecycle event,
  but the app renders nothing until the feature-flag fetch and the route's chunk settle
  (they load in parallel; the chunk wait is capped at 1 s, then the Suspense fallback
  shows). That gap is why the first test in a file used to flake on a cold environment. The helpers wait for a
  route anchor on a `TIMEOUTS.appBoot` budget; assertions after that keep the tight
  `TIMEOUTS.expect` default. Exception: snapshot specs (keep `load` so images are settled).
- API specs assert two things, both written in the test. The feature client
  (`getGyms`, `getBjjEvents`, `getStores`, `getCompetitions`) is called with the
  OpenAPI page schema and a typed query (`GetBjjEventsPaginationQuery` and the
  siblings). The client runs `expectSchema` and returns `PaginatedResponse<Dto>`,
  then the business assertions check the returned values. The page schema is the
  Zod schema generated from the published OpenAPI contract
  (`src/api/generated/zod.gen.ts`). The contract is the OCI artifact
  `ghcr.io/ianoflynnautomation/bjjeire-openapi-contract` (published by `bjjeire-java` CI
  on main). Run `npm run contract:pull [tag|sha]` to write it to
  `./contracts/openapi-v1.json` (gitignored), then `npm run gen:api-schemas`. The generator
  wipes `src/api/generated/`, so the DTO-typed adapters (`openApiPageSchema`,
  `openApiSchema`) live in `src/api/support/openapi-schemas.ts`.
  Schema compatibility stays with `oasdiff` in the app repo. These specs do not assert
  field types one by one.
- Specs make API calls explicitly; assertion helpers receive responses, never fetch.
- API specs take Playwright's built-in `request` fixture and pass it to the feature
  client. `baseURL` / TLS / static headers are declared in `src/api/config/playwright.ts`;
  the Entra bearer and per-test `traceparent` are layered by overriding the
  `extraHTTPHeaders` option in `src/api/fixtures/index.ts`. `get()` from
  `@api/support` performs the request and returns the JSON body. The feature client
  is what parses it. Specs asserting an error status call `request.get(...)` and pass
  the `APIResponse` to `expectProblem(response, status, ProblemType.X)`. That checks the
  status, the RFC 9457 problem schema (hand-written in `src/api/support/problem.ts`,
  because the published contract lists only 200s), and the problem `type`. It returns the body
  so the spec can assert validation `errors` (`field` + `errorCode`). Get-by-id clients
  (`getGymById`, `getBjjEventById`) take the item schema; ids go through `resourcePath`.
- Negative inputs are data-driven. Shared invalid sets (malformed integer, boolean, enum
  and ObjectId values, the paging bounds, and an unpublished id) live in
  `tests/features/common/testdata/invalid-values.ts`. A set used by only one field stays
  inline. Every API test is top-level Given/When/Then `test.step`s (its Squash Gherkin
  scenario): each call is a `When`/`And` step, the assertions a `Then` step.
  The `api-testing` skill has the full workflow.
- **Calling the API unauthenticated** — `requestAuth` is an option on
  `@api/fixtures`: a file declares `test.use({ requestAuth: 'none' })` to withhold
  the Entra bearer (Cloudflare Access headers still apply — they clear the edge,
  not the API's authorization). Only `tests/api/authorization.api.acceptance.spec.ts`
  does this, and it gates itself with `test.skip(!env.apiAuth.required, ...)` because
  local and docker targets do not enforce auth. Conditional skips are the supported
  way to gate on environment; unconditional `test.skip` stays a lint error.
- Axe gotcha: disabled elements are exempt from color-contrast — a11y scans must wait
  for list content (filters enable after data loads) before analyzing.

### Page objects + fixtures

- Page objects are classes taking `page` in the constructor and holding no other
  state. The four list pages extend `ListPage` in `src/ui/pages/common/list-page.ts`,
  which owns everything they share (navigation, search, result counts, empty and
  error states, card reads) — a feature class supplies only `readCardData` plus its
  own filters. Card-data readers, `common/card.page.ts`, `empty.page.ts`,
  `error.page.ts` and `pagination.page.ts` stay plain functions: they act on a
  locator or a page, not on a page object.
- **One test object per feature, no central registry.** `src/ui/fixtures/base.ts`
  holds only cross-cutting fixtures (feature-flag option, trace headers, header /
  footer / support-modal sections, failure mocks) and is re-exported as
  `@ui/fixtures`. Each feature owns `tests/features/<feature>/fixtures.ts`, which
  sits beside its specs, extends the core with that feature's page object and
  route mocks, and exports its own `test`. A feature spec imports `./fixtures`; a
  cross-cutting spec (layout, a11y, support) imports `@ui/fixtures`. Each feature
  names its fixture set (`GymsUiFixtures`, …) so helpers can take it as a
  parameter, and exports a `<feature>TestConfig` that every one of its UI specs
  passes to `test.use(...)` — empty by default, and the single place to put an
  option the whole feature needs. Specs import `expect` from that same module
  (`./fixtures`, `@ui/fixtures`, or `@api/fixtures`). The UI chain and the API
  chain stay separate, so an API spec never imports `@ui/fixtures` and never
  launches a browser. A layout spec that needs one feature page object extends
  `@ui/fixtures` in that file with `pageFixture`; it does not import the
  feature's mocks. A feature is
  exactly three directories — `tests/features/<f>/`, `src/ui/pages/<f>/` and
  `src/api/features/<f>/` — and `rm -rf` on all three removes it completely:
  typecheck, lint and the remaining suite stay green with no shared file edited.
- Fixtures are declared with `pageFixture(PageClass)` from `src/ui/fixtures/page-fixture.ts`
  and `mockFixture(mock)` from `src/ui/fixtures/mock-fixture.ts`. `pageFixture` constructs
  a page object per test, including the header, footer, and support modal on the core
  test. `mockFixture` binds a route mock to `page`. Specs never construct a page object.
- **Feature flags are pinned on, never observed.** An auto fixture
  (`feature-flags.fixture.ts`) sets the app's `__BJJEIRE_TEST_FLAG_OVERRIDES__`
  global via `addInitScript`; the app layers flags as `DEFAULT_FLAGS → remote →
overrides`, so this wins even if the remote fetch is slow or fails. Feature
  availability is a precondition of these specs, not their subject — without it a
  failed flag fetch fails closed and the feature's route redirects away,
  producing failures far from the cause. Never assert the flag API.
- **Varying flags for one spec file** — `featureFlagOverrides` is a Playwright
  _option_, so a file that deliberately exercises a disabled feature declares
  `test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, Stores: false } })`
  at file scope (see `tests/layout/feature-flags.ui.acceptance.spec.ts`). Every
  other spec keeps the pinned-on default. `test.use` also accepts Playwright's
  built-in options (`colorScheme`, `viewport`, `timezoneId`, `storageState`, …),
  but note it beats the _project_ value: a spec forcing `colorScheme: 'light'`
  runs light in every project, including `a11y` and the dark snapshot project.
- **Mutation audit** — `responseMutant` is a core option read from `PW_MUTANT`; when set,
  the `responseMutation` auto fixture (`src/ui/mocks/mutation.mock.ts`) fetches each real
  list response and hands the app one deliberate corruption
  (`<resource>:<operator>[:<field>]`) or, with `observe`, records resources and fields.
  Unset in every normal run. Specs that mock a route are unaffected (their route wins).
  `npm run mutation:audit` drives it; never set `PW_MUTANT` in a spec.
- A feature's route mocks live in `tests/features/<feature>/mocks.ts` and reach specs
  only through that feature's fixtures. `src/ui/mocks/` keeps just the feature-agnostic
  machinery (`json-response`, `paginate`, `failure`, `mutation`); `failure.mock.ts` takes the route
  to break as an argument, so nothing shared imports a feature.

### Snapshots

- Screenshot baselines are **per-platform** (`-darwin.png` + `-linux.png`); the Linux
  ones are what CI compares. Regenerate both with `/update-snapshots` after visual
  changes. Aria snapshots (`__aria__/*.aria.yml`) are platform-independent.
