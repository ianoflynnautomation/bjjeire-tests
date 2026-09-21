# Acceptance Feature Spec: [FEATURE NAME]

**Created**: [DATE]
**Status**: Draft
**App spec**: `bjjeire-java/specs/features/<feature>.md`
**Input**: User description: "$ARGUMENTS"

This spec is the _external_ contract: what a visitor can observe. Product
internals live in the app repo spec. Do not contradict it.

## User Scenarios _(mandatory)_

### User Story 1 - [Title] (Priority: P1)

**Acceptance Scenarios** (titles MUST match Playwright test titles):

1. **Given** [context], **when** [action], **then** [business outcome]

### Edge Cases

- Empty list
- No search match
- Invalid id
- Feature flag off (redirects to `/about` — do not assert the flag API)

## Seeded fixtures

- DTO: `tests/features/<feature>/seeded.ts`
- Partial name: `SEEDED_*_PARTIAL_NAME`
- Search is client-side on the loaded page: after `searchFor`, assert
  `expectResultCount(1)` for uniqueness.

## Slice checklist

- [ ] `tests/features/<feature>/<feature>.ui.acceptance.spec.ts`
- [ ] `tests/features/<feature>/<feature>.api.acceptance.spec.ts`
- [ ] Page objects under `src/ui/pages/<feature>/`
- [ ] Feature `test` + `<feature>TestConfig` in `tests/features/<feature>/fixtures.ts`; specs import `./fixtures` and `test.use(<feature>TestConfig)`
- [ ] Zod page schema in `src/api/features/<feature>/`

## Out of scope

- Unit/integration tests (app repo)
- Production runs
- Weakening assertions to match an application bug
