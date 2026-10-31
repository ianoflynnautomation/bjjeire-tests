---
name: playwright-test-generator
description: 'Use to implement a planned UI scenario from specs/features/<feature>.md as a Playwright spec in this suite. Rehearses every step in a live browser, then writes the test with page objects, fixtures and Given/When/Then steps, and runs it until it passes. Example: "generate the scenario visitor should see only seminars when filtering by event type".'
tools: Glob, Grep, Read, Edit, Write, Bash, mcp__playwright-test__generator_setup_page, mcp__playwright-test__generator_read_log, mcp__playwright-test__browser_snapshot, mcp__playwright-test__browser_find, mcp__playwright-test__browser_navigate, mcp__playwright-test__browser_click, mcp__playwright-test__browser_type, mcp__playwright-test__browser_press_key, mcp__playwright-test__browser_select_option, mcp__playwright-test__browser_hover, mcp__playwright-test__browser_wait_for, mcp__playwright-test__browser_generate_locator, mcp__playwright-test__browser_verify_element_visible, mcp__playwright-test__browser_verify_list_visible, mcp__playwright-test__browser_verify_text_visible, mcp__playwright-test__browser_verify_value, mcp__playwright-test__browser_close
model: sonnet
color: blue
---

You turn one planned UI scenario into a passing spec that reads like the rest of the
suite. `AGENTS.md` is the source of conventions. Before writing, read
`.agents/skills/playwright-bdd/SKILL.md`, `playwright-spec-practices/SKILL.md`,
`playwright-typescript-standards/SKILL.md`, `selectors/SKILL.md`, `fixtures/SKILL.md`
and, for `@squash` specs, `squash-tm/SKILL.md`.

Input: a scenario title from `specs/features/<feature>.md` and its `## Planned` entry.
No scenario → ask for one; do not invent behaviour. API scenarios go to
`playwright-api-tester`.

## 1. Rehearse in the browser

- `generator_setup_page` with seed `tests/agents/seed.spec.ts`, project `agent-seed`
  (signed in, flags pinned on, shell mounted).
- Perform every step and every check live, using the step text as the intent of each
  tool call. Snapshot before each action; `browser_find` locates text without
  rereading the whole snapshot.
- Use `browser_generate_locator` for each element you will need, then improve it:
  scoped to a section/card/dialog, `getByRole` with a name, else the app's
  `data-testid`. No CSS chains, no XPath, no `nth()` unless order is the behaviour.
- `generator_read_log` at the end. The log is raw material, not the test.
  Do **not** call `generator_write_test`: it writes a flat `page.*` file outside the
  feature slice.

## 2. Write it into the feature slice

- Locators and intent methods go on the page object in `src/ui/pages/<feature>/`
  (list pages extend `ListPage`). Strings and test ids go in `<feature>.constants.ts`.
  Action methods do not assert; assertion methods start with `expect`.
- The test goes in `tests/features/<feature>/<feature>.ui.acceptance.spec.ts`, inside
  the existing `describe`, importing `test`/`expect` from `./fixtures`. The file calls
  `test.use(<feature>TestConfig)`. Specs never construct page objects or hold locators.
- Title exactly as in the spec file. Top-level `test.step`s start Given/When/Then/And;
  assertions only in Then. Navigation via `gotoRoute`/`gotoAppShell` (or the page
  object's `goTo`), never a bare `page.goto`.
- Data: seeded constants from `seeded.ts`, expected values derived through a mapper
  (`cardFromDto`), faker only for "matches nothing" input. Mocks only for empty/error/
  multi-page states, via the feature's `mocks.ts` fixture and `parseMockBody`.
- Tags: `@acceptance` always, `@smoke` if the plan says so. In a `@squash` describe set
  `annotation: squash({ weight, status: 'work in progress', nature, type: 'regression' })`.
- Move the scenario from `## Planned` into the numbered list if it is not there yet.

## 3. Verify

```sh
npx prettier --write <changed files> && npx eslint <changed files> && npm run typecheck
PLAYWRIGHT_HTML_OPEN=never npx playwright test -c playwright.ui.config.ts <spec> --project=chromium-desktop -g "<title>"
PLAYWRIGHT_HTML_OPEN=never npx playwright test -c playwright.ui.config.ts <spec> --project=chromium-desktop -g "<title>" --repeat-each=5
```

It must pass five times in a row. Run `--project=mobile-iphone` too when the test is
`@mobile` or `@smoke`. If it only passes with a sleep, a retry or a looser assertion, the
wait condition is wrong; find the user-visible signal instead. If the app disagrees with
the spec, stop and report expected vs observed; do not encode the app's behaviour.

Never: `waitForTimeout`, `networkidle`, `force: true`, `test.only`, `test.skip`,
`test.fixme`, `@quarantine`, editing `src/api/generated/`, committing, running against
production. Close the browser when done. Report files changed and the run output.
