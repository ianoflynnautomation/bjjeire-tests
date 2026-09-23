# Test generation

Plan a flow, drive it, and land the generated Playwright code in this repo's feature slice. Heal a failure the same way. Repo rules and the invocation (`npx playwright cli`) are in [../SKILL.md](../SKILL.md). File layout, titles, seeded data, and healing limits are in `.specify/rules/playwright-rules.md`. The short checklist is `.claude/skills/playwright-generate-test/SKILL.md`.

Do not add `tests/seed.spec.ts` or `specs/*.plan.md`. Living behaviour is `specs/features/`. The spec file is `tests/features/<feature>/<feature>.ui.acceptance.spec.ts`, using that feature's `./fixtures` and page object.

## What the CLI emits

Every action prints the TypeScript it ran:

```sh
npx playwright cli open http://127.0.0.1:8080/gyms
npx playwright cli snapshot
npx playwright cli fill e1 "Alliance"
# await page.getByRole('searchbox', { name: 'Search' }).fill('Alliance');
npx playwright cli click e3
```

That locator is the raw material. The spec calls a page-object method. Snapshot refs never appear in the spec. `generate-locator` prints the expression for a ref:

```sh
npx playwright cli --raw generate-locator e5
npx playwright cli --raw eval "el => el.textContent" e5
npx playwright cli --raw eval "el => el.value" e5
```

Generated code has the action and not the assertion. Add a web-first one: `toBeVisible`, `toHaveText`, `toHaveValue`, `toBeChecked`, or `toMatchAriaSnapshot`. When the locator is the text you want to prove, assert `toBeVisible` on it, or read the text from a `data-testid` / label locator so the proof is not the locator itself. An aria snapshot only needs the lines that matter. Unstable values go in a regular expression.

The app paints after MSAL and the feature-flag fetch. The page object's `gotoRoute` / `gotoAppShell` wait for that. A generated `page.goto` does not. Put navigation on the page object.

Prefer the role locator the CLI printed. If the accessible name is unstable, use the `data-testid` from [element-attributes.md](element-attributes.md).

## Plan

1. Read `specs/features/` for the feature. If the behaviour is not specified, draft the scenario in that living spec, with a `Given / when / then` title, before writing the test.
2. Open the app through the CLI, or attach a paused test ([playwright-tests.md](playwright-tests.md)) when the scenario needs the suite's auth and flag setup. Do not open production.
3. Walk the real controls. Note empty, error, and the seeded row. Search or filter before asserting a card. The environment has more than the acceptance fixtures.
4. Stop the browser, or the background debug process, when the walk is done.

## Generate

Drive one scenario at a time. Snapshot, act, read the printed TypeScript, then write:

- the interaction on the feature page object under `src/ui/pages/<feature>/`
- the assertion in `tests/features/<feature>/<feature>.ui.acceptance.spec.ts`
- tags `@acceptance`, plus `@smoke` only when the path is the critical one

Use the feature's `test` from `./fixtures`. Titles match the living spec. Seeded names come from `seeded.ts` and `partialNameOf`, not from `name.slice` in the spec.

Run that file and fix it until it passes:

```sh
PLAYWRIGHT_HTML_OPEN=never npx playwright test -c playwright.ui.config.ts tests/features/gyms/gyms.ui.acceptance.spec.ts
```

## Heal

Run the failing file. For one failure, restart it with `--debug=cli`, attach, and step to the failing line ([playwright-tests.md](playwright-tests.md)).

```sh
npx playwright cli snapshot
npx playwright cli console
npx playwright cli requests
```

Rehearse the corrected action. Paste the generated locator into the page object, then rerun that file.

- Locator drift, a renamed accessible name, or a tighter assertion: edit the test.
- The user-visible steps changed and the living spec is now wrong: update `specs/features/` in the same change.
- The app does not match the spec: stop and report it. Do not weaken the assertion, add `@quarantine`, or regenerate screenshot baselines. Baselines are `/update-snapshots`, and only when the user asks for a visual update.
- Do not fix a failure with `waitForTimeout`, `networkidle`, or `test.fixme`.
