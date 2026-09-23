---
name: playwright-generate-test
description: Generate a Playwright acceptance spec from a scenario by driving the live page with Playwright MCP or the pinned CLI first. Use when asked to turn a user flow into a test.
---

# Test generation

Follow `.claude/skills/playwright-cli/SKILL.md` and `.specify/rules/playwright-rules.md`. CLI codegen, `--debug=cli` attach, and healing are in `.claude/skills/playwright-cli/references/test-generation.md`.

1. If the user gives no scenario, ask for one. Do not write a spec from the scenario text alone.
2. Drive every step with MCP or the CLI. Snapshot before each action.
3. After the flow succeeds, add the spec under `tests/features/<feature>/` using that feature's `./fixtures` and page object. Titles: `Given <context>, when <action>, then <business outcome>`, matching `specs/features/` when a living spec exists. Locators go through the page object. On the CLI, `generate-locator` is the bridge from a ref. Never paste snapshot refs into a spec.
4. Run that spec and fix it until it passes. If the app is wrong, stop and report it. Do not weaken the assertion.
