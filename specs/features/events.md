# Acceptance spec: Events

**App spec**: `bjjeire-java/specs/features/events.md`
**Slice**: `tests/features/events/`
**Seeded**: `tests/features/events/seeded.ts`

## UI scenarios

List, search (full and partial), clear search, header count, county filter,
reset county, type filter, empty/error states; card details (address, map,
organiser and more-information links, session lines) for a weekly open mat and a
multi-day camp; header total across several pages (mocked). Titles are in
`events.ui.acceptance.spec.ts`.

## API scenarios

Upcoming only; finished excluded; county filter; order by creation date;
type filter including multi-type events; pagination; event by id (found, not
found, malformed id); malformed `county` / `types` / `includeInactive` / paging
params rejected as bad requests; out-of-range paging fails validation — titles in
`events.api.acceptance.spec.ts`.

## Constraints

- Search is client-side; assert `expectResultCount(1)` after a unique search.
- Finished events must not appear.
- Organiser spelling on the wire is `organiser`.
- Schedule dates are seeded relative to seed time. Cards are compared on session times
  and titles only, until the seeder makes dates deterministic.
