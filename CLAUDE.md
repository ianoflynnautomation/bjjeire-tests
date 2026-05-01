# CLAUDE.md

## Project overview

Playwright + TypeScript acceptance test suite for the BjjEire web application. Tests run against local, Docker, testcontainer, and staging environments.

## Stack

- **Runtime**: Node 22, TypeScript 5.7, CommonJS (`"type": "commonjs"`)
- **Test framework**: `@playwright/test` ^1.59.1
- **Validation**: Zod v4 (`zod` ^4.3.6)
- **Lint**: ESLint v9 flat config + Prettier 3
- **Git hooks**: Husky v9 + lint-staged v15

## Quick commands

```sh
npm run test:smoke        # Smoke suite (@smoke tag)
npm run test:api          # API-only tests
npm run test:ui           # UI tests (all projects)
npm run test:security     # Security regression (requires staging)
npm run lint              # ESLint
npm run typecheck         # tsc --noEmit
```

## TypeScript rules

- **Strict mode** is on: `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitReturns`
- Use `type` imports: `import type { Foo } from '...'` or `import { type Foo } from '...'` (enforced by `consistent-type-imports`)
- No `any` — `@typescript-eslint/no-explicit-any` is an error
- No floating promises — `@typescript-eslint/no-floating-promises` is an error
- Path aliases: `@shared/*`, `@api/*`, `@ui/*`, `@fixtures/*` (defined in `tsconfig.json`)
- When dealing with `exactOptionalPropertyTypes`, use conditional objects (`input.x ? { x: input.x } : {}`) instead of spreading `undefined`

## Test conventions

### File naming

- UI tests: `<feature>.ui.<tag>.spec.ts` (e.g., `gyms.ui.acceptance.spec.ts`)
- API tests: `<feature>.api.<tag>.spec.ts`
- Security tests: `<name>.security.spec.ts`

### Feature slice layout

```
tests/features/<feature>/          # Spec files only
src/ui/features/<feature>/         # Screen objects (.screen.ts) + fixtures (.fixture.ts)
src/api/features/<feature>/        # Factories (.factory.ts) + typed clients (.api.ts, .types.ts)
```

See `tests/features/_template/README.md` for the canonical template.

### Tags

Use test tags in the title: `@smoke`, `@acceptance`, `@mobile`, `@desktop`, `@security`. Tags drive `--grep` filtering in npm scripts.

### Assertions

- Prefer Playwright web-first assertions (`expect(locator).toBeVisible()`) over manual waits
- Never use `waitForTimeout()` — eslint rule `playwright/no-wait-for-timeout` is an error
- Use `locator.waitFor()` for element state checks, not polling loops

### Page objects

- Extend `BasePage` from `src/ui/pages/base-page.ts` (legacy) or use role-first `.screen.ts` composables (preferred for new features)
- Feature fixtures go in `src/ui/features/<feature>/<feature>.fixture.ts` using `test.extend<Fixtures>()`

## Linting and formatting

- Run `npm run lint` before committing — Husky pre-commit hook runs `lint-staged`
- `no-console` is a warning in source code, off in test files
- `import/no-cycle` is enforced — no circular imports
- Prettier handles all formatting (enforced via `eslint-plugin-prettier`)

## Environment

- `.env` file (gitignored) provides `BASE_URL`, `API_URL`, etc.
- `APP_ENV` selects the profile: `local`, `docker`, `testcontainers`, `staging`

## CI

- `ci.yml` runs lint + typecheck on every push/PR to main
- `playwright-security.yml` is a reusable workflow for security regression against staging
- `playwright-docker.yml` is a reusable workflow for tests against docker environment
- `playwright-terraform.yml` is a reusable workflow for tests against provisioned terraform environment
