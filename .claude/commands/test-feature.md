---
description: Run tests for a specific feature and report results.
argument-hint: <feature-name>
---

Run all tests for the feature `$ARGUMENTS` and diagnose any failures.

Steps:

1. Verify `tests/features/$ARGUMENTS/` exists — if not, list available features from
   `tests/features/` and stop.
2. Confirm the app is reachable (`curl -s -o /dev/null -w '%{http_code}' $BASE_URL` or
   `http://127.0.0.1:8080` for local minikube). If not, say so instead of reporting
   test failures — a dead port-forward looks like mass test failure.
3. Run `APP_ENV=local npx playwright test -c playwright.ui.config.ts tests/features/$ARGUMENTS/`
   (add `-c playwright.api.config.ts` in a second run if the feature has API specs).
4. On failure, read the failing spec plus the relevant page object, fixture, and seeded
   testdata before diagnosing — distinguish test bugs from app bugs from data drift.

Success criteria / report format: total passed and failed; for each failure the test
title, failing assertion, and a one-line root cause classified as test bug, app bug, or
environment/data issue. Do not mark the task done with failing tests unless the failure
is a genuine app bug — then report it explicitly (and note it in TODO.md).
