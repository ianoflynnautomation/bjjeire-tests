---
description: Scaffold a new feature slice following the project template.
argument-hint: <feature-name>
---

Scaffold a complete feature slice named `$ARGUMENTS`.

When to use: a new app feature needs acceptance coverage and no slice exists yet.
When NOT to use: adding tests to an existing feature — extend its existing slice instead.

Steps:

1. Read `tests/features/_template/README.md` and the CLAUDE.md "Feature slice layout"
   section for the canonical structure and naming rules.
2. Create the slice by copying and adapting the template files:
   - `tests/features/_template/_template.ui.acceptance.spec.ts`
     → `tests/features/$ARGUMENTS/$ARGUMENTS.ui.acceptance.spec.ts`
   - `tests/features/_template/_template.api.acceptance.spec.ts`
     → `tests/features/$ARGUMENTS/$ARGUMENTS.api.acceptance.spec.ts` (if API tests apply)
   - `src/ui/pages/_template/_template.page.ts`
     → `src/ui/pages/$ARGUMENTS/$ARGUMENTS.page.ts` (+ `.constants.ts` for test IDs).
     A card-list feature should extend `ListPage` instead — copy `gyms.page.ts`,
     which only supplies `readCardData` and its own filters.
   - `tests/features/_template/fixtures.ts` → `tests/features/$ARGUMENTS/fixtures.ts`
     (extends the core test; exports `<Feature>UiFixtures`, `test`, and an empty
     `<feature>TestConfig`. The feature's specs import `./fixtures` and open with
     `test.use(<feature>TestConfig)`)
   - `src/api/features/stores/` (the simplest slice) → `src/api/features/$ARGUMENTS/`:
     `.api.ts` (one `get` call per endpoint), `.types.ts` (DTOs) and `.schemas.ts`
     (re-export the generated OpenAPI page schema — required by the mock drift guard).
     Regenerate `src/api/generated/zod.gen.ts` when the feature is in the served spec.
3. Replace all `_template` references with `$ARGUMENTS`.
4. Nothing central to register: `tests/features/$ARGUMENTS/fixtures.ts` exports its
   own `test`, and its specs import `./fixtures`. Only add to
   `src/ui/fixtures/base.ts` if the fixture is genuinely cross-cutting (app chrome,
   failure mocks, a global option).
5. If the feature has seeded data, add a DTO-typed module in
   `tests/features/$ARGUMENTS/seeded.ts` (include `SEEDED_*_PARTIAL_NAME` terms via
   `partialNameOf`).
6. Verify: `npm run lint` and `npm run typecheck` must both pass.

Success criteria: lint + typecheck clean, specs import `./fixtures`, spec titles
follow `Given/when/then`, tags follow the two-tier taxonomy (`@acceptance` on every
test, `@smoke` only on the critical happy path). Report the created files and any
template gaps you had to fill manually.
