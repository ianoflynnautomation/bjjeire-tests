# CLAUDE.md

Playwright + TypeScript acceptance test suite for the BjjEire web application (read-only
BJJ directory: gyms, events, competitions, stores). Tests run against local (minikube),
Docker, and staging environments. Acceptance-level tests only — unit/integration tests
live in the app repository (`~/Sources/BjjEire`).

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
npm run lint              # ESLint (+ Prettier via plugin)
npm run typecheck         # tsc --noEmit
```

Local runs need the app reachable: minikube via
`kubectl port-forward -n bjjeire-app service/bjj-frontend 8080:80`, then
`APP_ENV=local BASE_URL=http://127.0.0.1:8080 API_URL=http://127.0.0.1:8080 npm run <script>`
(or rely on the gitignored `.env`). Local runs abort on first failure (`maxFailures: 1`).

## Playwright projects

| Project                                                   | Runs                                                            | Filter                                              |
| --------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------- |
| `api`                                                     | `*.api.acceptance.spec.ts` (config: `playwright.api.config.ts`) | —                                                   |
| `chromium-desktop`, `firefox-desktop`, `webkit-desktop`   | `*.ui.acceptance.spec.ts`                                       | excludes `@mobile`                                  |
| `chromium-wide`                                           | UI specs at 1728×1117                                           | `@desktop\|@smoke\|@acceptance`, excludes `@mobile` |
| `snapshots`                                               | `*.snapshot.acceptance.spec.ts`                                 | —                                                   |
| `a11y`                                                    | `*.a11y.acceptance.spec.ts`                                     | —                                                   |
| `mobile-iphone` (iPhone 16), `mobile-galaxy` (Galaxy S24) | UI specs                                                        | `@smoke\|@mobile`                                   |

The whole suite runs with `colorScheme: 'dark'` (shared base config) — the app boots in
dark mode in every test.

## Tags

Two-tier taxonomy:

- **Every test** carries `@acceptance` — `--grep @acceptance` selects the full suite.
- `@smoke` marks the basic critical subset **in addition**: `{ tag: ['@smoke', '@acceptance'] }`.
- Suite-level tags on `describe`: feature tag, `@ui`/`@api`/`@snapshot`/`@a11y`, and
  `@desktop` or `@mobile`. `@mobile` suites run only on the mobile projects.

## Test conventions

### File naming

- UI: `<feature>.ui.acceptance.spec.ts` · API: `<feature>.api.acceptance.spec.ts`
- Snapshots: `<feature>.snapshot.acceptance.spec.ts` · A11y: `<name>.a11y.acceptance.spec.ts`
- Titles: `Given <context>, when <action>, then <business outcome>` — domain vocabulary,
  observable outcomes, no selectors or DTO talk.

### Feature slice layout

```
tests/features/<feature>/                 # Spec files only
src/ui/pages/<feature>/                   # Page objects — pure functions taking page: Page
src/ui/fixtures/<feature>.fixture.ts      # One fixture per feature; register in fixtures/index.ts
src/api/features/<feature>/               # .api.ts + .types.ts + .schemas.ts + .builder.ts
tests/testdata/seeded/<feature>.ts        # DTO-typed seeded fixtures + partial search terms
```

See `tests/features/_template/README.md`; scaffold with `/add-feature`.

### Data policy (in priority order)

1. **Real seeded data first.** Acceptance specs assert the seeded fixtures in
   `tests/testdata/seeded/` against the real backend (seeder lives in the app repo).
2. **Environments hold full datasets** (e.g. 61 gyms locally), not just the acceptance
   fixtures — never assert a fixture card is on page 1 of an _unfiltered_ list. Narrow
   the view (search/filter) first, or prove state changes via search.
3. **`route.fulfill()` only for hard-to-seed cases**: empty states, error states,
   multi-page pagination, and snapshot determinism. Every mocked body is parsed against
   the feature's Zod page schema (`parseMockBody`) — drifted mocks fail loudly.
4. Partial search terms live next to their DTOs (`SEEDED_*_PARTIAL_NAME`, guarded by
   `partialNameOf`); never derive them with `name.slice(...)` in specs.

### Assertions

- Web-first assertions only (`expect(locator).toBeVisible()`); no `waitForTimeout()`
  (lint error), no polling loops.
- API specs assert returned values and domain invariants, not `typeof` shape checks —
  Zod schemas already validate the wire shape.
- Specs make API calls explicitly; assertion helpers receive responses, never fetch.
- Axe gotcha: disabled elements are exempt from color-contrast — a11y scans must wait
  for list content (filters enable after data loads) before analyzing.

### Page objects + fixtures

- Page objects are pure functions taking `page: Page` first; no page singletons.
- Fixtures bind page modules via `bindPage(mod, page)` and are composed in
  `src/ui/fixtures/index.ts`; specs `import { test } from '@ui/fixtures'`.
- Mocks live in `src/ui/mocks/` and are exposed to specs only through fixtures.

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
- `playwright-docker.yml`: reusable workflow (compose stack + sharded matrix across all
  projects). The app repo's `ci-main.yml` calls it pinned by commit SHA; the SHA pins
  the **workflow logic only** — test code is always checked out from this repo's `main`.
  Bump the pin only when the workflow files themselves change.
- `playwright-terraform.yml` / `acceptance.yml`: provisioned-environment runs.

## Guardrails

- **Never commit or push** — leave changes in the working tree; Ian commits manually.
- Never run tests against production targets; staging runs only as an explicit task.
- Keep generated reports/test output (`playwright-report/`, `test-results/`,
  `allure-results/`) out of source changes.
- `TODO.md` tracks the coverage roadmap and known app bugs — update it when closing items.

---

Maintenance: this file is the single source of truth for agent instructions
(`AGENTS.md` points here). Update it in the same change that alters a convention,
script, project, or workflow it documents. Last reviewed: 2026-07-06.
