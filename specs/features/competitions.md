# Acceptance spec: Competitions

**App spec**: `bjjeire-java/specs/features/competitions.md`
**Slice**: `tests/features/competitions/`
**Seeded**: `tests/features/competitions/seeded.ts`

## UI scenarios

List (`@smoke`), search (full and partial), client pagination, empty/error
states — titles in `competitions.ui.acceptance.spec.ts`.

## API scenarios

Published details; finished excluded; ordered by start date; pagination —
titles in `competitions.api.acceptance.spec.ts`.

## Constraints

- No county filter (aggregate has no county).
- Search is client-side; unique search → `expectResultCount(1)`.
- `slug` uniqueness is an API/index concern — do not assert it only in UI.
