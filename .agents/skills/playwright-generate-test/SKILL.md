---
name: playwright-generate-test
description: Turn one planned UI scenario from specs/features/<feature>.md into a passing Playwright spec in the feature slice, rehearsing it in a live browser first. Use when asked to turn a user flow or planned scenario into a test. Harness-neutral entry point to the playwright-test-generator agent.
---

# Generate a test from a planned scenario

The procedure is the generator agent: follow
[`.claude/agents/playwright-test-generator.md`](../../../.claude/agents/playwright-test-generator.md).
In Claude Code, delegate to that agent instead of running these steps inline. API
scenarios follow [`.claude/agents/playwright-api-tester.md`](../../../.claude/agents/playwright-api-tester.md).

Harnesses without the `playwright-test` MCP server rehearse with `npx playwright cli`
(CLI codegen and `--debug=cli` attach are in
`.agents/skills/playwright-cli/references/test-generation.md`). Where that reference
disagrees with the agent file (seed paths, `// spec:` headers, `test.fixme`), the agent
file wins. Never paste snapshot refs into a spec.
