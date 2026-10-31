# Acceptance spec: Events

**App spec**: `bjjeire-java/specs/features/events.md`
**Slice**: `tests/features/events/`
**Seeded**: `tests/features/events/seeded.ts`

## UI scenarios

List, search (full and partial), clear search, header count, county filter,
reset county, type filter, empty/error states; card details (address, map,
organiser name, organiser and more-information links, session lines) for a weekly open mat and a
multi-day camp; header total across several pages (mocked). Titles are in
`events.ui.acceptance.spec.ts`.

Combined filters and search: several types, All Types, county with type and search, no
search match within a filter, no events for a chosen county (mocked), and search by address,
organiser and county; URL state: shared search link, reload and shared link with county and
type, and Back to the previous filter. Titles are in `events-filters.ui.acceptance.spec.ts`.

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

## Planned

Explored live on 2026-10-31 (`APP_ENV=docker`, `http://localhost:3000`, five seeded events).
UI only; the API suite already owns the county and type rules, finished events and paging.

#### visitor should reach the next page of events

- Layer: UI · Tags: @acceptance · Data: firstPageOfManyEvents, extended to serve later pages · Mocked: yes (multi-page)
- Given/When/Then:
  - Given there are more events than fit on one page
  - When a visitor opens Events
  - And the visitor goes to the next page
  - Then the next events are listed instead of the first ones
- Why: the current paging test stops at the header total and never moves page.

#### visitor should return to the first page when changing a filter on a later page

- Layer: UI · Tags: @acceptance · Data: firstPageOfManyEvents, extended to serve later pages · Mocked: yes (multi-page)
- Given/When/Then:
  - Given there are more events than fit on one page
  - When a visitor opens Events
  - And the visitor goes to the next page
  - And the visitor filters by county
  - Then the first page of that county's events is listed
- Why: stale page state is a likely regression and would strand the visitor on an empty page.

#### visitor should find an event on a later page by searching

- Layer: UI · Tags: @acceptance · Data: firstPageOfManyEvents, extended to serve later pages · Mocked: yes (multi-page)
- Given/When/Then:
  - Given there are more events than fit on one page
  - When a visitor opens Events
  - And the visitor searches for an event that is not on the first page
  - Then only that event is listed
- Why: search reaches beyond the loaded page, and no test proves it.

#### visitor should see the events after retrying a failed load

- Layer: UI · Tags: @acceptance · Data: seeded listing after recovery · Mocked: yes (first response fails)
- Given/When/Then:
  - Given the event service is unavailable
  - When a visitor opens Events
  - Then a server error message is displayed
  - When the service recovers and the visitor retries
  - Then the event list is displayed
- Why: the error tests stop at the message, and retry is the visitor's only way out.

#### visitor should be able to filter and search events using only the keyboard

- Layer: UI · Tags: @acceptance · Data: SEEDED_EVENT_REBEL_COUNTY_SEMINAR (seeded) · Mocked: no
- Given/When/Then:
  - When a visitor opens Events
  - And the visitor chooses Seminar using the keyboard
  - And the visitor searches for the seminar using the keyboard
  - Then only that event is listed
- Why: the a11y sweep checks rules on a static page, not that the controls can be operated.

#### visitor should see event cards fit the screen on a phone

- Layer: UI · Tags: @acceptance, @mobile · Data: SEEDED_EVENT_REBEL_COUNTY_SEMINAR (seeded) · Mocked: no
- Given/When/Then:
  - When a visitor opens Events on a phone
  - Then each event card, including its type badge, fits within the screen
- Why: Events has no `@mobile` scenario. Expected to fail at 360px until finding F2 is fixed.

### Held for a product decision

Do not implement these until the question is answered.

- Per-day price (finding F1): `visitor should see the daily rate of a camp priced per day`.

### Findings

- **F1: a per-day price is multiplied by the number of days but still labelled per day.** Tribes No-Gi Camp is seeded at EUR 55 per day for 3 days and shows `EUR 165.00 per day`. No UI test reads this card, and `eventCardFromDto` copies the same calculation, so a test built on it would pass with the wrong price. Reproduced twice. Expected a daily rate of EUR 55.00, or a total without "per day".
- **F2: the type badge overflows the card at 360px.** The Seminar badge on the Rebel County card ends at 366px, 6px past the screen edge. The page does not scroll sideways. Reproduced twice by measurement; not checked visually.
- **F3 (question): a per-session fee is shown as a weekly total.** Shannonside's mat fee is seeded at EUR 10 per session and shows `Mat fee: EUR 20.00 per week` for two weekly sessions. The sum is consistent, but a visitor attending once may read it as the price. `eventCardFromDto` copies this calculation too.
- **F5 (fixed 2026-10-31): the card showed the organiser's website host instead of their name.** The product owner confirmed it should show `organiser.name`. Fixed in `formatOrganiserDisplay` in `bjjeire-java` (`src/bjjeire-app/src/utils/format-event-details.ts`) and checked on a local rebuild; not yet committed. `expectCardData` now guards the name, so these tests fail against any build without the fix.
- **F4 (question): the server error shows a technical message.** With the filtered request failing, the page shows `Request failed with status code 500`. The suite expects this text (`SERVER_ERROR_MESSAGE` in `src/ui/pages/common/error.page.ts`), so a friendlier message would need that constant changed too.
