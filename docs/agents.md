# Test agents

Eight Claude Code subagents explore the app, measure the tests, and plan, write, heal and review this suite's tests. Their
definitions live in [`.claude/agents/`](../.claude/agents/); the conventions they
follow are in [`AGENTS.md`](../AGENTS.md).

| Agent                           | Use it to                                                                    | Browser |
| ------------------------------- | ---------------------------------------------------------------------------- | ------- |
| `playwright-test-planner`       | Explore a feature and add scenarios to `specs/features/<feature>.md`         | MCP     |
| `playwright-test-generator`     | Turn one planned UI scenario into a passing spec in the feature slice        | MCP     |
| `playwright-test-healer`        | Reproduce and fix a failing UI test, or report an app bug                    | CLI     |
| `playwright-exploratory-tester` | Chartered bug hunt; findings and candidate scenarios in `specs/exploration/` | CLI     |
| `playwright-mutation-auditor`   | Find what the UI specs would not notice; triaged report in `specs/mutation/` | none    |
| `playwright-api-tester`         | Write or heal `*.api.acceptance.spec.ts`                                     | none    |
| `playwright-flake-hunter`       | Measure a flaky test with `--repeat-each`, find the cause, fix it            | none    |
| `playwright-test-reviewer`      | Review test changes before you commit (read-only)                            | none    |

**Models.** Agents whose output is judgement run on `opus`: the reviewer (a missed
defect ships), the flake-hunter (root cause from noisy evidence) and the explorer
(deciding what is suspicious). Agents that follow a tight procedure run on `sonnet`:
planner, generator, healer, API tester and mutation auditor. Change the `model:` line in
an agent's frontmatter, then compare pass rate and cost with `npm run evals:agents`.

The usual flow is **planner → generator (UI) or api-tester (API) → reviewer**. Run the
healer when a test fails and the flake hunter when it fails only sometimes. Run the
exploratory tester to find what the specs miss; its candidate scenarios go to the planner.

## Before you start

1. **A running app.** The agents run tests and open a browser against it. Either:
   - Docker: the app's compose stack on `http://localhost:3000` (API on `:5003`), or
   - minikube: `kubectl port-forward -n bjjeire-app service/bjj-frontend 8080:80`.

   Never point an agent at production. Staging only as an explicit task.

2. **The target in `.env`** (gitignored), so every agent run picks it up:

   ```sh
   # Docker
   APP_ENV=docker
   BASE_URL=http://localhost:3000
   API_URL=http://localhost:5003
   ACCEPT_INVALID_CERTS=true
   ```

   For minikube use `APP_ENV=local` and `http://127.0.0.1:8080` for both URLs. Check the
   rate limit first (AGENTS.md, "Check the API rate limit").

3. **Dependencies:** `npm ci` and `npx playwright install chromium`.

4. **Approve the MCP server once.** Start Claude Code from the repo root. It reads
   [`.mcp.json`](../.mcp.json) and asks whether to enable the `playwright-test` server;
   say yes. Check with `/mcp`: `playwright-test` should be connected. The planner and
   generator need it; the other four agents do not.

Quick check that everything is wired up:

```sh
PW_AGENT_SEED=true npx playwright test -c playwright.ui.config.ts --project=agent-seed
```

Two passing tests (`seed` and `explore`) mean the app is reachable, sign-in and feature flags work, and
the agents' browser will start in the right state.

## Running an agent

Ask for it in plain language and Claude Code delegates to the matching agent, or name
it to be explicit. `@`-mention it (type `@agent-` and pick one) or say
"use the playwright-test-planner agent to …". `/agents` lists them.

Each agent works in its own context and reports back to the main conversation, which
then tells you what changed. Nothing is committed; review the working tree yourself.

### Plan coverage

```text
@agent-playwright-test-planner plan coverage for the Stores page
```

It reads the existing spec file and tests, explores the page in a browser, and adds
numbered scenario titles plus a `## Planned` section (Given/When/Then, layer, data,
reason) to `specs/features/stores.md`. It edits nothing outside `specs/`. Read the plan
before generating: delete scenarios you don't want.

### Generate a UI test

```text
@agent-playwright-test-generator implement "visitor should see only stores from the chosen county when filtering by county" from specs/features/stores.md
```

Give it **one** scenario title from the spec file. It rehearses every step in the
browser, puts locators on the page object, writes the test into
`tests/features/<feature>/<feature>.ui.acceptance.spec.ts`, and runs it until it passes
five times in a row. If the app disagrees with the spec it stops and reports instead.

### Write or fix API tests

```text
@agent-playwright-api-tester add API tests for the stores county filter
@agent-playwright-api-tester the competitions API spec fails with a schema error
```

No browser. A response that doesn't match the OpenAPI contract is reported as a
contract finding; it never loosens the generated schema.

### Heal a failing test

```text
@agent-playwright-test-healer tests/features/gyms/gyms.ui.acceptance.spec.ts:126 fails on chromium-desktop
@agent-playwright-test-healer heal the failures in test-results/
```

Point it at the test (file and line, or title), the project, and any evidence you have
(error text, `test-results/**/error-context.md`, a CI run). It re-runs just that test,
debugs the paused page with `npx playwright cli`, fixes the cause in the page object or
spec, and proves it with `--repeat-each=5`. If the app is wrong it reports the bug and
leaves the test alone. It never adds `test.fixme`, `test.skip` or `@quarantine`.

### Hunt a flaky test

```text
@agent-playwright-flake-hunter the events retry test is flaky on webkit
```

It runs the test 20 times on one worker and on four, compares passing and failing
traces, and either fixes the cause (proved with 0 failures in 20 runs) or recommends
quarantine with the evidence. Adding `@quarantine` stays your decision.

### Hunt for bugs (exploratory)

```text
@agent-playwright-exploratory-tester explore Events filtering with back/forward and refresh to discover state-sync bugs
@agent-playwright-exploratory-tester bug-hunt the gyms page at 360px
@agent-playwright-exploratory-tester run a session            # it picks the top unexplored risk
```

Give it a charter (_explore target with technique to discover information_), or let it
choose one from the risk catalogue in
[`exploratory-testing`](../.agents/skills/exploratory-testing/SKILL.md). It starts from
`tests/agents/explore.spec.ts` (signed in, flags pinned on, then paused with no timeout),
drives the page with `npx playwright cli` for a fixed budget (default 60 actions), and
after every state runs the oracle probe
([`scripts/oracles.js`](../.agents/skills/exploratory-testing/scripts/oracles.js): axe,
overflow, leaked `undefined`/`NaN`, broken images, dead links, failed/slow/repeated API
calls, list total vs cards) plus `console error`. A suspicion becomes a finding only after
two reproductions from a fresh load. The report lands in
`specs/exploration/<date>-<charter>.md` with severity-ranked findings, product questions
and **candidate scenarios**. Hand those to the planner. It writes nothing else.

You can run the probe yourself in any CLI session:

```sh
npx playwright cli -s=<session> --raw run-code --filename=.agents/skills/exploratory-testing/scripts/oracles.js
```

### Audit test strength (mutation)

```text
@agent-playwright-mutation-auditor mutation audit the events specs
```

It runs `npm run mutation:audit -- --feature <f>`. That command takes a green baseline,
then reruns the feature's UI spec once per mutant: a real list response corrupted one way
in the browser (rows dropped, duplicated or reversed, total off by one, a field rotated
between items or mangled). A mutant that every test survives is behaviour nobody guards.
The agent looks at the rendered card to classify each survivor: **gap** (shown but not
asserted, with the exact reader or mapper change), **owned by API**, **equivalent**
(never shown) or **out of contract**. It then writes `specs/mutation/<date>-<feature>.md`.
It changes no tests. An Events audit (52 mutants) takes about 4 minutes on Docker.

Run the audit yourself and view a mutant live:

```sh
APP_ENV=docker npm run mutation:audit -- --feature gyms --only 'rotate'
PW_MUTANT=bjjevent:mangle:location.address npx playwright test -c playwright.ui.config.ts tests/features/events --project=chromium-desktop
```

### Review before committing

```text
@agent-playwright-test-reviewer review my changes
@agent-playwright-test-reviewer review tests/features/events
```

Read-only. It reviews the uncommitted diff by default and returns findings ranked by
severity, each with `file:line`, a concrete failure scenario, and a short fix.

## Watching the browser

The MCP server runs headless. To watch the planner or generator drive the page, remove
`"--headless"` from the `args` in `.mcp.json` locally (don't commit it) and restart
Claude Code. The healer's CLI session can be watched with `npx playwright cli show`.

## In CI

The [`playwright-fix`](../.github/workflows-aw/playwright-fix.md) agentic workflow runs
the healer (and the API tester) on GitHub. It starts the app's Docker stack on the
runner, re-runs only the failing tests, and opens a `fix(test):` pull request or posts
an app-bug comment.

```sh
gh workflow run playwright-fix.lock.yml \
  -f run_id=<failed bjjeire-java run id> \
  -f artifact_name=<artifact with results.json> \
  -f reproduce=true -f app_ref=main
```

`reproduce=false` skips the stack (several minutes of build) and heals from the evidence
alone. The workflow needs the `ANTHROPIC_API_KEY` repository secret; see
[`.github/workflows-aw/README.md`](../.github/workflows-aw/README.md).

## How the browser agents start

The planner and generator call `planner_setup_page` / `generator_setup_page` with the
seed test [`tests/agents/seed.spec.ts`](../tests/agents/seed.spec.ts) in project
`agent-seed`. It runs through the suite's fixtures, so the agent's page is signed in,
has feature flags pinned on, and has the app shell mounted. The project only exists
when `PW_AGENT_SEED` is set, which `.mcp.json` does for the server, so normal and CI
runs never include it.

The exploratory tester runs `tests/agents/explore.spec.ts` (same project) with
`--debug=cli`, resumes once, and works on the page parked at its `page.pause()`.
`PW_EXPLORE_PATH` chooses the first route.

The healer gets the same state another way: it runs the failing test itself with
`--debug=cli`, so the paused page comes from that test's own fixtures.

## Guardrail hooks

The "Never" lists in the agent files are backed by hooks in
[`.claude/settings.json`](../.claude/settings.json), so an agent cannot talk itself past
them. `guard-edit.mjs` denies the edit and tells the agent why. That covers generated
files, baselines, compiled workflows, auth caches, and adding `@quarantine`, `.fixme(`,
`.only(`, `waitForTimeout(`, `networkidle` or `force: true` to test code. The check
compares counts before and after, so editing a line that already contains one is
allowed. `lint-edited.mjs` runs `eslint --fix` after each `.ts` edit and feeds the
remaining errors back, so lint failures are fixed as the agent goes. To quarantine a
test, edit it yourself; the hooks bind Claude Code only.

## Troubleshooting

| Symptom                                                            | Fix                                                                                                                                                                       |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Planner or generator says it has no `mcp__playwright-test__` tools | The server isn't connected. Run `/mcp`, enable `playwright-test`, or restart Claude Code from the repo root                                                               |
| Seed test fails or the page is empty                               | App not reachable or `.env` points at the wrong URL. `curl -I $BASE_URL` and run the seed check above                                                                     |
| Every feature page redirects to `/about`                           | The feature-flag fetch is being rate limited (429). Raise or disable the limit (AGENTS.md)                                                                                |
| `project "agent-seed" not found`                                   | `PW_AGENT_SEED` isn't set. Only the MCP server sets it; set it yourself for manual seed runs                                                                              |
| Healer CLI: `The browser 'default' is not open`                    | After `attach`, every command needs the session: `npx playwright cli -s=tw-XXXX …`                                                                                        |
| Healer CLI: `pause-at` runs straight to the end                    | That line has no Playwright call (a `test.step` or page-object call). Pause on the `click`/`expect` line inside `src/ui/pages/**`                                         |
| A browser is left open after an agent stops                        | `npx playwright cli list`, then `npx playwright cli close-all`; stop any background `npx playwright test --debug=cli`                                                     |
| Agent output mentions `specs/*.plan.md` or `tests/seed.spec.ts`    | It's following the bundled playwright-cli skill instead of its own file. Remind it that `.claude/agents/<name>.md` and AGENTS.md win; the plan lives in `specs/features/` |

## Diagnostics the agents share

Two skills give the healer, flake-hunter and explorer evidence beyond the DOM:

- **`trace-correlation`**: `npm run trace:correlate` lists each failed attempt from
  `test-results/results.json` with its trace id. From Tempo it adds the attempt's spans
  (errors, slowest calls, Mongo queries). On Docker, where OTel is off, it adds the
  API log lines in the attempt's time window. A backend 5xx or 429 there makes a failure
  an app or environment finding.
- **`devtools`**: CDP scripts for any CLI session. `boot-profile.js` measures the
  document → flags → route chunk → list API chain on desktop and slow 4G, with Web
  Vitals and budgets. `leak-check.js` walks the nav for 5 rounds and samples heap,
  nodes and listeners. `js-coverage.js` shows the unused JS per file.

```sh
npx playwright cli -s=<session> --raw run-code --filename=.agents/skills/devtools/scripts/boot-profile.js
npm run trace:correlate -- --test 'ordered by name' --all
```

## Measuring the agents

[`evals/`](../evals/README.md) holds golden tasks: a planted defect with a known right
answer per agent, run headless in a throwaway copy of the repo and graded without an
LLM. Examples: a drifted test id the healer must fix in constants, an app bug it must
report without touching the test, and a spec with four planted defects the reviewer must
name.

```sh
npm run evals:agents -- --self-test --tier all   # free; validates the graders
npm run evals:agents -- --auth login             # fast tier against your claude login
```

## Updating the agents

The planner, generator and healer started from Playwright's own agents
(`npx playwright init-agents --loop=claude`). After a Playwright upgrade, run that
command in a scratch directory, compare its output with `.claude/agents/`, and carry
over new or renamed tool names only. Don't overwrite these files: they hold this suite's
rules. Keep this page, the table in AGENTS.md, and the agent files in step.
