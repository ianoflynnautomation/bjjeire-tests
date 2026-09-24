# Acceptance spec: Stores

**App spec**: `bjjeire-java/specs/features/stores.md`
**Slice**: `tests/features/stores/`
**Seeded**: `tests/features/stores/seeded.ts`

## UI scenarios

List (`@smoke`), search (full and partial), empty/error states — titles in
`stores.ui.acceptance.spec.ts`.

## API scenarios

Published details; ordered by name; pagination — titles in
`stores.api.acceptance.spec.ts`.

## Constraints

- No county. Search is client-side; unique search → `expectResultCount(1)`.
