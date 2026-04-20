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

## CI — Reusable Playwright Workflows

This repo ships reusable GitHub Actions workflows that other repos (app, infra, acceptance) can call to run the Playwright suite against local, Docker, Terraform, or other external environments.

- [`.github/workflows/playwright-tests.yml`](.github/workflows/playwright-tests.yml) for already-available environments such as local or external URLs
- [`.github/workflows/playwright-docker.yml`](.github/workflows/playwright-docker.yml) for Docker Compose-provisioned environments
- [`.github/workflows/playwright-terraform.yml`](.github/workflows/playwright-terraform.yml) for Terraform-provisioned ephemeral environments

### Workflow responsibilities

1. `playwright-tests.yml`
   Runs the generic Playwright matrix against caller-supplied URLs, merges reports, and exposes workflow outputs.
   Use this for `local` or `external` environments where the system-under-test already exists.
2. `playwright-docker.yml`
   Brings up Docker Compose in the caller repo, waits for health, runs Playwright, merges reports, and tears the stack down.
3. `playwright-terraform.yml`
   Applies Terraform in the caller repo, resolves URL outputs, runs Playwright through the generic runner, and always destroys afterward.

### Generic runner inputs (`playwright-tests.yml`)

| Input                 | Default                                                                                                 | Notes                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `app_env`             | `local`                                                                                                 | `local` \| `staging` \| `docker`                   |
| `base_url`            | `''`                                                                                                    | Target app URL for already-available environments. |
| `api_base_url`        | `''`                                                                                                    | Target API URL for already-available environments. |
| `test_tags`           | `'@smoke\|@regression'`                                                                                 | Playwright `--grep`, e.g. `@smoke\|@regression`.   |
| `shard_total`         | `6`                                                                                                     | Parallel shards per project.                       |
| `playwright_projects` | `'["api","chromium-desktop","firefox-desktop","webkit-desktop","chromium-wide","iphone-15","pixel-8"]'` | JSON array of project names.                       |
| `node_version`        | `22`                                                                                                    |                                                    |
| `playwright_image`    | `mcr.microsoft.com/playwright:v1.58.2-noble`                                                            | Pin to your `@playwright/test` version.            |
| `test_repo`           | `''`                                                                                                    | Owner/repo of tests; empty = caller.               |
| `test_repo_ref`       | `main`                                                                                                  | Tag, branch, or SHA.                               |

### Secrets (runner)

`EPHEMERAL_MONGO_URL`, `EPHEMERAL_MONGO_DB`, `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_API_SCOPE`, `AZURE_AUTHORITY`.

Additional workflow-specific secrets:

- `playwright-docker.yml`: `GHCR_TOKEN` when private images must be pulled from GHCR
- `playwright-terraform.yml`: `AZURE_SUBSCRIPTION_ID` for Azure OIDC login

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
    uses: bjjeire/bjjeire-tests/.github/workflows/playwright-docker.yml@v1
    with:
      compose_file: docker-compose.yml
      compose_health_url: http://localhost:5003/healthz
      base_url: http://localhost:3000
      api_base_url: http://localhost:5003
      test_tags: '@smoke|@regression'
      shard_total: 4
      playwright_projects: '["api","chromium-desktop","firefox-desktop","webkit-desktop","chromium-wide","iphone-15","pixel-8"]'
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
    uses: bjjeire/bjjeire-tests/.github/workflows/playwright-terraform.yml@v1
    with:
      terraform_dir: infra
      terraform_workspace: ${{ github.head_ref || github.ref_name }}
      terraform_var_file: pr.tfvars
      test_tags: '@smoke|@regression'
      playwright_projects: '["api","chromium-desktop","firefox-desktop","webkit-desktop","chromium-wide","iphone-15","pixel-8"]'
    secrets:
      AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
      AZURE_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
      AZURE_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```

The terraform root module must expose `base_url` and `api_base_url` as outputs.

### Local profile against caller-supplied URLs

See [`examples/consumer-local.yml`](examples/consumer-local.yml):

```yaml
jobs:
  e2e:
    uses: bjjeire/bjjeire-tests/.github/workflows/playwright-tests.yml@v1
    with:
      app_env: local
      base_url: http://localhost:3000
      api_base_url: http://localhost:5000
      test_tags: '@smoke|@regression'
      playwright_projects: '["api","chromium-desktop","firefox-desktop","webkit-desktop","chromium-wide","iphone-15","pixel-8"]'
    secrets:
      AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
      AZURE_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
      AZURE_CLIENT_SECRET: ${{ secrets.AZURE_CLIENT_SECRET }}
      AZURE_API_SCOPE: ${{ secrets.AZURE_API_SCOPE }}
      AZURE_AUTHORITY: ${{ secrets.AZURE_AUTHORITY }}
```

### External env (already provisioned)

```yaml
jobs:
  e2e:
    uses: bjjeire/bjjeire-tests/.github/workflows/playwright-tests.yml@v1
    with:
      app_env: staging
      base_url: ${{ secrets.EPHEMERAL_BASE_URL }}
      api_base_url: ${{ secrets.EPHEMERAL_API_URL }}
      test_tags: '@smoke|@regression'
      playwright_projects: '["api","chromium-desktop","firefox-desktop","webkit-desktop","chromium-wide","iphone-15","pixel-8"]'
    secrets:
      EPHEMERAL_MONGO_URL: ${{ secrets.EPHEMERAL_MONGO_URL }}
      EPHEMERAL_MONGO_DB: ${{ secrets.EPHEMERAL_MONGO_DB }}
```

## Versioning

- Production callers: pin to a commit SHA (`@a1b2c3d`).
- Dev / acceptance callers: pin to a floating major (`@v1`).
- Tag releases `v1`, `v1.2`, `v1.2.3` on each change to the reusable workflow; move the `v1` tag to the latest matching release.

## Cross-repo access

GitHub blocks reusable-workflow calls from other repos by default. Allow them at **Org → Settings → Actions → General → Access** (or per-repo settings). For environment-gated approvals, apply the GitHub Environment to the caller job _inside_ the reusable workflow — not on the `uses:` job itself (GitHub rejects that combination).

## Internal CI

This repo's own pipeline ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs lint + typecheck + prettier on every push/PR. The reusable workflow is lint-checked by [`.github/workflows/lint-reusable.yml`](.github/workflows/lint-reusable.yml) using `actionlint` + `yamllint` (config in [`.yamllint.yml`](.yamllint.yml)).
