# Acceptance spec: Gyms

**App spec**: `bjjeire-java/specs/features/gyms.md`
**AC-IDs**: `bjjeire-java/specs/stc/gyms/spec.md`
**Database**: `bjjeire-java/specs/database-contracts/gym.md`
**Slice**: `tests/features/gyms/` · `src/ui/pages/gyms/` · `src/api/features/gyms/`
**Agent seed**: `tests/agents/seed.spec.ts` (project `agent-seed`: signed in, flags pinned on, shell mounted)
**Seeded**: `tests/features/gyms/seeded.ts`
**Status**: living · **Reconciled with tests**: 2026-11-10

A visitor opens Gyms and scans, searches, filters by county and pages a directory of
published gyms, or switches to a map of the same results. Search is client-side on
the loaded page; county and page are URL state. The app repo owns the flag on the wire
(AC-GYM-006, AC-GYM-014 API part) and the search mechanics once (AC-GYM-003 T4); this
suite proves what the visitor sees against real data.

## Scenarios (must match test titles)

### UI

1. visitor should see the gym list when opening Gyms (`@smoke`) · AC-GYM-001
2. visitor should see an empty state when no gym matches the search · AC-GYM-003
3. visitor should find only the gym searched for by name · AC-GYM-003
4. visitor should find a gym by part of its name · AC-GYM-003
5. visitor should reach a gym's website and map location from its card · AC-GYM-004
6. visitor should see only gyms from the chosen county when filtering by county · AC-GYM-002
7. visitor should find gyms from other counties again after resetting the county filter · AC-GYM-002
8. visitor should see the no-data message when there are no gyms to show · AC-GYM-005
9. visitor should see a network error message when gyms cannot be loaded because the connection fails · AC-GYM-005
10. visitor should see a server error message when gyms cannot be loaded because of a server problem · AC-GYM-005
11. visitor should see the gym list after retrying when gyms failed to load · AC-GYM-005
12. visitor should reach the next page of gyms · AC-GYM-005
13. visitor should return to the previous page of gyms with Back · AC-GYM-005
14. visitor should see the same page of gyms after reloading · AC-GYM-005
15. visitor should stay within the chosen county when moving to its next page · AC-GYM-002
16. visitor should see the chosen county after reloading · AC-GYM-002
17. visitor should see only the shared county when opening a shared county link · AC-GYM-002
18. visitor should find a gym by its county name · AC-GYM-003
19. visitor should not find a gym by anything other than its name or county · AC-GYM-003
20. visitor should see a gym's free trial offer on its card · AC-GYM-004
21. visitor should see the map with the shared county when opening a shared map link · AC-GYM-007
22. visitor should return to the gym list with Back after switching to the map · AC-GYM-007
23. visitor should see pins only for the chosen county when filtering the map by county · AC-GYM-008
24. visitor should see gyms in their real locations on the map · AC-GYM-009
25. visitor should see a gym's details and links when opening its pin · AC-GYM-010
26. visitor should see only the searched gym's pin when searching on the map · AC-GYM-011
27. Gyms map should have no WCAG 2.1 A/AA violations in the <theme> theme · AC-GYM-015
28. visitor should keep the pins and be offered the list when map tiles fail to load · AC-GYM-013
29. visitor should see the gym list when opening a map link while the map is off · AC-GYM-014
30. visitor should not download the map when staying on the gym list · AC-GYM-016
31. visitor should find a gym with an accented name without typing the accent · AC-GYM-003
32. Gyms page header should match the approved image · none (visual baseline)
33. Gyms map popup should keep its accessible structure · none (aria baseline)
34. Gyms empty state should keep its accessible structure · none (aria baseline)

Scenarios 1–11 are in `gyms.ui.acceptance.spec.ts`; 12–20 and 31 in
`gyms-navigation.ui.acceptance.spec.ts` (12–15 and 19 mocked); 21–26 and 28–30 in
`gyms-map.ui.acceptance.spec.ts`; 27 in `gyms-map.a11y.acceptance.spec.ts` (one test per
theme); 32–34 in `gyms.snapshot.acceptance.spec.ts`. Map details are in [Planned](#planned).

### API

1. client should receive each published gym with its details (`@smoke`) · AC-GYM-001
2. client should receive only gyms from the chosen county when filtering by county · AC-GYM-002
3. client should receive gyms ordered by name · AC-GYM-001
4. client should page through the directory in distinct slices with correct links · AC-GYM-005
5. client should receive an empty page with valid pagination for a page beyond the last · AC-GYM-005
6. client should get a bad request for <param> "<value>" · AC-GYM-002
7. client should get a validation error on <param> when <param> <value> is out of range · AC-GYM-005
8. client should receive the details of a published gym by id · none
9. client should get not found for a gym id that does not exist · none
10. client should get a validation error on the id for a gym id that is <malformed> · none

Scenarios 6, 7 and 10 are data-driven over `tests/features/common/testdata/invalid-values.ts`
(6 covers an unknown county and non-numeric paging values). Errors are asserted as RFC 9457
problem documents (`expectProblem`): status, `type`, and for validation failures the
offending `field` + `errorCode`. Get-by-id has no AC-ID in the app repo yet.

## Constraints

- Search matches gym name and county only. County and page are part of the address, so a shared link opens the same view.
- A search that names one gym lists that gym and no other.
- A partial name is the seeded partial name for that gym.
- Directions use the gym's latitude, then its longitude.
- The status badge shows the published label for the gym's status.

## Planned

Map view, from User Story 5 and AC-GYM-007 to AC-GYM-016 in `bjjeire-java/specs/`.
Written from the app spec and its tests, then automated against the running app. UI only:
the app's unit and Pact tests own the `GymsMap` flag on the wire, and the suite does not
assert the flag API.

### Test design for the map

**Setup for all of them**

- New file `gyms-map.ui.acceptance.spec.ts`, with
  `test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, GymsMap: true } })` at file
  scope. Scenario 29 needs `GymsMap: false`, so it goes in its own `test.describe` or file.
  `GymsMap` is off unless an environment enables it, so it must be set explicitly.
  Scenario 27 is in `gyms-map.a11y.acceptance.spec.ts` with the same setup, because the `a11y`
  projects select by filename, not by the `@a11y` tag.
- `FeatureFlagOverrides` in `src/ui/fixtures/feature-flags.fixture.ts` has `GymsMap` as an
  optional key, left out of `ALL_FEATURES_ENABLED`, so other specs keep the environment's value.
- Fulfil `**/tile.openstreetmap.org/**` with a blank image, except in scenario 28. Tests must
  not depend on live OpenStreetMap or send it automated traffic. Never compare tile images.
- Page object additions (test IDs from `bjjeire-java/src/bjjeire-app/src/constants/gymDataTestIds.ts`):
  `gym-map`, `gym-map-pin`, `gym-map-popup`, `gym-map-popup-name`, `gym-map-popup-county`,
  `gym-map-popup-address`, `gym-map-popup-website-link`, `gym-map-popup-directions-link`,
  `gym-map-notice-tiles-failed`, `gyms-view-switch`, `gyms-view-switch-list`,
  `gyms-view-switch-map`. A named pin is `getByRole('button', { name: <gym name> })`.

**Observed on the running app (planner, scenarios 21-26, 30; tiles were live, see report)**

- Map URL is `/gyms?view=map`, county as `county=Cork`, search as `q=...` (not a path). Switching from the
  list gives `/gyms?county=Cork&view=map`; Back returns to `/gyms?county=Cork`.
- View switch is a group labelled "Choose how to view gyms" with two buttons, List and Map. The current one
  has `aria-pressed=true`, asserted with `toHaveAttribute`. Test ids `gyms-view-switch-list` and `gyms-view-switch-map` exist.
- The map region is `getByRole('region', { name: 'Map of Brazilian Jiu-Jitsu gyms in Ireland' })`. The
  `gym-map` test id is on a wrapper that also holds the notices, not on the region. Pins are buttons named
  by gym, 28x28 px boxes. Popup is a group named by gym with a close button "Close gym details".
- Popup county reads "Cork County", the same as the card. Links read "Visit Website" and "Get Directions";
  directions href is `https://www.google.com/maps/search/?api=1&query=51.8985,-8.4706`, same as the card.
- Environments hold the full dataset: 62 gyms in total, 16 in Cork, many Cork pins overlap near Cork city.
  Assert named pins, never totals.
- Tile-failed notice copy: "The map background could not be loaded. The pins are still available." then a
  link "View the gym list", which keeps the county.
- With the flag off the app keeps `?view=map` in the URL while showing the list (app test); path stays `/gyms`.
- Built image assets: `/assets/gym-map-<hash>.js` and `/assets/gym-map-<hash>.css`. A plain `/gyms` load
  requests neither, and no tiles.

**Known gaps**

- The real flag path from API to SPA was run once by hand on 2026-11-02, with scenario 21's
  checks and no `GymsMap` override, and it passed. No committed test covers it.
- Axe reports text over a tile or a translucent surface as incomplete, not as a violation, so
  scenario 27 would still pass there. Today it cannot judge the attribution text.
- Axe does not judge focus indicators or pin contrast on tiles. The app's browser tests own
  those.

#### visitor should see the map with the shared county when opening a shared map link

- Layer: UI · Tags: @acceptance · Data: SEEDED_GYM_HARBOUR_CITY, SEEDED_GYM_BLACKWATER_VALLEY, SEEDED_GYM_LIFFEY_GRAPPLING (seeded) · Mocked: tiles only
- Covers: AC-GYM-007
- Oracle: the seeded Cork gyms have pins and the seeded Dublin gym does not. Cork is the chosen county.
- Steps:
  1. When a visitor opens a shared link to the map for Cork
- Expected results:
  - Then the map is displayed and marked as the current view
  - And Cork is the chosen county
  - And the Cork gyms have pins and the Dublin gym does not
- Why: a shared map link that opens the list, or the wrong county, cannot be sent on.

#### visitor should return to the gym list with Back after switching to the map

- Layer: UI · Tags: @acceptance · Data: seeded · Mocked: tiles only
- Covers: AC-GYM-007
- Oracle: the gym list for the seeded Cork county is showing again after Back.
- Steps:
  1. Given a visitor is on the gym list for Cork
  2. When the visitor switches to the map
  3. And the visitor goes back
- Expected results:
  - Then the gym list for Cork is displayed
- Why: a map opened from the list that ignores Back leaves the visitor without the list they came from.

#### visitor should see pins only for the chosen county when filtering the map by county

- Layer: UI · Tags: @acceptance · Data: SEEDED_GYM_HARBOUR_CITY, SEEDED_GYM_BLACKWATER_VALLEY, SEEDED_GYM_LIFFEY_GRAPPLING (seeded) · Mocked: tiles only
- Covers: AC-GYM-008
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. Given a visitor is on the map
  2. When the visitor filters by Cork
- Expected results:
  - Then the Cork gyms have pins and the Dublin gym does not
  - And the map has moved closer to the Cork gyms
- Why: a county filter that leaves another county's pins on the map shows the wrong gyms.

#### visitor should see gyms in their real locations on the map

- Layer: UI · Tags: @acceptance · Data: SEEDED_GYM_LIFFEY_GRAPPLING, SEEDED_GYM_HARBOUR_CITY (seeded) · Mocked: tiles only
- Covers: AC-GYM-009
- Oracle: the seeded coordinates of the Dublin and Cork gyms. Dublin is north-east of Cork, close enough that a latitude/longitude swap fails.
- Steps:
  1. When a visitor opens the map of all gyms
- Expected results:
  - Then the Dublin gym is north-east of the Cork gym, at the right angle
- Why: a swapped latitude and longitude still looks like a map of Ireland.

#### visitor should see a gym's details and links when opening its pin

- Layer: UI · Tags: @acceptance · Data: SEEDED_GYM_HARBOUR_CITY (seeded) · Mocked: tiles only
- Covers: AC-GYM-010
- Oracle: the seeded gym's name, county, address and links. Directions use that gym's latitude, then its longitude.
- Steps:
  1. Given a visitor is on the map, narrowed to the gym by name so no neighbouring pin covers it
  2. When the visitor opens the gym's pin
- Expected results:
  - Then the gym name, county and address are shown
  - And its website and directions links match its card and open safely in a new tab
- Why: a pin that shows another gym's address or link sends the visitor to the wrong place.

#### visitor should see only the searched gym's pin when searching on the map

- Layer: UI · Tags: @acceptance · Data: SEEDED_GYM_HARBOUR_CITY (seeded) · Mocked: tiles only
- Covers: AC-GYM-011
- Oracle: the seeded gym is the only pin, and the map moves from an overview to street level. A pin that was already near the centre is not enough.
- Steps:
  1. Given a visitor is on the map
  2. When the visitor searches for a gym by name
- Expected results:
  - Then only that gym has a pin
  - And the map has zoomed to it
- Why: a search that leaves other pins up, or does not move the map, hides the gym the visitor asked for.

Test design: tiles mocked. Street level is a tile zoom from 13 to 18. The pin finishes within 40 px of the map centre.

#### Gyms map should have no WCAG 2.1 A/AA violations in the `<theme>` theme

- Layer: UI · Tags: @acceptance, @a11y · Data: SEEDED_GYM_HARBOUR_CITY (seeded) · Mocked: tiles only
- Covers: AC-GYM-015
- Oracle: axe reports no WCAG 2.1 A or AA violations at the pinned axe-core version, in each theme.
- Steps:
  1. Given a visitor has the map open in the <theme> theme
  2. And the gym's pin is open and fully faded in
- Expected results:
  - Then no accessibility violations are found
- Why: a map popup that fails contrast or naming is unusable with a screen reader.

Test design: UI · @a11y · tiles use a normal blend before the scan, because the map's lighter blend crashes axe colour rules. The theme is the stored theme, including competition.

#### visitor should keep the pins and be offered the list when map tiles fail to load

- Layer: UI · Tags: @acceptance · Data: SEEDED_GYM_BLACKWATER_VALLEY (seeded; Fermoy, no near neighbour, so no overlapping Cork pin can intercept the click) · Mocked: tiles aborted
- Covers: AC-GYM-013
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. Given map tiles cannot be loaded
  2. When a visitor opens the map for Cork
- Expected results:
  - Then a notice offers the gym list and the map stays open
  - And the Cork gym's pin can still be opened
  - And following the notice shows the gym list for Cork
- Why: a failed map background that removes the pins leaves the visitor with nothing to open.

Test design: the tile request is aborted, not replaced with a blank image.

#### visitor should see the gym list when opening a map link while the map is off

- Layer: UI · Tags: @acceptance · Data: seeded · Mocked: tiles only
- Covers: AC-GYM-014
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. Given the map feature is off
  2. When a visitor opens a link to the map for Cork
- Expected results:
  - Then the gym list for Cork is displayed on the Gyms page
  - And the visitor is not offered a choice of view
- Why: a map link while the map is off must still show that county's gyms.

Test design: map flag off. The address stays on Gyms and does not fall through to About.

#### visitor should not download the map when staying on the gym list

- Layer: UI · Tags: @acceptance · Data: seeded · Mocked: tiles only
- Covers: AC-GYM-016
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. When a visitor opens Gyms and stays on the list
- Expected results:
  - Then no map code or tiles are requested
  - And switching to the map then requests them
- Why: downloading the map on the list makes every visit pay for a map the visitor did not open.

Test design: run against a built image. The list requests neither a map tile nor the gym-map asset. Switching to the map does.
