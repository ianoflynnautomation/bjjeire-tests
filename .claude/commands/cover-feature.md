---
description: Plan acceptance coverage for one feature, then write and review the scenarios you accept.
argument-hint: <feature-name>
---

Coordinate acceptance coverage for `$ARGUMENTS`. Spawn one agent, wait for it
to finish, then spawn the next. Do not plan, write, or review the tests
yourself. Do not commit or push.

The loop is `docs/spec-guide.md` under "End to end". How to spawn an agent is
`docs/agents.md`. The procedure for each agent is `.claude/agents/<name>.md`.

## Check first

Stop at the first failed check. Say what failed. Do not start the planner.

1. `$ARGUMENTS` is one feature slug, the same word as
   `specs/features/<feature>.md` (for example `gyms`). If it is missing, or it
   is more than one word, stop and ask for the slug. If that spec and
   `tests/features/$ARGUMENTS/` are both missing, stop and point at
   `/add-feature`. If only the spec is missing, the planner creates it from
   `specs/templates/feature-spec.md`.
2. Work at the repo root inside the dev container (`.devcontainer/`). If this
   session is on the Mac host, stop. Do not install browsers or npm packages
   on the Mac.
3. The app must answer, and the API rate limit must be raised. Follow the
   "Local runs" check in `.agents/skills/suite-environments/SKILL.md`. Then run
   the seed check from `docs/agents.md`:

   ```sh
   PW_AGENT_SEED=true npx playwright test -c playwright.ui.config.ts --project=agent-seed
   ```

   `seed` and `explore` must both pass. If the app does not answer, either test
   fails, or `/featureflag` would return 429, stop. A dead app or a 429 looks
   like a mass test failure.

4. The planner and the generator need the `playwright-test` MCP server
   connected in this session. If it is not, stop.

## Steps

1. Spawn `playwright-test-planner` on `$ARGUMENTS`. It adds `####` blocks under
   `## Planned` in `specs/features/$ARGUMENTS.md`. It does not add a numbered
   title, and it does not write a test.
2. Stop and show the plan. List each new `####` title, anything the planner
   placed in Held or Rejected, and any contradiction with the product spec. A
   contradiction is a finding: leave it out of the plan. Continue only with the
   blocks named in the reply. "Continue with all of them" means every block
   from this run, and no older `## Planned` block.
3. Implement one accepted block at a time. Wait for that agent to finish
   before you spawn the next. Two writers edit the same spec and the same test
   file.
   - `Test design` (or an older block's `Layer`) starts with `UI`: spawn
     `playwright-test-generator`.
   - It starts with `API`: spawn `playwright-api-tester`.
   - It names neither: ask. Do not guess the layer.

   Pass the exact `####` title and `specs/features/$ARGUMENTS.md`. The writer
   owns the red run, `spec:check`, and `--repeat-each=5`. If it reports that
   the app disagrees with the block, record expected and observed, leave the
   test as the writer left it, and move to the next block. Do not change the
   block to match the app, and do not send that block to the healer.

4. Spawn `playwright-test-reviewer` on the files this run changed. It is
   read-only. Send its correctness findings back to the writer that owns those
   files, then spawn a new reviewer on the same files. A correctness finding is
   a test that would still pass if the behaviour broke, a step that does not
   match the block, an assertion copied from the app, or a determinism break.
   Review at most twice. If the second review still reports a finding, stop
   and ask. Do not start a third review.
5. Spawn `playwright-test-healer` only for a UI test that fails on every run
   and was not already reported as an app disagreement. Send an API failure
   back to `playwright-api-tester`. If a test fails only sometimes, stop and
   ask before spawning `playwright-flake-hunter`. An app bug stays a report.
   Do not weaken the test to make it pass.

Do not run `playwright-mutation-auditor` or `playwright-exploratory-tester`
as part of this command. Do not add `@quarantine`, `test.fixme`, `test.skip`,
or `test.only`.

## Report

When the run stops, include each of these. If a writer did not report the
repeat run, write "unverified". Do not invent a pass.

- Scenarios added, by `####` title.
- Blocks held back, and why.
- Test files changed.
- For each implemented scenario, the writer's `--repeat-each=5` result.
- App bugs and spec contradictions, each with expected and observed.
- Review findings still open.
- Checks or agents that did not run.

To measure whether the new tests catch wrong data, ask for
`playwright-mutation-auditor` in a later turn.
