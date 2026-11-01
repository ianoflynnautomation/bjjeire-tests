---
description: Plan, write and review acceptance coverage for one feature using the test agents.
argument-hint: <feature-name>
---

Cover the feature `$ARGUMENTS` end to end. You coordinate; the subagents do the work. Run
everything in the dev container. Do not commit.

1. Confirm the app answers and the rate limit is raised (`suite-environments` skill). If
   not, stop and say so: a dead app looks like mass test failure.
2. Run `playwright-test-planner` on `$ARGUMENTS`. Show me the scenarios it added and any
   contradictions with the product spec. Contradictions are findings. Do not encode them.
3. For each new scenario, run `playwright-test-generator` (UI) or `playwright-api-tester`
   (API), one scenario at a time, because they edit the same spec files. If one reports
   that the app disagrees with the spec, record it and move on.
4. Run `playwright-test-reviewer` on the working-tree diff. Send correctness findings back
   to the agent that wrote the test, then review again. After two failed rounds on a
   finding, stop and ask me.
5. Run `playwright-test-healer` only for tests that still fail. An app bug stays a report.

Finish with: scenarios added, test files changed, the passing `--repeat-each` output,
app bugs and contradictions found, and anything unverified. To measure whether the new
tests catch wrong data, I can run `playwright-mutation-auditor` next.
