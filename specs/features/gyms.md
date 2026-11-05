# Acceptance spec: Gyms

**App spec**: `bjjeire-java/specs/features/gyms.md`
**Database**: `bjjeire-java/specs/database-contracts/gym.md`
**Slice**: `tests/features/gyms/` · `src/ui/pages/gyms/` · `src/api/features/gyms/`
**Seeded**: `tests/features/gyms/seeded.ts`

## Scenarios (must match test titles)

### UI

1. visitor should see the gym list when opening Gyms (`@smoke`)
2. visitor should see an empty state when no gym matches the search
3. visitor should find only the gym searched for by name
4. visitor should find a gym by part of its name
5. visitor should reach a gym's website and map location from its card
6. visitor should see only gyms from the chosen county when filtering by county
7. visitor should find gyms from other counties again after resetting the county filter
8. visitor should see the no-data message when there are no gyms to show
9. visitor should see a network error message when gyms cannot be loaded because the connection fails
10. visitor should see a server error message when gyms cannot be loaded because of a server problem
11. visitor should see the gym list after retrying when gyms failed to load
12. visitor should reach the next page of gyms
13. visitor should return to the previous page of gyms with Back
14. visitor should see the same page of gyms after reloading
15. visitor should stay within the chosen county when moving to its next page
16. visitor should see the chosen county after reloading
17. visitor should see only the shared county when opening a shared county link
18. visitor should find a gym by its county name
19. visitor should not find a gym by anything other than its name or county
20. visitor should see a gym's free trial offer on its card
21. visitor should see the map with the shared county when opening a shared map link
22. visitor should return to the gym list with Back after switching to the map
23. visitor should see pins only for the chosen county when filtering the map by county
24. visitor should see gyms in their real locations on the map
25. visitor should see a gym's details and links when opening its pin
26. visitor should see only the searched gym's pin when searching on the map
27. Gyms map should have no WCAG 2.1 A/AA violations in the `<theme>` theme
28. visitor should keep the pins and be offered the list when map tiles fail to load
29. visitor should see the gym list when opening a map link while the map is off
30. visitor should not download the map when staying on the gym list

Scenarios 12–20 are in `gyms-navigation.ui.acceptance.spec.ts`. Scenarios 12–15 and 19 are mocked.
Scenarios 21–26 and 28–30 are in `gyms-map.ui.acceptance.spec.ts`, and scenario 27 is in
`gyms-map.a11y.acceptance.spec.ts`. Their details are in [Planned](#planned).

### API

1. client should receive each published gym with its details
2. client should receive only gyms from the chosen county when filtering by county
3. client should receive gyms ordered by name
4. client should page through the directory in distinct slices with correct links; client should receive an empty page with valid pagination for a page beyond the last
5. client should get a bad request for an unknown county "<value>"
6. client should get a bad request for a non-numeric page / page size "<value>"
7. client should get a validation error on page / pageSize when `<value>` is out of range
8. client should receive the details of a published gym by id
9. client should get not found for a gym id that does not exist
10. client should get a validation error on the id for a gym id that is `<malformed>`

Scenarios 5–7 and 10 are data-driven over `tests/features/common/testdata/invalid-values.ts`.
Errors are asserted as RFC 9457 problem documents (`expectProblem`): status, `type`, and
for validation failures the offending `field` + `errorCode`.

## Constraints

- Search matches gym name and county only. Page and county are URL state.
- After `searchFor`, `expectResultCount(1)` — uniqueness, not merely visible.
- Partial name: `SEEDED_GYM_*_PARTIAL_NAME`, never `name.slice`.
- Maps link: `query=lat,lng` from GeoJSON `[lng, lat]`.
- Status on the wire is `GymStatus` PascalCase; badge copy must follow the
  mapper, not a lowercased guess.

## Planned

Map view, from User Story 5 and AC-GYM-007 to AC-GYM-016 in `bjjeire-java/specs/`.
Written from the app spec and its tests, then automated against the running app. UI only:
the app's unit and Pact tests own the `GymsMap` flag on the wire, and the suite does not
assert the flag API.

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
- Given/When/Then:
  - When a visitor opens a shared link to the map for Cork
  - Then the map is displayed and marked as the current view
  - And Cork is the chosen county
  - And the Cork gyms have pins and the Dublin gym does not
- Why: AC-GYM-007, SC-005. The app's page tests cover this against mocks; only this proves it on real data.

#### visitor should return to the gym list with Back after switching to the map

- Layer: UI · Tags: @acceptance · Data: seeded · Mocked: tiles only
- Given/When/Then:
  - Given a visitor is on the gym list for Cork
  - When the visitor switches to the map
  - And the visitor goes back
  - Then the gym list for Cork is displayed
- Why: AC-GYM-007. Start on the list, because a directly opened link has no earlier page to return to.

#### visitor should see pins only for the chosen county when filtering the map by county

- Layer: UI · Tags: @acceptance · Data: SEEDED_GYM_HARBOUR_CITY, SEEDED_GYM_BLACKWATER_VALLEY, SEEDED_GYM_LIFFEY_GRAPPLING (seeded) · Mocked: tiles only
- Given/When/Then:
  - Given a visitor is on the map
  - When the visitor filters by Cork
  - Then the Cork gyms have pins and the Dublin gym does not
  - And the map has moved closer to the Cork gyms
- Why: AC-GYM-008, SC-004. Full datasets, so assert named gyms, not pin totals. Prove the move by the two Cork pins being further apart on screen than before.

#### visitor should see gyms in their real locations on the map

- Layer: UI · Tags: @acceptance · Data: SEEDED_GYM_LIFFEY_GRAPPLING, SEEDED_GYM_HARBOUR_CITY (seeded) · Mocked: tiles only
- Given/When/Then:
  - When a visitor opens the map of all gyms
  - Then the Dublin gym is north-east of the Cork gym, at the right angle
- Why: AC-GYM-009, SC-004. From the two pins' on-screen boxes: Dublin is right of and above Cork, and vertical distance divided by horizontal distance is between 0.95 and 1.2. The true geography gives about 1.08. Swapped latitude and longitude gives about 1.53 with the same directions, so a direction check alone cannot catch a swap.

#### visitor should see a gym's details and links when opening its pin

- Layer: UI · Tags: @acceptance · Data: SEEDED_GYM_HARBOUR_CITY (seeded) · Mocked: tiles only
- Given/When/Then:
  - Given a visitor is on the map
  - When the visitor opens a gym's pin
  - Then the gym's name, county and address are shown
  - And its website and directions links match its card
- Why: AC-GYM-010, SC-003. Compare with the DTO. Directions use `query=lat,lng`, so `51.8985,-8.4706` here. Both links open in a new tab with `rel="noopener noreferrer"`. The map is narrowed to the gym with `q=`, because Barão Jiu Jitsu Cork sits about 200 m away and its pin can cover this one.

#### visitor should see only the searched gym's pin when searching on the map

- Layer: UI · Tags: @acceptance · Data: SEEDED_GYM_HARBOUR_CITY (seeded) · Mocked: tiles only
- Given/When/Then:
  - Given a visitor is on the map
  - When the visitor searches for a gym by name
  - Then only that gym has a pin
  - And the map has zoomed to it
- Why: AC-GYM-008, AC-GYM-011. Assert exactly one `gym-map-pin`, the uniqueness rule from Constraints. Oracle is the map tile zoom (`z` in the tile URLs): below 13 before the search, 13 to 18 after (street level, not maximum; the app uses 15), plus the pin within 40 px of the map centre. A position check alone proves nothing, because the pin is already about 22 px from the horizontal centre before any search.

#### Gyms map should have no WCAG 2.1 A/AA violations in the `<theme>` theme

- Layer: UI · Tags: @acceptance, @a11y · Data: SEEDED_GYM_HARBOUR_CITY (seeded) · Mocked: tiles only
- Given/When/Then:
  - Given a visitor has the map open with a gym's pin open, in each of the light, dark and competition themes
  - Then no accessibility violations are found
- Why: AC-GYM-015. Use `expectNoWcagViolations`. Competition is not a `colorScheme`, so set the theme through `localStorage['bjjeire-theme']` (`light`, `dark`, `competition`) in an init script. Report violations as app bugs. Leaflet paints tiles with `mix-blend-mode: plus-lighter`, which crashes axe's `color-contrast` and `link-in-text-block` rules and skips them for the whole page while the scan still reports no violations. So the test sets tiles to `normal` before scanning, and `expectNoWcagViolations` fails if an axe rule crashes.

#### visitor should keep the pins and be offered the list when map tiles fail to load

- Layer: UI · Tags: @acceptance · Data: SEEDED_GYM_BLACKWATER_VALLEY (seeded; Fermoy, no near neighbour, so no overlapping Cork pin can intercept the click) · Mocked: tiles aborted
- Given/When/Then:
  - Given map tiles cannot be loaded
  - When a visitor opens the map for Cork
  - Then a notice offers the gym list and the map stays open
  - And the Cork gym's pin can still be opened
  - And following the notice shows the gym list for Cork
- Why: AC-GYM-013. Abort the tile route instead of fulfilling it.

#### visitor should see the gym list when opening a map link while the map is off

- Layer: UI · Tags: @acceptance · Data: seeded · Mocked: tiles only
- Given/When/Then:
  - Given the map feature is off
  - When a visitor opens a link to the map for Cork
  - Then the gym list for Cork is displayed on the Gyms page
  - And the visitor is not offered a choice of view
- Why: AC-GYM-014, SC-006. Needs `GymsMap: false`. Assert the path stays `/gyms` and is not `/about`.

#### visitor should not download the map when staying on the gym list

- Layer: UI · Tags: @acceptance · Data: seeded · Mocked: tiles only
- Given/When/Then:
  - When a visitor opens Gyms and stays on the list
  - Then no map code or tiles are requested
  - And switching to the map then requests them
- Why: AC-GYM-016, SC-007. Record request URLs from before navigation and match `tile.openstreetmap.org` and `/assets/gym-map-`. The final step proves the check can see them. Against a local Vite dev server the chunk names differ, so run it against a built image.
