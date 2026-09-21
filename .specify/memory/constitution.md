# BjjEire Tests Constitution

Principles for every acceptance spec, page object, and agent run in this
repository. Product architecture and database contracts live in `bjjeire-java`;
this constitution governs how those contracts are proven from the outside.

## Core Principles

### I. Acceptance-level only

This suite proves observable product behaviour against a running app. Unit,
integration, Pact, and OpenAPI tests live in `bjjeire-java`. Do not duplicate
them here. Do not assert DTO field names, CSS selectors, or HTTP status
integers as the story — assert the business outcome.

### II. Spec is the oracle; seeded data is the fixture

Feature behaviour is specified in `specs/features/` here and in
`bjjeire-java/specs/`. Tests consume the seeded DTOs in `tests/features/<feature>/seeded.ts`.
Partial search terms live next to those DTOs (`SEEDED_*_PARTIAL_NAME`), never
`name.slice(...)` in a spec. Environments hold full datasets — search or
filter before asserting a specific card.

### III. Web-first assertions (NON-NEGOTIABLE)

Playwright web-first assertions only. `waitForTimeout()` is a lint error.
Never open an app route with a bare `page.goto` — use `gotoRoute` /
`gotoAppShell` from `@ui/support` so MSAL init and the feature-flag fetch
settle. Feature flags are pinned on via the auto fixture; never assert the
flag API.

### IV. Feature-slice layout

```
tests/features/<feature>/                 # spec files only
src/ui/pages/<feature>/                   # page object class; list pages extend ListPage
tests/features/<feature>/fixtures.ts      # feature's own `test`, extends fixtures/base.ts
src/api/features/<feature>/               # .api.ts + .types.ts + .schemas.ts
tests/features/<feature>/seeded.ts        # DTO-typed seeded fixtures + mocks.ts
```

Page objects are classes taking `page` in the constructor. No page singletons, no
state beyond `page`.
`route.fulfill()` only for empty/error/pagination/snapshot-determinism cases,
and every mocked body is parsed with the feature Zod page schema.

### V. Healing may patch tests, never the product

The `playwright-fix` agentic workflow and the atest heal engine may propose
locator, wait, and assertion repairs in this repository. They must not open
PRs against `bjjeire-java`. If evidence says the app is wrong, file a finding
and stop. Flake analysis is advisory (ADR-0005 in the app repo) — do not
gate delivery on an atest score.

## Additional Constraints

- Every test carries `@acceptance`. `@smoke` is the critical subset on top.
- `@quarantine` is excluded from every run; fix or delete promptly.
- Chromium desktop is the system of record. Firefox, WebKit, and light
  Chromium pay the `@smoke` tax only.
- Screenshot baselines are per-platform (`-darwin.png` + `-linux.png`).
- Never run against production. Staging only as an explicit task.
- Never commit or push from an agent session; leave changes in the working tree
  unless a gh-aw safe-output `create-pull-request` is the configured write path.

## Governance

This constitution supersedes local convenience for tests. Agentic reviews
(`spec-review`, `playwright-fix`) must check it. Amendments land in the same
PR as the convention change, and `CLAUDE.md` is updated in that PR.

**Version**: 1.0.0 | **Ratified**: 2026-09-18 | **Last Amended**: 2026-09-18
