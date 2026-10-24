# ADR-0002: Configure, select and target Squash TM runs from one settings cascade

## Status

Proposed

## Date

2026-10-23

## Context

ADR-0001 publishes results into one iteration chosen by environment variables. A
central QA team also needs to:

- govern where synced test cases live (Squash folders);
- run only the tests a Squash folder or test suite holds;
- aim a run at a campaign and iteration chosen by a pipeline, creating them
  when needed.

Settings must come from environment variables, a committed config file, and CLI
flags, with CLI flags taking the highest precedence.

What Squash TM 8.1.1's REST API allows, checked against a live instance:

- Folders, campaigns and campaign folders can be listed and created.
- A test case reports its `path`, with `/` inside names escaped as `\/`.
- A test case **cannot be moved**: PATCHing `parent` returns 200 and changes nothing.
- A test suite's items can only be set **when the suite is created**: PATCHing
  `test_plan` returns 200 and changes nothing.

Playwright 1.64 rejects unknown CLI flags, and runs an explicit list of tests with
`--test-list`.

## Decisions

### 1. One flat schema; precedence defaults < config file < project section < environment < CLI

`config-schema.ts` defines every setting once. Environment names (`SQUASH_TM_` plus
upper snake case) and CLI flags (`--squash-` plus kebab case) are derived from the
keys, so there is no mapping table to keep in step. `SquashConfigLoader` validates
each source separately, so errors name their origin. It rejects unknown
`SQUASH_TM_*` variables, and conflicting targets before anything else. Sources are
injected, which keeps the cascade unit-testable without `process.env`.

The committed file holds shared, reviewed defaults, and the environment adjusts one
pipeline or deployment: the usual twelve-factor order. For teams sharing one file,
its `projects.<id>` section (placement only: `testCaseFolder`, `folderRules`) sits
between the file's top level and the environment. The active `projectId`, from any
source, picks it.

Revised during review. The first version put the environment below the file, as
the original requirement listed. That let a committed value silently beat a
pipeline's env var: a team's `SQUASH_TM_TEST_CASE_FOLDER` was ignored whenever the
file set `testCaseFolder`.

### 2. Authentication is a personal API token, from the environment only

The token is not a setting. In the config file or a CLI flag it is rejected,
because a committed file or a process list would expose it.

Revised during review: Basic auth (username/password) was dropped. Enterprise
instances sit behind SSO and accept only API tokens. A token can also be scoped
to one service account, expires, and can be revoked without changing a password.
A leftover `SQUASH_TM_USERNAME` or `SQUASH_TM_PASSWORD` is an error, so a
pipeline still configured for Basic auth fails loudly instead of running
unauthenticated.

### 3. Tests opt in with `@squash`

Only tests carrying the configured tag (default `@squash`) become Squash test
cases or publish results. The first version scoped by `@acceptance`, which every
test carries. That synced the whole suite, and it tied Squash to a tag that means
something else. An explicit tag says "this test is tracked in Squash" and nothing more.

### 4. Automated tests are synced as Gherkin test cases

The sync creates `scripted-test-case`s (Gherkin), generating the script from the
test. The top `describe` is the Feature and the title is the Scenario. Classic
and Exploratory stay the formats for manual testing, so the format tells QA at a
glance which cases a pipeline runs. BDD (`keyword-test-case`) was rejected for
now: its steps come from Squash's action-word library, and the Playwright tests
do not use that library.

Verified on 8.1.1: a case's `_type` cannot change, and a PATCH with another
`_type` is a 400 (`Invalid patch type (STANDARD) for GHERKIN entity`). Existing
synced Classic cases are therefore reported for `squash:prune` instead of being
converted. Plan items and executions are the same for every format.

Steps come from the test's top-level `Given`/`When`/`Then`/`And`/`But`
`test.step` titles. Only a run sees them, so the results reporter supplies them
(from passing runs only), and the list-only sync keeps the steps already in the
script instead of erasing them. The script is the one place a sync and a run
both write, and that rule stops them overwriting each other.

### 5. `squash:run` is a small CLI in front of Playwright

`src/squash/cli/squash-run.mts` turns `--squash-*` flags into the top layer
(`SQUASH_TM_CLI`, JSON) and passes everything else to `playwright test`. It is plain
Node (type stripping, Node ≥ 22.18): it imports nothing from `src`, and leaves
validation to the loader. It keeps the Squash reporter in any `--reporter` list the
user passes.

### 6. Selection is a Squash query turned into a Playwright `--test-list`

A first `playwright test --list` pass with the select reporter asks Squash which
cases are in the folder or suite, maps them to tests (by pin, else derived key),
and writes the list. The run then uses it. The folder is where the case is in
Squash now, so the QA team's moves in the UI decide what runs. An empty selection
fails rather than running everything.

### 7. Placement at creation only; test suites are read, never edited

Folder rules decide where the sync **creates** a case. Since the API cannot move
one, misplaced synced cases are reported for moving in the UI. Test suites are
curated in Squash, and the tooling only reads them: a suite selects the tests and
receives the results in its own iteration.

### 8. Repositories split by consumer

`TestCaseRepository` (sync, selection) and `ExecutionRepository` (publishing)
replace one repository. Folders of both Squash libraries go through one
`FolderTree` port. The `FolderPathResolver` shares each path's lookup, so
concurrent callers create a folder once.

## Alternatives Considered

### Config file above the environment (the original requirement)

- Pros: a central file cannot be overridden by an ambient env var.
- Cons: a pipeline's explicit env var is silently ignored whenever the file sets
  the same key, which is the opposite of what an operator expects.
- Replaced during review by the twelve-factor order. Central governance comes from
  reviewing the file, not from env vars being unable to override it.

### One config file per team, chosen with `SQUASH_TM_CONFIG`

- Pros: no new structure. Still supported for teams in separate repositories.
- Cons: in a shared repository, N files repeat the shared settings and drift apart.
- Kept as an option. Per-project sections are the default for a shared file.

### YAML config

- Pros: comments, terser.
- Cons: a new dependency for a file of a dozen keys.
- Rejected. JSON is read with the standard library.

### Selecting by mapping folder rules over spec paths, without asking Squash

- Pros: no Squash call before the run.
- Cons: ignores the cases QA moved or curated in the UI, which is the point of
  selecting by Squash folder.
- Rejected.

### Selecting with `--grep` built from titles

- Pros: no file.
- Cons: titles contain regex metacharacters and quotes, and long suites hit
  command-line limits. `--test-list` matches file and title path exactly.
- Rejected.

## Consequences

- A run with `squash:run` costs one extra `--list` pass (about a second here).
- Changing a folder rule never moves existing cases; the sync lists them instead.
- Two pipelines creating the same campaign or iteration at the same moment could
  both create it; the CI blueprint serialises runs per target with `concurrency`.
- Verified live against the local Docker app and Squash:
  - 121 feature tests were synced into `Playwright/Features/*` and published into
    `Releases/2.4 › Local docker run`, and a second run reused that iteration;
  - the folder filter ran exactly the 35 gyms tests;
  - a 3-test suite ran only its tests and published into its iteration.

## References

- [ADR-0001](0001-squash-tm-integration.md): publishing model, identity, resilience
- [docs/squash-tm.md](../squash-tm.md), [examples/squash-tm-publish.yml](../../examples/squash-tm-publish.yml)
