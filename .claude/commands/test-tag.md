Run tests matching a specific tag and report results.

Usage: /test-tag <tag> (e.g., @smoke, @acceptance, @security, @mcp)

Steps:

1. Determine the correct config file based on the tag:
   - `@security` -> `playwright.security.config.ts` with `APP_ENV=local`
   - All others -> `playwright.ui.config.ts` with `APP_ENV=local`
2. Run `APP_ENV=local npx playwright test -c <config> --grep "$ARGUMENTS"`
3. Report: total passed, total failed, and first error for each failure
