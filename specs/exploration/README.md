# Exploration sessions

One report per exploratory session, written by the `playwright-exploratory-tester`
agent (or by hand, from the same template):
`<YYYY-MM-DD>-<charter-slug>.md`. Template and method:
[`.agents/skills/exploratory-testing/`](../../.agents/skills/exploratory-testing/SKILL.md).

These reports are evidence, not the spec. **Candidate scenarios** in a report enter
`specs/features/<feature>.md` only when `playwright-test-planner` (or you) accepts
them. Findings that are app bugs go to the app repo. Screenshots and traces stay in the
gitignored `.playwright-cli/`; a report's steps must reproduce without them.

Before a new session, skim the reports here so the next charter covers new ground.
