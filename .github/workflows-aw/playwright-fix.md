---
emoji: 🩹
name: playwright-fix
description: Propose a test-only fix from Playwright / atest evidence, reproduced against a local Docker stack
on:
  workflow_dispatch:
    inputs:
      run_id:
        description: GitHub Actions run ID of the failed Playwright job (usually bjjeire-java CI)
        required: false
      artifact_name:
        description: Artifact name that contains results.json or atest evidence
        required: false
      reproduce:
        description: Start the app's Docker stack so the healer can re-run and debug the failing test
        type: boolean
        default: true
      app_ref:
        description: Git ref of ianoflynnautomation/bjjeire to build the stack from
        required: false
        default: main
permissions:
  contents: read
  pull-requests: read
  issues: read
  actions: read
engine: claude
strict: true
timeout-minutes: 45
env:
  APP_ENV: docker
  BASE_URL: http://localhost:3000
  API_URL: http://localhost:5003
  ACCEPT_INVALID_CERTS: 'true'
  PLAYWRIGHT_HTML_OPEN: never
network:
  allowed: [defaults, github, local]
tools:
  github:
    mode: gh-proxy
    toolsets: [default]
  bash:
    - 'npx playwright test:*'
    - 'npx playwright cli:*'
    - 'npx eslint:*'
    - 'npx prettier:*'
    - 'npm run typecheck'
    - 'npm run trace:correlate:*'
    - 'curl:*'
    - 'kill:*'
    - 'unzip:*'
    - cat
    - ls
    - find
    - grep
    - head
    - tail
    - wc
    - 'jq:*'
steps:
  - name: Set up Node
    uses: actions/setup-node@v7
    with:
      node-version: 22
      cache: npm
  - name: Install test dependencies
    run: npm ci
  - name: Install Playwright Chromium
    if: inputs.reproduce
    run: npx playwright install --with-deps chromium
  - name: Check out the app (compose sources)
    if: inputs.reproduce
    uses: actions/checkout@v7
    with:
      repository: ianoflynnautomation/bjjeire
      ref: ${{ inputs.app_ref }}
      path: .app
      persist-credentials: false
  - name: Start and seed the app stack
    if: inputs.reproduce
    working-directory: .app
    env:
      COMPOSE_FILE: docker-compose.yml:docker-compose.override.java-local.yml:docker-compose.override.ci.yml
    run: |
      set -euo pipefail
      # The pre-up script writes the stack's env (incl. a generated Mongo
      # password) to $GITHUB_ENV. Point it at a temp file instead so none of
      # it reaches the agent's environment.
      stack_env="$RUNNER_TEMP/stack.env"
      GITHUB_ENV="$stack_env" ./.github/scripts/smoke-pre-up.sh
      set -a
      # shellcheck source=/dev/null
      . "$stack_env"
      set +a
      docker compose up -d --build --wait --wait-timeout 300
      curl --fail --silent --show-error --retry 30 --retry-connrefused --retry-all-errors \
        --retry-max-time 120 http://localhost:5003/health >/dev/null
      docker compose run --rm seeder
      {
        echo "COMPOSE_FILE=$COMPOSE_FILE"
        echo "COMPOSE_PROJECT_NAME=$COMPOSE_PROJECT_NAME"
        echo "COMPOSE_PROFILES=$COMPOSE_PROFILES"
      } >> "$GITHUB_ENV"
post-steps:
  - name: Stack logs on failure
    if: failure() && inputs.reproduce
    working-directory: .app
    run: docker compose logs --no-color --tail=300 || true
safe-outputs:
  create-pull-request:
    title-prefix: 'fix(test): '
    labels: [playwright-heal]
    allowed-files:
      - 'tests/**'
      - 'src/ui/**'
      - 'src/api/**'
      - 'specs/features/**'
  add-comment:
    max: 1
---

# Playwright fix (atest-backed)

## Task

Repair **this repository's tests** from evidence. Do not change the product.

Read:

1. `.specify/memory/constitution.md`
2. `AGENTS.md` (§ Test conventions, § Guardrails)
3. `.github/aw/instructions.md`
4. `specs/features/` for the failing feature
5. `specs/system-architecture.md` (CI attachment / atest notes)

Dispatch inputs:

- run id: `${{ github.event.inputs.run_id }}`
- artifact: `${{ github.event.inputs.artifact_name }}`

If a run id is present, use `gh` to inspect that workflow run and download
available artifacts (`results.json`, blob report, `.atest/evidence` if
uploaded). If atest CLI is not installed in the job, reason from the JSON
report and any evidence files already on disk.

Preferred evidence, in order:

1. atest evidence bundle (ARIA snapshot, network ledger, page-object intent)
2. Playwright JSON report (`results.json`) — same adapter path as
   `aplaytest history ingest --playwright-json`
3. HTML report / error-context.md under `test-results/`

atest is published as the `@aplaytest/*` npm packages. Do not vendor it.
Do not run `aplaytest ci generate`.
Do not re-run the full Playwright suite in this job.

## Reproduce and debug

When the dispatch input `reproduce` is `${{ github.event.inputs.reproduce }}`
and true, the job has already started and seeded the app's Docker stack
(frontend `http://localhost:3000`, API `http://localhost:5003`), installed the
dependencies and Chromium, and exported `APP_ENV=docker`, `BASE_URL` and
`API_URL`. Docker targets do not enforce auth. Confirm the stack answers with
`curl --fail --silent http://localhost:5003/health` before anything else; if it
does not, fall back to evidence only and say so in the output.

Hand each failing **UI** test to the `playwright-test-healer` agent
(`.claude/agents/playwright-test-healer.md`) with the evidence for it. It
re-runs only that test, debugs it with `npx playwright cli` against the stack,
and returns a root cause, a fix and a passing `--repeat-each=5` run, or an app
finding. Hand **API** failures to `playwright-api-tester` the same way. Never
run more than the failing tests. Results from a Docker stack can differ from
the environment that failed (data volume, auth, network); when the test passes
locally but failed upstream, treat it as environment or flake evidence, not as
proof the test is fine, and report that.

The `playwright-test` MCP server is not available in this job; the healer's
CLI flow is the only browser access. Close every browser and stop every
background test run before finishing.

## Allowed repairs

- Locator that drifted (`data-testid`, role, page-object method)
- Missing `gotoRoute` / web-first assertion instead of a timeout
- Test title / spec mapping only if the scenario was already specified
- Page-object helper that still asserts the same business outcome

## Forbidden

- Weakening an assertion to match an application bug
- Adding `@quarantine`
- Regenerating screenshot baselines unless the dispatch text explicitly says
  the change is visual and both darwin and linux will be updated
- Editing anything outside `allowed-files`
- Opening a PR against `bjjeire-java`
- Introducing `waitForTimeout`

## Required effects

- If the evidence supports a **test** defect: `create-pull-request` with a
  focused patch and a body that cites the failing title, project, and evidence,
  plus the local re-run result (before and after) when the stack was used.
- If the evidence supports an **application** defect: `add-comment` (or PR
  body on this run's summary) describing the app finding; do **not** patch tests.
- If artifacts are missing: `noop` explaining what the caller must upload
  (`results.json` and/or `.atest/evidence` via `extra-output-paths` in the
  templates — not yet present; JSON ingest is the current seam).

## No-op

Call `noop` when there is no failure, the only failures are classified infra,
or the repair would be speculative.

Do not approve or merge.
