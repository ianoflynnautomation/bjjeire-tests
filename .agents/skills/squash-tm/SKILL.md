---
name: squash-tm
description: Squash TM test management for this suite. Tests opt in with the @squash tag, set Squash fields with annotation squash({ weight, status, nature, type }) from @squash/annotations, and keep their Squash history with a @Squash_<id> pin. npm run squash:sync mirrors tests into Squash test cases; npm run squash:run runs a Squash folder or test suite and publishes results into a campaign iteration. Use when adding or renaming a test that is tracked in Squash, choosing Squash field values, syncing, publishing results, configuring squash-config.json or SQUASH_TM_* variables, or debugging a Squash error. Do not use for fixtures, selectors or API assertions (see those skills).
author: Ian O Flynn
---

# Squash TM

`src/squash/` mirrors Playwright tests into Squash TM as test cases and records
run results into a campaign iteration. It is opt-in twice over: nothing loads
unless `SQUASH_TM_MODE` is set or `squash:run` is used, and only tests tagged
`@squash` take part. Full reference: `docs/squash-tm.md`. Design:
`docs/decisions/0001-squash-tm-integration.md`, `0002-squash-tm-execution-engine.md`.

## Critical

- **ALWAYS** tag the top-level `describe` with `@squash` when a spec's tests belong
  in Squash. A test without it is never synced and never publishes a result.
- **ALWAYS** set the fields with the typed helper, one line per test:
  `annotation: squash({ weight, status, nature, type })`. Do not hand-write four
  `squash:*` objects; the helper autocompletes the values and keeps describes under
  the 200-line lint limit.
- **NEVER** put the API token in `squash-config.json`, a `--squash-*` flag or a
  committed `.env.*.example`. It lives in `SQUASH_TM_TOKEN`: a gitignored
  `.env*.local` / `.env` locally, a secret in CI. Username/password is not
  supported and is rejected.
- **Renaming or moving an unpinned test creates a new Squash case.** Identity is
  `spec#describe › title`. If the history matters, pin the test (`@Squash_<id>`)
  before renaming it.
- **The sync never deletes or moves cases.** Deleting Squash data needs the
  user's explicit confirmation, case by case or as a named set.
- **Automated tests are Gherkin cases; manual tests are Classic or Exploratory.**
  The sync creates Gherkin (script generated from the test) and never converts a
  case's format. When it warns that synced cases are not Gherkin, retire them with
  the `squash:prune` command it prints, then sync again.
- **NEVER** publish from a shard. CI publishes once, from `merge-reports`
  (`examples/squash-tm-publish.yml`).
- **NEVER** point a run at production. Staging only as an explicit task.
- A publish updates the test case's execution. A new Squash execution is
  created only when the run is a release (`--squash-release=true` or
  `SQUASH_TM_RELEASE=true` in the shell or `.env*.local`), and that run updates
  the test case execution too. Point the release at its own iteration. A flag
  overrides the env value.

## Opting a test in

```ts
import { squash } from '@squash/annotations';
import { test } from './fixtures';

test.describe('Gyms UI acceptance', { tag: ['@gyms', '@ui', '@desktop', '@squash'] }, () => {
  test(
    'visitor should see the gym list when opening Gyms',
    {
      tag: ['@smoke', '@acceptance'],
      annotation: squash({ weight: 'high', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ gymsPage }) => { … },
  );
});
```

A new test added inside a tagged `describe` syncs on the next `squash:sync`.
The scaffold in `tests/features/_template/` already follows this shape.

## Field values

A field left out stays as Squash has it, editable in the UI. A field set in code
is owned by code: a UI edit is overwritten on the next sync.

| Field    | Values                                                                                |
| -------- | ------------------------------------------------------------------------------------- |
| `weight` | `low`, `medium`, `high`, `very high`                                                  |
| `status` | `work in progress`, `under review`, `approved`, `obsolete`, `to be updated`           |
| `nature` | `functional`, `business`, `user`, `non functional`, `performance`, `security`, `atdd` |
| `type`   | `compliance`, `correction`, `evolution`, `regression`, `end to end`, `partner`        |

Nature and type are per-project info lists. For a custom item pass its code
(`nature: 'NAT_CONTRACT_TESTING'`); Squash rejects an unknown code with HTTP 412.

Suite convention:

| Field  | Rule                                                                              |
| ------ | --------------------------------------------------------------------------------- |
| weight | `high` for `@smoke` and security tests, otherwise `medium`                        |
| status | `approved` once the test is green on main; `work in progress` while it is drafted |
| nature | `security` (auth), `non functional` (a11y, snapshot, SEO), otherwise `functional` |
| type   | `regression`                                                                      |

## Titles

`<actor> should <outcome> [when <context>]`: `visitor` for UI, `client` for API,
the component for snapshot and a11y tests (`About page should match the approved
image`). The Squash case name is `describe › title`, so the title is what QA reads.

## Given/When/Then steps

Write the scenario as top-level `test.step`s whose titles start with `Given`,
`When`, `Then`, `And` or `But`. A publishing run copies them under the Scenario
in the Gherkin script:

```ts
await test.step('Given an environment that enforces API authorization', () => {
  test.skip(!env.apiAuth.required, 'this environment does not enforce API authorization');
});
const response = await test.step('When a client requests the gym directory without a bearer token', () =>
  request.get(API_ROUTES.gyms, { params: { page: 1, pageSize: 1 } }));
await test.step('Then the request is rejected as unauthorized', async () => {
  await expectProblem(response, 401, ProblemType.Unauthorized);
});
```

- Only a **passing** run updates the steps; failed and skipped runs stop part-way.
- `squash:sync` cannot see steps (`--list` does not run tests). It keeps the ones
  Squash already holds, so a sync never wipes them.
- Nested steps and other titles are not part of the scenario.
- A `test.skip` inside the Given step skips cleanly.

## Pinning

After a publish-mode sync the output lists `@Squash_<id>` for every unpinned
test. Add it to the test's `tag` to keep its history across renames and moves:

```ts
{ tag: ['@acceptance', '@Squash_214'], annotation: squash({ … }) }
```

A pin never creates a case, and ids belong to one Squash project. Tests a `for`
loop declares share a line, so put each id in the loop data:
``tag: ['@acceptance', `@Squash_${route.squashId}`]``.

## Commands

```sh
# Preview: what would be created or updated (no connection needed)
SQUASH_TM_MODE=dry-run npm run squash:sync

# Sync test cases (create missing, update changed)
SQUASH_TM_MODE=publish SQUASH_TM_PROJECT_ID=1 npm run squash:sync

# Nightly: updates the test case execution. Playwright args (--project, -g) pass through.
npm run squash:run -- --squash-mode=publish --squash-project-id=1 \
  --squash-campaign="Releases/2.4" --squash-iteration="Nightly" --project=chromium-desktop

# Release: also creates one Squash execution per test. Flag for one run, or
# SQUASH_TM_RELEASE=true in the shell or .env*.local (the flag overrides the file).
# Other flags and the combinations that are rejected: docs/squash-tm.md § Commands.
npm run squash:run -- --squash-mode=publish --squash-release=true --squash-project-id=1 \
  --squash-campaign="Releases/2.4" --squash-iteration="2.4.0"
SQUASH_TM_RELEASE=true npm run squash:run -- --squash-mode=publish --squash-project-id=1 \
  --squash-campaign="Releases/2.4" --squash-iteration="2.4.0"

# Run only a Squash folder's tests, or a QA-curated test suite
npm run squash:run -- --squash-mode=publish --squash-filter-folder=BjjEire/Features/Gyms …
npm run squash:run -- --squash-mode=publish --squash-test-suite-id=3

# Retire sync-created cases in old folders (preview; add --yes to delete, only with the user's go-ahead)
npm run squash:prune -- --folder Playwright --folder /

# Unit tests for the integration
npm run test:squash
```

Local Squash: `squash-tm/` (`./init-squash.sh`, `docker compose up -d`),
UI at `http://localhost:8080/squash`. That stack holds port 8080, which is also
the documented minikube port-forward. When both are needed, pass the app's
`BASE_URL` / `API_URL` explicitly.

## Configuration

Precedence, lowest to highest: defaults < `squash-config.json` < its
`projects.<id>` section < `SQUASH_TM_*` env < `--squash-*` flags. One schema in
`src/squash/infrastructure/config-schema.ts` derives every env name and flag.

- `squash-config.json` (committed): `tag`, `testCaseFolder`, `folderRules`
  (`{ path, tag?, folder }`, first match wins) and per-project `projects`.
- Env / CI: `SQUASH_TM_URL`, `SQUASH_TM_TOKEN`, `SQUASH_TM_PROJECT_ID`, and the
  run target (`SQUASH_TM_CAMPAIGN`, `_ITERATION`, `_ITERATION_ID`, `_TEST_SUITE_ID`,
  `_FILTER_FOLDER`). A misspelt `SQUASH_TM_*` variable is an error.
- `SQUASH_TM_LOG_LEVEL=debug` prints which source set each setting.

Folder rules decide where a case is **created**. Changing a rule never moves an
existing case (the API cannot); the sync lists misplaced cases for moving in the UI.

## Troubleshooting

| Symptom                                                 | Cause and fix                                                                                                                                                         |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `needs SQUASH_TM_TOKEN` or `publish mode needs url`     | Set `SQUASH_TM_URL` and `SQUASH_TM_TOKEN` in the shell, `.env`, or `.env*.local`. A local run reads those keys from `.env.dev.local` without switching the app to dev |
| `SQUASH_TM_USERNAME: username/password … not supported` | Unset it; use a personal API token                                                                                                                                    |
| 401 from Squash                                         | Token expired, revoked or for another instance. Create one: My account › Personal API tokens                                                                          |
| 500 creating a token (`WeakKeyException` in the log)    | `SQUASH_RESTAPI_JWT_SECRET` under 86 characters; regenerate it (128) and restart Squash                                                                               |
| 412 on create/update                                    | Unknown nature/type code for that project                                                                                                                             |
| A renamed test got a new case                           | It was unpinned; pin it, or retire the old one with `squash:prune` (with the user's confirmation)                                                                     |
| `SquashAnnotationError … file:line`                     | Malformed pin tag or `squash:*` value at that location                                                                                                                |
| UI tests show "HTTP Status 404 – Not Found"             | `BASE_URL` points at 8080, which is Squash, not the app                                                                                                               |
| `N synced test cases are not Gherkin`                   | Created before the Gherkin change; run the printed `squash:prune` command (user's go-ahead), then sync                                                                |
| A test is missing from Squash                           | Its `describe` (or the test) lacks `@squash`, or it is excluded by `grepInvert` (`@quarantine`)                                                                       |

## Where the code lives

```
src/squash/annotations.ts      squash() helper (what specs import)
src/squash/domain/             identity, fields, labels, folder placement
src/squash/application/        ports, synchronizer, selector, publisher
src/squash/infrastructure/     config cascade, HTTP client + retry, repositories, parser
src/squash/reporters/          sync, select and results reporters
src/squash/cli/squash-run.mts  --squash-* flags → selection pass → playwright test
src/squash/composition.ts      the only place components are wired
```

Add behaviour behind a port in `application/ports.ts`, implement it in
`infrastructure/`, wire it in `composition.ts`, and cover it with a
`src/squash/tests/*.unit.spec.ts` using the in-memory fakes in `fakes.ts`.
