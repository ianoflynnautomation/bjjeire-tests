# Agent evals

Golden tasks for the agents in [`.claude/agents/`](../.claude/agents/). Each task plants
a known defect with a known right answer, runs one agent headless against it, and
grades the result deterministically. Run them after editing an agent, a skill, AGENTS.md
or the hooks, and after a Playwright or model bump. A drop in pass rate is a regression
in the agents, not in the app.

```sh
npm run evals:agents -- --self-test --tier all     # free: checks the graders, runs no agent
npm run evals:agents                               # fast tier (about 4 tasks, a few $)
npm run evals:agents -- --tier all --repeat 3      # everything, 3 runs each (pass@3)
npm run evals:agents -- --task healer-app-bug --keep --auth login
```

The app must be reachable (`APP_ENV=docker` or local; see AGENTS.md). Every agent run
is billed usage. Each run is capped by the task's `budgetUsd`. `--auth login` drops
`ANTHROPIC_API_KEY` from the agent's environment so `claude` uses its own login.

## How a task runs

1. The current working tree is copied to a temp dir and committed as a baseline, so
   uncommitted agents, skills and hooks are what is measured. `node_modules` is linked.
2. `setup` plants the defect (`file`/`find`/`replace`, `create`, `delete`) and is committed,
   so the diff afterwards is the agent's work only. `env` adds variables; for example
   `PW_MUTANT` simulates an app bug through the mutation fixture.
3. `claude -p --agent <agent>` runs with a fixed tool allowlist (`ALLOWED_TOOLS` in
   `scripts/agent-evals.mjs`), `acceptEdits`, project settings only (so the hooks apply),
   and the MCP server only when `mcp: true`. Denied tool calls are listed in the result.
4. Checks grade the sandbox. A run passes when every critical check passes.
   `critical: false` checks are reported but do not fail the run.

| Check                    | Passes when                                                  |
| ------------------------ | ------------------------------------------------------------ |
| `changed_only_within`    | every changed file matches one of `allow` (`[]` = read-only) |
| `unchanged`              | no changed file matches `paths`                              |
| `file_matches` / `_not_` | `path` does (not) match `pattern`                            |
| `new_file_matches`       | a changed file matching `glob` contains `pattern`            |
| `section_matches`        | that file's markdown section `heading` contains `pattern`    |
| `diff_lacks`             | no added line matches `pattern`                              |
| `command`                | `run` exits with `expectExit` (default 0) in the sandbox     |
| `command_output_matches` | `run`'s output matches `pattern`                             |
| `output_matches`         | the agent's final reply matches `pattern`                    |

Results: `evals/results/<stamp>.{json,md}` (gitignored), with each task's pass rate set
against the previous run. A passing run's sandbox is deleted; a failing one is kept for
inspection.

## Writing a task

- Plant one defect whose right answer you have checked by hand. Prefer outcome checks
  (test passes, file restored, nothing else touched) over wording checks. Use
  `output_matches` only where the reply is the product (reviewer, app-bug reports).
- Check the forbidden moves too: assertion weakened (`unchanged` on the spec),
  `@quarantine`/`fixme` (`diff_lacks`), and browsers left open.
- Add `selfTest` with a reference answer (`revertSetup: true` and/or `output`), then
  run `--self-test`. The planted state must fail, and the reference must pass.
- Slow tasks (`tier: "slow"`) drive a browser or run the mutation audit.

## Current tasks

| Task                           | Agent                         | Tier | What it proves                                                         |
| ------------------------------ | ----------------------------- | ---- | ---------------------------------------------------------------------- |
| `reviewer-planted-defects`     | playwright-test-reviewer      | fast | Catches bare goto, non-retrying read, page-1 fixture, selector title   |
| `healer-locator-drift`         | playwright-test-healer        | fast | Fixes a drifted test id in constants, not in the spec                  |
| `healer-app-bug`               | playwright-test-healer        | fast | Reports a wrong-county app bug and changes no test                     |
| `api-tester-order-drift`       | playwright-api-tester         | fast | Restores the seeded order the spec defines; keeps the assertion        |
| `mutation-auditor-triage`      | playwright-mutation-auditor   | slow | Classes startDate as a gap and description as equivalent               |
| `generator-shared-search-link` | playwright-test-generator     | slow | Lands a planned scenario in the slice, passing, in suite style         |
| `explorer-discipline`          | playwright-exploratory-tester | slow | Report from the template, nothing else touched, browser closed         |
| `flake-hunter-tight-timeout`   | playwright-flake-hunter       | slow | Finds a 340 ms timeout racing the ~300 ms search debounce (~10% fails) |
| `planner-stores-coverage`      | playwright-test-planner       | slow | Only `specs/` changes; Planned entries with layer, data and G/W/T      |

Every agent has at least one task. The flake task's failure rate depends on the machine
(measured 4/40 at `--workers=4` on 2026-10-30). If the planted state stops flaking, retune
the timeout in its setup until `--repeat-each=20` fails some runs, not all.
