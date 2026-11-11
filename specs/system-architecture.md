# Test-system architecture

**Status**: Living
**Product architecture**: `bjjeire-java/specs/system-architecture.md`

## What this repo is

Playwright acceptance suite (API, UI, snapshot, a11y, mobile) for BjjEire.
It is checked out by `bjjeire-ci-templates` from `bjjeire-java` CI. Local
`CI` here is lint + typecheck only.

## How a scenario becomes a test

1. An acceptance criterion (`bjjeire-java/specs/stc/`) or an accepted exploration finding becomes a `####` block in `specs/features/<feature>.md`. The block names `Covers` and `Oracle` before anyone writes a test.
2. The generator, the API tester, or a person rehearses that block and adds the test. The numbered title is added in the same change.
3. `npm run spec:check` fails if the title, the `// spec:` header, `Covers`, `Oracle` or the step titles disagree.
4. A reviewer in a fresh context reads the diff against the block. The healer reads the block before deciding whether the app or the test is wrong.
5. Exploration reports and mutation audits stay in their own folders until a block accepts them.

The same path, including the red run and the way evidence comes back, is drawn in [docs/spec-guide.md](../docs/spec-guide.md#end-to-end).

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

See `AGENTS.md`. Feature flags pinned on. Dark default; light projects are
smoke + a11y only.

## Contracts this suite owns

- Zod wire schemas: `src/api/features/*/*.schemas.ts`
- Seeded DTOs: `tests/features/<feature>/seeded.ts` (shared helpers in `tests/features/common/testdata/seeded/`)
- Page objects and `data-testid` usage (IDs themselves are defined in the SPA)

A Zod change without a matching `bjjeire-java` OpenAPI/DTO change is schema
drift — report it, do not "fix" the app from this repo.

## Environments

`APP_ENV`: `local` | `docker` | `dev` | `staging`. Never production.
Staging only as an explicit task.
