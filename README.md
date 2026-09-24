# bjjeire-tests

[![CI](https://github.com/ianoflynnautomation/bjjeire-tests/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ianoflynnautomation/bjjeire-tests/actions/workflows/ci.yml)
![Playwright](https://img.shields.io/badge/Playwright-1.61-2EAD33?logo=playwright&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node-22-339933?logo=nodedotjs&logoColor=white)

Acceptance test suite for **[BjjEire](https://github.com/ianoflynnautomation/BjjEire)** — a
read-only directory of BJJ gyms, events, competitions, and stores across Ireland.

Playwright + TypeScript, covering **API**, **UI** (Chromium / Firefox / WebKit), **visual +
aria snapshots**, **accessibility** (axe, WCAG 2.1 AA), and **mobile** (iPhone 16, Galaxy
S24) — against real seeded data in local, Docker, and remote (dev / staging) environments.

## Quick start

**Prerequisites:** Node 22, npm, and a running BjjEire instance (local
[minikube](https://github.com/ianoflynnautomation/bjjeire-deploy), Docker Compose, or a
remote environment URL).

```sh
npm ci
npx playwright install          # browsers (skip if using the Docker image)
cp .env.local.example .env      # then point BASE_URL / API_URL at your app
npm run test:smoke              # first green run 🎉
```

Prefer a container? **Reopen in Container** in VS Code gives you the pinned CI
image with all three browsers pre-installed, and relays `localhost` to the app
running on your host — see [`.devcontainer/README.md`](.devcontainer/README.md).

Key `.env` variables:

| Variable               | Purpose                                            | Example                 |
| ---------------------- | -------------------------------------------------- | ----------------------- |
| `APP_ENV`              | Profile: `local` \| `docker` \| `dev` \| `staging` | `local`                 |
| `BASE_URL`             | App under test                                     | `http://127.0.0.1:8080` |
| `API_URL`              | API under test                                     | `http://127.0.0.1:8080` |
| `ACCEPT_INVALID_CERTS` | Allow self-signed certs                            | `true`                  |

There is one `.env.<profile>.example` per environment. Local runs stop on the first
failure by design; CI runs the whole suite.

## Running tests

| Command                              | What it runs                                                      |
| ------------------------------------ | ----------------------------------------------------------------- |
| `npm run test:smoke`                 | Critical subset (`@smoke`)                                        |
| `npm run test:acceptance`            | Full suite (`@acceptance` — every test)                           |
| `npm run test:snapshots`             | Visual + aria snapshots                                           |
| `npm run test:a11y`                  | Axe WCAG 2.1 A/AA sweep per route                                 |
| `npm run test:mobile`                | Mobile devices (iPhone 16 + Galaxy S24)                           |
| `npm run test:docker`                | Full suite against the Docker Compose profile                     |
| `npm run test:dev` / `test:dev:api`  | Live AKS **dev** cluster — see [docs/dev-env.md](docs/dev-env.md) |
| `npm run lint` / `npm run typecheck` | ESLint + Prettier / `tsc --noEmit`                                |

Handy filters (any Playwright flag works):

```sh
npx playwright test tests/features/gyms/                    # one feature
npx playwright test --grep "@gyms" -c playwright.ui.config.ts
npx playwright test --project=chromium-desktop --headed     # watch it run
npx playwright test --ui                                    # Playwright UI mode
```

## Reports & debugging

```sh
npm run play-report    # open the Playwright HTML report
npm run open-report    # generate + open the Allure report
npm run trace          # inspect a trace file (traces upload on CI failure)
```

Updating screenshot baselines? They are **per-platform** (`-darwin` locally, `-linux`
in CI) — regenerate both; see `.claude/commands/update-snapshots.md` for the procedure.

### Tracing test runs (OTel, opt-in)

The suite ships an opt-in OpenTelemetry reporter (one trace per run, a span per
test). It activates only when `OTEL_EXPORTER_OTLP_ENDPOINT` is set — unset means
the module is never loaded. Against the local minikube observability stack
(`bjjeire-deploy/…/observability/install.sh full`):

```sh
npm run otel:forward     # port-forward the collector (4318) — keep running
OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318 npm run test:smoke
npm run otel:grafana     # Grafana at http://localhost:3000 → Explore → Tempo
```

Every test is the root of its own **distributed trace**: fixtures inject the
test's `traceparent` into all browser/API requests, so the app spans a test
caused (frontend proxy → API → Mongo) appear as its children in Tempo. Search
`service.name = bjjeire-acceptance-tests`; shards of one CI run share a
`test.run.id` resource attribute. Each test's trace id lands in the HTML report
annotations — set `GRAFANA_URL=http://localhost:3000` to make it a clickable
Grafana link. In CI the endpoint/headers arrive as optional secrets
(`OTEL_EXPORTER_OTLP_ENDPOINT` / `OTEL_EXPORTER_OTLP_HEADERS`).

## CI

- **This repo** ([`ci.yml`](.github/workflows/ci.yml)): lint + typecheck on every push/PR.
- **The app repo** calls `bjjeire-ci-templates` `playwright-docker-tests.yml` (PR compose
  smoke) and `acceptance-gate.yml` (main ephemeral AKS). Chromium desktop is the system
  of record; Firefox/WebKit run `@smoke` only. Results land as a merged HTML report.
- Callers pin the workflow by commit SHA; test code is always checked out from `main`.

Minimal consumer example ([more in `examples/`](examples/)):

```yaml
jobs:
  acceptance:
    uses: ianoflynnautomation/bjjeire-ci-templates/.github/workflows/playwright-docker-tests.yml@<sha>
    with:
      compose-files: docker-compose.yml
      compose-health-url: http://localhost:5003/health
      base-url: http://localhost:3000
      api-url: http://localhost:5003
      test-repo: ianoflynnautomation/bjjeire-tests
      test-tags: '@acceptance'
      playwright-projects: |
        api
        chromium-desktop
```

All inputs, secrets, and outputs are documented inline in the workflow files.
Provisioned AKS environments are owned by Flux in `bjjeire-gitops`
(`bjj-eire-preview`). Callers use
`bjjeire-ci-templates` `acceptance-gate.yml` (SHA / existing)
and `BjjEire` `pr-env-validation.yml` (PR previews).

## Project structure

```
tests/features/<feature>/            Specs, fixtures.ts, mocks.ts, seeded.ts
tests/features/common/testdata/      Shared seeded helpers (coordinates, partial names)
src/ui/pages/<feature>/              Page objects
src/ui/fixtures/                     Cross-cutting Playwright fixtures (base.ts)
src/api/features/<feature>/          Typed API clients, Zod schemas, DTO types
.github/workflows/                   Internal CI + reusable workflows
```

Conventions, tag taxonomy, and data policy live in [`CLAUDE.md`](CLAUDE.md); the
coverage roadmap lives in [`TODO.md`](TODO.md).

## Contributing

- Start new features from the template: `tests/features/_template/README.md`.
- Every test carries `@acceptance`; add `@smoke` only for the critical happy path.
- `npm run lint` and `npm run typecheck` must pass — the pre-commit hook enforces it.

Maintained by [@ianoflynnautomation](https://github.com/ianoflynnautomation).
