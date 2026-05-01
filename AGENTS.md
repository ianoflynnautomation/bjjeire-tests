# Agent Instructions

## Repository Scope

This repository contains the BjjEire Playwright acceptance, API, UI, snapshot, and security tests.

## Working Guidelines

- Prefer existing feature-slice patterns under `tests/features/`, `src/ui/features/`, and `src/api/features/`.
- Keep UI work role-first and use Playwright web-first assertions.
- Do not use `waitForTimeout()` in tests.
- Do not run tests against production targets.
- Treat staging/security tests as explicit execution tasks because they can hit external environments.
- Keep generated reports and test output out of source changes unless explicitly requested.
