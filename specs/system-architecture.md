# Test-system architecture

**Status**: Living
**Product architecture**: `bjjeire-java/specs/system-architecture.md`

## What this repo is

Playwright acceptance suite (API, UI, snapshot, a11y, mobile) for BjjEire.
It is checked out by `bjjeire-ci-templates` from `bjjeire-java` CI. Local
`CI` here is lint + typecheck only.

## Attachment to the app

```
bjjeire-java CI
  → bjjeire-ci-templates (SHA-pinned)
      → this repo @ main (or PR pin)
          → Playwright projects (api, chromium-desktop, …)
              → optional @aplaytest/runner-playwright reporter
                  → .atest/runs + .atest/evidence  (must escape the container)
```

atest's designed footprint is **one reporter line** in
`src/shared/config/playwright.ts`. Flaky scoring and healing run afterwards
on artifacts. JSON ingest (`aplaytest history ingest --playwright-json`) is
the phase-1 path that needs no reporter (see atest doc 14).

## Projects (system of record: Chromium desktop)

See `CLAUDE.md`. Feature flags pinned on. Dark default; light projects are
smoke + a11y only.

## Contracts this suite owns

- Zod wire schemas: `src/api/features/*/*.schemas.ts`
- Seeded DTOs: `tests/testdata/seeded/`
- Page objects and `data-testid` usage (IDs themselves are defined in the SPA)

A Zod change without a matching `bjjeire-java` OpenAPI/DTO change is schema
drift — report it, do not "fix" the app from this repo.

## Environments

`APP_ENV`: `local` | `docker` | `dev` | `staging`. Never production.
Staging only as an explicit task.
