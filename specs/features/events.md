# Acceptance spec: Events

**App spec**: `bjjeire-java/specs/features/events.md`
**Slice**: `tests/features/events/`
**Seeded**: `tests/features/events/seeded.ts`

## UI scenarios

List, search (full and partial), clear search, header count, county filter,
reset county, type filter, empty/error states — titles in
`events.ui.acceptance.spec.ts`.

## API scenarios

Upcoming only; finished excluded; county filter; order by creation date;
type filter including multi-type events; pagination — titles in
`events.api.acceptance.spec.ts`.

## Constraints

- Search is client-side; assert `expectResultCount(1)` after a unique search.
- Finished events must not appear.
- Organiser spelling on the wire is `organiser`.
