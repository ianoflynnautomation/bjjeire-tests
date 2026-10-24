# ADR-0001: Integrate Playwright with Squash TM through a reporter and its REST API

## Status

Proposed

## Date

2026-10-23

## Context

Test management lives in Squash TM (local stack: `squash-tm/`, Squash TM 8.1.1 on
PostgreSQL 15). Squash should list the acceptance suite as test cases and show each
run's results as executions, without hand-maintaining either side.

Constraints that shaped the design:

- The suite runs 161 distinct tests across 11 Playwright projects. In CI it runs
  in shards, so one test can run in several processes in a single run.
- A Squash outage must not turn a green suite red by default.
- `AGENTS.md` keeps this repository acceptance-only, Playwright-first. New tooling
  should reuse Playwright's machinery rather than add runtimes (no `tsx`,
  no second test runner).
- The Squash REST API has no idempotency keys. POST always creates.

## Decisions

### 1. Identity: a `@Squash_<id>` pin, else the automated test reference

A test tagged `@Squash_<id>` maps to that Squash test case by id. That survives
renames and moves, and also reaches hand-written cases. Any other test maps
through the case's automated test reference: `<spec>#<describe › title>`. The sync
prints the pin tag for every unpinned test, so pinning is a copy-paste step rather
than a lookup in Squash.

The visible `reference` is a label for people, not identity: the feature folder
plus a number (`EVENTS-012`), assigned once.

Revised during review. The first version stored a `PW-` plus SHA-256 hash in
`reference`. Squash shows the reference before every name in the tree, so the
hash looked like noise. Moving identity to the field Squash provides for it freed
`reference` for labels. Existing `PW-` cases already carried the automated
reference, so they are matched without loss and relabelled on the next sync.

Per-test Squash fields (weight, status, nature, type) come from `squash:*`
annotations. A field a test leaves out stays owned by the Squash UI.

### 2. Tests are discovered with `playwright test --list` and a sync reporter

`npm run squash:sync` is a Playwright reporter run in `--list` mode. Playwright
discovers and transpiles the specs, so titles, tags, annotations and grep filters
resolve exactly as they do in a real run.

### 3. Results are published once, from `merge-reports`, in CI

Shards write blob reports. A final job merges them and runs the results reporter, so
each test case gets one execution per run with the worst outcome across projects,
in one new iteration.

### 4. Opt-in and fail-open

The results reporter loads only when `SQUASH_TM_MODE` is set, like the OpenTelemetry
reporter. Publishing problems are logged and do not change the run status unless
`SQUASH_TM_FAIL_ON_ERROR=true`. Locally, `dry-run` (the default mode) makes no network
calls.

## Alternatives Considered

### Squash test case ids required on every test

- Pros: exact, survives any rename.
- Cons: every new test needs a manual Squash step first. Ids are specific to one
  Squash project.
- Rejected as a requirement, adopted as an option. Unpinned tests still sync with a
  derived key, and the `@Squash_<id>` pin is added where history matters. A pin to a
  missing id fails that test's sync and never creates a case, so a typo is reported
  instead of silently reporting elsewhere.

### A free-form key annotation (`{ type: 'squash', description: 'GYMS-001' }`)

- Pros: survives renames, and is not tied to one Squash project.
- Cons: a second naming scheme to invent and maintain beside Squash's own ids.
- Superseded during review by the id pin, which needs no invented names and is what
  the Squash UI shows.

### Matching by test case name

- Pros: no extra field.
- Cons: names are not unique in Squash, and a rename duplicates the case just as a
  hash does, so it gains nothing.
- Rejected.

### Parsing spec files (regex or TypeScript AST)

- Pros: no Playwright process.
- Cons: re-implements what Playwright already does: `describe` nesting, parameterised
  titles in loops, tags from `describe` options, `testIgnore`/`grepInvert`. Any gap
  makes the sync disagree with what actually runs.
- Rejected.

### Publishing from every shard

- Pros: no merge job.
- Cons: a test that ran on several shards gets several executions, and shards race
  each other to create the iteration. Squash also rejects concurrent test-plan inserts
  into one iteration (see Consequences).
- Rejected.

### Squash's own automation link (Squash AUTOM / SCM-bound automated tests)

- Pros: native Squash feature.
- Cons: needs Squash AUTOM and SCM-server configuration in Squash. Not investigated
  further for this local, single-instance setup.
- Deferred, not rejected. Revisit if the instance gains AUTOM.

## Consequences

- Renaming or moving an unpinned test creates a new Squash test case and orphans the
  old one. A pinned test is renamed in place (verified live).
- Pins are Squash ids, so they hold for one Squash project. Syncing the same suite
  into another project fails every pinned test.
- On a hand-written case a test is pinned to, the sync never overwrites the name or
  description. It owns those only on cases carrying its "Managed by the Playwright
  sync" marker, or whose description is empty. The sync never deletes, so orphans need occasional manual
  cleanup.
- Squash numbers a test-plan item `max(order) + 1` inside the insert, so concurrent
  adds to one iteration fail with HTTP 500 (`uc_item_test_plan_list_order`). Found by
  running against the live instance. Items are therefore added serially, and only
  execution writes run concurrently.
- POST has no idempotency guarantee, so it is retried only when Squash provably did
  nothing (429, 503, refused connection). A timed-out create has an unknown outcome:
  a test case is adopted by the next sync via its automated test reference, and an execution may be
  left as a stray `READY` execution.
- Squash's name and description fields are owned by the sync. Steps, requirement
  links and custom fields are not touched.
- The integration is ~1,400 lines in `src/squash/` with its own unit tests
  (`npm run test:squash`), the one exception to this repository being acceptance-only.

## References

- [docs/squash-tm.md](../squash-tm.md): usage, configuration, architecture
- [examples/squash-tm-publish.yml](../../examples/squash-tm-publish.yml): CI wiring
