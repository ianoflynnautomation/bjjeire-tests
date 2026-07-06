# Agent Instructions

Canonical agent instructions for this repository live in **[CLAUDE.md](./CLAUDE.md)** —
stack, commands, conventions, data policy, and guardrails. Read that file first; this
file exists so non-Claude tools pick up the same rules and adds nothing that conflicts
with it.

## Scope

BjjEire Playwright acceptance tests: API, UI, snapshot, a11y, and mobile. Acceptance
level only — unit/integration/security tests live in the app repository.

## Hard rules (duplicated from CLAUDE.md for tools that skip links)

- Never commit or push; leave changes in the working tree.
- Never run tests against production; staging only as an explicit task.
- No `waitForTimeout()`; Playwright web-first assertions only.
- Prefer the existing feature-slice patterns: specs in `tests/features/<feature>/`,
  page objects in `src/ui/pages/<feature>/`, fixtures in `src/ui/fixtures/`,
  API clients in `src/api/features/<feature>/`.
- Keep generated reports and test output out of source changes.
