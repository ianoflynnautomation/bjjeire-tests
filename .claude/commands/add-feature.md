Scaffold a new feature slice following the project template.

Usage: /add-feature <feature-name>

Steps:
1. Read `tests/features/_template/README.md` for the canonical layout
2. Create the feature directory structure:
   - `tests/features/$ARGUMENTS/` — spec files
   - `src/ui/features/$ARGUMENTS/` — screen objects + fixture
   - `src/api/features/$ARGUMENTS/` — factory + typed API client (if API tests needed)
3. Copy and adapt from the `_template` files:
   - `_template.ui.acceptance.spec.ts` -> `$ARGUMENTS.ui.acceptance.spec.ts`
   - `_template.api.acceptance.spec.ts` -> `$ARGUMENTS.api.acceptance.spec.ts`
   - `_template.screen.ts` -> `$ARGUMENTS.screen.ts`
   - `_template.fixture.ts` -> `$ARGUMENTS.fixture.ts`
4. Replace all `_template` references with the feature name
5. Run `npx eslint tests/features/$ARGUMENTS/ src/ui/features/$ARGUMENTS/ --fix` to verify
6. Report the created files
