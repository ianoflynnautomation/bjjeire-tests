# Acceptance spec: Events

**App spec**: `bjjeire-java/specs/features/events.md`
**Requirements**: `bjjeire/requirements` · epic `&2`
**Slice**: `tests/features/events/` · `src/ui/pages/events/` · `src/api/features/events/`
**Agent seed**: `tests/agents/seed.spec.ts` (project `agent-seed`: signed in, flags pinned on, shell mounted)
**Seeded**: `tests/features/events/seeded.ts`
**Status**: living · **Reconciled with tests**: 2026-11-10

A visitor opens Events and scans, searches, filters by county and type, and pages a list
of upcoming events, or switches to a map of the same results. Search is client-side on
the loaded page; county, type, page and view are URL state. The app repo owns the flag on
the wire (`#2006`, `#2015` API part) and the search mechanics once (`#2003` T4);
this suite proves what the visitor sees against real data.

## Scenarios (must match test titles)

### UI

1. visitor should see the event list when opening Events (`@smoke`) · `#2001`
2. visitor should see an empty state when no event matches the search · `#2003`
3. visitor should find only the event searched for by name · `#2003`
4. visitor should find an event by part of its name · `#2003`
5. visitor should see the full event listing again after clearing the search · `#2003`
6. visitor should see the header count match the events a search finds · `#2003`
7. visitor should see only events from the chosen county when filtering by county · `#2002`
8. visitor should see events from every county after resetting the county filter · `#2002`
9. visitor should see only events of the chosen type when filtering by type · `#2002`
10. visitor should see the no-data message when there are no events to show · `#2005`
11. visitor should see a network error message when events cannot be loaded because the connection fails · `#2005`
12. visitor should see a server error message when events cannot be loaded because of a server problem · `#2005`
13. visitor should see the weekly session times of a recurring open mat · `#2004`
14. visitor should see each day's session of a multi-day camp · `#2004`
15. visitor should see the total number of events in the header when the list spans several pages · `#2005`
16. visitor should see each seeded event's dates as far apart as the seeded schedule says · `#2004`
17. visitor should see events of every chosen type when choosing several types · `#2002`
18. visitor should see every type of event again after choosing All Types · `#2002`
19. visitor should find only the matching event when combining county, type and search · `#2002`
20. visitor should see no results when a search matches nothing within the chosen filters · `#2005`
21. visitor should be told no events match when the chosen filters find nothing · `#2005`
22. visitor should find an event by its <field> · `#2003`
23. visitor should find events by county name · `#2003`
24. visitor should see the daily rate of a camp priced per day · none (finding F1; expected to fail until fixed)
25. visitor should see the search results when opening a shared search link · none (exploration 2026-10-29)
26. visitor should keep the chosen county and type when reloading Events · none (decided 2026-10-31)
27. visitor should see only the shared filters when opening a shared filter link · none (decided 2026-10-31)
28. visitor should return to the previous filter with Back · none (decided 2026-10-31)
29. visitor should see an event's date in Irish time wherever they are · none (decided 2026-10-31)
30. visitor should see pins for the current results when switching from the event list to the map (`@smoke`) · `#2007`
31. visitor should keep the search, county and type when switching from the map back to the list · `#2007`
32. visitor should see each venue's events when opening its pin on the map · `#2010`
33. visitor should see the empty-search message when a search matches nothing on the map · `#2013`
34. visitor should see an error message and be able to retry when events cannot be loaded on the map · `#2013`
35. visitor should be told how many events are not shown when some have no usable location · `#2009`
36. visitor should be told to filter when more events match than the map can show · `#2008`
37. visitor should switch between list and map using only the keyboard · `#2016`
38. visitor should see the map fit the screen on a phone · `#2016`
39. visitor should see the map with the shared filters when opening a shared map link · `#2007`
40. visitor should reach the next page of events · `#2005`
41. visitor should return to the first page when changing a filter on a later page · `#2005`
42. visitor should find an event on a later page by searching · `#2003`
43. visitor should stay on the same page of events when reloading Events · `#2005`
44. visitor should see the events after retrying a failed load · `#2005`
45. visitor should be able to filter and search events using only the keyboard · none (no requirement issue for list keyboard use)
46. visitor should see event cards fit the screen on a phone · none (no requirement issue for phone list cards)
47. visitor should return to the event list with Back after switching to the map · `#2007`
48. visitor should see pins only for the chosen county when filtering the map by county · `#2008`
49. visitor should see pins only for the chosen type when filtering the map by type · `#2008`
50. visitor should see only the searched event's pin when searching on the map · `#2008`, `#2012`
51. visitor should see events in their real locations on the map · `#2009`
52. visitor should see an event's details and links when opening its pin · `#2011`
53. visitor should keep the pins and be offered the list when map tiles fail to load · `#2014`
54. visitor should see the event list when opening a map link while the events map is off · `#2015`
55. Events map should have no WCAG 2.1 A/AA violations in the `<theme>` theme · `#2016`

Scenarios 1–16 are in `events.ui.acceptance.spec.ts`; 17–28 in `events-filters.ui.acceptance.spec.ts`; 29 in `events-dates.ui.acceptance.spec.ts` (mocked,
fixed date, timezone set with `test.use`); 30–38, 47 and 51 in `events-map.ui.acceptance.spec.ts` (tiles fulfilled with a blank image); 39 and 48–50 in `events-map-filters.ui.acceptance.spec.ts` (map filter scenarios join it); 52 in `events-map-pins.ui.acceptance.spec.ts` (pin popup scenarios join it); 53–54 in `events-map-states.ui.acceptance.spec.ts` (53 with tiles aborted, 54 with the map off; error and off states join it); 55 in `events-map.a11y.acceptance.spec.ts` (three themes); 40–43 in `events-paging.ui.acceptance.spec.ts` (mocked, paged helper); 44 in `events-errors.ui.acceptance.spec.ts`; 45 in `events-keyboard.ui.acceptance.spec.ts`; 46 in `events-phone.ui.acceptance.spec.ts`. Scenario 22 is data-driven over address, organiser and
county. Design notes for 17–55 are in [Planned](#planned).

### API

1. client should receive each upcoming event with its details (`@smoke`) · `#2001`
2. client should not receive finished events · `#2001`
3. client should receive only upcoming events from the chosen county when filtering by county · `#2002`
4. client should receive events ordered by creation date · `#2001`
5. client should receive only upcoming events of the chosen type when filtering by type · `#2002`
6. client should receive an event with several types when filtering by any one of them · `#2002`
7. client should page through the listing in distinct slices with correct links · `#2005`
8. client should get a bad request for <param> "<value>" · `#2002`
9. client should get a validation error on <param> when <param> <value> is out of range · `#2005`
10. client should receive the details of an upcoming event by id · none
11. client should get not found for an event id that does not exist · none
12. client should get a validation error on the id for an event id that is <malformed> · none

Scenarios 8, 9 and 12 are data-driven over `tests/features/common/testdata/invalid-values.ts`
(8 covers malformed `county`, `types`, `includeInactive` and paging values). Errors are
asserted as RFC 9457 problem documents (`expectProblem`). Get-by-id has no requirement issue yet.

## Constraints

- Search is client-side; assert `expectResultCount(1)` after a unique search.
- Finished events must not appear.
- Organiser spelling on the wire is `organiser`.
- Schedule dates are seeded relative to seed time. Cards are compared on session times
  and titles only, until the seeder makes dates deterministic.
- Dates show in Irish time wherever the visitor is: `visitor should see an event's date in Irish time wherever they are` in `events-dates.ui.acceptance.spec.ts` (mocked, so the date is fixed).

## Planned

A block whose title is in the numbered list above is implemented; the rest are open.
Open as of 2026-11-19: `visitor should not download the map when staying on the event list` (`#2017`, needs a built image). `visitor should see every event at a venue when opening that venue's pin` is **rejected as a duplicate**: scenario 32 already opens the shared Leinster pin and checks both events with `mapPopupFromDtos`.
Scenarios 17–29 predate the convention and have no block.

**Paging mock (2026-11-19).** The app asks for `?page=N&pageSize=20`; a search or the map asks for `page=1&pageSize=100` (`useListPage`, `loadAll`/search). `firstPageOfManyEvents` serves one fixed body, so the three paging scenarios need one new helper in `tests/features/events/testdata/multi-page.ts` plus a `mockBjjEventsPaged` fixture: a route handler that reads `page` and `pageSize` from the request and answers with `paginatePages(events, pageSize, API_ROUTES.bjjEvents)[page]` over 45 derived events. Parse bodies with `parseMockBody`. Name each derived event neutrally and distinctively (`Paged Event 01` to `Paged Event 45`; `Paged Event 45` matches only the last).

Explored live on 2026-10-31 (`APP_ENV=docker`, `http://localhost:3000`, five seeded events).
UI only; the API suite already owns the county and type rules, finished events and paging.

#### visitor should reach the next page of events

- Covers: `#2005`
- Oracle: the fixed 45-event mock body (page 1 holds events 1 to 20, page 2 holds 21 to 40).
- Steps:
  1. Given there are 45 events, more than fit on one page
  2. When a visitor opens Events
  3. And the visitor goes to the next page
- Expected results:
  - Then events 21 to 40 are listed
  - And event 1 is not listed
  - And the page indicator shows page 2 of 3
- Why: the current paging test stops at the header total and never moves page.

Test design: UI · @acceptance · mocked (multi-page, paged helper) · `events-paging.ui.acceptance.spec.ts` (`events.ui` is at the 400-line lint limit) · built. Next button and indicator are `PaginationTestIds`. The URL gains `page=2`. No existing test covers it.

#### visitor should return to the first page when changing a filter on a later page

- Covers: `#2005`
- Oracle: the fixed mock body. The handler also filters by the request's `county` and `types`, so the county's 25 events are the expected set (page 1 holds the first 20).
- Steps:
  1. Given there are 45 events, 25 of them in Cork
  2. When a visitor opens Events
  3. And the visitor goes to the next page
  4. And the visitor filters by Cork
- Expected results:
  - Then the first page of Cork's events is listed
  - And the page indicator shows page 1 of 2
- Why: stale page state is a likely regression and would strand the visitor on an empty page.

Test design: UI · @acceptance · mocked (multi-page; the paged helper must honour `county`, so derive events with two counties) · `events-paging.ui.acceptance.spec.ts` · built. The filter change drops `page` from the URL. Apart from county, `types` is the other filter that would do the same; one is enough.

#### visitor should find an event on a later page by searching

- Covers: `#2003`
- Oracle: the fixed 45-event mock body. Event 45 is on page 3 and its name is unique (`Paged Event 45`).
- Steps:
  1. Given there are 45 events, more than fit on one page
  2. When a visitor opens Events
  3. And the visitor searches for the name of the 45th event
- Expected results:
  - Then only the 45th event is listed
  - And the header count says one event was found
- Why: search reaches beyond the loaded page, and no test proves it.

Test design: UI · @acceptance · mocked (multi-page, paged helper) · `events-paging.ui.acceptance.spec.ts` · built. Verified live: a search requests `page=1&pageSize=100`, so the helper must serve all 45 on that request (a fixed page-1 body would pass for the wrong reason). Note this contradicts the Summary line "search is client-side on the loaded page": it loads up to 100 events, then filters them (finding F8).

#### visitor should stay on the same page of events when reloading Events

- Covers: `#2005`
- Oracle: the fixed 45-event mock body (page 2 holds events 21 to 40).
- Steps:
  1. Given there are 45 events, more than fit on one page
  2. When a visitor opens Events
  3. And the visitor goes to the next page
  4. And the visitor reloads the page
- Expected results:
  - Then events 21 to 40 are listed
  - And the page indicator shows page 2 of 3
- Why: page is URL state (FR-006 sibling behaviour in `useListPage`), so a shared or reloaded page-2 link must not fall back to page 1.

Test design: UI · @acceptance · mocked (multi-page, paged helper) · `events-paging.ui.acceptance.spec.ts` · built (added by the planner 2026-11-19). Route mocks survive `page.reload()`. Alternative with one fewer step: open `?page=2` directly.

#### visitor should see the events after retrying a failed load

- Covers: `#2005`
- Oracle: the real listing after the one injected failure: the list is not empty and no error state is shown (environments hold full datasets, so no seeded event is assumed on page 1).
- Steps:
  1. Given the event service is unavailable
  2. When a visitor opens Events
  3. Then a server error message is displayed
  4. When the service recovers and the visitor retries
- Expected results:
  - Then the event list is displayed
- Why: the error tests stop at the message, and retry is the visitor's only way out.

Test design: UI · @acceptance · mocked (`mockServerErrorOnce`, then the real service) · `events-errors.ui.acceptance.spec.ts` (`events.ui` is at the 400-line lint limit) · built. No new helper: the map retry scenario already uses `mockServerErrorOnce` and `eventsPage.retryAfterError`. Reuse them. The map copy of this is scenario 34.

#### visitor should see event cards fit the screen on a phone

- Covers: none (exploration 2026-10-31, F2; no requirement issue for phone list cards)
- Oracle: the seeded Rebel County Submission Seminar, as the visitor sees it.
- Steps:
  1. When a visitor opens Events on a phone
  2. And the visitor finds the seminar
- Expected results:
  - Then only that event is listed
  - And the event card, including its type badge, fits within the screen
  - And the page does not scroll sideways
- Why: Events has no `@mobile` scenario. Expected to fail at 360px until finding F2 is fixed.

Test design: UI · @acceptance, @mobile · `SEEDED_EVENT_REBEL_COUNTY_SEMINAR` · not mocked · phone viewport (`mobile-galaxy` is 360px; `mobile-iphone` is wider) · `events-phone.ui.acceptance.spec.ts` (`events.ui` is near the file-length limit), own `describe` tagged `@mobile` like the map phone test, found by searching · built and run. It measures each card's `left >= 0` and `right <= innerWidth`, and that the type badge lies inside its own card. At 360px the list has two columns, so one searched card is about 174px wide, and the badge-inside-card check is what would catch F2.

#### visitor should be able to filter and search events using only the keyboard

- Covers: none (no requirement issue for list keyboard use; #2016 covers the map switch only)
- Oracle: the seeded Rebel County Submission Seminar, as the visitor sees it.
- Steps:
  1. When a visitor opens Events
  2. And the visitor chooses Seminar using the keyboard
  3. And the visitor searches for the seminar using the keyboard
- Expected results:
  - Then only that event is listed
  - And the type chosen is Seminar
- Why: the a11y sweep checks rules on a static page, not that the controls can be operated.

Test design: UI · @acceptance · `SEEDED_EVENT_REBEL_COUNTY_SEMINAR` · not mocked · `events-keyboard.ui.acceptance.spec.ts` · built (`events-filters` is at the function-length lint limit). Type is a native button group (Enter or Space), search a native searchbox, so use `keyboard.press`; do not use `click` or `fill`. Verified live: Seminar plus `q=Rebel` gives one card and `Found 1 event.` The county select is a native combobox; leave it out. If #2016 is judged map-only, use `none (no requirement issue for list keyboard use)`.

### Map view

From User Story 4 and `#2007` to `#2017` in `bjjeire-java/specs/`. Written from the
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
- **Planner check 2026-11-19 (local stack, six events; the map was not opened in the MCP browser, which cannot block tile traffic).** `?types=Seminar` and `?county=` are the URL forms. Built since: the map scenarios 39 and 47–55 are all UI, with tiles fulfilled blank (aborted for 53) and no other mock, in `events-map-filters`, `events-map-pins`, `events-map-states`, `events-map.a11y` and `events-map.ui.acceptance.spec.ts`. Not built: no map download (`#2017`), only against a built image; the local stack serves hashed chunks (`/assets/EventsPage-*.js`) and the list page loaded none named `event-map-` or `leaflet-`, so the asserted absence holds today, but the chunk names for the "then switching requests them" half were not observed.
- **Data gap:** `seeded.ts` needs `SEEDED_EVENT_DUBLIN_NO_GI_SEMINAR`, mirroring the new
  `bjjeire-java/seeder/data-test/bjj-events/dublin-no-gi-seminar.json`. It shares Leinster
  Grappling HQ's coordinates with `SEEDED_EVENT_LEINSTER_OPEN_MAT`. Its address, name and
  organiser deliberately avoid the existing single-match search terms, so those tests still
  find exactly one event. `SEEDED_EVENT_FINISHED_WINTER_SOLSTICE` is at the same venue but
  finished, so it never appears on the map.

#### visitor should see the map with the shared filters when opening a shared map link

- Layer: UI · Tags: @acceptance · Data: SEEDED_EVENT_REBEL_COUNTY_SEMINAR (seeded) · Mocked: tiles only
- Covers: `#2007`
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. When a visitor opens a shared link to the map for Cork and seminars
- Expected results:
  - Then the map is displayed and marked as the current view
  - And Cork and Seminar are chosen
  - And the Cork seminar has a pin and the Dublin events do not
- Why: `#2007`, SC-004. The app's page tests prove this against mocks only.

Test design: UI · @acceptance · `SEEDED_EVENT_REBEL_COUNTY_SEMINAR` and the Leinster venue · not mocked beyond tiles · `events-map-filters.ui.acceptance.spec.ts`. The link is `?view=map&county=Cork&types=Seminar`; both filters narrow the map, so the Cork pin is among at most a few seminars.

#### visitor should return to the event list with Back after switching to the map

- Layer: UI · Tags: @acceptance · Data: seeded · Mocked: tiles only
- Covers: `#2007`
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. Given a visitor is on the event list for Dublin
  2. When the visitor switches to the map
  3. And the visitor goes back
- Expected results:
  - Then the list is marked as the current view
  - And the address no longer has the map view
  - And the event list shows events
  - And every event listed is in Dublin
- Why: `#2007`. Start on the list: a directly opened link has no earlier page.

Test design: UI · @acceptance · `County.Dublin`, no named seeded event · not mocked beyond tiles · `events-map.ui.acceptance.spec.ts`. Starts on `/events?county=Dublin`, so the list assertion does not depend on page 1 (`expectListNotEmpty` and `expectOnlyCountyListed`). Back is `page.goBack`, wrapped by `goBackToList`.

#### visitor should see pins only for the chosen county when filtering the map by county

- Layer: UI · Tags: @acceptance · Data: SEEDED_EVENT_REBEL_COUNTY_SEMINAR, SEEDED_EVENT_DUBLIN_NO_GI_SEMINAR (seeded) · Mocked: tiles only
- Covers: `#2008`
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. Given a visitor is on the map of seminars
  2. When the visitor filters by Cork
- Expected results:
  - Then the Cork seminar has a pin and the Dublin No-Gi Seminar does not
  - And the map has moved closer to Cork
- Why: `#2008`, SC-003. Assert named pins, not totals.

Test design: UI · @acceptance · not mocked beyond tiles · `events-map-filters.ui.acceptance.spec.ts`. Starts on `?view=map&types=Seminar` so both seeded seminars are single-event pins and no hard-coded count is used. The baseline zoom is read with `settledTileZoom` (a finite number two reads agree on); "closer" means the zoom rose and the Cork pin's box lies inside the map's box (`expectZoomedInOnPin`).

#### visitor should see pins only for the chosen type when filtering the map by type

- Layer: UI · Tags: @acceptance · Data: SEEDED_EVENT_TRIBES_NO_GI_CAMP, SEEDED_EVENT_REBEL_COUNTY_SEMINAR (seeded) · Mocked: tiles only
- Covers: `#2008`
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. Given a visitor is on the map
  2. When the visitor filters by Camp
- Expected results:
  - Then the Galway camp has a pin and the Cork seminar does not
- Why: `#2008`. Type is a server filter, and only this proves it reaches the map on real data.

Test design: UI · @acceptance · not mocked beyond tiles · `events-map-filters.ui.acceptance.spec.ts`. Starts on the unfiltered map and asserts only the Cork pin beforehand, the one whose absence the test proves. Camp splits the seeded events: Galway camp stays, the Cork seminar goes (the Leinster venue holds no camp).

#### visitor should see only the searched event's pin when searching on the map

- Layer: UI · Tags: @acceptance · Data: SEEDED_EVENT_REBEL_COUNTY_SEMINAR (seeded) · Mocked: tiles only
- Covers: `#2008`, `#2012`
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. Given a visitor is on the map of seminars
  2. When the visitor searches for an event by name
- Expected results:
  - Then only that event has a pin
  - And the map has zoomed to it
- Why: `#2008`, `#2012`. Exactly one pin, and the map zooms in on it.

Test design: UI · @acceptance · `SEEDED_EVENT_REBEL_COUNTY_SEMINAR`, `SEEDED_EVENT_DUBLIN_NO_GI_SEMINAR` · not mocked beyond tiles · `events-map-filters.ui.acceptance.spec.ts`. Starts on `?view=map&types=Seminar` (two single-event pins), searches the Cork seminar's name, then `expectOnlyPin` (exactly one `event-map-pin`, named for the venue). Zoom as for the county scenario, as the gym scenario does.

#### visitor should see events in their real locations on the map

- Layer: UI · Tags: @acceptance · Data: SEEDED_EVENT_DUBLIN_NO_GI_SEMINAR, SEEDED_EVENT_REBEL_COUNTY_SEMINAR (seeded) · Mocked: tiles only
- Covers: `#2009`
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. When a visitor opens the map of seminars
- Expected results:
  - Then the Dublin venue is north-east of the Cork venue, at the right angle
- Why: `#2009`, SC-003. Dublin is right of and above Cork, at the angle the real coordinates give.

Test design: UI · @acceptance · not mocked beyond tiles · `events-map.ui.acceptance.spec.ts`. Opens `?view=map&types=Seminar` (one Cork and one Dublin No-Gi pin, both single-event). The expected vertical / horizontal ratio is computed from the two seeded coordinates in Web Mercator (`onScreenRatioBounds`, plus or minus 10%): about 1.09 (band 0.98 to 1.20); swapped latitude and longitude gives about 1.53 with the same directions, which the band rejects. The Galway/Westport check (scenario 30) uses the same helper (about 2.05, band 1.85 to 2.26).

#### visitor should see an event's details and links when opening its pin

- Layer: UI · Tags: @acceptance · Data: SEEDED_EVENT_REBEL_COUNTY_SEMINAR (seeded) · Mocked: tiles only
- Covers: `#2011`
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. Given a visitor is on the map
  2. When the visitor opens an event's pin
- Expected results:
  - Then the venue and address are shown
  - And the event's name, type and dates are shown
  - And its event and directions links match its card
- Why: `#2011`. A visitor opening a pin needs the venue, the event and a way to reach both.

Test design: UI · @acceptance · `SEEDED_EVENT_REBEL_COUNTY_SEMINAR` · not mocked beyond tiles · `events-map-pins.ui.acceptance.spec.ts`. Expected venue, address, name, types and links come from `mapPopupFromDtos` and `eventCardFromDto`. Dates are seeded relative to seed time, so the card's days (`readScheduledDays`, read from the list first) are the expectation. Directions use `query=lat,lng` from GeoJSON `[lng, lat]`.

#### Events map should have no WCAG 2.1 A/AA violations in the `<theme>` theme

- Layer: UI · Tags: @acceptance, @a11y · Data: SEEDED_EVENT_LEINSTER_OPEN_MAT (seeded) · Mocked: tiles only
- Covers: `#2016`
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. Given a visitor has the map open with the Leinster open mat's popup open, in the <theme> theme
- Expected results:
  - Then no accessibility violations are found
- Why: `#2016`. A map popup that fails contrast or naming is unusable with a screen reader.

Test design: UI · @acceptance, @a11y · `SEEDED_EVENT_LEINSTER_OPEN_MAT` · not mocked beyond tiles · `events-map.a11y.acceptance.spec.ts`, so `npm run test:a11y` selects it. Opens `?view=map&q=<open mat name>` (one single-event pin), opens the popup and waits for it to be opaque, then sets tiles to a normal blend so axe's colour rules run (`makeTilesReadableByAxe`; nothing is excluded). Uses `expectNoWcagViolations`. Axe does not judge focus indicators or pin contrast on tiles; the app's browser tests own those.

#### visitor should keep the pins and be offered the list when map tiles fail to load

- Layer: UI · Tags: @acceptance · Data: SEEDED_EVENT_REBEL_COUNTY_SEMINAR (seeded) · Mocked: tiles aborted
- Covers: `#2014`
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. Given map tiles cannot be loaded
  2. When a visitor opens the map for Cork
  3. Then a notice offers the event list and the map stays open
  4. And the Cork seminar's pin can still be opened
  5. When the visitor follows the notice
- Expected results:
  - Then the event list for Cork is shown
- Why: `#2014`. A failed map background must not leave the visitor without the pins or a way to the list.

Test design: UI · @acceptance · `SEEDED_EVENT_REBEL_COUNTY_SEMINAR` · tiles aborted (`abortMapTiles`) · `events-map-states.ui.acceptance.spec.ts`. The link is `?view=map&county=Cork&q=<seminar name>`, so the list that follows is one card whatever else the environment holds. Notice copy is `TILES_FAILED_COPY`.

#### visitor should see the event list when opening a map link while the events map is off

- Layer: UI · Tags: @acceptance · Data: seeded · Mocked: tiles only
- Covers: `#2015`
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. When a visitor opens a link to the map while the events map is off
- Expected results:
  - Then the event list is displayed on the Events page
  - And the address stays on the Events page
  - And no map is displayed
  - And the visitor is not offered a choice of view
- Why: `#2015`, SC-006. A map link must not break the page when the feature is off.

Test design: UI · @acceptance · `SEEDED_EVENT_REBEL_COUNTY_SEMINAR` · tiles fulfilled blank (a leaked map must not reach OpenStreetMap) · `events-map-states.ui.acceptance.spec.ts`, own `describe` pinning `EventsMap: false` with `test.use`. The flag is pinned, never asserted. The link is `?view=map&county=Cork&q=<seminar name>`; the path must stay `/events`.

#### visitor should not download the map when staying on the event list

- Layer: UI · Tags: @acceptance · Data: seeded · Mocked: tiles only
- Covers: `#2017`
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. When a visitor opens Events and stays on the list
- Expected results:
  - Then no map code or tiles are requested
  - And switching to the map then requests them
- Why: `#2017`. Visitors who never open the map should not pay for it. Run against a built image.

### Additional map scenarios (planner, 2026-11-05)

Added for User Story 4 acceptance scenarios 1, 2, 9, 10 and FR-007, FR-008, FR-016, FR-017, which the twelve above leave out. Same setup (tiles fulfilled with a blank image). Explored 2026-11-05 where stated in each Why.

Test design: UI · @acceptance · not built · record request URLs from before navigation and match `tile.openstreetmap.org`, `/assets/event-map-` and `/assets/leaflet-` (both maps now share a separate Leaflet chunk).

#### visitor should see pins for the current results when switching from the event list to the map

- Layer: UI · Tags: @acceptance, @smoke · Data: SEEDED_EVENT_TRIBES_NO_GI_CAMP, SEEDED_EVENT_ATLANTIC_COAST_CAMP, SEEDED_EVENT_REBEL_COUNTY_SEMINAR (seeded) · Mocked: tiles only
- Covers: `#2007`
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. Given a visitor has opened the event list for camps
  2. When the visitor switches to the map
- Expected results:
  - Then the map is displayed and marked as the current view
  - And the Galway and Westport camps have pins and the Cork seminar does not
  - And the Galway pin is south-east of the Westport pin
- Why: `#2007` (User Story 4, scenario 1). The map's critical journey; the shared-link scenario starts on the map and never uses the switch. Narrowed by the Camp type, which gives two seeded events at different venues (Tribes in Galway, Atlantic Coast in Westport) and does not depend on the Dublin seminar, so the results are a real set the map must match: a pin for each, none for a non-camp venue, and the pins placed the right way round (mutation audit 2026-11-05, gap 2 and the smoke test that proved too little). Galway lies south-east of Westport, at the angle the seeded coordinates give (band derived from them, see scenario 51).

#### visitor should keep the search, county and type when switching from the map back to the list

- Layer: UI · Tags: @acceptance · Data: SEEDED_EVENT_REBEL_COUNTY_SEMINAR (seeded) · Mocked: tiles only
- Covers: `#2007`
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. Given a visitor is on the map filtered by Cork and Seminar
  2. When the visitor switches to the list
- Expected results:
  - Then the search, Cork and Seminar are still chosen
  - And only the Cork seminar is listed
- Why: User Story 4, scenario 2, FR-006. Distinct from the Back scenario: this is the switch control carrying filters, not history.

#### visitor should see the empty-search message when a search matches nothing on the map

- Layer: UI · Tags: @acceptance · Data: seeded · Mocked: tiles only
- Covers: `#2013`
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. Given a visitor is on the map
  2. When the visitor searches for text no event contains
- Expected results:
  - Then the same no-results message as the list is displayed
- Why: User Story 4, scenario 9, FR-012. No test owns the map's empty state. Explored 2026-11-05: confirmed with differences to word precisely. A search that matches nothing shows `Showing 0 events` and `No events match your search` with a clear button, and no map is rendered. So "no pin is shown" holds because the map is replaced; assert the message, not the absence of a map.

#### visitor should see an error message and be able to retry when events cannot be loaded on the map

- Layer: UI · Tags: @acceptance · Data: seeded listing after recovery · Mocked: yes (first response fails, then recovers) and tiles
- Covers: `#2013`
- Oracle: the fixed mock body named on the test-design line. The expected value is that body, not a calculation shared with the app.
- Steps:
  1. Given the event service is unavailable
  2. When a visitor opens the map for Cork
  3. Then the same server error message as the list is displayed
  4. When the service recovers and the visitor retries
- Expected results:
  - Then the map shows the Cork seminar's pin
- Why: User Story 4, scenario 10, FR-012. Mirrors the list's retry scenario in Planned.

#### visitor should be told how many events are not shown when some have no usable location

- Layer: UI · Tags: @acceptance · Data: seeded listing plus one event without coordinates · Mocked: yes (snapshot state; seeded data has no unmapped event)
- Covers: `#2009`
- Oracle: the fixed mock body named on the test-design line. The expected value is that body, not a calculation shared with the app.
- Steps:
  1. Given one event has no usable coordinates
  2. When a visitor opens the map
- Expected results:
  - Then a notice says one event is not shown
  - And the other events have pins
  - And the event is still listed after switching to the list
- Why: FR-008. Not seedable without a bad-data fixture, so mocked.

#### visitor should be told to filter when more events match than the map can show

- Layer: UI · Tags: @acceptance · Data: firstPageOfManyEvents-style listing of 100 events with a larger total · Mocked: yes (multi-page)
- Covers: `#2008`
- Oracle: the fixed mock body named on the test-design line. The expected value is that body, not a calculation shared with the app.
- Steps:
  1. Given <count> events match, more than the map can show
  2. When a visitor opens the map
- Expected results:
  - Then a notice says not every event is shown and suggests filtering
  - And the header count shows the number of matching events
- Why: FR-007. Environments with full datasets can reach the cap; seeded data cannot.

#### visitor should switch between list and map using only the keyboard

- Layer: UI · Tags: @acceptance · Data: SEEDED_EVENT_REBEL_COUNTY_SEMINAR (seeded) · Mocked: tiles only
- Covers: `#2016`
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. When a visitor opens Events for Cork
  2. And the visitor chooses the map view using the keyboard
  3. Then the map is marked as the current view
  4. When the visitor opens the Cork seminar's pin using the keyboard
  5. Then its details are shown
  6. When the visitor chooses the list view using the keyboard
- Expected results:
  - Then the list is marked as the current view
- Why: FR-016. The a11y sweep does not prove the controls can be operated.

#### visitor should see the map fit the screen on a phone

- Layer: UI · Tags: @acceptance, @mobile · Data: seeded · Mocked: tiles only
- Covers: `#2016`
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. When a visitor opens the map on a phone
- Expected results:
  - Then the map fits within the screen
  - And the page does not scroll sideways
- Why: FR-017. Events has no map `@mobile` scenario.

#### visitor should see each venue's events when opening its pin on the map

- Layer: UI · Tags: @acceptance · Data: every seeded upcoming event plus SEEDED_EVENT_DUBLIN_NO_GI_SEMINAR (seeded) · Mocked: tiles only
- Covers: `#2010`
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. Given a visitor is on the map for <view>
  2. When the visitor opens the pin for <venue>
  3. Then its popup shows the events at <venue>
  4. When the visitor closes the popup for <venue>
- Expected results:
  - Then the popups show the events as many days long and as far apart as seeded
- Why: mutation audit 2026-11-05, gap 2 (`location.venue`, `name` and coordinates rotate survived: every other map test is narrowed to Cork, so one event cannot show a pin tied to the wrong event). Pins are grouped by coordinates, as the app does, and the shared Leinster pin holds the open mat and the seminar, in earliest-start order. The pins are grouped into narrowed views defined in `testdata/map-views.ts` (the Camp type, then one view per county for the rest; a helper checks every seeded pin is in exactly one view), so each pin is on the map whatever else a full dataset holds (the unfiltered map shows only the first 100 events). A county with one seeded event turns a `rotate` mutant into an identity, so the venue and name rotate kills rest on the Dublin pin (two events) here and on the `@smoke` Camp scenario; the latitude/longitude rotate kill comes from the Camp view, where one response holds two places (Galway and Westport) and a rotated coordinate changes a directions link. No pin-geometry check here. After the last popup, the dates shown are checked against the seeded offsets (see the dates scenario below).

#### visitor should see each seeded event's dates as far apart as the seeded schedule says

- Layer: UI · Tags: @acceptance · Data: every seeded dated event plus SEEDED_EVENT_DUBLIN_NO_GI_SEMINAR, with `SEEDED_EVENT_SCHEDULE_OFFSETS` (seeded) · Mocked: no
- Covers: `#2004`
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. When a visitor opens Events
  2. When the visitor finds <name>
  3. Then only <name> is listed
- Expected results:
  - And that event's dates are shown
  - Then each event runs as many days as seeded and the events start as far apart as seeded
- Why: mutation audit 2026-11-05, gap 4 (`schedule.startDate`/`endDate` rotate and mangle survived: seeded dates move with every seed, so the cards' dates were never asserted on real data). The seeder sets `now+Nd`, so the test compares gaps between the rendered dates with the seeded offsets and never the dates themselves; it makes no API call. It reads the first line of the card's schedule (the date range; Shannonside's weekly sessions follow it). The seeder adds 24-hour days to one instant and the card shows the Irish calendar day, so a clock change can move a date near midnight: a pair of dates that span the March change may show one day more than seeded (+1), a pair that span the October change one day fewer (−1). Only that signed difference is allowed, only across that change. A rotate swaps two events' dates and a mangle breaks a date, so both change a gap. A shift of every date by the same number of days is not caught, and no seed-time source exists without the API. The same check runs on the map popups in the per-venue scenario above.

## Held for a product decision

Do not implement these until the question is answered.

- Per-day price (finding F1, now apparently fixed, see Findings): `visitor should see the daily rate of a camp priced per day` is scenario 24. Nothing is held once a run confirms it.

## Findings

- **F8: the Summary says search is client-side on the loaded page, but search requests `page=1&pageSize=100`.** Observed: typing a term refetches up to 100 events and filters them in the browser, so search reaches beyond page 1 but not beyond 100 events. No product-spec line states either; the later-page search scenario encodes the observed reach only up to 100 events.

- **F9 (low): fast typing in the events search box drops characters.** Observed 2026-11-19 (local): typing `Rebel County` with no delay between keys left `r` or `y`; at 20 ms it left `yRebel County`; at 80 ms it was reliable. Each key rewrites the input from `?q=`, so a faster key overtakes the update. Humans rarely type that fast, so severity is low. The keyboard scenario (45) types at 80 ms (`KEY_DELAY_MS` in `events.page.ts`); remove the delay once this is fixed. No GitHub issue filed: the product owner decides.
- **F1: a per-day price is multiplied by the number of days but still labelled per day.** Tribes No-Gi Camp is seeded at EUR 55 per day for 3 days and shows `EUR 165.00 per day`. No UI test reads this card, and `eventCardFromDto` copies the same calculation, so a test built on it would pass with the wrong price. Reproduced twice. Expected a daily rate of EUR 55.00, or a total without "per day". **Update 2026-11-19 (live check): fixed.** Tribes No-Gi Camp now shows `EUR 55.00 per day`, and Atlantic Coast shows `Open mat day pass: EUR 20.00 per day` unmultiplied. Scenario 24 should now pass; remove "expected to fail until fixed" from its line and the Held entry once a run confirms it.
- **F2: the type badge overflows the card at 360px.** The Seminar badge on the Rebel County card ends at 366px, 6px past the screen edge. The page does not scroll sideways. Reproduced twice by measurement; not checked visually.
- **F3 (question): a per-session fee is shown as a weekly total.** Shannonside's mat fee is seeded at EUR 10 per session and shows `Mat fee: EUR 20.00 per week` for two weekly sessions. The sum is consistent, but a visitor attending once may read it as the price. `eventCardFromDto` copies this calculation too.
- **F5 (fixed 2026-10-31): the card showed the organiser's website host instead of their name.** The product owner confirmed it should show `organiser.name`. Fixed in `formatOrganiserDisplay` in `bjjeire-java` (`src/bjjeire-app/src/utils/format-event-details.ts`) and checked on a local rebuild; not yet committed. `expectCardData` now guards the name, so these tests fail against any build without the fix.
- **F7 (data risk): `dublin-no-gi-seminar.json` ties with the Leinster open mat on `createdAt`.** Both are `2026-01-01T00:00:00Z`. `client should receive events ordered by creation date` compares against `SEEDED_UPCOMING_EVENTS` order, so adding the new event to that list makes the order of the two undefined. Give it a distinct `createdAt` (for example 2026-01-07, after Shannonside) and append it last, or the ordering test can flake. It also adds a Dublin Seminar, so any UI test that expects exactly one Dublin event or one Seminar must be checked. The existing UI tests use the Rebel County event for county and type, and the API tests derive from the seeded list, so none breaks as written. Its `imageUrl` points at the Leinster event's image, which is harmless.
- **F4 (question): the server error shows a technical message.** With the filtered request failing, the page shows `Request failed with status code 500`. The suite expects this text (`SERVER_ERROR_MESSAGE` in `src/ui/pages/common/error.page.ts`), so a friendlier message would need that constant changed too.
