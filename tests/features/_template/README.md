Use this slice as the starting point for every new feature.

Layout:

- `tests/features/<feature>/*.spec.ts` for runnable specs only
- `src/ui/features/<feature>/*.page.ts` for role-first page modules and feature composables
- use `@ui/fixtures` directly unless the feature needs additional local fixture composition
- `src/api/features/<feature>/*.builder.ts` for feature test data builders
- `src/api/features/<feature>/*.api.ts` and `src/api/features/<feature>/*.types.ts` for typed API clients and contracts

For this template specifically:

- keep `_template.ui.acceptance.spec.ts` and `_template.api.acceptance.spec.ts` in `tests/features/_template`
- keep `_template.page.ts` in `src/ui/features/_template`
- keep `_template.builder.ts` in `src/api/v1/features/_template`
