# CLAUDE.md

Playwright + TypeScript acceptance test suite for the BjjEire web application (read-only
BJJ directory: gyms, events, competitions, stores). Tests run against local (minikube),
Docker, and remote (dev / staging) environments. Acceptance-level tests only — unit/integration tests
live in the app repository (`~/Sources/BjjEire`). Against live AKS **dev**: [docs/dev-env.md](docs/dev-env.md).

## Stack

- **Runtime**: Node 22, TypeScript 5.7, CommonJS (`"type": "commonjs"`)
- **Test framework**: `@playwright/test` 1.61.0 (pinned; must match the CI runner image)
- **Validation**: Zod v4 — wire schemas in `src/api/features/*/​*.schemas.ts`
- **A11y**: `@axe-core/playwright`
- **Lint**: ESLint v9 flat config + Prettier 3, Husky pre-commit runs lint-staged

## Quick commands

```sh
npm run test:smoke        # Critical subset (@smoke)
npm run test:acceptance   # Full suite (@acceptance = every test)
npm run test:snapshots    # Snapshot project (screenshots + aria)
npm run test:a11y         # Axe WCAG 2.1 A/AA sweep per route
npm run test:mobile       # @mobile tests (mobile-iphone + mobile-galaxy projects)
npm run test:dev          # Live AKS dev UI (see docs/dev-env.md)
npm run test:dev:api      # Live AKS dev API
npm run lint              # ESLint (+ Prettier via plugin)
npm run typecheck         # tsc --noEmit
```

Local runs need the app reachable: minikube via
`kubectl port-forward -n bjjeire-app service/bjj-frontend 8080:80`, then
`APP_ENV=local BASE_URL=http://127.0.0.1:8080 API_URL=http://127.0.0.1:8080 npm run <script>`
(or rely on the gitignored `.env`). Local runs abort on first failure (`maxFailures: 1`).

**Check the API rate limit before running the full suite.** Through a port-forward
every worker shares one per-IP bucket, so a low limit 429s the suite: API specs
fail outright, and because the app's flags are fail-closed a 429 on
`/featureflag` silently redirects every feature route to `/about`.
`bjjeire-deploy`'s `values-local.yaml` already sets `RATE_LIMIT_ENABLED: "false"`,
so a cluster deployed per that repo's `LOCAL_DEVELOPMENT.md` is fine. A minikube
deployed with dev/ephemeral values instead runs `RATE_LIMIT_PERMIT_LIMIT: 30`,
which is far too low. Verify and patch the live release:

```sh
kubectl get cm -n bjjeire-app bjj-api \
  -o jsonpath='{.data.RATE_LIMIT_ENABLED}/{.data.RATE_LIMIT_PERMIT_LIMIT}{"\n"}'
# if rate-limited, raise it (reverts on the next `helm upgrade`):
kubectl patch cm -n bjjeire-app bjj-api --type merge \
  -p '{"data":{"RATE_LIMIT_PERMIT_LIMIT":"500"}}'
kubectl rollout restart deploy/bjj-api -n bjjeire-app
```

## Dev container

`.devcontainer/` builds on the **pinned CI image**
(`mcr.microsoft.com/playwright:v1.61.0-noble`), not a generic Node image: browsers
come pre-installed, and `-linux.png` baselines regenerated inside it match what CI
compares. The tag must track `@playwright/test` — Renovate's `playwright` group
covers this Dockerfile too.

The app under test still runs on the **host**. A local feature
(`.devcontainer/features/host-relay/`) starts a TCP relay from the container's
entrypoint so `localhost:8080` (and 3000/5000/5003/4318) reaches the same port on
the host — the app needs a `localhost` origin for MSAL's secure-context check, so
`host.docker.internal` is not a substitute. It has to be an entrypoint, not a
`postStartCommand`: lifecycle hooks run in a `docker exec` whose leftovers the CLI
kills. `node_modules` is a named volume — the host tree holds darwin-arm64 binaries.
Details in `.devcontainer/README.md`.

## Playwright projects

| Project                                                   | Runs                                                            | Filter                                      |
| --------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------- |
| `api`                                                     | `*.api.acceptance.spec.ts` (config: `playwright.api.config.ts`) | —                                           |
| `chromium-desktop`                                        | `*.ui.acceptance.spec.ts`                                       | excludes `@mobile`                          |
| `firefox-desktop`, `webkit-desktop`                       | UI specs                                                        | `@smoke` only, excludes `@mobile`           |
| `chromium-desktop-light`                                  | UI specs with `colorScheme: 'light'`                            | `@smoke` only, excludes `@mobile`, `@theme` |
| `chromium-wide`                                           | UI specs at 1728×1117                                           | `@layout\|@wide`, excludes `@mobile`        |
| `snapshots`                                               | `*.snapshot.acceptance.spec.ts`                                 | —                                           |
| `a11y`                                                    | `*.a11y.acceptance.spec.ts`                                     | —                                           |
| `a11y-light`                                              | a11y specs with `colorScheme: 'light'`                          | —                                           |
| `mobile-iphone` (iPhone 16), `mobile-galaxy` (Galaxy S24) | UI specs                                                        | `@smoke\|@mobile`                           |

Chromium desktop is the system of record. Firefox, WebKit, and light Chromium pay the
cross-browser/theme tax on `@smoke` only so the suite stays inside a 15-minute CI SLA
as the spec count grows. Wide is layout/nav, not a second copy of every catalog test.

The suite defaults to `colorScheme: 'dark'` (shared base config) — the app boots in dark
mode in every test. The `*-light` projects override to `colorScheme: 'light'` so the
light theme gets smoke UI + axe coverage; the app falls back to `prefers-color-scheme`
when no theme is stored. The theme-toggle spec (`@theme`) asserts the dark default, so it
is excluded from the light projects. Image snapshots stay dark-only — the snapshot path
template has no project segment, so light baselines would collide with dark ones.

CI workers default to 4 (not 100% of the box) so a single API is not the flake source.
Override with `PLAYWRIGHT_WORKERS`. UI Entra setup is skipped when `PW_UI_STORAGE_STATE`
points at a pre-built `storageState` file — shards must not each drive the login form.

Both auth artefacts live in the gitignored `playwright/.auth/`: `api-token.json`
(the Entra token cache — one entry, `0600`, written atomically so parallel workers
never read a half-written token) and `ui-user.json` (`STORAGE_STATE_PATH`, written
by the `setup` project). Both are caches: delete them to force a fresh mint or
sign-in. A cache from an earlier scope is ignored rather than reused, because the
scope is stored alongside the token.

## Tags

Two-tier taxonomy:

- **Every test** carries `@acceptance` — `--grep @acceptance` selects the full suite.
- `@smoke` marks the basic critical subset **in addition**: `{ tag: ['@smoke', '@acceptance'] }`.
- Suite-level tags on `describe`: feature tag, `@ui`/`@api`/`@snapshot`/`@a11y`, and
  `@desktop` or `@mobile`. `@mobile` suites run only on the mobile projects.
  `@layout` / `@wide` select the `chromium-wide` project.
- `@quarantine` marks known-flaky tests: excluded from every run via config
  `grepInvert` (`QUARANTINE_TAG` in `src/shared/config/playwright.ts`) but kept in
  the repo so they stay greppable. Fix or delete promptly — never let the list grow.

## Spec-driven development

Acceptance behaviour is specified in [`specs/`](specs/) before (or with) the
Playwright files. Product architecture and Mongo/OpenAPI contracts live in
`bjjeire-java/specs/`. Agent steering: [`.specify/memory/constitution.md`](.specify/memory/constitution.md)
and [`.specify/rules/playwright-rules.md`](.specify/rules/playwright-rules.md).

GitHub Agentic Workflows (sources under `.github/workflows-aw/`, compiled to
`.github/workflows/*.lock.yml`):

- `spec-review` — PR comment when tests and `specs/features/` disagree
- `playwright-fix` — test-only heal from atest / Playwright JSON evidence
  (`workflow_dispatch`; not hooked to this repo's lint `CI`)

Engine is Claude Code (`engine: claude`); the jobs need repository secret
`ANTHROPIC_API_KEY`. After editing workflow Markdown:
`gh aw compile spec-review playwright-fix`. Keep the `workflows-aw` and
`workflows` copies identical.

## Browser exploration

Live browsing uses either the Playwright MCP server or the CLI shipped with the
pinned Playwright (`npx playwright cli` from the repo root). Both are valid; the
procedure (snapshot, act, re-snapshot, close) lives in
[`.claude/skills/playwright-cli/SKILL.md`](.claude/skills/playwright-cli/SKILL.md).
CLI task notes (tests, mocks, storage, traces, video, and the rest) are in
that skill's `references/` directory.
The companion skills `playwright-explore-website`, `playwright-generate-test`, and
`playwright-automation-fill-in-form` call that procedure. Specs generated from a
session still follow the feature-slice rules below; snapshot refs are session-only.

## Test conventions

### File naming

- UI: `<feature>.ui.acceptance.spec.ts` · API: `<feature>.api.acceptance.spec.ts`
- Snapshots: `<feature>.snapshot.acceptance.spec.ts` · A11y: `<name>.a11y.acceptance.spec.ts`
- Titles: `Given <context>, when <action>, then <business outcome>` — domain vocabulary,
  observable outcomes, no selectors or DTO talk.

### Feature slice layout

```
tests/features/<feature>/                 # Specs, `fixtures.ts`, `mocks.ts`, `seeded.ts`,
                                          # and the feature's static JSON bodies
src/ui/pages/<feature>/                   # Page object class; list pages extend ListPage
src/api/features/<feature>/               # .api.ts + .types.ts + .schemas.ts
```

See `tests/features/_template/README.md`; scaffold with `/add-feature`.

### Data policy (in priority order)

1. **Real seeded data first.** Acceptance specs assert the seeded fixtures in
   `tests/features/<feature>/seeded.ts` against the real backend (the seeder lives in
   the app repo). Shared helpers — `seededCoordinates`, `partialNameOf` — stay in
   `tests/testdata/seeded/`.
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
  but the app renders nothing until MSAL init and the feature-flag fetch settle, and
  only then requests the route's `lazy()` chunk. Those two serial round trips are why
  the first test in a file used to flake on a cold environment. The helpers wait for a
  route anchor on a `TIMEOUTS.appBoot` budget; assertions after that keep the tight
  `TIMEOUTS.expect` default. Exceptions: the SEO spec (asserts static `index.html`
  tags) and snapshot specs (keep `load` so images are settled).
- API specs assert returned values and domain invariants, not `typeof` shape checks —
  Zod schemas already validate the wire shape.
- Specs make API calls explicitly; assertion helpers receive responses, never fetch.
- API specs take Playwright's built-in `request` fixture — there is no custom client.
  `baseURL` / TLS / static headers are declared in `src/api/config/playwright.ts`;
  the Entra bearer and per-test `traceparent` are layered by overriding the
  `extraHTTPHeaders` option in `src/api/fixtures/index.ts`. `get()` from
  `@api/support` is the only helper: native `request.get` + a required Zod schema.
  Specs asserting an error status call `request.get(...)` and read the `APIResponse`.
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
  option the whole feature needs. A feature is
  exactly three directories — `tests/features/<f>/`, `src/ui/pages/<f>/` and
  `src/api/features/<f>/` — and `rm -rf` on all three removes it completely:
  typecheck, lint and the remaining suite stay green with no shared file edited.
- Fixtures are declared with the factories in `src/ui/fixtures/mock-fixture.ts` —
  `pageFixture(PageClass)` constructs a page object per test, `mockFixture(mock)`
  binds a route mock to `page`. Specs never construct a page object.
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
- A feature's route mocks live in `tests/features/<feature>/mocks.ts` and reach specs
  only through that feature's fixtures. `src/ui/mocks/` keeps just the feature-agnostic
  machinery (`json-response`, `paginate`, `failure`); `failure.mock.ts` takes the route
  to break as an argument, so nothing shared imports a feature.

### Snapshots

- Screenshot baselines are **per-platform** (`-darwin.png` + `-linux.png`); the Linux
  ones are what CI compares. Regenerate both with `/update-snapshots` after visual
  changes. Aria snapshots (`__aria__/*.aria.yml`) are platform-independent.

## TypeScript rules

- Strict mode: `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`,
  `noImplicitReturns`. No `any`; no floating promises (both lint errors).
- `import type { Foo }` / `import { type Foo }` (enforced by `consistent-type-imports`).
- Path aliases: `@shared/*`, `@api/*`, `@ui/*`.
- With `exactOptionalPropertyTypes`, use conditional objects
  (`input.x ? { x: input.x } : {}`) instead of spreading `undefined`.
- DTO types mirror the app repo; deviate only when the wire truth differs.

## Environments & CI

- `APP_ENV` selects the profile: `local` (minikube), `docker`, `dev`, `staging`.
  `.env` (gitignored) supplies `BASE_URL`/`API_URL`.
- `ci.yml`: lint + typecheck on every push/PR.
- Reusable runners live in `bjjeire-ci-templates`: `playwright-docker-tests.yml`
  (compose stack + shards) and `playwright-tests.yml` / `acceptance-gate.yml` (existing
  or Flux ephemeral AKS). The app repo pins those workflows by commit SHA; the SHA pins
  the **workflow logic only** — test code is always checked out from this repo's `main`.
  Bump the pin only when the workflow files themselves change.
- Provisioned AKS environments live in `bjjeire-gitops` (`bjj-eire-preview`).
  Ephemeral values (`controller/values-ephemeral.yaml`) run two API/frontend replicas
  and a raised rate limit so sharded Playwright does not 429 the SUT.
  Callers use `bjjeire-ci-templates` `acceptance-gate.yml` and
  `BjjEire` `pr-env-validation.yml`.
- `lint-reusable.yml` gates workflow changes with actionlint + yamllint + zizmor
  (policy in `.github/zizmor.yml`: `actions/*` may float on tags, everything else
  SHA-pinned). Renovate (`renovate.json`) bumps `@playwright/test`, the Dockerfile
  base image, and the workflow default image in one grouped PR — they must match.
- Observability is an opt-in plugin: `src/shared/otel/otel-reporter.ts` (a custom
  Playwright reporter) activates only when `OTEL_EXPORTER_OTLP_ENDPOINT` is set.
  Every test is the root span of its own **distributed trace**: fixtures inject a
  deterministic `traceparent` (derived from run id + test id + retry in
  `src/shared/otel/trace-context.ts`) into browser contexts and API requests, and
  the reporter mints the test span with the same ids — app spans nest under the
  test. Shards correlate via `test.run.id`. `traceAnnotations` puts the trace id
  (and a Grafana link when `GRAFANA_URL` is set) into the HTML report. CI passes
  endpoint/headers as optional secrets. Locally: `npm run otel:forward` + the env
  var; `npm run otel:grafana` to explore (README "Tracing test runs").
  Renaming `test.*` span attributes breaks the Grafana dashboard — see TODO.

## Guardrails

- **Never commit or push** — leave changes in the working tree; Ian commits manually.
- Never run tests against production targets; staging runs only as an explicit task.
- Keep generated reports/test output (`playwright-report/`, `test-results/`,
  `allure-results/`) out of source changes.
- `TODO.md` tracks the coverage roadmap and known app bugs — update it when closing items.

---

Maintenance: this file is the single source of truth for agent instructions
(`AGENTS.md` points here). Update it in the same change that alters a convention,
script, project, or workflow it documents. Last reviewed: 2026-09-23.
