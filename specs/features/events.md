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
- Dates show in Irish time wherever the visitor is: `visitor should see an event's date in Irish time wherever they are` in `events-dates.ui.acceptance.spec.ts` (mocked, so the date is fixed).

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

### Map view

From User Story 4 and AC-EVT-007 to AC-EVT-017 in `bjjeire-java/specs/`. Written from the
app spec and its tests. Implemented in `events-map.ui.acceptance.spec.ts` unless a scenario says otherwise; the per-scenario notes below say what was explored live. UI only:
the app's unit and Pact tests own the `EventsMap` flag on the wire, and the suite does not
assert the flag API. The gym map (`gyms.md`, scenarios 21–30) is the model: same setup,
same tile rules.

**Setup for all of them**

- New file `events-map.ui.acceptance.spec.ts`, with
  `test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, EventsMap: true } })` at file
  scope. The map-off scenario needs `EventsMap: false` in its own `test.describe` or file.
  Add `EventsMap` to `FeatureFlagOverrides` as optional, like `GymsMap`.
- Fulfil `**/tile.openstreetmap.org/**` with a blank image, except in the tile-failure
  scenario, which aborts it. Never send live tile traffic and never compare tile images. The
  MCP browser cannot block requests, so do not open the map in it.
- Test IDs come from `bjjeire-java/src/bjjeire-app/src/constants/eventDataTestIds.ts`
  (`EventMapTestIds`, `EventViewSwitchTestIds`). A pin is
  `getByRole('button', { name: <venue> })`, or `<venue>, <n> events` when it holds several.
- **Explored 2026-11-05 (docker stack via `http://127.0.0.1:8080`, flags pinned on by the seed):** confirmed. The List/Map view switch is shown and `EventsMap` is honoured (Map click goes to `?view=map`). The Dublin No-Gi Seminar is in the running data: the list shows 6 events, with the seminar on 17 November 2026 after the open mat on 10 November. The map has 5 pins named `Leinster Grappling HQ, 2 events`, `Rebel County BJJ Academy`, `Tribes Grappling Centre`, `Atlantic Coast Grappling Hall` and `Shannonside Grappling Club`. Opening the shared pin lists both events, open mat first, with the seminar's own address (`Rear Hall, Mat Lane, Dublin 8, Ireland`) shown in its entry because it differs, as FR-009 says. The map's `EventsMap` default is off in `application.yml` (`FEATURE_EVENTS_MAP`), so a non-fixture environment needs it on. Pin lat/lng in the directions link matches the card (`query=53.3382,-6.2889`). See F7 for a `createdAt` tie.
- **Explored 2026-11-05, per scenario** (tiles were live in the MCP browser, so only the switch, pins, shared popup and an empty search were opened; the rest are unexplored):
  - Shared link with Cork and seminars: not opened; `?view=map` is the URL form and the pin names above apply.
  - Back after switching to the map: not opened.
  - County filter on the map: not opened; the filters are present on the map view.
  - Type filter on the map: not opened.
  - Search on the map: partly confirmed (an unmatched search keeps `?view=map&q=...`); a matching search was not opened.
  - Real locations: not measured; pins exist for all five venues.
  - Event details and links: confirmed for the shared pin (name, type, date, venue, address, directions and More Information links).
  - Every event at a venue: confirmed. Pin is `Leinster Grappling HQ, 2 events`, open mat then seminar, venue shown once.
  - Events map a11y: not run.
  - Tile failure: not run (the MCP browser cannot block requests).
  - Map off: not run (the seed pins flags on).
  - No map download on the list: not run.
- **Data gap:** `seeded.ts` needs `SEEDED_EVENT_DUBLIN_NO_GI_SEMINAR`, mirroring the new
  `bjjeire-java/seeder/data-test/bjj-events/dublin-no-gi-seminar.json`. It shares Leinster
  Grappling HQ's coordinates with `SEEDED_EVENT_LEINSTER_OPEN_MAT`. Its address, name and
  organiser deliberately avoid the existing single-match search terms, so those tests still
  find exactly one event. `SEEDED_EVENT_FINISHED_WINTER_SOLSTICE` is at the same venue but
  finished, so it never appears on the map.

#### visitor should see the map with the shared filters when opening a shared map link

- Layer: UI · Tags: @acceptance · Data: SEEDED_EVENT_REBEL_COUNTY_SEMINAR (seeded) · Mocked: tiles only
- Given/When/Then:
  - When a visitor opens a shared link to the map for Cork and seminars
  - Then the map is displayed and marked as the current view
  - And Cork and Seminar are chosen
  - And the Cork seminar has a pin and the Dublin events do not
- Why: AC-EVT-007, SC-004. The app's page tests prove this against mocks only.

#### visitor should return to the event list with Back after switching to the map

- Layer: UI · Tags: @acceptance · Data: seeded · Mocked: tiles only
- Given/When/Then:
  - Given a visitor is on the event list for Dublin
  - When the visitor switches to the map
  - And the visitor goes back
  - Then the event list for Dublin is displayed
- Why: AC-EVT-007. Start on the list: a directly opened link has no earlier page.

#### visitor should see pins only for the chosen county when filtering the map by county

- Layer: UI · Tags: @acceptance · Data: SEEDED_EVENT_REBEL_COUNTY_SEMINAR, SEEDED_EVENT_LEINSTER_OPEN_MAT (seeded) · Mocked: tiles only
- Given/When/Then:
  - Given a visitor is on the map
  - When the visitor filters by Cork
  - Then the Cork seminar has a pin and Leinster Grappling HQ does not
  - And the map has moved closer to Cork
- Why: AC-EVT-008, SC-003. Assert named pins, not totals.

#### visitor should see pins only for the chosen type when filtering the map by type

- Layer: UI · Tags: @acceptance · Data: SEEDED_EVENT_TRIBES_NO_GI_CAMP, SEEDED_EVENT_REBEL_COUNTY_SEMINAR (seeded) · Mocked: tiles only
- Given/When/Then:
  - Given a visitor is on the map
  - When the visitor filters by Camp
  - Then the Galway camp has a pin and the Cork seminar does not
- Why: AC-EVT-008. Type is a server filter, and only this proves it reaches the map on real data.

#### visitor should see only the searched event's pin when searching on the map

- Layer: UI · Tags: @acceptance · Data: SEEDED_EVENT_REBEL_COUNTY_SEMINAR (seeded) · Mocked: tiles only
- Given/When/Then:
  - Given a visitor is on the map
  - When the visitor searches for an event by name
  - Then only that event has a pin
  - And the map has zoomed to it
- Why: AC-EVT-008, AC-EVT-012. Exactly one pin; check the tile zoom level, as the gym scenario does.

#### visitor should see events in their real locations on the map

- Layer: UI · Tags: @acceptance · Data: SEEDED_EVENT_LEINSTER_OPEN_MAT, SEEDED_EVENT_REBEL_COUNTY_SEMINAR (seeded) · Mocked: tiles only
- Given/When/Then:
  - When a visitor opens the map of all events
  - Then the Dublin venue is north-east of the Cork venue, at the right angle
- Why: AC-EVT-009, SC-003. Dublin is right of and above Cork, and vertical distance divided by horizontal distance is between 0.95 and 1.2. The true geography gives about 1.09; swapped latitude and longitude gives about 1.53 with the same directions.

#### visitor should see an event's details and links when opening its pin

- Layer: UI · Tags: @acceptance · Data: SEEDED_EVENT_REBEL_COUNTY_SEMINAR (seeded) · Mocked: tiles only
- Given/When/Then:
  - Given a visitor is on the map
  - When the visitor opens an event's pin
  - Then the venue and address are shown
  - And the event's name, type and dates are shown
  - And its event and directions links match its card
- Why: AC-EVT-011. Dates are seeded relative to seed time, so compare them with the card, not a fixed date. Directions use `query=lat,lng` from GeoJSON `[lng, lat]`.

#### visitor should see every event at a venue when opening that venue's pin

- Layer: UI · Tags: @acceptance · Data: SEEDED_EVENT_LEINSTER_OPEN_MAT, SEEDED_EVENT_DUBLIN_NO_GI_SEMINAR (seeded, see data gap) · Mocked: tiles only
- Given/When/Then:
  - Given two upcoming events at Leinster Grappling HQ
  - When a visitor opens that venue's pin on the map
  - Then both events are listed, earliest first
  - And the venue is shown once
- Why: AC-EVT-010, SC-005. The pin is named `Leinster Grappling HQ, 2 events`. The open mat starts first.

#### Events map should have no WCAG 2.1 A/AA violations in the `<theme>` theme

- Layer: UI · Tags: @acceptance, @a11y · Data: SEEDED_EVENT_LEINSTER_OPEN_MAT (seeded) · Mocked: tiles only
- Given/When/Then:
  - Given a visitor has the map open with the shared-venue popup open, in each of the light, dark and competition themes
  - Then no accessibility violations are found
- Why: AC-EVT-016. Use `expectNoWcagViolations`, in `events-map.a11y.acceptance.spec.ts` so `npm run test:a11y` selects it. Make the tiles readable by axe first, as the gym map scenario does. Axe does not judge focus indicators or pin contrast on tiles; the app's browser tests own those.

#### visitor should keep the pins and be offered the list when map tiles fail to load

- Layer: UI · Tags: @acceptance · Data: SEEDED_EVENT_REBEL_COUNTY_SEMINAR (seeded) · Mocked: tiles aborted
- Given/When/Then:
  - Given map tiles cannot be loaded
  - When a visitor opens the map for Cork
  - Then a notice offers the event list and the map stays open
  - And the Cork seminar's pin can still be opened
  - And following the notice shows the event list for Cork
- Why: AC-EVT-014.

#### visitor should see the event list when opening a map link while the events map is off

- Layer: UI · Tags: @acceptance · Data: seeded · Mocked: tiles only
- Given/When/Then:
  - Given the events map is off
  - When a visitor opens a link to the map
  - Then the event list is displayed on the Events page
  - And the visitor is not offered a choice of view
- Why: AC-EVT-015, SC-006. Needs `EventsMap: false`. Assert the path stays `/events`.

#### visitor should not download the map when staying on the event list

- Layer: UI · Tags: @acceptance · Data: seeded · Mocked: tiles only
- Given/When/Then:
  - When a visitor opens Events and stays on the list
  - Then no map code or tiles are requested
  - And switching to the map then requests them
- Why: AC-EVT-017. Record request URLs from before navigation and match `tile.openstreetmap.org`, `/assets/event-map-` and `/assets/leaflet-`. Both maps now share a separate Leaflet chunk. Run against a built image.

### Additional map scenarios (planner, 2026-11-05)

Added for User Story 4 acceptance scenarios 1, 2, 9, 10 and FR-007, FR-008, FR-016, FR-017, which the twelve above leave out. Same setup (tiles fulfilled with a blank image). Explored 2026-11-05 where stated in each Why.

#### visitor should see pins for the current results when switching from the event list to the map

- Layer: UI · Tags: @acceptance, @smoke · Data: SEEDED_EVENT_TRIBES_NO_GI_CAMP, SEEDED_EVENT_ATLANTIC_COAST_CAMP, SEEDED_EVENT_REBEL_COUNTY_SEMINAR (seeded) · Mocked: tiles only
- Given/When/Then:
  - Given a visitor has opened the event list for camps
  - When the visitor switches to the map
  - Then the map is displayed and marked as the current view
  - And the Galway and Westport camps have pins and the Cork seminar does not
  - And the Galway pin is south-east of the Westport pin
- Why: AC-EVT-007 (User Story 4, scenario 1). The map's critical journey; the shared-link scenario starts on the map and never uses the switch. Narrowed by the Camp type, which gives two seeded events at different venues (Tribes in Galway, Atlantic Coast in Westport) and does not depend on the Dublin seminar, so the results are a real set the map must match: a pin for each, none for a non-camp venue, and the pins placed the right way round (mutation audit 2026-11-05, gap 2 and the smoke test that proved too little). Galway lies south-east of Westport; the check is tolerant (ratio 1.5 to 2.7, Mercator gives about 2.05).

#### visitor should keep the search, county and type when switching from the map back to the list

- Layer: UI · Tags: @acceptance · Data: SEEDED_EVENT_REBEL_COUNTY_SEMINAR (seeded) · Mocked: tiles only
- Given/When/Then:
  - Given a visitor is on the map filtered by Cork and Seminar
  - When the visitor switches to the list
  - Then the search, Cork and Seminar are still chosen
  - And only the Cork seminar is listed
- Why: User Story 4, scenario 2, FR-006. Distinct from the Back scenario: this is the switch control carrying filters, not history.

#### visitor should see the empty-search message when a search matches nothing on the map

- Layer: UI · Tags: @acceptance · Data: seeded · Mocked: tiles only
- Given/When/Then:
  - Given a visitor is on the map
  - When the visitor searches for text no event contains
  - Then the same no-results message as the list is displayed
- Why: User Story 4, scenario 9, FR-012. No test owns the map's empty state. Explored 2026-11-05: confirmed with differences to word precisely. A search that matches nothing shows `Showing 0 events` and `No events match your search` with a clear button, and no map is rendered. So "no pin is shown" holds because the map is replaced; assert the message, not the absence of a map.

#### visitor should see an error message and be able to retry when events cannot be loaded on the map

- Layer: UI · Tags: @acceptance · Data: seeded listing after recovery · Mocked: yes (first response fails, then recovers) and tiles
- Given/When/Then:
  - Given the event service is unavailable
  - When a visitor opens the map for Cork
  - Then the same server error message as the list is displayed
  - When the service recovers and the visitor retries
  - Then the map shows the Cork seminar's pin
- Why: User Story 4, scenario 10, FR-012. Mirrors the list's retry scenario in Planned.

#### visitor should be told how many events are not shown when some have no usable location

- Layer: UI · Tags: @acceptance · Data: seeded listing plus one event without coordinates · Mocked: yes (snapshot state; seeded data has no unmapped event)
- Given/When/Then:
  - Given one event has no usable coordinates
  - When a visitor opens the map
  - Then a notice says one event is not shown
  - And the other events have pins
  - And the event is still listed after switching to the list
- Why: FR-008. Not seedable without a bad-data fixture, so mocked.

#### visitor should be told to filter when more events match than the map can show

- Layer: UI · Tags: @acceptance · Data: firstPageOfManyEvents-style listing of 100 events with a larger total · Mocked: yes (multi-page)
- Given/When/Then:
  - Given 130 events match, more than the map can show
  - When a visitor opens the map
  - Then a notice says not every event is shown and suggests filtering
  - And the header count shows the number of matching events
- Why: FR-007. Environments with full datasets can reach the cap; seeded data cannot.

#### visitor should switch between list and map using only the keyboard

- Layer: UI · Tags: @acceptance · Data: SEEDED_EVENT_REBEL_COUNTY_SEMINAR (seeded) · Mocked: tiles only
- Given/When/Then:
  - When a visitor opens Events for Cork
  - And the visitor chooses the map view using the keyboard
  - Then the map is marked as the current view
  - When the visitor opens the Cork seminar's pin using the keyboard
  - Then its details are shown
  - When the visitor chooses the list view using the keyboard
  - Then the list is marked as the current view
- Why: FR-016. The a11y sweep does not prove the controls can be operated.

#### visitor should see the map fit the screen on a phone

- Layer: UI · Tags: @acceptance, @mobile · Data: seeded · Mocked: tiles only
- Given/When/Then:
  - When a visitor opens the map on a phone
  - Then the map fits within the screen
  - And the page does not scroll sideways
- Why: FR-017. Events has no map `@mobile` scenario.

#### visitor should see each venue's events when opening its pin on the map

- Layer: UI · Tags: @acceptance · Data: every seeded upcoming event plus SEEDED_EVENT_DUBLIN_NO_GI_SEMINAR (seeded) · Mocked: tiles only
- Given/When/Then:
  - Given a visitor is on the map for the pin's county
  - When the visitor opens the pin for a venue
  - Then its popup shows the events at that venue, with their types, address and links
  - When the visitor closes the popup
  - (repeated for every venue, each on a fresh map for its county)
  - Then the popups show the events as many days long and as far apart as seeded
- Why: mutation audit 2026-11-05, gap 2 (`location.venue`, `name` and coordinates rotate survived: every other map test is narrowed to Cork, so one event cannot show a pin tied to the wrong event). Pins are grouped by coordinates, as the app does, and the shared Leinster pin holds the open mat and the seminar, in earliest-start order. Each venue is opened on the map narrowed to its county, so the pin is on the map whatever else a full dataset holds (the unfiltered map shows only the first 100 events). Under a county filter a county with one seeded event turns a `rotate` mutant into an identity, so the venue and coordinates rotate kills rest on the Dublin pin (two events) here and on the `@smoke` Camp scenario (two pins in different counties). No pin-geometry check here. After the last popup, the dates shown are checked against the seeded offsets (see the dates scenario below).

#### visitor should see each seeded event's dates as far apart as the seeded schedule says

- Layer: UI · Tags: @acceptance · Data: every seeded dated event plus SEEDED_EVENT_DUBLIN_NO_GI_SEMINAR, with `SEEDED_EVENT_SCHEDULE_OFFSETS` (seeded) · Mocked: no
- Given/When/Then:
  - When a visitor opens Events
  - When the visitor finds an event (repeated for every seeded dated event)
  - Then only that event is listed
  - And the visitor reads the dates of that event
  - Then each event runs as many days as seeded and the events start as far apart as seeded
- Why: mutation audit 2026-11-05, gap 4 (`schedule.startDate`/`endDate` rotate and mangle survived: seeded dates move with every seed, so the cards' dates were never asserted on real data). The seeder sets `now+Nd`, so the test compares gaps between the rendered dates with the seeded offsets and never the dates themselves; it makes no API call. It reads the first line of the card's schedule (the date range; Shannonside's weekly sessions follow it). The seeder adds 24-hour days to one instant and the card shows the Irish calendar day, so a clock change can move a date near midnight: a pair of dates that span the March change may show one day more than seeded (+1), a pair that span the October change one day fewer (−1). Only that signed difference is allowed, only across that change. A rotate swaps two events' dates and a mangle breaks a date, so both change a gap. A shift of every date by the same number of days is not caught, and no seed-time source exists without the API. The same check runs on the map popups in the per-venue scenario above.

### Held for a product decision

Do not implement these until the question is answered.

- Per-day price (finding F1): `visitor should see the daily rate of a camp priced per day`.

### Findings

- **F1: a per-day price is multiplied by the number of days but still labelled per day.** Tribes No-Gi Camp is seeded at EUR 55 per day for 3 days and shows `EUR 165.00 per day`. No UI test reads this card, and `eventCardFromDto` copies the same calculation, so a test built on it would pass with the wrong price. Reproduced twice. Expected a daily rate of EUR 55.00, or a total without "per day".
- **F2: the type badge overflows the card at 360px.** The Seminar badge on the Rebel County card ends at 366px, 6px past the screen edge. The page does not scroll sideways. Reproduced twice by measurement; not checked visually.
- **F3 (question): a per-session fee is shown as a weekly total.** Shannonside's mat fee is seeded at EUR 10 per session and shows `Mat fee: EUR 20.00 per week` for two weekly sessions. The sum is consistent, but a visitor attending once may read it as the price. `eventCardFromDto` copies this calculation too.
- **F5 (fixed 2026-10-31): the card showed the organiser's website host instead of their name.** The product owner confirmed it should show `organiser.name`. Fixed in `formatOrganiserDisplay` in `bjjeire-java` (`src/bjjeire-app/src/utils/format-event-details.ts`) and checked on a local rebuild; not yet committed. `expectCardData` now guards the name, so these tests fail against any build without the fix.
- **F7 (data risk): `dublin-no-gi-seminar.json` ties with the Leinster open mat on `createdAt`.** Both are `2026-01-01T00:00:00Z`. `client should receive events ordered by creation date` compares against `SEEDED_UPCOMING_EVENTS` order, so adding the new event to that list makes the order of the two undefined. Give it a distinct `createdAt` (for example 2026-01-07, after Shannonside) and append it last, or the ordering test can flake. It also adds a Dublin Seminar, so any UI test that expects exactly one Dublin event or one Seminar must be checked. The existing UI tests use the Rebel County event for county and type, and the API tests derive from the seeded list, so none breaks as written. Its `imageUrl` points at the Leinster event's image, which is harmless.
- **F4 (question): the server error shows a technical message.** With the filtered request failing, the page shows `Request failed with status code 500`. The suite expects this text (`SERVER_ERROR_MESSAGE` in `src/ui/pages/common/error.page.ts`), so a friendlier message would need that constant changed too.
