Use this slice as the starting point for every new feature.

Layout:

- `tests/features/<feature>/*.spec.ts` for runnable specs only
- `src/ui/features/<feature>/*.screen.ts` for role-first screen objects and feature composables
- `src/ui/features/<feature>/*.fixture.ts` for feature-local fixture composition
- `src/api/features/<feature>/*.factory.ts` for feature test data builders
- `src/api/features/<feature>/*.api.ts` and `src/api/features/<feature>/*.types.ts` for typed API clients and contracts

For this template specifically:

- keep `_template.ui.acceptance.spec.ts` and `_template.api.acceptance.spec.ts` in `tests/features/_template`
- keep `_template.screen.ts` and `_template.fixture.ts` in `src/ui/features/_template`
- keep `_template.factory.ts` in `src/api/v1/features/_template`
