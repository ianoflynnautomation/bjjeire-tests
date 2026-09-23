# Running and debugging Playwright tests

Repo rules and the invocation (`npx playwright cli`) are in [../SKILL.md](../SKILL.md). Suite commands and project names are in `CLAUDE.md`. Set `PLAYWRIGHT_HTML_OPEN=never` so a run does not open the HTML report.

```sh
PLAYWRIGHT_HTML_OPEN=never npm run test:smoke
PLAYWRIGHT_HTML_OPEN=never npx playwright test -c playwright.ui.config.ts tests/features/gyms/gyms.ui.acceptance.spec.ts
PLAYWRIGHT_HTML_OPEN=never npx playwright test -c playwright.api.config.ts tests/features/gyms/gyms.api.acceptance.spec.ts
```

Local runs stop at the first failure (`maxFailures: 1`). Pass `--project=chromium-desktop` when you want one browser.

## Attach a paused test

`--debug=cli` pauses at the start, prints a session name such as `tw-abcdef`, and leaves the test process running. Start it in the background, wait until the output contains "Debugging Instructions", then attach. Stop that process when you are finished.

```sh
PLAYWRIGHT_HTML_OPEN=never npx playwright test -c playwright.ui.config.ts tests/features/gyms/gyms.ui.acceptance.spec.ts --debug=cli
npx playwright cli attach tw-abcdef
npx playwright cli resume
npx playwright cli step-over
npx playwright cli pause-at tests/features/gyms/gyms.ui.acceptance.spec.ts:40
```

Each CLI action prints the Playwright TypeScript it ran. That snippet is raw material for a page object or a spec. It is not the spec by itself. How to land it in this repo is [test-generation.md](test-generation.md).

After a fix, stop the debug run and rerun that file. If the failure is the app, stop and report it.
