Run tests for a specific feature and report results.

Usage: /test-feature <feature-name>

Steps:
1. Verify `tests/features/$ARGUMENTS/` exists — if not, list available features from `tests/features/`
2. Run `APP_ENV=local npx playwright test -c playwright.ui.config.ts tests/features/$ARGUMENTS/`
3. If any tests fail, read the failing spec and relevant screen/fixture/factory files to diagnose
4. Report: total passed, total failed, and for each failure the test name, assertion, and root cause
5. If all pass, confirm the count
