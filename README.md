# bjjeire-tests

End-to-end web test automation framework using [Playwright](https://playwright.dev/) and TypeScript. Includes page-object utilities, soft assertions, an API helper, Allure + HTML reporting, Docker support, and a reusable GitHub Actions workflow for cross-repo CI.

## Setup

```bash
npm install
cp .env.example .env  # add BASE_URL and any test credentials
```

## Running Tests

```bash
npm test                       # all tests, headless
npm run test:chromium          # Chromium only
npm run test:chromium-headed   # headed, single worker (debugging)
npm run test:smoke             # @smoke tagged tests
npm run test:reg               # @reg tagged tests
npm run ui                     # Playwright UI mode
```

## Reporting

```bash
npm run play-report   # open Playwright HTML report
npm run open-report   # generate + open Allure report
npm run trace         # inspect a trace file
```

## Docker

```bash
docker compose build                                                          # build image
docker compose run --rm playwright                                            # run all tests
docker compose run --rm playwright npx playwright test -g @smoke             # smoke only
docker compose run --rm playwright npx playwright test --project=chromium    # Chromium only
```

Reports are written to `./playwright-report`, `./test-results`, and `./allure-results` on the host.

## CI — Reusable Playwright Workflow

This repo ships a reusable GitHub Actions workflow at [`.github/workflows/playwright-tests.yml`](.github/workflows/playwright-tests.yml) that other repos (app, infra, acceptance) can call to run the Playwright suite against one of three environment types.

### What it does

1. **Plans a matrix** over `playwright_projects` × `shard_total`.
2. **Provisions** the system-under-test — one of:
   - `docker` — brings up a `docker-compose.yml` from the caller's repo and waits for a health URL.
   - `terraform` — `terraform apply` in a workspace using Azure OIDC (no client secrets).
   - `external` — assumes the env is already up; pulls URLs from `EPHEMERAL_*` secrets.
3. **Runs tests** in parallel shards inside the official Playwright container image, with browser cache.
4. **Merges** per-shard blob reports into one HTML + JSON report, uploads as artifacts.
5. **Tears down** docker-compose / terraform state (always runs, even on test failure).
6. **Gates** on the aggregated matrix result and exposes `test_status`, `failed_count`, `report_artifact_name` outputs.

### Inputs (summary)

| Input                 | Default                                      | Notes                                                     |
| --------------------- | -------------------------------------------- | --------------------------------------------------------- |
| `environment_type`    | `external`                                   | `docker` \| `terraform` \| `external`                     |
| `base_url`            | `''`                                         | Override; else from provisioning or `EPHEMERAL_BASE_URL`. |
| `api_base_url`        | `''`                                         | Override; else from provisioning or `EPHEMERAL_API_URL`.  |
| `compose_file`        | `docker-compose.yml`                         | Used when `environment_type=docker`.                      |
| `compose_health_url`  | `''`                                         | Polled until 200-OK before tests start.                   |
| `terraform_dir`       | `infra`                                      | Used when `environment_type=terraform`.                   |
| `terraform_workspace` | `default`                                    | Typically PR ref.                                         |
| `terraform_var_file`  | `''`                                         | Optional `.tfvars` path.                                  |
| `test_tags`           | `''`                                         | Playwright `--grep`, e.g. `@smoke\|@regression`.          |
| `shard_total`         | `6`                                          | Parallel shards per project.                              |
| `playwright_projects` | `'["api","ui-chromium"]'`                    | JSON array of project names.                              |
| `node_version`        | `22`                                         |                                                           |
| `playwright_image`    | `mcr.microsoft.com/playwright:v1.58.2-noble` | Pin to your `@playwright/test` version.                   |
| `test_repo`           | `''`                                         | Owner/repo of tests; empty = caller.                      |
| `test_repo_ref`       | `main`                                       | Tag, branch, or SHA.                                      |

### Secrets (all optional)

`EPHEMERAL_BASE_URL`, `EPHEMERAL_API_URL`, `EPHEMERAL_MONGO_URL`, `EPHEMERAL_MONGO_DB`, `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_SUBSCRIPTION_ID`, `AZURE_API_SCOPE`, `AZURE_AUTHORITY`, `GHCR_TOKEN`.

Pass via `secrets: inherit` or an explicit map — see examples below.

### Outputs

| Output                 | Description                                   |
| ---------------------- | --------------------------------------------- |
| `test_status`          | `success` \| `failure` (aggregate of matrix). |
| `failed_count`         | Number of failed specs across all shards.     |
| `report_artifact_name` | Name of the merged HTML report artifact.      |

## Consuming from another repo

### Docker-provisioned env

See [`examples/consumer-docker.yml`](examples/consumer-docker.yml):

```yaml
jobs:
  e2e:
    uses: bjjeire/bjjeire-tests/.github/workflows/playwright-tests.yml@v1
    with:
      environment_type: docker
      compose_file: docker-compose.yml
      compose_health_url: http://localhost:5003/healthz
      test_tags: '@smoke|@regression'
      shard_total: 4
      test_repo: bjjeire/bjjeire-tests
      test_repo_ref: v1
    secrets:
      GHCR_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Terraform-provisioned ephemeral env (Azure OIDC)

See [`examples/consumer-terraform.yml`](examples/consumer-terraform.yml):

```yaml
jobs:
  e2e:
    uses: bjjeire/bjjeire-tests/.github/workflows/playwright-tests.yml@v1
    with:
      environment_type: terraform
      terraform_dir: infra
      terraform_workspace: ${{ github.head_ref || github.ref_name }}
      terraform_var_file: pr.tfvars
      test_tags: '@smoke'
    secrets:
      AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
      AZURE_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
      AZURE_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```

The terraform root module must expose `base_url` and `api_base_url` as outputs.

### External env (already provisioned)

```yaml
jobs:
  e2e:
    uses: bjjeire/bjjeire-tests/.github/workflows/playwright-tests.yml@v1
    with:
      environment_type: external
    secrets:
      EPHEMERAL_BASE_URL: ${{ secrets.EPHEMERAL_BASE_URL }}
      EPHEMERAL_API_URL: ${{ secrets.EPHEMERAL_API_URL }}
```

## Versioning

- Production callers: pin to a commit SHA (`@a1b2c3d`).
- Dev / acceptance callers: pin to a floating major (`@v1`).
- Tag releases `v1`, `v1.2`, `v1.2.3` on each change to the reusable workflow; move the `v1` tag to the latest matching release.

## Cross-repo access

GitHub blocks reusable-workflow calls from other repos by default. Allow them at **Org → Settings → Actions → General → Access** (or per-repo settings). For environment-gated approvals, apply the GitHub Environment to the caller job _inside_ the reusable workflow — not on the `uses:` job itself (GitHub rejects that combination).

## Internal CI

This repo's own pipeline ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs lint + typecheck + prettier on every push/PR, then self-calls the reusable workflow with `environment_type: external`. The reusable workflow is lint-checked by [`.github/workflows/lint-reusable.yml`](.github/workflows/lint-reusable.yml) using `actionlint` + `yamllint` (config in [`.yamllint.yml`](.yamllint.yml)).
