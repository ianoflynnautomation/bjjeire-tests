Use this slice as the starting point for every new feature.

Layout:

- `tests/features/<feature>/*.spec.ts` for runnable specs only
- `src/features/<feature>/*.screen.ts` for role-first screen objects and feature composables
- `src/features/<feature>/*.fixture.ts` for feature-local fixture composition
- `src/features/<feature>/*.factory.ts` for feature test data builders

For this template specifically:

- keep `_template.ui.spec.ts` and `_template.api.spec.ts` in `tests/features/_template`
- keep `_template.screen.ts`, `_template.fixture.ts`, and `_template.factory.ts` in `src/features/_template`
