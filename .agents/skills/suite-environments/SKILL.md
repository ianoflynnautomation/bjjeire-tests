---
name: suite-environments
description: How this suite runs. Covers local targets, the API rate limit, the dev container, Playwright projects and their filters, auth artefacts, APP_ENV profiles, CI workflows and runners, AKS environments, agentic workflows, Squash TM publishing, OpenTelemetry tracing and the MCP versus CLI browser tooling. Use when a run cannot reach the app, every feature route redirects to /about, a project or filter is in question, or you are changing CI, environments, Squash or tracing. For how to write tests use suite-conventions.
---

# Suite environments

## Local runs

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
acceptance gate until its budgets are agreed. Vitals are read once LCP and CLS go quiet,
so late card images count, and first content means a card, the empty state or the About
page, never a list page's heading. On 2026-11-01 (Docker) every route passed, with CLS about 0.002. Firefox, WebKit, and light Chromium pay the
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

## Browser tooling

The CLI skill is the official one bundled with this Playwright pin. Its canonical copy is [`.agents/skills/playwright-cli/SKILL.md`](.agents/skills/playwright-cli/SKILL.md). Refresh it with `npx playwright cli install --skills`. That writes through the `.claude/skills` symlink into `.agents/skills/playwright-cli/`. Do not also pass `--skills=agents`; that path is the same directory. Delete `.agents/skills/playwright-cli` first when the refresh must not keep stale files (the copy does not remove extras). Playwright MCP remains available when that server is connected. Specs generated from a session still follow the feature-slice rules below; snapshot refs are session-only.

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
`specs/*.plan.md`. The CLI skill's `references/spec-driven-testing.md` describes
Playwright's own plan files and allows `test.fixme`. This suite's templates and
the healer win where they disagree. When `npx playwright init-agents` is re-run
after a Playwright bump, compare its output with these files and carry over new
tool names only; do not overwrite them. Keep `docs/agents.md` in step with the
agent files.

## Agentic workflows

GitHub Agentic Workflows (sources under `.github/workflows-aw/`, compiled to
`.github/workflows/*.lock.yml`):

- `spec-review` — PR comment when tests and `specs/features/` disagree
- `playwright-fix` — test-only heal from atest / Playwright JSON evidence,
  reproduced on a local Docker stack by the `playwright-test-healer` subagent
  (`workflow_dispatch`; not hooked to this repo's lint `CI`)

Healing evidence can also come from the `atest` repo, published as `@aplaytest/*`.
See that repo's `docs/11-adoption-bjjeire.md` and `docs/14-bjjeire-ci-integration.md`.
Do not run `aplaytest ci generate` here. This suite is invoked from `bjjeire-java`
via `bjjeire-ci-templates`. Phase-1 ingest reads the uploaded Playwright JSON.

Engine is Claude Code (`engine: claude`); the jobs need repository secret
`ANTHROPIC_API_KEY`. After editing workflow Markdown:
`gh aw compile spec-review playwright-fix`. Keep the `workflows-aw` and
`workflows` copies identical.

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
  `bjjeire-java` `pr-env-validation.yml`.
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
