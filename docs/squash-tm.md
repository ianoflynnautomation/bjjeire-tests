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

```sh
# Run tests aimed at a campaign iteration, optionally only a Squash folder's tests.
# The API token comes from the environment; everything else can be a --squash-* flag.
export SQUASH_TM_URL=http://localhost:8080/squash SQUASH_TM_TOKEN=<personal API token>
npm run squash:run -- --squash-mode=publish --squash-project-id=1 \
  --squash-campaign="Releases/2.4" --squash-iteration="Nightly #128" \
  --squash-filter-folder=BjjEire/Features/Gyms --project=chromium-desktop

# Run a QA-curated Squash test suite: it picks the tests and receives the results
npm run squash:run -- --squash-mode=publish --squash-project-id=1 --squash-test-suite-id=3

# Sync test cases only (create missing, update changed; never deletes or moves)
SQUASH_TM_MODE=publish SQUASH_TM_PROJECT_ID=1 npm run squash:sync

# Retire sync-created cases in a folder (after renames or a testCaseFolder change).
# Preview by default; --yes deletes. Hand-written cases are never touched.
npm run squash:prune -- --folder Playwright --folder /
npm run squash:prune -- --folder Playwright --folder / --yes

# CI pieces: select once, run shards with the list, publish from the merge
npm run squash:select            # writes playwright/.cache/squash-test-list.txt
npx playwright test --test-list=playwright/.cache/squash-test-list.txt --shard=1/4
SQUASH_TM_MODE=publish npx playwright merge-reports \
  --reporter=html,./src/squash/reporters/squash-results.reporter.ts all-blob-reports

npm run test:squash              # unit tests for the integration (no browser, no app)
```

`squash:run` passes every argument that is not a `--squash-*` flag to
`playwright test`. If you pass `--reporter`, it appends the Squash reporter to
your list; a bare `npx playwright test --reporter=…` replaces the configured
reporters and so drops it. CI blueprint, with central-pipeline inputs:
[`examples/squash-tm-publish.yml`](../examples/squash-tm-publish.yml).

## Configuration

One schema (`src/squash/infrastructure/config-schema.ts`) with flat keys, read
from three sources. Each later source overrides the earlier ones key by key
(the usual twelve-factor order):

1. **`squash-config.json`** at the repository root, or the file `SQUASH_TM_CONFIG` / `--squash-config` names.
   The committed copy holds the shared, reviewed defaults: tag, default folder, folder rules.
   Its `projects.<id>` section for the active project, if any, overrides the top level.
2. **Environment**: `SQUASH_TM_` plus the key in upper snake case (`campaignId` → `SQUASH_TM_CAMPAIGN_ID`).
   A pipeline or deployment adjusts the defaults here.
3. **CLI** through `npm run squash:run`: `--squash-` plus the key in kebab case (`--squash-campaign-id=7`).

Every source is validated on its own, so an error names its origin
(`testSuiteId (from environment) and campaign (from CLI) cannot be combined`). An
unknown `SQUASH_TM_*` variable is an error, not ignored, so a typo cannot fall
back to a default. `SQUASH_TM_LOG_LEVEL=debug` logs which source set each key.

| Key                                                   | Purpose                                                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `mode`                                                | `dry-run` (default; no writes), `publish`, or `auto` (`publish` when `CI` is set)                |
| `url`, `projectId`                                    | Squash root including the context path, and the project. Needed to publish or select             |
| `tag`                                                 | Only tests carrying it are Squash test cases (default `@squash`: tests opt in)                   |
| `testCaseFolder`                                      | Folder for new test cases no rule matches (`Playwright`); project root when unset                |
| `folderRules`                                         | File only: `[{ "path": "features/gyms/", "tag": "@api", "folder": "…" }]`, first match wins      |
| `projects`                                            | File only: `{ "<projectId>": { "testCaseFolder": …, "folderRules": … } }`, per-project placement |
| `campaign`                                            | Campaign path, folders included (`Releases/2.4`); each missing part is created                   |
| `campaignId`                                          | An existing campaign, instead of `campaign`                                                      |
| `iteration`                                           | Iteration name in the campaign, reused when it exists; unset means one per run                   |
| `iterationId`                                         | Publish into exactly this iteration (no campaign or iteration settings with it)                  |
| `testSuiteId`                                         | Run only the suite's tests and publish into its iteration (no other target with it)              |
| `filterFolder`                                        | Run only tests whose Squash case is in this folder or below                                      |
| `failOnError`, `maxAttempts`, `timeoutMs`, `logLevel` | `false`, `5`, `30000`, `info`                                                                    |

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
given, and a campaign path or id gets the named iteration, found or created. Two
pipelines creating the same campaign at the same moment could both create it, so
the CI blueprint serialises runs per target with `concurrency`.

## How tests map to Squash

- **Each synced case gets a readable reference** from its feature folder:
  `COMPETITIONS-001`, `EVENTS-012`, `API-001`. The number continues after the
  highest existing one for that prefix, and is assigned once and never changed,
  even if the test is renamed or moved. Cases from earlier versions that still
  show a `PW-…` hash are relabelled on the next sync. A reference someone typed
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
      Given gyms are published
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

- **One execution per test case per run.** Within a project the last attempt
  counts, so a test that passed on retry is `SUCCESS` and the comment notes
  the attempts. Across projects the worst outcome wins:
  failed → `FAILURE`, interrupted → `BLOCKED`, skipped → `SKIPPED`.
- The execution comment lists each project's outcome, its duration, and the
  error output, with ANSI codes stripped and the text HTML-escaped.
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

```
src/squash/
  domain/              Pure model: test cases, results, pins, keys, folder placement rules
  application/         Use cases against ports (no HTTP, no Playwright, no config parsing)
    ports.ts             TestCaseRepository, ExecutionRepository, FolderTree, SquashStrategy, Logger
    test-case-synchronizer.ts    Creates/updates cases; places new ones by folder rule
    test-selector.ts             Folder or test suite → the tests to run
    execution-context-resolver.ts  Target → the iteration results go to (find or create)
    folder-path-resolver.ts      Folder path → id, creating each missing folder once
    result-publisher.ts, result-aggregator.ts
    strategies.ts        DryRunStrategy (local) / RemoteStrategy (CI)
  infrastructure/      Adapters
    config-schema.ts     The one settings schema, and env / CLI names derived from it
    config.ts            SquashConfigLoader: file < project section < env < CLI, credentials, conflicts
    squash-client.ts, retrying-squash-client.ts  Transport contract, fetch, backoff decorator
    squash-test-case-repository.ts, squash-execution-repository.ts, squash-folder-tree.ts
    squash-wire.ts       The wire contract: Zod schemas for responses and request bodies
    squash-payloads.ts   Builds request bodies; HTML-escapes everything a test supplies
    playwright-test-parser.ts  Playwright reporter model → domain
  composition.ts       Composition root + strategy factory: wires the concrete classes
  reporters/           Playwright entry points: select, results and sync reporters
  cli/squash-run.mts   `npm run squash:run`: --squash-* flags, then select, then run
  tests/               Unit tests with in-memory fakes (`npm run test:squash`)
```

Dependencies point inwards: reporters → composition → infrastructure → application → domain.
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
