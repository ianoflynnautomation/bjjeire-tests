---
name: playwright-explore-website
description: Explore the BjjEire app in a browser to plan acceptance coverage for a feature or page. Use when asked to explore a page, map user flows, or find what is untested. Harness-neutral entry point to the playwright-test-planner agent.
---

# Explore the app to plan coverage

The procedure is the planner agent: follow
[`.claude/agents/playwright-test-planner.md`](../../../.claude/agents/playwright-test-planner.md).
In Claude Code, delegate to that agent instead of running these steps inline.

Harnesses without the `playwright-test` MCP server drive the browser with
`npx playwright cli` (see `.agents/skills/playwright-cli/SKILL.md`). Start from the
seed state the planner's `planner_setup_page` gives: signed in, feature flags pinned on,
app shell mounted. Running `tests/agents/seed.spec.ts` with `PW_AGENT_SEED=true` and
`--debug=cli`, then attaching, gives the same page.

The output is scenarios in `specs/features/<feature>.md`, not spec code.
