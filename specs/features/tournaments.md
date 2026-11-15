# Acceptance spec: Tournaments

**App spec**: `bjjeire-java/specs/features/tournaments.md` (design record: `bjjeire-java/specs/001-tournament-registration/`)
**Requirements**: `bjjeire/requirements` · epic `&11`
**Slice**: `tests/features/tournaments/` (API, UI and a11y specs) · `src/ui/pages/tournaments/` (list, card, detail and organiser page objects) · `src/api/features/tournaments/tournaments.service.ts` (raw clients for the error paths; `getTournaments` checks a placeholder page schema from `tournaments.schemas.ts` until the published contract has tournament schemas) (the header section is shared)
**Agent seed**: `tests/agents/seed.spec.ts` (project `agent-seed`: signed in, flags pinned on, shell mounted)
**Seeded**: three published tournaments in the app's test dataset (`bjjeire-java/seeder/data-test/tournaments/`): `acceptance-open` (registration open, limit 200), `acceptance-opens-later` (opens in 7 days), `acceptance-closed` (closed yesterday). Each has five divisions. `acceptance-open` and `acceptance-opens-later` share 2 June 2035, a €25.00 fee and the National Indoor Arena; `acceptance-closed` has its own day (14 July 2035), fee (€30.00) and venue (UL Sport Arena), so a card showing another tournament's values is caught. Dates are relative to the seed run. Recorded in `tests/features/tournaments/seeded.ts`
**Status**: planned · **Reconciled with tests**: 2026-11-13 (both scenarios; the API scenario is red on an app finding: the gate's 404 problem lacks `traceId`. Fixed in the app on 2026-11-14, not yet deployed to an environment); slice 1 scenarios added 2026-11-14; slice 2 scenarios added 2026-11-15 (planned, local Docker stack only, see Slice 2); reconciled with the tree 2026-11-14: every planned scenario is implemented except two API scenarios, "client should get the public details of a published tournament by its address name" and "client should list the seeded tournaments with their registration state", which Ian has parked until the published contract has tournament schemas (their blocks stay under Planned and are not in the numbered list). The deep-link and organiser sign-in UI tests pass again since F1 stopped reproducing (2026-11-15); six scenarios added 2026-11-15 (two UI, two a11y, two API; the list a11y test was red on colour-contrast finding F6 until the 2026-11-15 redeploy)

BjjEire is adding tournaments it runs itself: the admin sets one up, competitors create an
account, sign up for a division and pay, and results feed a public leaderboard. The app is
building this in slices behind the `Tournaments` flag, which is off unless an environment
enables it. Two slices have shipped: the flag and the access rules that keep the existing
directory open to read and closed to competitors, then tournament set-up and the public
pages. A visitor can list published tournaments at `/tournaments` and open one to see its
details, fee, registration window in Irish time, and divisions. No page offers a sign-up
yet; that arrives with the sign-up slice. The organiser's set-up screens exist but need the
organiser's sign-in.

The issue numbers are placeholders until the GitLab issues exist.

## Scenarios (must match test titles)

### UI

1. visitor should see no tournament or account entry when tournaments are switched off · `#5038`
2. visitor should find a published tournament in the tournament list (`@smoke`) · `#5002`
3. visitor should see a tournament entry in the navigation when tournaments are switched on · `#5002`
4. visitor should see a tournament's details, fee, registration window and divisions · `#5002`
5. visitor should see when registration opens and no sign-up when registration has not opened · `#5003`
6. visitor should see that registration is closed and no sign-up when registration has closed · `#5003`
7. visitor should see registration times in Irish time when the browser is in another time zone · `#5002`
8. visitor should see no results when no tournament matches the search · `#5002`
9. visitor should see a tournament's details when opening its address directly · `#5002`
10. visitor should be asked to sign in as an organiser when opening tournament management · `#5004`
11. visitor should see a tournament is not found when opening the address of one that does not exist · `#5002`
12. visitor should see how many divisions a tournament has on its list card · `#5002`
13. visitor should find no accessibility violations on the tournament list · none
14. visitor should find no accessibility violations on a tournament's details · none
15. visitor should see the number of tournaments in the list header matching the tournaments listed · `#5002`

### API

1. client should get not found for <route> when tournaments are switched off · `#5038`
2. client should get not found for a tournament that does not exist when the address is <address> · `#5002`
3. client should be refused a tournament list request with an out-of-range or malformed paging value (<parameters>) · none
4. client should be refused the organiser tournament routes without a token when requesting <route> · `#5004`
5. client should get consecutive tournaments on consecutive pages when paging one at a time · none
6. client should be refused the competitor routes without a token when requesting <route> · `#5009`

Scenario 1 is data-driven over four routes, in `tournaments.api.acceptance.spec.ts`. `<route>` is one of: the tournament list, the competitor's own profile, the competitor's own registrations, a new registration (mapping in the block below).

Scenarios 2 to 6 are in `tournaments-switched-on.api.acceptance.spec.ts`, the file for environments with tournaments on. The flag-off file above fails where the flag is on, and this file fails where it is off, so exactly one of the two can pass.

- Scenario 2 is data-driven over `<address>`: an unknown name, a name with capitals and a space, an over-long name.
- Scenario 3 is data-driven over `<parameters>`: page 0 and -1, page size 0 and 101 (validation errors on the field), page size `abc` and `1.5` (bad request).
- Scenario 4 is data-driven over `<route>`: the organiser list, an organiser read, a new tournament, an update, a publish. No request carries a body.
- Scenario 6 is data-driven over `<route>`: the competitor's own profile, a profile save (no body), a profile deletion, the competitor's history, the competitor's registrations.

## Constraints

- `Tournaments` is off by default. A test that needs it on must set it explicitly; `ALL_FEATURES_ENABLED`
  pins it off, so shared chrome is identical on every environment and only tournaments specs turn it on.
- `#5036` (the directory stays readable without an account) is proven by the existing gyms,
  events, competitions and stores suites passing unchanged. It gets no scenario of its own.
- Competitor accounts live in a separate sign-in tenant that does not exist yet in any
  environment. Nothing here can sign in as a competitor until it does.
- The Docker stack (UI :3000, API :5003) runs with `FEATURE_TOURNAMENTS=true` and the test dataset, so the flag-off API scenario cannot run there and the slice 1 scenarios can (run with `TOURNAMENTS_FLAG=on`; the profile default is off). The UI slice 1 scenarios stub the browser's flags with `Tournaments: true`; `ALL_FEATURES_ENABLED` pins it off on purpose.
- Detail pages are reached from the list in the existing scenarios (written while F1 was open). F1 no longer reproduces (2026-11-15), so direct loads are safe; the direct-address scenarios and the not-found scenario load by address on purpose.
- The slice 1 scenarios need an environment with `FEATURE_TOURNAMENTS=true` on the API and
  the app's test dataset seeded. The API hides every tournament route when the flag is off, so
  stubbing the flag in the browser alone is not enough. The flag-on API spec and both flag-on UI
  describes (list and details) are tagged `@tournaments-on`, and the flag-off API spec `@tournaments-off`; each also checks the flag
  endpoint in its Given step, so a wrong `TOURNAMENTS_FLAG` fails with a message naming it.
- **`TOURNAMENTS_FLAG=on|off`** says whether the environment's API serves tournaments. The config
  excludes the opposite tag set from every project (UI and API), so a full run is not red by
  construction. Defaults per `APP_ENV` (`src/shared/config/profile-defaults.ts`): every profile off (the compose
  file defaults the flag off and the gitops values never set `FEATURE_TOURNAMENTS`); a Docker stack started with
  `FEATURE_TOURNAMENTS=true`, as the local one is, needs `TOURNAMENTS_FLAG=on`. With no value and no default both sets are excluded and the
  run says so.
- Registration times are shown in Irish time whatever the browser's time zone. The seeded
  dates are relative to the seed run, so oracles name the seeded day, not a fixed date.
- A draft is never visible to a visitor (`#5001`). The app's API integration tests own that
  rule; the test dataset seeds no drafts, so there is nothing to observe here.

## Findings

- **F1 (app, open): a direct load or reload of any nested route renders a blank page.** Observed 2026-11-14 on the Docker stack: `/tournaments/acceptance-open` (also `/events/xyz` and `/admin/tournaments`) is blank with 10 console errors, because the frontend build uses `base: './'` (`vite.config.ts:86`), so assets resolve to `/tournaments/assets/...` and the server answers HTML. Reaching the page by clicking from the list works. The detail and not-found pages are shareable addresses, so this breaks every shared link. Do not encode the blank page. The scenarios below reach the detail page from the list; the two deep-link scenarios are expected to fail until F1 is fixed.

- **F2 (spec, informational): an address holding an encoded slash is refused with 400, not 404.** Observed 2026-11-14 on the Docker stack: `/api/v1/tournament/a%2Fb` answers 400 (the server rejects the encoded slash before the app). The contract and app spec say nothing about malformed slugs, so no row asserts it. `Not A Slug` (encoded space) and a 300-character name both answer 404 as the block predicted.

- **F1 update (2026-11-15): no longer reproduces on the Docker stack.** `/tournaments/acceptance-open`, `/admin/tournaments`, `/account/profile` and `/gyms/does-not-exist` now load the app shell with assets from `/assets/...` (all 200) instead of a blank page. The stack was rebuilt since 2026-11-14. The deep-link and organiser sign-in scenarios were re-run 2026-11-15 and pass; the "red on F1" notes are dropped. Not verified with the flag on in the browser: the planner's browser is pinned to `Tournaments: false` by the seed and cannot be changed from the MCP tools.

- **F3 (suite seed vs live data, resolved 2026-11-15: the stack was reseeded and `acceptance-closed` now has five divisions): the live `acceptance-closed` has 4 divisions, not 5.** Observed 2026-11-15 on the Docker stack: `GET /api/v1/tournament/acceptance-closed` returns `divisionCount: 4` (ids `...0301` to `...0304`; the No-Gi · Female `-66.5 kg` division is missing), while `bjjeire-java/seeder/data-test/tournaments/acceptance-closed.json` lists five, `acceptance-open` and `acceptance-opens-later` hold five, and the Seeded line above and `seeded.ts` say every tournament has five. Either the stack was seeded from an older file or the seeder drops one division. No current test asserts the closed tournament's count, but the list-card scenario below would fail for it. Gap for the app repo's seeder; the new card scenario uses `acceptance-open` for that reason.

- **F4 (spec, informational): with the flag off, the SPA answers a direct load of `/tournaments`, `/tournaments/<slug>`, `/account/profile` and `/admin/tournaments` by redirecting to `/events`.** Observed 2026-11-15. FR-038 says only that no entry point is shown, so the redirect has no rule behind it and no row asserts it.

- **F5 (spec, informational): the Spec Kit places `#5009` and `#5012` at lower tiers only**, but this spec carries a UI scenario for `#5012` (owner's defect report) and now a thin API check for `#5009`. Both stay as environment checks, not depth.

- **F6 (app, resolved 2026-11-15 by the redeploy that added `--color-info-300`; both a11y tests pass): the "Not open yet" registration badge on the tournament list failed WCAG 2.1 AA colour contrast.** Observed 2026-11-15 on the Docker stack by the list a11y scenario: axe `color-contrast` (serious) on `.bg-info-500/10`, text `#7a8b96` on `#232628`, 12px normal, 4.32:1 against the required 4.5:1 (dark theme). The details page is clean. The list a11y test was red until the badge colour was fixed; the rule was never excluded.

## Planned

Implementation order recommended on 2026-11-14 (cheapest and most stable first): list, API get by slug, API list, API unknown address, API paging bounds, nav entry on, details, not open, closed, Irish time, search no match, API organiser routes refused, then the two that wait on F1 (direct address, organiser sign-in gate). Done: the page objects, the API service and `seeded.ts` exist. Two API scenarios (get by address name, list with state) are parked, see their blocks.

Rehearsal key: **[snapshot]** rehearsed from live Playwright CLI snapshots of the Docker stack on 2026-11-14 (list `/tournaments`, detail reached by client navigation); **[source]** from the app source and specs only; **[API-fact]** from the coordinator's reading of the live API.

From User Story 6 of the app spec. The UI scenario was rehearsed on 2026-11-13 against the Docker stack
(flag endpoint reports `Tournaments: false`) with the pinned Playwright CLI: the header shows the logo, Events, Gyms,
Competitions, Stores, About, a theme toggle and Support, and nothing else. The expected navigation also comes from the
app's `use-nav-items` unit test and the app spec. The API scenario's responses (404, `urn:bjjeire:not-found`,
"The tournament feature is not available.") were observed against the Docker stack by the
coordinator on 2026-11-13 with the flag off.

#### visitor should see no tournament or account entry when tournaments are switched off

- Covers: `#5038`
- Oracle: the rule in the app spec (FR-038): with the flag off, no tournament or account entry point is shown. The expected navigation is the fixed list of directory sections plus About.
- Steps:
  1. When a visitor opens the site
- Expected results:
  - Then the navigation lists Events, Gyms, Competitions, Stores and About
  - And the navigation has no tournament entry
  - And the navigation has no sign-in or account entry
- Why: a half-built feature leaking into the menu would send every visitor to a page that does not exist.

Note (2026-11-14): the SPA now has a flag-gated Tournaments entry (header and footer), so this test is a real regression check: it fails if the entry shows while the flag is stubbed off. The flag is stubbed in the browser, so it runs on any environment whatever the API's flag says. The app's `use-nav-items.unit.test.tsx` owns the rule at unit level. Rehearsed from a snapshot of the flag-on header (Events, Gyms, Competitions, Stores, Tournaments, About); the flag-off header was rehearsed on 2026-11-13.

Test design: UI · @acceptance · no data · flags stubbed with `{ ...ALL_FEATURES_ENABLED, Tournaments: false }` · default seed

#### client should get not found for <route> when tournaments are switched off

- Covers: `#5038`
- Oracle: the rule in the app spec (FR-038) and ADR-0013: with the flag off every tournament, competitor and registration route answers 404 before authentication, as an RFC 9457 problem document of type `urn:bjjeire:not-found`.
- Steps:
  1. Given the environment has tournaments switched off
  2. When a client with no token requests <route>
- Expected results:
  - Then the response is a not-found problem document
  - And the problem says the tournament feature is not available
- Why: a route that asks for a token instead of answering not-found tells the world a hidden feature exists, and one that answers at all is a switched-off feature that is still on.

Test design: API · @acceptance · data-driven over `<route>`: the tournament list = `GET /api/v1/tournament`, the competitor's own profile = `GET /api/v1/competitor/me`, the competitor's own registrations = `GET /api/v1/registration/me`, a new registration = `POST /api/v1/registration` · not mocked · cannot run where the environment's flag endpoint reports `Tournaments: true`. That is the case on the Docker stack (`FEATURE_TOURNAMENTS=true`) as of 2026-11-14. The describe is tagged `@tournaments-off`, and the config excludes it where `TOURNAMENTS_FLAG` is on, so it runs only against an environment with the flag off. Keep it; do not delete it

### Slice 1 — User Story 1, organiser publishes a tournament

#### visitor should find a published tournament in the tournament list

- Covers: `#5002`
- Oracle: the seeded tournament `acceptance-closed`: its name, day (14 July 2035), venue (UL Sport Arena), €30.00 fee and closed registration from the seed file.
- Steps:
  1. Given tournaments are switched on
  2. When a visitor opens Tournaments
  3. And the visitor searches for "Acceptance Closed"
- Expected results:
  - Then the seeded tournament is listed with its date, venue and entry fee
  - And it is marked as closed for registration
- Why: if a published tournament is missing from the list, visitors never reach its page.

Test design: UI · @smoke · @acceptance · seeded `acceptance-closed` · not mocked · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · test dataset, `Tournaments` on in the environment · the feature's one critical journey. Open it through the Tournaments navigation entry or `gotoRoute`; the list itself loads fine on a direct visit. Search is the search box (case-insensitive substring match on name only). Do not revert to `acceptance-open`: "Acceptance Open" also matches "Acceptance Opens Later" (live: 2 cards), so `expectResultCount(1)` cannot pass, and the open tournament cannot be isolated by name. "Acceptance Closed" matches only itself. Scenarios that need the open tournament (details, Irish time) reach it from the list with a scoped exact-name card lookup and assert no result count, or a count derived from `seededTournamentsMatching`, as the divisions-card scenario does. Rehearsed: [snapshot] list shows 3 cards with name, badge (Open / Closed / Not open yet), Date, Venue, Entry fee (`€25.00` on the two Dublin cards, `€30.00` on `acceptance-closed` since the 2026-11-15 reseed), "5 divisions"; the search box and result count are [source] (`useTournamentsPage`, name match)

#### visitor should see a tournament's details, fee, registration window and divisions

- Covers: `#5002`
- Oracle: the seeded tournament `acceptance-open`: tournament day 2 June 2035, National Indoor Arena, €25.00 per division, and its five seeded divisions, which fall into four groups by discipline and gender: Gi · Male (2), Gi · Female (1), No-Gi · Male (1), No-Gi · Female (1).
- Steps:
  1. Given tournaments are switched on
  2. When a visitor opens Tournaments
  3. And the visitor searches for "Acceptance Open"
  4. And the visitor opens the "Acceptance Open" tournament
- Expected results:
  - Then the tournament day and the venue are shown
  - And the entry fee is €25.00 per division
  - And the registration window is shown in Irish time
  - And registration is shown as open
  - And the divisions are listed in four groups by discipline and gender
- Why: the page is where a competitor decides whether to enter; a wrong fee, day or division list misleads every one of them.

Test design: UI · @acceptance · seeded `acceptance-open` · not mocked · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · test dataset, `Tournaments` on in the environment · reach the page by searching the list for "Acceptance Open" (the unfiltered list may not hold the seeded card on page 1), asserting the count the seed implies (2: "Acceptance Opens Later" also matches, derived from the seeded names, not a literal), then choosing "View tournament: Acceptance Open" on the exact-name card, not by `page.goto` (F1). The registration window is the API's opening and closing instants (read in the Given step, never fixed dates) shown on the Irish clock, with the "(Irish time)" label. Rehearsed [snapshot]: h1 "Acceptance Open", Date `2 June 2035`, Venue `National Indoor Arena` plus address, `€25.00 per division`, "Registration ... (Irish time)", "0 of 200 taken", status badge "Open", groups Gi · Male (2 rows), Gi · Female (1), No-Gi · Male (1), No-Gi · Female (1). The oracle lists every group's row count, so the test asserts the four group headings in order and each group's row count

#### visitor should see when registration opens and no sign-up when registration has not opened

- Covers: `#5003`
- Oracle: the rule in the app spec (`#5003`) and the seeded tournament `acceptance-opens-later`, whose registration opens 7 days after the seed run.
- Steps:
  1. Given tournaments are switched on
  2. When a visitor opens Tournaments
  3. And the visitor searches for "Acceptance Opens Later"
  4. And the visitor opens the "Acceptance Opens Later" tournament
- Expected results:
  - Then the page says registration opens on the seeded opening day
  - And no sign-up is offered
- Why: a visitor who cannot tell when entries open misses the window, and a sign-up offered early takes entries the organiser has not opened.

Test design: UI · @acceptance · seeded `acceptance-opens-later` · not mocked · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · test dataset, `Tournaments` on in the environment · reach the page by searching the list for the exact name (count 1: no other seeded name contains it), then "View tournament" (F1). The seeded opening instant is read from the API in the Given step and shown on the Irish clock. "No sign-up" means the registration section holds only a status badge ("Not open yet") and the sentence "Registration opens on <day>"; there is no button or link there, and no button or link named like a sign-up (sign up, register, enrol, pay) anywhere on the page. Honest limit: the app has no sign-up control in any state yet, so this check cannot fail until one exists; it guards the future sign-up slice. [source] for the sentence (`registrationMessage`); the list badge "Not open yet" is [snapshot]; the detail page for this slug was not captured

#### visitor should see that registration is closed and no sign-up when registration has closed

- Covers: `#5003`
- Oracle: the rule in the app spec (`#5003`) and the seeded tournament `acceptance-closed`, whose registration closed the day before the seed run.
- Steps:
  1. Given tournaments are switched on
  2. When a visitor opens Tournaments
  3. And the visitor searches for "Acceptance Closed"
  4. And the visitor opens the "Acceptance Closed" tournament
- Expected results:
  - Then the page says registration is closed
  - And no sign-up is offered
- Why: entries taken after the close break the organiser's brackets and refund rules.

Test design: UI · @acceptance · seeded `acceptance-closed` · not mocked · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · test dataset, `Tournaments` on in the environment · reach the page by searching the list for the exact name (count 1), then "View tournament" (F1). Same honest limit as the opens-later block: the no-sign-up check cannot fail until the app has a sign-up control. Sentence is "Registration is closed." [source] (`registrationMessage`); the list badge "Closed" is [snapshot]; the detail page for this slug was not captured

#### client should get the public details of a published tournament by its address name

- Covers: `#5002`
- Oracle: the seed file for `acceptance-open`: fee of 2500 cents in euro, five divisions, published.
- Steps:
  1. Given the environment has tournaments switched on
  2. When a client with no token requests the "acceptance-open" tournament
- Expected results:
  - Then the tournament is returned as published with its fee in euro cents
  - And its registration is reported as open
  - And all five seeded divisions are returned
- Why: the page's facts come from this response; checking it at the API separates a data fault from a display fault.

Test design: API · @acceptance · seeded `acceptance-open` · not mocked · tagged `@tournaments-on`, so it runs only where `TOURNAMENTS_FLAG` is on · [API-fact] only · **PARKED by Ian (2026-11-14) until the published contract has tournament schemas**: the scenario asserts the response against the generated Zod schema, and there is none yet. Do not implement it with a hand-written schema

#### client should list the seeded tournaments with their registration state

- Covers: `#5002`
- Oracle: the seed file: `acceptance-open` is open, `acceptance-opens-later` is not open yet, `acceptance-closed` is closed; each has five divisions and a fee of 2500 cents in euro. The state names are the app spec's four values (not open, open, closed, full).
- Steps:
  1. Given the environment has tournaments switched on
  2. When a client with no token lists the tournaments
- Expected results:
  - Then the three seeded tournaments are listed among the published ones
  - And each reports the registration state its seed implies
  - And each reports five divisions and a fee of 2500 euro cents
- Why: the card badges on the list come from these states; a state that is computed wrongly misleads every visitor before they open a page.

Test design: API · @acceptance · seeded `acceptance-*` (find by address name; never assert list position or total, environments hold full datasets) · not mocked · tagged `@tournaments-on`, so it runs only where `TOURNAMENTS_FLAG` is on · page through if the seeded ones are not on page 1, or request the largest page size. The state is read from the response field `registrationState`. [API-fact] · **PARKED by Ian (2026-11-14) until the published contract has tournament schemas**: it needs the generated Zod schema for the list response. Do not implement it with a hand-written schema

#### client should get not found for a tournament that does not exist when the address is <address>

- Covers: `#5002`
- Oracle: the rule in the app spec: an unknown or draft address answers 404 as a not-found problem document. The test dataset seeds no drafts, so only unknown and malformed addresses are observable.
- Steps:
  1. Given the environment has tournaments switched on
  2. When a client with no token requests a tournament by <address>
- Expected results:
  - Then the response is a not-found problem document
- Why: an address that answers with a page or a server error for a tournament that does not exist leaks internals and breaks the links visitors share.

Test design: API · @acceptance · data-driven over `<address>`: an unknown name = `does-not-exist`, a name with capitals and a space = `Not A Slug`, an over-long name · not mocked · tagged `@tournaments-on`, so it runs only where `TOURNAMENTS_FLAG` is on. Use `expectProblem` with `ProblemType.NotFound`. The malformed rows are [source] only (the controller does no slug pattern check on reads, so they should fall to not found); confirm live when implementing and drop any row that answers differently, then report it as a finding rather than encode it. Do not include `admin`: that address is the organiser list route

#### client should be refused a tournament list request with an out-of-range or malformed paging value (<parameters>)

- Covers: none, a paging bound with no requirement issue of its own; rule from the OpenAPI contract
- Oracle: the OpenAPI contract: page is at least 1 and page size is between 1 and 100; a value outside it is a 400 problem document.
- Steps:
  1. Given the environment has tournaments switched on
  2. When a client with no token lists the tournaments with <parameters>
- Expected results:
  - Then the response is a bad-request or validation problem document
- Why: an unbounded page size lets one request pull the whole collection and hide the limit the visitor's list relies on.

Test design: API · @acceptance · data-driven over `<parameters>`: page 0, page -1, page size 0, page size 101 (a validation error on the field, `urn:bjjeire:validation-error`), page size `abc`, page size `1.5` (`urn:bjjeire:bad-request`); the shared sets in `invalid-values.ts` · not mocked · tagged `@tournaments-on`, so it runs only where `TOURNAMENTS_FLAG` is on. The bounds are [source] (`@Min(1)`, `@Max(100)` on `TournamentController`); the problem types are verified live and match the other directory lists. Do not duplicate it if an API scenario for a shared pagination rule already owns it

#### visitor should see a tournament entry in the navigation when tournaments are switched on

- Covers: `#5002`
- Oracle: the app spec: with the flag on, the Tournaments entry sits in the navigation between Stores and About and leads to the tournament list.
- Steps:
  1. Given tournaments are switched on
  2. When a visitor opens the site
  3. And the visitor chooses the Tournaments entry
- Expected results:
  - Then the navigation lists Events, Gyms, Competitions, Stores, Tournaments and About
  - And the tournament list is shown
- Why: the flag-off scenario proves the entry hides; without this one a broken flag-on wiring leaves the finished pages unreachable.

Test design: UI · @acceptance · no data · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · test dataset, `Tournaments` on in the environment (the list must load) · extend the header page object's link list, do not construct a second one. Rehearsed [snapshot]: header Events, Gyms, Competitions, Stores, Tournaments, About; the footer Quick Links repeat it. Assert the header only

#### visitor should see registration times in Irish time when the browser is in another time zone

- Covers: `#5002`
- Oracle: the app spec: the window is shown in Irish time whatever the visitor's time zone. The expected opening and closing times are the seeded tournament's opening and closing instants, read from the API response in the Given step and rendered in Europe/Dublin by a suite helper (`dublin-time.ts`, written in the suite, not the app's formatter). The helper uses the same display options as the app (day, long month, year, 24-hour time), so it is independent of the visitor's browser zone and of the app's code, not of the format itself; it would not catch a wrong format that both share.
- Steps:
  1. Given tournaments are switched on
  2. When a visitor opens Tournaments
  3. And the visitor searches for "Acceptance Open"
  4. And the visitor opens the "Acceptance Open" tournament
- Expected results:
  - Then the registration window shows the Irish opening and closing times
  - And the window is labelled as Irish time
- Why: a competitor in another zone who reads the window in their own clock enters a day early or misses the close.

Test design: UI · @acceptance · seeded `acceptance-open` · not mocked · browser context `timezoneId: 'Pacific/Auckland'` set with `test.use` for the scenario (a 12-13 hour offset moves the calendar day; it needs no step of its own) · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · reach the page by searching the list and choosing the exact-name card (F1) · the seeded windows are relative to seed time, so the oracle is computed from the API's timestamps at run time, not fixed text. Rehearsed [snapshot] in the default zone only: "7 November 2026, 06:03 to 14 December 2026, 06:03 (Irish time)"; the other-zone behaviour is [source] (`formatDublinDateTime`)

#### visitor should see no results when no tournament matches the search

- Covers: `#5002`
- Oracle: the app spec's list search (by name) and the seeded names: no seeded tournament contains the search term.
- Steps:
  1. Given tournaments are switched on
  2. When a visitor opens Tournaments
  3. And the visitor searches for a name no tournament has
- Expected results:
  - Then no tournament is listed
  - And a no-results message is shown
- Why: a search that leaves the previous cards on screen tells the visitor a tournament exists that does not.

Test design: UI · @acceptance · no seeded record needed (the fixed term `zzzz-no-such-tournament`, guarded in `seeded.ts` against matching any seeded name) · not mocked · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · test dataset, `Tournaments` on in the environment · the match is client-side on name, but while a search is active the app widens the list to the API's largest page size (100) and shows page 1 (`useListPage.ts`, `wantsAllItems ? searchPageSize`), so it searches every tournament, not only the visible page. Message is "No Results Found" [source] (`tournaments.search.noResultsTitle`). Not rehearsed

#### client should be refused the organiser tournament routes without a token when requesting <route>

- Covers: `#5004`
- Oracle: the app spec's access rules: the organiser list, an organiser read by id, create, update and publish need the organiser's token; a request with none is refused as an unauthorised problem document.
- Steps:
  1. Given the environment has tournaments switched on
  2. When a client with no token requests <route>
- Expected results:
  - Then the response is an unauthorised problem document
- Why: an organiser route that answers a visitor would expose drafts, which the public list never shows.

Test design: API · @acceptance · data-driven over `<route>`: the organiser list = `GET /api/v1/tournament/admin`, an organiser read = `GET /api/v1/tournament/admin/<any id>`, a new tournament = `POST /api/v1/tournament` with an empty body, an update = `PUT /api/v1/tournament/<any id>`, a publish = `POST /api/v1/tournament/<any id>/publish` · not mocked · tagged `@tournaments-on`, so it runs only where `TOURNAMENTS_FLAG` is on · the id is a syntactically valid object id that exists nowhere. 401 `urn:bjjeire:unauthorized` per the contract (`errors` header) [source]; not verified live. The app's own `WriteAuthorizationIT` and `TournamentAdminIT` own the rule in depth, and the Spec Kit places `#5004` at lower tiers: this is a thin environment check that the route is guarded, nothing about what an organiser can do. The suite's own bearer (client-credentials) is not asserted either way: whether it holds the writer scope is unverified

#### visitor should see a tournament's details when opening its address directly

- Covers: `#5002`
- Oracle: the seeded tournament `acceptance-open` (name, day, venue), as in the details scenario. The app spec says `/tournaments/:slug` is a public page.
- Steps:
  1. Given tournaments are switched on
  2. When a visitor opens the address of the "Acceptance Open" tournament directly
- Expected results:
  - Then the tournament's name is shown
  - And the tournament day and the venue are shown
- Why: tournament links are shared by message and email; a blank page for a shared link loses every visitor who follows one.

Test design: UI · @acceptance · seeded `acceptance-open` · not mocked · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · `gotoRoute` to `/tournaments/acceptance-open` (the one place a direct load is the point). Was red on F1 (blank page, 10 console errors, 2026-11-14); F1 no longer reproduces: re-run 2026-11-15, passes. Do not weaken it, do not add `fixme`. The same break hits `/events/<id>` and every other nested route, so once fixed consider whether a cross-feature direct-link check belongs in the shared shell spec

#### visitor should be asked to sign in as an organiser when opening tournament management

- Covers: `#5004`
- Oracle: the app spec: `/admin/tournaments` asks for the organiser's sign-in before loading anything and is not in the site navigation. An anonymous browser has no organiser account, so the sign-in prompt shows and no tournament data does.
- Steps:
  1. Given tournaments are switched on
  2. When a visitor with no organiser sign-in opens tournament management
- Expected results:
  - Then the organiser sign-in prompt is shown
  - And no tournament is listed
  - And the navigation has no management entry
- Why: a management screen that loads for anyone shows draft tournaments to the public.

Test design: UI · @acceptance · no data · not mocked · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · `gotoRoute` to `/admin/tournaments` (no link leads there, so a direct load is the only way in). Was blocked by F1 (blank page 2026-11-14); F1 no longer reproduces: re-run 2026-11-15, passes. The prompt ("Organiser sign-in", button "Sign in") and the rule that it appears when the browser holds no workforce account are [source] (`AdminSignInGate`). Not rehearsed. What the suite's signed-in user sees is undecided: in-app MSAL is off on local and Docker (`PW_UI_ENTRA_AUTH` unset; the suite signs in at the API with a client-credentials bearer, not in the browser), so the seed's "signed-in" browser also holds no MSAL account and should see the prompt too. The test uses an empty `storageState`, so the visitor holds no sign-in by construction on any environment. Do not plan a scenario that signs in as the organiser until that account route is decided (see Held)

### Slice 1 — added 2026-11-15 from a live look at the Docker stack

Rehearsal: the API facts below are [API-fact], read live on 2026-11-15 (list, detail, 401s). The planner's browser is pinned to `Tournaments: false`, so the UI wording is [source] and not rehearsed.

#### visitor should see a tournament is not found when opening the address of one that does not exist

- Covers: `#5002`
- Oracle: the app spec: an unknown or draft address shows "Tournament Not Found" with a link back to the list.
- Steps:
  1. Given tournaments are switched on
  2. When a visitor opens the address of a tournament that does not exist directly
- Expected results:
  - Then the page says the tournament was not found
  - And a link back to the tournament list is offered
- Why: a stale or mistyped shared link must end on a way back, not on a blank page or a server error.

Test design: UI · @acceptance · no seeded record (the address `does-not-exist`, as in the API not-found scenario) · not mocked · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · `gotoRoute` to `/tournaments/does-not-exist` (a direct load is the point; possible now that F1 no longer reproduces). The title "Tournament Not Found" is [source] (app spec). Not rehearsed. The API scenario owns the 404 rule; this proves only what the visitor reads

#### visitor should see how many divisions a tournament has on its list card

- Covers: `#5002`
- Oracle: the seeded tournament `acceptance-open`: five divisions.
- Steps:
  1. Given tournaments are switched on
  2. When a visitor opens Tournaments
  3. And the visitor searches for "Acceptance Open"
- Expected results:
  - Then the "Acceptance Open" card says it has 5 divisions
- Why: the division count is how a competitor judges whether a tournament has their category before opening it; a wrong count sends them to the wrong event.

Test design: UI · @acceptance · seeded `acceptance-open` · not mocked · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · result count from `seededTournamentsMatching` (2: the search also matches "Acceptance Opens Later"); card picked by exact name. Card text "5 divisions" is [snapshot] from 2026-11-14. Uses `acceptance-open`; `acceptance-closed` also works since F3 was resolved

#### visitor should see the number of tournaments in the list header matching the tournaments listed

- Covers: `#5002`
- Oracle: the cards the visitor can page through, counted independently of the header, with the three seeded tournaments as the floor.
- Steps:
  1. Given tournaments are switched on
  2. When a visitor opens Tournaments
- Expected results:
  - Then the header total equals the number of tournaments listed
- Why: a header that overstates the tournaments tells a visitor there are events they cannot find.

Test design: UI · @acceptance · not mocked · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · unfiltered list, no search. Not folded into the search scenarios: under a search the header shows the browser-filtered count (`TournamentsPage`: `isSearchActive ? filteredItems.length : totalItems`), so only the unfiltered header reads the API total that the `tournament:total-plus-one` mutant corrupts. The unfiltered total is data-dependent (other workers' records), so the test counts the cards across pages (paging forward through `listApiRoute`, so it still works past one page of 20) and requires at least the seeded three, never an absolute number. It relies on data policy rule 5: no test leaves a tournament published, so the count is the seeded set plus nothing stray

#### visitor should find no accessibility violations on the tournament list

- Covers: none, a cross-cutting accessibility sweep; no requirement issue names it
- Oracle: WCAG 2.1 A and AA as run by the suite's axe sweep. The existing sweep covers no tournament route.
- Steps:
  1. Given tournaments are switched on
  2. When a visitor opens Tournaments
- Expected results:
  - Then the tournament list has no accessibility violations
- Why: the registration state is shown by a badge and wording; a screen-reader visitor who cannot read it cannot tell whether entries are open.

Test design: UI · @acceptance · `.a11y.` spec file in the feature slice · seeded list · not mocked · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · follow the existing a11y specs' scan helper and rule set. Was red on F6 (the "Not open yet" badge at 4.32:1 against 4.5:1) until the 2026-11-15 redeploy

#### visitor should find no accessibility violations on a tournament's details

- Covers: none, a cross-cutting accessibility sweep; no requirement issue names it
- Oracle: WCAG 2.1 A and AA as run by the suite's axe sweep. The existing sweep covers no tournament route.
- Steps:
  1. Given tournaments are switched on
  2. When a visitor opens Tournaments
  3. And the visitor searches for "Acceptance Closed"
  4. And the visitor opens the "Acceptance Closed" tournament
- Expected results:
  - Then the tournament details have no accessibility violations
- Why: the registration state is shown by a badge and wording; a screen-reader visitor who cannot read it cannot tell whether entries are open.

Test design: UI · @acceptance · `.a11y.` spec file in the feature slice · seeded `acceptance-closed` (the closed one loads without an open window) · not mocked · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · reached by searching the list for the exact name (the unfiltered list may not hold the seeded card on page 1), asserting count 1 in the search step (no other seeded name contains it), then "View tournament"; the page-ready check (name shown) sits in the last And step

#### client should get consecutive tournaments on consecutive pages when paging one at a time

- Covers: none, a paging rule from the OpenAPI contract with no requirement issue of its own
- Oracle: the contract's paging fields and the seeded tournaments: a page of size 1 holds one tournament, the next page holds a different one, the totals agree between the two requests, and the first page of two holds the same two tournaments in the same order.
- Steps:
  1. Given the environment has tournaments switched on
  2. When a client with no token lists the tournaments one per page, page 1
  3. And the client requests the second page
  4. And the client lists the first two tournaments on one page
- Expected results:
  - Then each page holds exactly one tournament
  - And the two pages hold different tournaments
  - And both report the same total
  - And the second page reports a previous page and the first does not
  - And together they match the first page of two
- Why: a list that repeats or skips a tournament across pages hides events from visitors who page through.

Test design: API · @acceptance · not mocked · tagged `@tournaments-on` · `GET /api/v1/tournament?page=1&pageSize=1` and `page=2`. Environments may hold more than the three seeded tournaments, so assert only the relations above, never which tournament is on a page, and never the total's value. Also fetch `page=1&pageSize=2` and assert its ids equal the two single-page ids in order, so a skipped tournament fails. No tournament schema in the contract yet: a placeholder page schema (`tournamentsPageSchema`, ids only, on `openApiPageSchema`) checks the envelope; replace it when the contract publishes the DTO. [API-fact]: page 2 of size 1 answered one tournament with `currentPage: 2`, `hasPreviousPage: true`, `hasNextPage: true`, `totalItems: 3` on the stack

#### client should be refused the competitor routes without a token when requesting <route>

- Covers: `#5009`
- Oracle: the app spec's access rules: the competitor's own profile, history and registrations need a competitor token; a request with none is refused as an unauthorised problem document. There is no public profile page.
- Steps:
  1. Given the environment has tournaments switched on
  2. When a client with no token requests <route>
- Expected results:
  - Then the response is an unauthorised problem document
- Why: a competitor route that answers a request with no sign-in would expose a person's date of birth and address to anyone.

Test design: API · @acceptance · data-driven over `<route>`: the competitor's own profile = `GET /api/v1/competitor/me`, a profile save = `PUT /api/v1/competitor/me` with no body, a profile deletion = `DELETE /api/v1/competitor/me`, the competitor's history = `GET /api/v1/competitor/me/history`, the competitor's registrations = `GET /api/v1/registration/me` · not mocked · tagged `@tournaments-on` · 401 `urn:bjjeire:unauthorized` · [API-fact] for the three GET routes (all answered 401 on the stack 2026-11-15); the PUT and DELETE rows are [source] and not verified live, so drop any that answers differently and report it as a finding. The Spec Kit places `#5009` at lower tiers: this is a thin environment check that the route is guarded, nothing about whose profile it is. Mirror the organiser-routes scenario's helper

### Slice 2 — User Story 2, competitor account and profile

Added 2026-11-15 from the app's slice 2 (`bjjeire-java/specs/features/tournaments.md`, User Story 2). Rehearsal: **[source]** only, from the app source, its SPA integration tests (`profile-page.integration.test.tsx`) and a run of the branch against a local API and dev server; not rehearsed against the Docker stack.

How a competitor signs in here: there is still no competitor tenant (see Held). The local Docker stack signs a competitor in without one: with the flag on, the header's account icon ("My account") opens `/account/profile`, which shows "Competitor sign-in" with an "Email (local sign-in)" field and a "Sign in or create an account" button (app ADR-0014, amendment 2026-11-15). The email typed is the competitor's identity: the same email is the same competitor on every run. Deleting the account ends the sessions that existed then; signing in again with that email starts a new, empty account. Each test types a fresh email (for example `competitor-<run id>@example.test`) so it starts on the create form ("Create your competitor profile"); the API answers an unsaved profile with 200, not 404. These scenarios run only where local sign-in is built in (`VITE_APP_LOCAL_SIGN_IN=true`, the local Docker stack); they need a describe tag of their own so other environments exclude them.

#### visitor should be offered competitor sign-in or registration when opening their account

- Covers: `#5006`
- Oracle: the app spec (User Story 2, "Signing in"): signed out, the account page offers sign-in or registration in one place and loads no profile.
- Steps:
  1. Given tournaments are switched on
  2. When a visitor opens their account from the navigation
- Expected results:
  - Then the visitor is asked to sign in as a competitor
  - And the visitor is offered to sign in or create an account
  - And no profile is shown
- Why: a visitor who cannot find where to sign up for an account can never enter a tournament.

Test design: UI · @acceptance · no data · not mocked · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · reach the page through the account link (F1: no direct load). Runs on any environment with the flag on: it checks only the signed-out page, not the sign-in itself. The heading "Competitor sign-in" and button "Sign in or create an account" are [source]

#### competitor should see their saved profile again after signing back in

- Covers: `#5007`
- Oracle: the app spec (User Story 2, "Profile"): the first save creates the profile and it is shown back as saved; the email shown is the one used to sign in.
- Steps:
  1. Given tournaments are switched on
  2. And a competitor has signed in with a new email
  3. When the competitor saves their name, nationality, date of birth, gender, belt and an academy
  4. And the competitor signs out and signs back in with the same email
- Expected results:
  - Then the profile shows the details they saved
  - And the profile shows the email they signed in with
- Why: a profile that is lost between visits sends competitors to the sign-up with nothing filled in, and with no record of who they are.

Test design: UI · @acceptance · creates its own competitor (unique email per test, from the test id or faker) in a test-scoped fixture and deletes it afterwards · not mocked · local Docker stack only (local competitor sign-in) · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }`. Use a typed academy name so the test does not depend on the gym seed. The saved message "Profile saved." and the heading "My competitor profile" (first visit: "Create your competitor profile") are [source]

#### competitor should be saved with a gym from the directory as their academy

- Covers: `#5008`
- Oracle: a gym from the app's test dataset (`bjjeire-java/seeder/data-test/gyms/` or the shared seed), found by part of its name.
- Steps:
  1. Given tournaments are switched on
  2. And a competitor has signed in with a new email
  3. When the competitor says their academy is in the gym directory
  4. And the competitor searches for part of a seeded gym's name and picks it
  5. And the competitor saves the profile
- Expected results:
  - Then the profile shows that gym as their academy
- Why: points are added up per academy; a competitor who cannot find their gym splits its points across spellings.

Test design: UI · @acceptance · creates its own competitor in a test-scoped fixture and deletes it afterwards · seeded gym · not mocked · local Docker stack only. Search ignores case and accents and matches part of the name. After picking, the page shows "Selected: <gym name>" and a "Change" button; on reload the "My academy is in the BJJ Éire gym directory" choice stays selected. All [source]

#### competitor should be saved with an academy typed by hand when theirs is not listed

- Covers: `#5008`
- Oracle: the app spec: "My academy is not listed" stores the typed name.
- Steps:
  1. Given tournaments are switched on
  2. And a competitor has signed in with a new email
  3. When the competitor says their academy is not listed and types its name
  4. And the competitor saves the profile
- Expected results:
  - Then the profile shows the typed academy name
- Why: small clubs are missing from the directory; their members must still be able to name them.

Test design: UI · @acceptance · creates its own competitor in a test-scoped fixture and deletes it afterwards · not mocked · local Docker stack only · [source]

#### competitor should be saved with no academy and no affiliation when they choose neither

- Covers: `#5008`
- Oracle: the app spec: "No academy" stores none, and the affiliation is optional.
- Steps:
  1. Given tournaments are switched on
  2. And a competitor has signed in with a new email
  3. When the competitor chooses no academy and leaves the affiliation empty
  4. And the competitor saves the profile
- Expected results:
  - Then the profile shows no academy
  - And the profile shows no affiliation
- Why: a competitor who trains alone must not be forced to invent a club, or they would add points to a team that does not exist.

Test design: UI · @acceptance · creates its own competitor in a test-scoped fixture and deletes it afterwards · not mocked · local Docker stack only · [source]

#### competitor should see no medals and no tournaments entered before any results

- Covers: `#5039`
- Oracle: the app spec ("Medals"): totals and tournaments entered come from recorded results, which do not exist before slice 5.
- Steps:
  1. Given tournaments are switched on
  2. And a competitor has signed in with a new email and saved a profile
  3. When the competitor opens their profile
- Expected results:
  - Then the profile shows 0 gold, 0 silver and 0 bronze
  - And the profile says they have not entered a tournament yet
- Why: a medal count that shows someone else's results, or invents some, makes the leaderboard look wrong to the person it is about.

Test design: UI · @acceptance · creates its own competitor in a test-scoped fixture and deletes it afterwards · not mocked · local Docker stack only. The empty message "You have not entered a tournament yet. Your medals will appear here." is [source]. Revisit with slice 5, when results exist: add a scenario with seeded medals then

#### competitor should be able to sign up again with the same email after deleting their account

- Covers: `#5012`
- Oracle: the owner's defect report (2026-11-15) and the app spec (User Story 2, "Deleting the account"): deletion removes the profile and ends the session; signing up again later with the same email starts a new, empty account.
- Steps:
  1. Given tournaments are switched on
  2. And a competitor has signed in with a new email and saved a profile
  3. When the competitor deletes their account
  4. And signs up again with the same email
- Expected results:
  - Then the visitor is offered to create a competitor profile
  - And none of the deleted profile's details are shown
- Why: someone who deleted their account and comes back must not be locked out of tournaments for good.

Test design: UI · @acceptance · creates and deletes a competitor · not mocked · local Docker stack only (local competitor sign-in). Wait a second between the deletion and the new sign-in: a token issued in the same second as the deletion counts as older and is refused. Delete confirmation is "Delete my account" then "Yes, delete my account"; afterwards the page shows "Competitor sign-in" again. [source]; the defect was observed by the owner on the local Docker stack before the fix

## Held

#### competitor should be refused when changing <directory section>

- Covers: `#5037`
- Question: this needs a real competitor token, and the competitor sign-in tenant and its test accounts do not exist yet. Owner: Ian (terraform, `main.app-registrations.tf`). Until then the rule is proven in the app's own integration tests (`WriteAuthorizationIT`).

#### visitor should create an account, confirm their email and sign in

- Covers: `#5006`
- Question: registration and email confirmation happen on the competitor tenant's hosted pages, which do not exist in any environment yet (app tasks.md T001). Owner: Ian (terraform, `main.app-registrations.tf`, plus two test users). The app's local stack signs competitors in without the tenant, so it cannot observe this.

#### visitor should not get a second account when registering with an email that already has one

- Covers: `#5010`
- Question: as above, the competitor tenant's hosted pages. The app proves its own half (one profile per identity) in `CompetitorIT`.

#### competitor should regain access through their email after forgetting their password

- Covers: `#5011`
- Question: as above, the competitor tenant's hosted pages; also needs a mailbox the test can read.

#### visitor should see the organiser's screens after signing in as the organiser

- Covers: `#5001`
- Question: this needs an organiser (workforce) browser sign-in through MSAL in the app. The suite signs in only at the API; the browser has no MSAL account on local and Docker. Owner: Ian. Until that is decided the organiser's write rules are proven in `TournamentAdminIT` and the app's SPA integration tests.

## Rejected

- A UI scenario that an unknown tournament address shows "Tournament Not Found" (2026-11-14). A visitor reaches an unknown address only by typing it, which hits F1, and the API not-found scenario owns the rule. Revisited 2026-11-15 after F1 stopped reproducing: now planned as one UI scenario (see Slice 1, unknown address).
- Separate UI scenarios per registration state on the list (Open, Closed, Not open yet badges) (2026-11-14). The API list scenario owns the state; the detail scenarios prove the visitor's wording for each. The list scenario proves one badge.
- A scenario for list order, earliest day first (2026-11-14). The three seeded tournaments share one day, so the seed cannot show order; the app's service tests own it. Needs a second seeded date from the app's seeder.
- Scenarios for draft, cancelled and finished tournaments (2026-11-14). The test dataset seeds none; the app's integration tests own them. Gap for the app seeder if wanted.
- A scenario for "places taken" and the FULL state (2026-11-14). Every seeded tournament has no registrations, and sign-up does not exist yet. Mock only if a mocked full list is wanted later.
- Empty, network-failure and server-error states for the tournament list (2026-11-14). The shared list-page component is exercised by the other features' scenarios; add a mocked one here only if the tournament page diverges.

- An API scenario that an unknown route answers 401 while tournament routes answer 404. It restates
  the not-found scenario from the other side and tests the framework's default, not a tournament rule.
- A UI scenario that the directory stays browsable without an account (`#5036`). See Constraints.

## Out of scope

- Whether the flag is present on the wire. The app's unit and Pact tests own that, as for `GymsMap`.
- The organiser's set-up screens (create, divisions, publish: `#5001`, `#5004`, `#5005`). The app spec keeps them at its API and SPA integration tiers, and they need the organiser's sign-in.
- Everything from User Stories 3–5 (sign-up and payment, cancellation, results). The app has not built them. Their scenarios are added here slice by slice.
- Profile privacy (`#5009`) and the deletion rules other than signing up again (`#5012`: active sign-up refused, tenant identity removed). The app spec keeps them at its API integration tier (`CompetitorPrivacyIT`, `CompetitorDeletionIT`).
