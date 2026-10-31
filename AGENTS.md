# AGENTS.md

Playwright + TypeScript acceptance test suite for the BjjEire web application (read-only
BJJ directory: gyms, events, competitions, stores). Tests run against local (minikube),
Docker, and remote (dev / staging) environments. Acceptance-level tests only — unit/integration tests
live in the app repository (`~/Sources/BjjEire`). Against live AKS **dev**: [docs/dev-env.md](docs/dev-env.md). Auth for `.env.dev.local`: [docs/authentication.md](docs/authentication.md).

## Stack

- **Runtime**: Node 22, TypeScript 6.0, CommonJS (`"type": "commonjs"`)
- **Test framework**: `@playwright/test` 1.64.1 (pinned; must match the CI runner image)
- **Validation**: Zod v4 generated from the published OpenAPI contract (`npm run contract:pull` → `npm run gen:api-schemas` → `src/api/generated/zod.gen.ts`). Feature `*.schemas.ts` files re-export the page schema.
- **A11y**: `@axe-core/playwright`
- **Lint**: ESLint v9 flat config + Prettier 3, Husky pre-commit runs lint-staged

## Quick commands

```sh
npm run test:smoke        # Critical subset (@smoke)
npm run test:acceptance   # Full suite (@acceptance = every test)
npm run test:snapshots    # Snapshot project (screenshots + aria)
npm run test:a11y         # Axe WCAG 2.1 A/AA sweep per route
npm run test:mobile       # @mobile tests (mobile-iphone + mobile-galaxy projects)
npm run test:perf         # Opt-in boot budgets per route, desktop + slow 4G (PW_PERF, 1 worker)
npm run test:dev          # Live AKS dev UI (see docs/dev-env.md, docs/authentication.md)
npm run test:dev:api      # Live AKS dev API
npm run lint              # ESLint (+ Prettier via plugin)
npm run typecheck         # tsc --noEmit
npm run mutation:audit -- --feature <f>   # Do the feature's UI specs catch wrong data? (local/docker)
npm run evals:agents      # Golden-task evals for the agents (billed; --self-test is free; see evals/README.md)
npm run trace:correlate   # Backend view of failed attempts: Tempo by trace id, or Docker API logs by window
npm run squash:sync       # Sync test cases to Squash TM (needs SQUASH_TM_MODE; see docs/squash-tm.md)
npm run squash:run        # Publish with --squash-* flags (a release is SQUASH_TM_RELEASE or --squash-release; see docs/squash-tm.md)
npm run squash:prune      # Preview (or --yes: delete) sync-created Squash cases in a folder, e.g. after renames
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
(`mcr.microsoft.com/playwright:v1.64.1-noble`), not a generic Node image: browsers
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
The host's `~/Sources/bjjeire-java` is bind-mounted read-write at
`/workspaces/bjjeire-java`; the folder must exist or the container will not start.
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
| `perf` (only with `PW_PERF=true`)                         | `*.perf.acceptance.spec.ts`, one worker                         | —                                           |

Chromium desktop is the system of record. `perf` measures boot budgets (shell, first
content, LCP, CLS) per route under desktop and slow-4G throttling via CDP
(`src/ui/support/performance.ts`). It is opt-in so CI time and noise stay out of the
acceptance gate until its budgets are agreed. On 2026-10-30 it failed CLS on desktop
Events, Gyms and Competitions (0.23–0.33 vs 0.1), which is an app finding. Firefox, WebKit, and light Chromium pay the
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
- `@squash` opts a test (or a whole `describe`) into the Squash TM sync and result
  publishing. It is independent of `@smoke`/`@acceptance`: an untagged test never
  reaches Squash.
- `@quarantine` marks known-flaky tests: excluded from every run via config
  `grepInvert` (`QUARANTINE_TAG` in `src/shared/config/playwright.ts`) but kept in
  the repo so they stay greppable. Fix or delete promptly — never let the list grow.

## Spec-driven development

Acceptance behaviour is specified in [`specs/`](specs/) before (or with) the
Playwright files. Product architecture and Mongo/OpenAPI contracts live in
`bjjeire-java/specs/`. Agent steering: [`.specify/memory/constitution.md`](.specify/memory/constitution.md); the
Playwright rules are this file (no separate digest, so there is nothing to drift).

GitHub Agentic Workflows (sources under `.github/workflows-aw/`, compiled to
`.github/workflows/*.lock.yml`):

- `spec-review` — PR comment when tests and `specs/features/` disagree
- `playwright-fix` — test-only heal from atest / Playwright JSON evidence,
  reproduced on a local Docker stack by the `playwright-test-healer` subagent
  (`workflow_dispatch`; not hooked to this repo's lint `CI`)

Engine is Claude Code (`engine: claude`); the jobs need repository secret
`ANTHROPIC_API_KEY`. After editing workflow Markdown:
`gh aw compile spec-review playwright-fix`. Keep the `workflows-aw` and
`workflows` copies identical.

## Agent layout

One instruction file, one skill tree. Harness folders are links, not copies.

- **Instructions.** This file is the single source of agent instructions, same pattern as `bjjeire-java`. `CLAUDE.md` is an `@AGENTS.md` import so Claude Code loads this file. Edit this file only.
- **Skills.** Each skill is `.agents/skills/<name>/SKILL.md` (Agent Skills layout: optional `scripts/`, `references/`, `assets/` beside that file). That directory is the copy you edit. `.claude/skills` and `.grok/skills` are symlinks to it, because Claude Code reads `.claude/skills` and Grok also reads `.grok/skills`. Codex, Cursor, and Copilot read `.agents/skills`. Grok keeps one skill per name. Do not add a root `skills/` directory, and do not replace the symlinks with copies or with a Markdown pointer.
- **Copilot / gh-aw.** `.github/skills/<name>` is a per-skill symlink to `../../.agents/skills/<name>` when that tool must see the skill at its own path. Today that is `agentic-workflows`.
- **Commands.** Slash commands live once in `.claude/commands/`. Claude Code and Grok both read that directory. Do not add `.grok/commands`.
- **Subagents.** Claude subagents stay in `.claude/agents/` (see [Test agents](#test-agents)). A Grok agent definition, if added, goes in `.grok/agents/` because the file format differs.
- **Hooks.** `.claude/settings.json` runs two hooks on every `Edit`/`MultiEdit`/`Write`, including inside subagents and the `playwright-fix` job. `.claude/hooks/guard-edit.mjs` (PreToolUse) denies edits to generated or recorded files (`src/api/generated/`, `__screenshots__/`, `__aria__/`, `*.lock.yml`, `playwright/.auth/`, run output). It also denies adding `@quarantine`, `.fixme(`, `.only(`, `waitForTimeout(`, `networkidle` or `force: true` to `tests/` or `src/` code. `.claude/hooks/lint-edited.mjs` (PostToolUse) runs `eslint --fix` on the edited `.ts` file and returns the remaining errors to the agent. Hooks bind Claude Code only. Bash writes and humans are not blocked; lint and review still apply to them. Other skills are deliberately limited to this suite: generic engineering packs belong in user-level skills, not here.
- **Symlinks.** Relative links, committed. macOS and Linux checkouts follow them. A Windows checkout needs `core.symlinks=true`.

## Browser exploration

The CLI skill is the official one bundled with this Playwright pin. Its canonical copy is [`.agents/skills/playwright-cli/SKILL.md`](.agents/skills/playwright-cli/SKILL.md). Refresh it with `npx playwright cli install --skills`. That writes through the `.claude/skills` symlink into `.agents/skills/playwright-cli/`. Do not also pass `--skills=agents`; that path is the same directory. Delete `.agents/skills/playwright-cli` first when the refresh must not keep stale files (the copy does not remove extras). Playwright MCP remains available when that server is connected. Specs generated from a session still follow the feature-slice rules below; snapshot refs are session-only.

## Test agents

Eight Claude subagents in `.claude/agents/`; how to run them: [docs/agents.md](docs/agents.md). The first three are Playwright's official
planner, generator and healer (`npx playwright init-agents --loop=claude`), rewritten
for this suite's conventions. The other five cover exploratory bug hunting, mutation audits, API tests, flaky tests and review.

| Agent                           | Use it to                                                                  | Browser |
| ------------------------------- | -------------------------------------------------------------------------- | ------- |
| `playwright-test-planner`       | Explore a feature and write scenarios into `specs/features/<feature>.md`   | MCP     |
| `playwright-test-generator`     | Rehearse a planned UI scenario live, then write it into the feature slice  | MCP     |
| `playwright-test-healer`        | Reproduce and fix a failing UI test, or report an app bug                  | CLI     |
| `playwright-exploratory-tester` | Chartered bug hunt with automatic oracles; report in `specs/exploration/`  | CLI     |
| `playwright-mutation-auditor`   | Corrupt real responses per mutant; triage survivors into `specs/mutation/` | none    |
| `playwright-api-tester`         | Write or heal `*.api.acceptance.spec.ts`                                   | none    |
| `playwright-flake-hunter`       | Measure a flaky test under `--repeat-each`, find the cause, fix it         | none    |
| `playwright-test-reviewer`      | Review test changes before commit (read-only, ranked findings)             | none    |

The planner and generator use the `playwright-test` MCP server in `.mcp.json`
(`npx playwright run-test-mcp-server`, UI config, headless): their loops lean on
its seed, recorder log and per-step introspection. The healer uses
`npx playwright cli` instead: it runs the failing test with `--debug=cli` and
attaches, which gives the same paused page at a fraction of the tokens (snapshots
go to files, and no MCP tool schemas load), and it runs in any shell. The server sets
`PW_AGENT_SEED`, which adds the `agent-seed` project. Its `tests/agents/seed.spec.ts`
signs in, pins feature flags on and mounts the app shell before the agent takes over;
`tests/agents/explore.spec.ts` does the same and then parks on `page.pause()` with no
timeout, so the exploratory tester's `--debug=cli` session lasts as long as its charter. Without the variable the project does not
exist, so suite and CI runs never see the seed. The living spec is the plan: no
`specs/*.plan.md`. When `npx playwright init-agents` is re-run after a Playwright
bump, compare its output with these files and carry over new tool names only;
do not overwrite them. Keep `docs/agents.md` in step with the agent files.

Pipeline: planner → generator (UI) or api-tester (API) → reviewer. Healer and
flake-hunter run on failures. The exploratory tester feeds the planner: its report's
candidate scenarios enter `specs/features/` only once the planner (or you) accepts them.
The mutation auditor measures the suite: survivors it classifies as gaps become
assertions or scenarios for the generator. No agent adds `test.fixme`, `test.skip` or
`@quarantine`; quarantine is a human decision.

Agents are measured by golden tasks in [`evals/`](evals/README.md): a planted defect,
a known right answer, deterministic grading. After changing an agent, a skill, this file
or the hooks, run `npm run evals:agents -- --self-test` and then the fast tier, and
compare pass rates with the previous run.

## Test conventions

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
  but the app renders nothing until MSAL init and the feature-flag fetch settle, and
  only then requests the route's `lazy()` chunk. Those two serial round trips are why
  the first test in a file used to flake on a cold environment. The helpers wait for a
  route anchor on a `TIMEOUTS.appBoot` budget; assertions after that keep the tight
  `TIMEOUTS.expect` default. Exceptions: the SEO spec (asserts static `index.html`
  tags) and snapshot specs (keep `load` so images are settled).
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

## TypeScript rules

- Strict mode: `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`,
  `noImplicitReturns`. No `any`; no floating promises (both lint errors).
- `import type { Foo }` / `import { type Foo }` (enforced by `consistent-type-imports`).
- Path aliases: `@shared/*`, `@api/*`, `@ui/*`. `@squash/annotations` resolves through `src/squash-package/annotations.ts` to `@playwright-squash/playwright-squash`.
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
- Squash TM is an opt-in plugin ([docs/squash-tm.md](docs/squash-tm.md); agent skill `squash-tm`).
  The running client is the npm package `@playwright-squash/playwright-squash`: `squash:sync`,
  `squash:run`, `squash:prune`, `squash:select`, and the results reporter load that package.
  Specs import `squash()` from `@squash/annotations`, which re-exports the package through
  `src/squash-package/annotations.ts`. The results reporter loads only when `SQUASH_TM_MODE` is set; CI publishes once from
  `merge-reports`, never per shard ([examples/squash-tm-publish.yml](examples/squash-tm-publish.yml)).
  Only tests tagged `@squash` sync. A test's Squash identity is a `@Squash_<id>` pin tag, or else its `spec#title path` in the
  case's automated test reference; the visible reference is a label such as `EVENTS-012`, and synced cases are Gherkin (manual ones stay Classic),
  assigned once from the feature folder. Every test sets its fields with
  `annotation: squash({ weight, status, nature, type })` from `@squash/annotations`
  (typed; values in docs/squash-tm.md). Settings cascade defaults < `squash-config.json` (and its `projects.<id>` section)
  < `SQUASH_TM_*` env < `--squash-*` CLI flags (one schema, `config-schema.ts`). Missing
  `SQUASH_TM_*` keys are filled from `.env` files for `SQUASH_TM_PROFILE`, otherwise `APP_ENV`.
  Auth is a personal API token in `SQUASH_TM_TOKEN` (env only; no username/password).
  The client's unit tests live in that package. The local Squash stack lives in `squash-tm/`.
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
  `npm run trace:correlate` (`scripts/trace-correlate.mjs`, skill `trace-correlation`) joins
  a test attempt from `test-results/results.json` to its trace in Tempo, or, on Docker
  (OTel off), to the API log lines in its time window. Front-end timing, leaks and JS
  weight are the `devtools` skill (CDP scripts run through `npx playwright cli`).

## Guardrails

- **Never commit or push** — leave changes in the working tree; Ian commits manually.
- Never run tests against production targets; staging runs only as an explicit task.
- Keep generated reports/test output (`playwright-report/`, `test-results/`,
  `allure-results/`) out of source changes.

---

Maintenance: this file is the single source of truth for agent instructions
(`CLAUDE.md` imports it). Update it in the same change that alters a convention,
script, project, or workflow it documents. Last reviewed: 2026-10-29.
