# Acceptance spec: Stores

**App spec**: `bjjeire-java/specs/features/stores.md`
**Slice**: `tests/features/stores/`
**Seeded**: `tests/features/stores/seeded.ts`

## UI scenarios

List (`@smoke`), search (full and partial, names only), empty/error states — titles in
`stores.ui.acceptance.spec.ts`.

## API scenarios

Published details; ordered by name; pagination; non-numeric paging params
rejected as bad requests; out-of-range paging fails validation — titles in
`stores.api.acceptance.spec.ts`.

## Constraints

- No county. Search matches the name only and is client-side; unique search → `expectResultCount(1)`.
