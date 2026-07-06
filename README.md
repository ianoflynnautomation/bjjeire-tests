# bjjeire-tests

[![CI](https://github.com/ianoflynnautomation/bjjeire-tests/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ianoflynnautomation/bjjeire-tests/actions/workflows/ci.yml)
![Playwright](https://img.shields.io/badge/Playwright-1.61-2EAD33?logo=playwright&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node-22-339933?logo=nodedotjs&logoColor=white)

Acceptance test suite for **[BjjEire](https://github.com/ianoflynnautomation/BjjEire)** — a
read-only directory of BJJ gyms, events, competitions, and stores across Ireland.

Playwright + TypeScript, covering **API**, **UI** (Chromium / Firefox / WebKit), **visual +
aria snapshots**, **accessibility** (axe, WCAG 2.1 AA), and **mobile** (iPhone 16, Galaxy
S24) — against real seeded data in local, Docker, and staging environments.

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

Key `.env` variables:

| Variable               | Purpose                                   | Example                 |
| ---------------------- | ----------------------------------------- | ----------------------- |
| `APP_ENV`              | Profile: `local` \| `docker` \| `staging` | `local`                 |
| `BASE_URL`             | App under test                            | `http://127.0.0.1:8080` |
| `API_URL`              | API under test                            | `http://127.0.0.1:8080` |
| `ACCEPT_INVALID_CERTS` | Allow self-signed certs                   | `true`                  |

There is one `.env.<profile>.example` per environment. Local runs stop on the first
failure by design; CI runs the whole suite.

## Running tests

| Command                              | What it runs                                  |
| ------------------------------------ | --------------------------------------------- |
| `npm run test:smoke`                 | Critical subset (`@smoke`)                    |
| `npm run test:acceptance`            | Full suite (`@acceptance` — every test)       |
| `npm run test:snapshots`             | Visual + aria snapshots                       |
| `npm run test:a11y`                  | Axe WCAG 2.1 A/AA sweep per route             |
| `npm run test:mobile`                | Mobile devices (iPhone 16 + Galaxy S24)       |
| `npm run test:docker`                | Full suite against the Docker Compose profile |
| `npm run lint` / `npm run typecheck` | ESLint + Prettier / `tsc --noEmit`            |

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

## CI

- **This repo** ([`ci.yml`](.github/workflows/ci.yml)): lint + typecheck on every push/PR.
- **The app repo** calls the reusable
  [`playwright-docker.yml`](.github/workflows/playwright-docker.yml) on every push to
  main: it boots the Docker Compose stack, seeds data, and runs the full `@acceptance`
  suite as a sharded matrix across all projects (API, three desktop browsers, wide,
  snapshots, a11y, both mobile devices). Results land as a merged HTML report artifact
  and a PR comment.
- Callers pin the workflow by commit SHA; test code is always checked out from `main`.

Minimal consumer example ([more in `examples/`](examples/)):

```yaml
jobs:
  acceptance:
    uses: ianoflynnautomation/bjjeire-tests/.github/workflows/playwright-docker.yml@<sha>
    with:
      compose_file: docker-compose.yml
      compose_health_url: http://localhost:5003/health
      base_url: http://localhost:3000
      api_base_url: http://localhost:5003
      test_repo: ianoflynnautomation/bjjeire-tests
      test_tags: '@acceptance'
```

All inputs, secrets, and outputs are documented inline in the workflow files.
`playwright-terraform.yml` covers Terraform-provisioned ephemeral environments.

## Project structure

```
tests/features/<feature>/            Spec files (Given/when/then titles)
tests/testdata/seeded/               DTO-typed seeded fixtures
src/ui/pages/<feature>/              Page objects (pure functions)
src/ui/fixtures/                     Playwright fixtures (composed in index.ts)
src/api/features/<feature>/          Typed API clients + Zod schemas + builders
.github/workflows/                   Internal CI + reusable workflows
```

Conventions, tag taxonomy, and data policy live in [`CLAUDE.md`](CLAUDE.md); the
coverage roadmap lives in [`TODO.md`](TODO.md).

## Contributing

- Start new features from the template: `tests/features/_template/README.md`.
- Every test carries `@acceptance`; add `@smoke` only for the critical happy path.
- `npm run lint` and `npm run typecheck` must pass — the pre-commit hook enforces it.

Maintained by [@ianoflynnautomation](https://github.com/ianoflynnautomation).
