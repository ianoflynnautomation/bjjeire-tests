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
     → `src/ui/pages/$ARGUMENTS/$ARGUMENTS.page.ts` (+ `.constants.ts` for test IDs)
   - `src/ui/fixtures/_template.fixture.ts` → `src/ui/fixtures/$ARGUMENTS.fixture.ts`
   - `src/api/features/_template/_template.builder.ts`
     → `src/api/features/$ARGUMENTS/$ARGUMENTS.builder.ts`, plus `.api.ts`, `.types.ts`,
     and `.schemas.ts` (Zod page schema — required by the mock drift guard)
3. Replace all `_template` references with `$ARGUMENTS`.
4. Register the new fixture in `src/ui/fixtures/index.ts` (type + `test.extend` entry) —
   the slice is invisible to specs without this.
5. If the feature has seeded data, add a DTO-typed module in
   `tests/testdata/seeded/$ARGUMENTS.ts` (include `SEEDED_*_PARTIAL_NAME` terms via
   `partialNameOf`).
6. Verify: `npm run lint` and `npm run typecheck` must both pass.

Success criteria: lint + typecheck clean, fixture registered in `index.ts`, spec titles
follow `Given/when/then`, tags follow the two-tier taxonomy (`@acceptance` on every
test, `@smoke` only on the critical happy path). Report the created files and any
template gaps you had to fill manually.
