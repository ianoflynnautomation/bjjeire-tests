---
description: Run tests matching a specific tag and report results.
argument-hint: <tag>
---

Run all tests matching the tag `$ARGUMENTS`.

Valid tags: `@smoke` (critical subset), `@acceptance` (full suite), `@snapshot`,
`@a11y`, `@mobile`, `@desktop`, or any feature tag (`@gyms`, `@events`, …).

Steps:

1. Run `APP_ENV=local npx playwright test -c playwright.ui.config.ts --grep "$ARGUMENTS"`.
   - For `@acceptance` or feature tags with API specs, also run with
     `-c playwright.api.config.ts`.
   - `@mobile` tests only execute on the `mobile-iphone`/`mobile-galaxy` projects;
     `@snapshot` and `@a11y` run on their dedicated projects — no extra flags needed.
2. Report: total passed, total failed, and the first error for each failure.

If zero tests match, list the tags actually present in the suite instead of reporting
success.
