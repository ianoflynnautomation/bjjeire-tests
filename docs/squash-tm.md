# Squash TM integration

Mirrors the Playwright suite into [Squash TM](https://www.squashtest.com/) as
test cases, runs the tests a Squash folder or test suite selects, and records
each run's results into the campaign iteration the run is aimed at. It is
opt-in: with `SQUASH_TM_MODE` unset and `squash:run` unused, nothing loads.
Tests opt in too: only tests tagged `@squash` (on the test or its `describe`)
become Squash test cases or publish results.

Verified end to end against Squash TM 8.1.1 on PostgreSQL 15 (the stack in
[`squash-tm/`](../squash-tm/)) and the local Docker app, authenticating with a
personal API token. Design rationale: [ADR-0001](decisions/0001-squash-tm-integration.md)
and [ADR-0002](decisions/0002-squash-tm-execution-engine.md).

## Commands

`npm run squash:run` runs the suite and publishes. Each `--squash-*` flag sets one
key for that run. The same key can live in the shell or in `.env` / `.env*.local`
as `SQUASH_TM_` plus the name in upper snake case (`release` → `SQUASH_TM_RELEASE`).
A flag overrides the env file, which overrides `squash-config.json`. A blank line
in an env file stays unset. Booleans accept `true`, `false`, `1`, `0`, `yes`, and `no`.

`SQUASH_TM_URL`, `SQUASH_TM_TOKEN`, and `SQUASH_TM_PROJECT_ID` are read from the
shell or from those env files. Only `SQUASH_TM_*` keys are copied, so a token in
`.env.dev.local` does not change `APP_ENV` or `BASE_URL`. The token has no flag.
Anything that is not a `--squash-*` flag is passed to `playwright test`
(`--project=chromium-desktop`, `-g @smoke`). If you pass `--reporter`, the Squash
reporter is appended to your list; a bare `npx playwright test --reporter=…`
replaces the configured reporters and drops it.

```sh
# Nightly: update each test case's execution in one reused iteration.
npm run squash:run -- --squash-mode=publish --squash-project-id=1 \
  --squash-campaign="Releases/2.4" --squash-iteration="Nightly" \
  --project=chromium-desktop

# Release, for this run only. Also updates the test case execution, then creates
# one Squash execution per test. Name the iteration after the version.
npm run squash:run -- --squash-mode=publish --squash-release=true \
  --squash-project-id=1 --squash-campaign="Releases/2.4" --squash-iteration="2.4.0"

# The same release from the environment. In .env*.local it applies to every
# publish until the line is cleared; the shell is one run. A flag still wins:
# --squash-release=false
SQUASH_TM_RELEASE=true npm run squash:run -- --squash-mode=publish \
  --squash-project-id=1 --squash-campaign="Releases/2.4" --squash-iteration="2.4.0"

# An existing campaign, or one exact iteration. An iteration id stands alone.
npm run squash:run -- --squash-mode=publish --squash-campaign-id=7 --squash-iteration="Nightly"
npm run squash:run -- --squash-mode=publish --squash-iteration-id=15

# Only the tests whose Squash cases sit in a folder (and below it).
npm run squash:run -- --squash-mode=publish --squash-project-id=1 \
  --squash-campaign="Releases/2.4" --squash-iteration="Nightly" \
  --squash-filter-folder=BjjEire/Features/Gyms

# A QA test suite picks the tests and receives the results. No campaign, iteration, or folder with it.
npm run squash:run -- --squash-mode=publish --squash-test-suite-id=3

# Preview the publish, or fail the Playwright run when a Squash write fails.
npm run squash:run -- --squash-mode=dry-run --squash-campaign="Releases/2.4" --squash-iteration="Nightly"
npm run squash:run -- --squash-mode=publish --squash-fail-on-error=true \
  --squash-project-id=1 --squash-campaign="Releases/2.4" --squash-iteration="Nightly"

# Which source set each key: --squash-log-level=debug
# Another config file: --squash-config=teams/gyms.json

# Sync test cases only (create missing, update changed; never deletes or moves).
SQUASH_TM_MODE=publish SQUASH_TM_PROJECT_ID=1 npm run squash:sync

# Retire sync-created cases in a folder. Preview first; --yes deletes. Hand-written cases stay.
npm run squash:prune -- --folder Playwright --folder /
npm run squash:prune -- --folder Playwright --folder / --yes

# CI: select once, shard the list, publish once from the merged report.
npm run squash:select
npx playwright test --test-list=playwright/.cache/squash-test-list.txt --shard=1/4
SQUASH_TM_MODE=publish npx playwright merge-reports \
  --reporter=html,@playwright-squash/playwright-squash/results all-blob-reports
```

These combinations are rejected before any test runs:

- `--squash-test-suite-id` together with a campaign, an iteration, or `--squash-filter-folder`
- `--squash-iteration-id` together with a campaign or `--squash-iteration`
- `--squash-campaign` and `--squash-campaign-id` together
- `--squash-iteration` without a campaign
- `folderRules` or `projects` from the environment or a flag (those two are config-file only)

CI blueprint, with central-pipeline inputs:
[`examples/squash-tm-publish.yml`](../examples/squash-tm-publish.yml).

## Configuration

One schema in `@playwright-squash/playwright-squash` (`src/infrastructure/config-schema.ts`) with flat keys, read
from three sources. Each later source overrides the earlier ones key by key
(the usual twelve-factor order):

1. **`squash-config.json`** at the repository root, or the file `SQUASH_TM_CONFIG` / `--squash-config` names.
   The committed copy holds the shared, reviewed defaults: tag, default folder, folder rules.
   Its `projects.<id>` section for the active project, if any, overrides the top level.
2. **Environment**: `SQUASH_TM_` plus the key in upper snake case (`campaignId` → `SQUASH_TM_CAMPAIGN_ID`).
   A pipeline or deployment adjusts the defaults here.
3. **CLI** through `npm run squash:run`: `--squash-` plus the key in kebab case (`--squash-campaign-id=7`).

`SQUASH_TM_*` values missing from the shell are filled from `.env`, `.env.local`, and
`.env*.local` before that cascade runs. The profile's file comes first
(`.env.<profile>.local`, then `.env.local`, `.env`, then any other `.env*.local`).
The profile is `SQUASH_TM_PROFILE`, otherwise `APP_ENV`, otherwise `local`, so
`npm run test:dev` still reads `.env.dev.local` first. Set `SQUASH_TM_PROFILE`
when `APP_ENV` is not the Squash profile: an unrelated `APP_ENV` would otherwise
select the file. `SQUASH_TM_PROFILE` is read from the shell (or from whatever
already loaded dotenv); a value that exists only inside the file it would select
cannot change the order. The first value wins, a blank line stays unset, and
only `SQUASH_TM_*` keys are copied, so a token in `.env.dev.local` does not
change `APP_ENV` or `BASE_URL`. Startup logs the profile and the file each key
came from, never the values. A CI run that named neither profile logs a warning,
because it would quietly read `.env.local`.

Every source is validated on its own, so an error names its origin
(`testSuiteId (from environment) and campaign (from CLI) cannot be combined`). An
unknown `SQUASH_TM_*` variable is an error, not ignored, so a typo cannot fall
back to a default. `SQUASH_TM_LOG_LEVEL=debug` logs which source set each key.

| Key                                                   | Purpose                                                                                                                                                                                                    |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mode`                                                | `dry-run` (default; no writes), `publish`, or `auto` (publish when a CI signal is set; otherwise dry-run, with a warning)                                                                                  |
| `url`, `projectId`                                    | Squash root including the context path, and the project. Needed to publish or select                                                                                                                       |
| `tag`                                                 | Only tests carrying it are Squash test cases (default `@squash`: tests opt in)                                                                                                                             |
| `testCaseFolder`                                      | Folder for new test cases no rule matches (`Playwright`); project root when unset                                                                                                                          |
| `folderRules`                                         | File only: `[{ "path": "features/gyms/", "tag": "@api", "folder": "…" }]`, first match wins                                                                                                                |
| `projects`                                            | File only: `{ "<projectId>": { "testCaseFolder": …, "folderRules": … } }`, per-project placement                                                                                                           |
| `campaign`                                            | Campaign path, folders included (`Releases/2.4`); each missing part is created                                                                                                                             |
| `campaignId`                                          | An existing campaign, instead of `campaign`                                                                                                                                                                |
| `iteration`                                           | Iteration name in the campaign, reused when it exists; unset means one per run                                                                                                                             |
| `iterationId`                                         | Publish into exactly this iteration (no campaign or iteration settings with it)                                                                                                                            |
| `release`                                             | `true` also creates a release execution (`false`). `SQUASH_TM_RELEASE` in the shell or `.env*.local`, or `--squash-release`. A set env value applies to every publish until cleared; the flag overrides it |
| `testSuiteId`                                         | Run only the suite's tests and publish into its iteration (no other target with it)                                                                                                                        |
| `filterFolder`                                        | Run only tests whose Squash case is in this folder or below                                                                                                                                                |
| `failOnError`, `maxAttempts`, `timeoutMs`, `logLevel` | `false`, `5`, `30000`, `info`. CI should set `failOnError` true, or a Squash outage leaves the suite green                                                                                                 |

**Authentication is an API token only.** `SQUASH_TM_TOKEN` holds a Squash
personal API token, sent as `Authorization: Bearer`. It is read from the
environment only. In the config file or a CLI flag it is rejected, so it never
lands in git or in a process list. Username/password (Basic) auth is not
supported, because enterprise instances behind SSO do not accept it. A leftover
`SQUASH_TM_USERNAME` or `SQUASH_TM_PASSWORD` is an error rather than being ignored.

To create a token, sign in as the account the pipeline should act as (a
dedicated service account, with test-case and execution rights on the project).
Then go to **My account › Personal API tokens**, choose **Read and write**, and
set an expiry. Store the token as the `SQUASH_TM_TOKEN` CI secret, and rotate it
before it expires: an expired token fails with 401. The instance must set
`squash.rest-api.jwt.secret` (env `SQUASH_RESTAPI_JWT_SECRET`) to at least 64
bytes once base64-decoded (86+ characters); a shorter secret makes token creation fail
with a 500 (`WeakKeyException` in the server log). `squash-tm/init-squash.sh`
generates 128.

Misconfigurations fail before any test runs: publishing without a target, a
selection without a connection, conflicting targets, or an iteration name with
no campaign.

### Several teams or Squash projects

Each team's folders are governed in the config file, per Squash project. The
`projectId` (from any source) picks the section, so one pipeline template serves
every team:

```json
{
  "tag": "@squash",
  "testCaseFolder": "BjjEire",
  "projects": {
    "12": { "testCaseFolder": "Gyms/Playwright", "folderRules": [{ "tag": "@api", "folder": "Gyms/API" }] },
    "15": { "testCaseFolder": "Events/Playwright" }
  }
}
```

```sh
SQUASH_TM_PROJECT_ID=12 npm run squash:sync   # cases go to Gyms/Playwright, @api ones to Gyms/API
```

A section may set `testCaseFolder` and `folderRules`, and replaces the top-level
value for each key it sets. An environment variable or CLI flag still overrides
both: `SQUASH_TM_TEST_CASE_FOLDER=Hotfix`. Teams in separate repositories, or
with very different setups, can keep one file each and pick it with
`SQUASH_TM_CONFIG`.

Add a `projects` section only when that project's folder or rules differ from
the top level. Project id `1` is the usual first Squash project. A `"1"` section
that only repeats the top-level folder hides a later edit of that folder: cases
keep going to the old path and the sync does not say why. This repository's
file has no `projects` section. Its folder and rules apply to whichever project
id the pipeline passes.

### Sharing the integration

The client is the published package
[`@playwright-squash/playwright-squash`](https://github.com/ianoflynnautomation/playwright-squash).
This repository keeps `squash-config.json`, which is BjjEire's folder layout. A copy
of that file places another team's cases in `BjjEire/...` and the sync reports success.
The package owns its config errors, env reading, and run id. Connection
settings stay in the environment (`SQUASH_TM_URL`, `SQUASH_TM_TOKEN`, `SQUASH_TM_PROJECT_ID`). The
token is never in the package, the config file, or a flag.

Each consumer commits their own config file (`tag`, `testCaseFolder`,
`folderRules`) and points at it with `SQUASH_TM_CONFIG` when it is not
`squash-config.json`. Pin the Squash TM version this client was checked against
(8.1.1, `/api/rest/latest`). On that instance the project needs the built-in
automation technology `Playwright` and the nature and type info-list codes the
tests send. An unknown code fails the sync with HTTP 412.

In CI set `SQUASH_TM_MODE=publish` and `SQUASH_TM_FAIL_ON_ERROR=true`. The
default `failOnError` is false, so a Squash outage does not turn a green suite
red; the failure is logged and the run stays green unless CI opts in. Publish
once, from the merged report, never from a shard
([`examples/squash-tm-publish.yml`](../examples/squash-tm-publish.yml)). Set
`SQUASH_TM_ITERATION` to a name the jobs share, or leave it unset: the iteration
is then `Playwright <environment> <run id>`. The environment is
`SQUASH_TM_ENVIRONMENT`, then `APP_ENV`, then `local`. A CI run with neither
set logs a warning, because the name would claim the run was local. The run id
is shared across shards on GitHub Actions, Azure Pipelines (`BUILD_BUILDID`),
GitLab (`CI_PIPELINE_ID`), Jenkins (`BUILD_TAG`), Buildkite, and CircleCI. The
execution comment links to a GitHub Actions run when `GITHUB_SERVER_URL`,
`GITHUB_REPOSITORY`, and `GITHUB_RUN_ID` are set.

`mode: auto` publishes when `CI`, `TF_BUILD`, `GITLAB_CI`, `GITHUB_ACTIONS`,
`BUILDKITE`, `CIRCLECI`, or `TRAVIS` is `true` or `1`, or when `JENKINS_URL` or
`TEAMCITY_VERSION` is set. Otherwise it dry-runs and logs a warning. A pipeline
that must write results sets `publish`.

A folder leaf with no ASCII letters or digits fails the sync. It is not labelled
`PLAYWRIGHT`, which would share the project root's `PLAYWRIGHT-###` sequence.

### Selecting tests

`filterFolder` or `testSuiteId` asks Squash which test cases are in scope. Each
case maps back to its test through its `@Squash_<id>` pin or its derived key, and
the result is written as a Playwright `--test-list`. The folder is where the
case is in Squash **now**, so moves made in the Squash UI count. Cases in scope
with no test are logged as not automated. A selection that matches no test fails
the run instead of running everything.

### Choosing the run instance

Before the first result is written, the execution context resolves the target
once: a test suite publishes into its own iteration, an `iterationId` is used as
given, and a campaign path or id gets the named iteration, found or created.
With no iteration name, the name is `Playwright <environment> <run id>` (see
[Sharing the integration](#sharing-the-integration)). Two pipelines creating the
same campaign at the same moment could both create it, so the CI blueprint
serialises runs per target with `concurrency`.

## How tests map to Squash

- **Each synced case gets a readable reference** from its feature folder:
  `COMPETITIONS-001`, `EVENTS-012`, `API-001`. The number continues after the
  highest existing one for that prefix, and is assigned once and never changed,
  even if the test is renamed or moved. A folder leaf with no ASCII letters or
  digits fails the sync instead of being labelled `PLAYWRIGHT`. Cases from
  earlier versions that still show a `PW-…` hash are relabelled on the next
  sync. A reference someone typed
  in Squash, and any hand-written case, is never touched.
- **Unpinned tests are matched by their automated test reference**,
  `<spec>#<describe › title>` (Automation panel), identical across machines and
  projects. Renaming or moving an unpinned test therefore creates a new Squash
  case, and the old one keeps its history but gets no new executions. Squash
  caps the field at 512 characters; a longer path keeps its start plus a hash.
- **Pinned tests are matched by id.** A `@Squash_<id>` tag (any letter case)
  maps the test straight to that Squash test case, so renames and moves update
  it in place (verified live). A pin never creates a case. If the id is not in
  `SQUASH_TM_PROJECT_ID`, that test fails to sync and is reported with its
  `file:line`. Pins are ids, so they are **specific to one Squash project**:
  syncing the same suite into another project fails every pinned test.

  ```ts
  test('visitor should …', { tag: ['@acceptance', '@squash', '@Squash_214'] }, async () => { … });
  ```

  After a publish-mode `npm run squash:sync`, the output lists the tag for
  every unpinned test. Tests a `for` loop declares share one source line, so a
  tag there cannot tell them apart. Those are listed by name, for the ids to go
  in the loop data (`tag: ['@acceptance', '@squash', `@Squash_${route.squashId}`]`).

- **Per-test Squash fields** come from annotations. A field a test leaves out
  stays as Squash has it, so it can still be edited in the UI. Write them with
  the typed `squash()` helper (`@squash/annotations`), which the editor
  autocompletes and keeps each test to one line:

  ```ts
  import { squash } from '@squash/annotations';

  test('…', {
    tag: ['@acceptance', '@Squash_214'],
    annotation: squash({ weight: 'high', status: 'approved', nature: 'security', type: 'regression' }),
  }, async () => { … });
  ```

  | Field    | Values (Squash's default lists)                                                       |
  | -------- | ------------------------------------------------------------------------------------- |
  | `weight` | `low`, `medium`, `high`, `very high`                                                  |
  | `status` | `work in progress`, `under review`, `approved`, `obsolete`, `to be updated`           |
  | `nature` | `functional`, `business`, `user`, `non functional`, `performance`, `security`, `atdd` |
  | `type`   | `compliance`, `correction`, `evolution`, `regression`, `end to end`, `partner`        |

  Nature and type are info lists a Squash admin can replace per project
  (Administration › Info lists). For a custom item, pass its code:
  `nature: 'NAT_CONTRACT_TESTING'`. The helper writes plain `squash:weight`,
  `squash:status`, `squash:nature` and `squash:type` annotations, which a test
  may also write by hand (`{ type: 'squash:nature', description: 'security testing' }`).

  The suite's convention: `@smoke` tests weigh `high`, others `medium` (the
  authorization spec `high`); status `approved`; nature `functional`, except
  `security` (authorization) and `non functional` (a11y, snapshot, SEO); type
  `regression`.

  In a hand-written annotation, case, spaces and hyphens do not matter (`very high` = `VERY_HIGH`). An
  unknown `squash:*` annotation or an invalid weight or status fails before
  anything is sent, naming the spec location. Nature and type codes are
  per-project info lists, so Squash validates those and rejects an unknown one
  with HTTP 412.

- **Automation fields are set on every case:** technology `Playwright` (Squash's
  built-in entry) and the automated test reference above. They identify the
  test; they are not configured for Squash AUTOM to run it.
- **Synced cases are Gherkin.** Automated tests are created as Gherkin
  (`scripted-test-case`). Classic and Exploratory are left for manual testing.
  The script is generated from the test and rewritten when it changes:

  ```gherkin
  # Automated by Playwright: features/gyms/gyms.ui.acceptance.spec.ts
  Feature: Gyms UI acceptance

    @gyms @ui @desktop @squash @smoke @acceptance
    Scenario: visitor should see the gym list when opening Gyms
      When a visitor opens Gyms
      Then the gym list is displayed
  ```

  The top `describe` is the Feature, the rest of the title path is the
  Scenario, and the test's tags, less any `@Squash_<id>` pin, tag it. The
  steps are the test's top-level `test.step` titles that start with `Given`,
  `When`, `Then`, `And` or `But`:

  ```ts
  await test.step('Given an environment that enforces API authorization', () => { … });
  const response = await test.step('When a client requests the gym directory without a bearer token', () => …);
  await test.step('Then the request is rejected as unauthorized', async () => { … });
  ```

  Steps reach Squash only from a **publishing run** (`SQUASH_TM_MODE=publish`
  with results), and only from a test that passed: a failed or skipped run
  stops part-way. `squash:sync` lists tests without running them, so it cannot
  see steps. It keeps the steps the script already holds and rewrites only
  the rest. Changing a test's steps therefore updates Squash on the next
  publishing run in which the test passes. Other step titles (`Open the directory`)
  stay in the Playwright report and are not part of the scenario.

  Squash fixes a case's format when it creates it, and a PATCH must repeat that
  format (`_type`), so cases are never converted. A synced case in another format
  is updated as it is, and the sync warns with the `squash:prune` command that
  recreates it as Gherkin. A hand-written Classic case that a test is pinned to
  stays Classic. **Weight "Auto"** (weight derived from linked requirements) has
  no REST field.

- **Every publish updates the test case's execution.** Squash stores that
  status on an execution and shows the latest execution, so the first publish
  creates the row and later publishes patch it. Within a project the last
  attempt counts, so a test that passed on retry is `SUCCESS` and the comment
  notes the attempts. Across projects the worst outcome wins:
  failed → `FAILURE`, interrupted → `BLOCKED`, skipped → `SKIPPED`.
- **A new execution is created only for a release** (`SQUASH_TM_RELEASE=true`
  in the shell or `.env*.local`, or `--squash-release=true`). That run patches the test case
  execution when the iteration already has one, then adds the release
  execution. Squash shows the latest execution as the current status, so the
  release row becomes the result the test case shows, and a later ordinary
  publish leaves that row as it was written. When the latest row is a release
  execution, the ordinary publish starts a new test case execution so the
  shown status can move. Point a release at its own iteration
  (`--squash-iteration=2.4.0 --squash-release=true`) so the iteration that
  tracks the current result keeps a single execution between releases.
- The execution comment lists each project's outcome, its duration, and the
  error output, with ANSI codes stripped and the text HTML-escaped. It starts
  with **Test case execution** or **Release execution**.
- **Name and description are owned by the sync only on cases it owns:** cases it
  created, recognisable by their "Managed by the Playwright sync" first line, and
  cases whose description is empty. Pinning a hand-written test case never
  overwrites its name or description; only the annotated fields and the
  automation fields are set. Test steps, requirement links and custom fields are
  never touched.
- **Only changed fields are sent.** Description, tags and `file:line` are
  compared too, so a re-tagged or moved test is updated, and an unchanged suite
  syncs with no writes at all.

## Architecture

The client is [`@playwright-squash/playwright-squash`](https://github.com/ianoflynnautomation/playwright-squash).
This repository keeps `squash-config.json` and `src/squash-package/annotations.ts`,
which re-exports `squash()` so specs can keep `import { squash } from '@squash/annotations'`.
The package's unit tests live in that repository.

Dependencies inside the package point inwards: reporters → composition → infrastructure → application → domain.
Squash ids are branded types (`TestCaseId`, `IterationId`, …), so passing one kind
where another is expected fails to compile; they are minted only in the repositories and config.
The two repositories follow their two consumers: synchronisation and selection need test
cases, publishing needs campaigns, iterations and executions.
Every class receives its collaborators through its constructor, so each
reporter's core class (`SquashResultsReporter`, `SquashSyncReporter`, `SquashSelectReporter`) can be
built with fakes. The default export is a thin subclass that calls the
composition root.

## Resilience

- **Retries.** Exponential backoff with jitter (500 ms doubling, capped at
  10 s, 5 attempts), and `Retry-After` is honoured. GET and PATCH are retried
  on network errors, 408, 429, 500, 502, 503 and 504. POST creates resources, so it is
  retried only when Squash provably did nothing: 429, 503, or a refused
  connection. Every retry is logged.
- **Partial failure.** A test case or execution that fails is logged and
  counted, and the rest still publish.
- **Test plan items are added one at a time.** Squash computes an item's
  position inside the insert, so concurrent adds to one iteration violate
  `uc_item_test_plan_list_order` and return HTTP 500. Executions, which land
  on distinct items, are recorded 4 at a time.
- **Response checks.** Responses are parsed with Zod, so a changed Squash API
  fails with a clear message instead of a silent `undefined`. A 2xx that is not
  JSON (typically an SSO or proxy login page in front of Squash) fails as
  `SquashUnexpectedResponseError` rather than a bare `SyntaxError`.
- **A timed-out POST has an unknown outcome** and is not retried. If it was a
  test case create, the next sync finds the case by its automated test reference and adopts
  it. If it was an execution, Squash may hold a stray `READY` execution, and
  that result is counted as failed and logged.
