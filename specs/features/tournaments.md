# Acceptance spec: Tournaments

**App spec**: `bjjeire-java/specs/features/tournaments.md` (design record: `bjjeire-java/specs/001-tournament-registration/`)
**Requirements**: `bjjeire/requirements` · epic `&11`
**Slice**: `tests/features/tournaments/` (API, UI and a11y specs) · `src/ui/pages/tournaments/` (list, card, detail and organiser page objects) · `src/api/features/tournaments/tournaments.service.ts` (raw clients for the error paths; `getTournaments` checks a placeholder page schema from `tournaments.schemas.ts` until the published contract has tournament schemas) (the header section is shared)
**Agent seed**: `tests/agents/seed.spec.ts` (project `agent-seed`: signed in, flags pinned on, shell mounted)
**Seeded**: three published tournaments in the app's test dataset (`bjjeire-java/seeder/data-test/tournaments/`): `acceptance-open` (registration open, limit 200), `acceptance-opens-later` (opens in 7 days), `acceptance-closed` (closed yesterday). Each has five divisions. `acceptance-open` and `acceptance-opens-later` share 2 June 2035, a €25.00 fee and the National Indoor Arena; `acceptance-closed` has its own day (14 July 2035), fee (€30.00) and venue (UL Sport Arena), so a card showing another tournament's values is caught. Dates are relative to the seed run. Recorded in `tests/features/tournaments/seeded.ts`
**Status**: planned · **Reconciled with tests**: 2026-11-13 (both scenarios; the API scenario is red on an app finding: the gate's 404 problem lacks `traceId`. Fixed in the app on 2026-11-14, not yet deployed to an environment); slice 1 scenarios added 2026-11-14; slice 2 scenarios added 2026-11-15 (planned, local Docker stack only, see Slice 2); reconciled with the tree 2026-11-14: every planned scenario is implemented except two API scenarios, "client should get the public details of a published tournament by its address name" and "client should list the seeded tournaments with their registration state", which Ian has parked until the published contract has tournament schemas (their blocks stay under Planned and are not in the numbered list). The deep-link and organiser sign-in UI tests pass again since F1 stopped reproducing (2026-11-15); six scenarios added 2026-11-15 (two UI, two a11y, two API; the list a11y test was red on colour-contrast finding F6 until the 2026-11-15 redeploy); slice 3 re-planned 2026-11-15 under the data-ownership rule (see Slice 3 and Held: nine API and four UI scenarios planned, paid and place-taking scenarios held); re-planned 2026-11-16 after app commits 9bd621e and 4883bc8 (slice 4 shipped, Stripe resume fix): scenarios added for the competitor profile API, cancel and change-division error paths, competitor-token refusals (`#5037` moved out of Held) and the empty "My sign-ups" page; the payment-dependent slice 4 scenarios moved to Held (see Slice 4 and Held)

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
16. visitor should be offered to sign up when registration is open · `#5013`
17. visitor should be asked to sign in and come back to the sign-up when signing up for a tournament · `#5013`
18. competitor should be offered only the divisions for their gender, belt and age · `#5014`
19. competitor should be told they cannot enter when they are 17 on the tournament day · `#5019`
20. competitor should be offered the adult division when they turn 18 on the tournament day · `#5019`
21. competitor should see no sign-ups before signing up for a tournament · `#5021`
22. competitor should find no accessibility violations on the sign-up page · none
23. competitor should find no accessibility violations on the profile form · none
24. visitor should be offered competitor sign-in or registration when opening their account · `#5006`
25. competitor should see their saved profile again after signing back in · `#5007`
26. competitor should be saved with a gym from the directory as their academy · `#5008`
27. competitor should be saved with an academy typed by hand when theirs is not listed · `#5008`
28. competitor should be saved with no academy and no affiliation when they choose neither · `#5008`
29. competitor should see no medals and no tournaments entered before any results · `#5039`
30. competitor should be able to sign up again with the same email after deleting their account · `#5012`

### API

1. client should get not found for <route> when tournaments are switched off · `#5038`
2. client should get not found for a tournament that does not exist when the address is <address> · `#5002`
3. client should be refused a tournament list request with an out-of-range or malformed paging value (<parameters>) · none
4. client should be refused the organiser tournament routes without a token when requesting <route> · `#5004`
5. client should get consecutive tournaments on consecutive pages when paging one at a time · none
6. client should be refused the competitor routes without a token when requesting <route> · `#5009`
7. client should list every division of a tournament in order with no competitor private data when asking for its competitors · `#5015`
8. client should get not found or bad request when asking for the competitors of a tournament at <address> · none
9. client should be refused the sign-up routes without a token when requesting <route> · `#5013`
10. client should be refused the Stripe webhook when requesting it with <method> · none
11. client should be offered no division when registration is not open for <tournament> · `#5003`
12. client should be refused a sign-up that does not accept both consents when the consent is <value> · none
13. client should be refused a sign-up request body that is not JSON when it is sent as <format> · none
14. client should get not found when signing up for <target> that does not exist · none
15. client should get not found or bad request when resuming payment for a sign-up that is <kind> · none
16. client should be refused changing a directory section with a competitor token when requesting <route> · `#5037`
17. client should be refused the organiser tournament routes with a competitor token when requesting <route> · `#5004`
18. client should get not found or bad request when cancelling a sign-up that is <kind> · none
19. client should get not found or bad request when moving a sign-up to another division and the request is <kind> · none
20. competitor should get an empty incomplete profile with their sign-in email before saving one · `#5007`
21. client should be refused a profile save with an invalid value when <field> is <value> · none
22. competitor should keep one profile when saving it twice and signing in again with the same email · `#5007`

Scenario 1 is data-driven over four routes, in `tournaments.api.acceptance.spec.ts`. `<route>` is one of: the tournament list, the competitor's own profile, the competitor's own registrations, a new registration (mapping in the block below).

Scenarios 2 to 10 are in `tournaments-switched-on.api.acceptance.spec.ts`, 11 to 15 in `tournaments-sign-up.api.acceptance.spec.ts`, 16 and 17 in `tournaments-competitor-access.api.acceptance.spec.ts`, 18 and 19 in `tournaments-sign-up-changes.api.acceptance.spec.ts`, 20 to 22 in `tournaments-profile.api.acceptance.spec.ts`: the files for environments with tournaments on. The flag-off file above fails where the flag is on, and these fail where it is off, so exactly one of the two can pass.

- Scenario 2 is data-driven over `<address>`: an unknown name, a name with capitals and a space, an over-long name.
- Scenario 3 is data-driven over `<parameters>`: page 0 and -1, page size 0 and 101 (validation errors on the field), page size `abc` and `1.5` (bad request).
- Scenario 4 is data-driven over `<route>`: the organiser list, an organiser read, a new tournament, an update, a publish. No request carries a body.
- Scenario 21 is data-driven over (`<field>`, `<value>`): first name blank and 61 characters, last name blank, nationality `XX1`, date of birth tomorrow and missing, affiliation 81 characters, phone `abc`, academy gym id that exists nowhere (`@local-sign-in`). Live 2026-11-16: every row 400 `urn:bjjeire:validation-error` on its own field, and the profile stays unsaved.
- Scenario 19 is data-driven over `<kind>`: a sign-up that does not exist (404), a malformed sign-up id (400 on `Id`), a missing division (400 `DivisionId` NOT_NULL), a malformed division id (400 `DivisionId` INVALID_FORMAT) (`@local-sign-in`; nothing is moved). Live 2026-11-16: validation runs before the lookup.
- Scenario 18 is data-driven over `<kind>`: an id that exists nowhere (404), each malformed id in `invalid-values.ts` (400 on `Id`) (`@local-sign-in`; no real sign-up). Live 2026-11-16: confirmed for all eight.
- Scenario 17 is data-driven over `<route>`: the organiser list, a new tournament, a tournament's sign-up list, a tournament cancellation, a team-name merge (`@local-sign-in`; each id exists nowhere, never a seeded one). Live 2026-11-16: every row 403 `urn:bjjeire:forbidden`.
- Scenario 16 is data-driven over `<route>`: a new entry (empty body) and a deletion (id that exists nowhere) for gym, event, competition and store (`@local-sign-in`). Live 2026-11-16: every row 403 `urn:bjjeire:forbidden`, not 401.
- Scenario 15 is data-driven over `<kind>`: an id that exists nowhere (404), and each malformed id in `invalid-values.ts` (400 validation on `Id`) (`@local-sign-in`; never a real sign-up).
- Scenario 14 is data-driven over `<target>`: a tournament, a division (of `acceptance-closed`), each an id that exists nowhere (`@local-sign-in`).
- Scenario 13 is data-driven over `<format>`: plain text, XML, form-encoded (`@local-sign-in`; an id that exists nowhere inside the body).
- Scenario 12 is data-driven over `<value>`: `false`, the string "true", the number 1, null, missing (`@local-sign-in`; the target is an id that exists nowhere).
- Scenario 11 is data-driven over `<tournament>`: `acceptance-opens-later`, `acceptance-closed` (`@local-sign-in`; both requests are refused before a place is taken).
- Scenario 10 is data-driven over `<method>`: GET, PUT, DELETE (never POST, the real webhook).
- Scenario 9 is data-driven over `<route>`: the eligible divisions, a new sign-up (no body), a return to payment; every id is one that exists nowhere.
- Scenario 8 is data-driven over `<address>`: the address name of an existing tournament (400 validation on `Id`), a well-formed id that exists nowhere (404).
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

- **F7 (app seed, cleared 2026-11-15 by a reseed: `placesTaken` read 0 on all three seeded tournaments afterwards, and stayed 0 through every slice-3 run; the cause, a sign-up that cannot be cancelled before slice 4, can recur): the seeded `acceptance-open` already reports `placesTaken: 1` on the Docker stack** (read 2026-11-15, `GET /api/v1/tournament/acceptance-open`), though the seed holds no registrations and the public competitor list is empty for every division. An earlier run or manual sign-up took a place that the API cannot return (no cancel route until slice 4). Seeded places are therefore not zero and the details scenario must not assert "0 of 200 taken". It is the live proof of why sign-up scenarios that create a sign-up are Held.

  **F7 update (2026-11-16): it reappeared, and this time it is a confirmed competitor.** `GET /api/v1/tournament/acceptance-open` answers `placesTaken: 1` again (read live 2026-11-16), and `GET /api/v1/tournament/acce88000000000000000001/competitor` lists one competitor in division `acce99000000000000000104` (No-Gi · Male · Master 1 · Purple): `displayName` "Ian O'Flynn", an academy and an affiliation, nothing else. No suite profile matches that division (the suite's profiles are male white/blue adults and a female black belt), so it is almost certainly the owner's manual Stripe test-mode run, not a suite leak. Consequences: the details scenario still must not assert "0 of 200 taken"; the competitor-list private-data check is no longer vacuous on this stack (it asserts real fields, see the competitors block), but it depends on a hand-made record that a reseed removes, so keep the `vacuous` annotation for the empty case; and the record cannot be cancelled by the suite (it is not the suite's competitor).

- **F8 (spec, informational): the public competitor list is addressed by object id, not slug.** `GET /api/v1/tournament/acceptance-open/competitor` answers 400; `/acce88000000000000000001/competitor` answers 200 with five divisions. The app spec writes `/{id}/competitor`, so this agrees; recorded so the generator does not use the slug the tournament page uses.

- **F9 (not verified): Stripe configuration.** The app repo's `.env` holds an `sk_test_` key and a `whsec_` secret, not placeholders, so checkout should answer 201 rather than 502/503 here. The planner has no tool that sends a POST, so no checkout call was made and webhook forwarding (`stripe listen`) could not be observed. Observed: `GET` on the webhook path answers 405, matching the app's note.

  **F9 update (2026-11-16):** the confirmed competitor in F7 proves the owner has completed a Stripe test-mode payment with the webhook forwarded on this stack, so checkout works here. The suite still cannot pay (no automation of Stripe's hosted page), so no planned scenario depends on it.

- **F10 (spec vs app, informational): the app's tasks.md says `GET /api/v1/competitor/me` is 404 before a profile exists (T045), the code and the slice 2 notes here say 200.** `CompetitorServiceImpl.getOwn` returns `CompetitorDto.unsaved(email)` (200, `profileComplete` false). The block below asserts 200 [source]; confirm live and report if it answers 404.

- **F11 (app change, 2026-11-16, commit 4883bc8 "strip stripe session issue"): checkout resume and the outside-window refusals.** Read from the source and `tasks.md` status notes, not run: `POST /api/v1/registration/{id}/checkout` now answers 409 `urn:bjjeire:payment-received` when Stripe reports the session paid or processing, 409 `hold-expired` once the hold ended, and 200 with the open session otherwise; `GET .../eligible-division` answers 409 `registration-not-open` outside the window (it used to list nothing); Stripe's `resource_missing` counts as expired. Effect on the plan: the existing resume-payment scenario (404 and 400 only) and "offered no division when registration is not open" (409 `registration-not-open`) are still right; the new 409 rows need a real sign-up and are Held.

- **F12 (app, informational, 2026-11-16): "My sign-ups" (`/account/signups`) is linked only from an open tournament's page (beside "Sign up") and from the sign-up-complete page.** The header account icon goes to the profile, and there is no account menu. With no tournament open, a competitor has no link to their own sign-ups. The app spec (`#5021`, "when they open my sign-ups") names no entry point, so this is not a contradiction; the scenario reaches the page through the tournament page link.

- **F13 (app, open, 2026-11-16): signing in again in the same second as deleting the account leaves the competitor stuck.** Observed on the Docker stack by the slice 2 re-sign-up scenario. The app refuses a token whose whole-second `iat` is not later than the deletion (`MongoRevokedCompetitors`), but the SPA still treats the sign-in as successful: the profile load is refused and the page shows "Error Loading Data / Failed to load your profile. Please try again." with only a Retry button. Retry never recovers (the token keeps its same-second `iat`), and the screen offers no sign-out or sign-in, so the competitor is stuck until the tab's session ends. It is the generic error, not the app's `errors.signedOut` copy. Expected: either accept a token issued after the deletion instant (millisecond comparison) or treat the refusal as signed out. The scenario retries the sign-in from a cleared session inside a bounded `toPass`; it does not encode the dead end.

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

Test design: UI · @acceptance · seeded `acceptance-opens-later` · not mocked · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · test dataset, `Tournaments` on in the environment · reach the page by searching the list for the exact name (count 1: no other seeded name contains it), then "View tournament" (F1). The seeded opening instant is read from the API in the Given step and shown on the Irish clock. "No sign-up" means the registration section holds only a status badge ("Not open yet") and the sentence "Registration opens on <day>"; there is no button or link there, and no button or link named like a sign-up (sign up, register, enrol, pay) anywhere on the page. The app now has a sign-up control (slice 3, shown only while registration is open), so this check can fail and is real. [source] for the sentence (`registrationMessage`); the list badge "Not open yet" is [snapshot]; the detail page for this slug was not captured

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

Test design: UI · @acceptance · seeded `acceptance-closed` · not mocked · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · test dataset, `Tournaments` on in the environment · reach the page by searching the list for the exact name (count 1), then "View tournament" (F1). As in the opens-later block, the app now has a sign-up control, so the no-sign-up check is real. Sentence is "Registration is closed." [source] (`registrationMessage`); the list badge "Closed" is [snapshot]; the detail page for this slug was not captured

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

Test design: UI · @acceptance · no data · not mocked · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · reach the page through the account link in the navigation. Runs on any environment with the flag on: it checks only the signed-out page, not the sign-in itself. The heading "Competitor sign-in" and button "Sign in or create an account" are [source]

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

Test design: UI · @acceptance · creates its own competitor (the `competitor` fixture's unique `pw-` email) and the fixture deletes it afterwards · not mocked · local Docker stack only (local competitor sign-in, `@local-sign-in`) · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }`. Use a typed academy name so the test does not depend on the gym seed. The saved message "Profile saved." and the heading "My competitor profile" (first visit: "Create your competitor profile") are [source]

#### competitor should be saved with a gym from the directory as their academy

- Covers: `#5008`
- Oracle: a gym from the app's test dataset (`bjjeire-java/seeder/data-test/gyms/` or the shared seed), found by part of its name.
- Steps:
  1. Given tournaments are switched on
  2. And a competitor has signed in with a new email
  3. And the competitor has filled in their name, date of birth, gender and belt
  4. When the competitor says their academy is in the gym directory
  5. And the competitor searches for part of a seeded gym's name and picks it
  6. And the competitor saves the profile
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
  3. And the competitor has filled in their name, date of birth, gender and belt
  4. When the competitor says their academy is not listed and types its name
  5. And the competitor saves the profile
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
  3. And the competitor has filled in their name, date of birth, gender and belt
  4. When the competitor chooses no academy and leaves the affiliation empty
  5. And the competitor saves the profile
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

Test design: UI · @acceptance · creates and deletes a competitor · not mocked · local Docker stack only (local competitor sign-in). The test waits, as setup, until the API accepts a fresh sign-in for the email (a bounded poll of a local sign-in plus a read of the own profile; it writes nothing): a token issued in the deletion's own second counts as older and is refused (`MongoRevokedCompetitors`), which leaves the visitor on "Failed to load your profile" with only Retry. That dead end is finding F13; this scenario does not cover it Delete confirmation is "Delete my account" then "Yes, delete my account"; afterwards the page shows "Competitor sign-in" again. [source]; the defect was observed by the owner on the local Docker stack before the fix

### Slice 3 — User Story 3, sign-up, payment and competitor list

Added 2026-11-15 from the app's slice 3 (`bjjeire-java/specs/features/tournaments.md`, User Story 3). Rehearsal: **[source]** only, from the app source and its SPA integration tests (`sign-up-page`, `sign-up-complete-page`, `my-sign-ups-page`, `tournament-page` integration tests); not rehearsed against the Docker stack or Stripe.

Revised 2026-11-15 under the data-ownership rule (data policy rule 5), and with the real behaviour from the app's tasks.md "Status 2026-11-15 (slice 3 built)". **Updated 2026-11-16: slice 4 now ships `POST /api/v1/registration/{id}/cancel`, but only for a CONFIRMED sign-up (an unpaid one is 409 `conflict` and ends only when its 30-minute hold runs out).** So a test that creates a sign-up and does not pay still cannot return the place or delete its competitor; only a paid sign-up can be cancelled in teardown, and the suite cannot pay (see Held). The original reasoning follows. An unpaid or confirmed sign-up blocks deleting its competitor ("cancel it first"). So a test that creates a sign-up on a seeded tournament permanently takes a place (`placesTaken` rises) until the hold sweep ends an unpaid hold (30 minutes, not under the test's control) or the stack is reseeded; a confirmed one never frees. Those scenarios are **Held** below, not planned. What stays planned never creates a sign-up: it creates a competitor (a profile, deleted afterwards through `DELETE /api/v1/competitor/me`, which is allowed while the competitor holds no sign-up), reads the eligible divisions, or sends a request the API refuses before it takes a place. Every refusal row below uses a request that cannot take a place even if the rule regressed: an unknown tournament id (a well-formed object id that exists nowhere), or a tournament outside its window.

How a test gets a competitor here: the local Docker stack issues a competitor token for any email (`POST` to the local competitor sign-in route, `LocalSignInController`: body `{ "email": ... }`, hidden from the OpenAPI document, local profile only), the same email always being the same competitor. A test-scoped fixture (`fixtures.api.ts` for API specs, `fixtures.ts` for UI) signs in with a fresh email built only from `PW ` plus the test id or a faker token (for example `pw-<id>@example.test`), saves a profile through `PUT /api/v1/competitor/me` where the scenario needs one, and deletes the competitor after `await use(...)` (ignore a 404). Stripe is not needed by any planned scenario. A Stripe test key looks configured on this stack (the app repo's `.env` holds an `sk_test_` key and a `whsec_` secret, not the `REPLACE_ME` placeholders), but whether `stripe listen` forwards webhooks was not observable, and nothing planned pays. The Checkout scenarios stay Held because they cannot be cleaned up, not because Stripe is absent. The sign-up scenarios need a describe tag of their own for local competitor sign-in (for example `@local-sign-in`) that other environments exclude.

#### visitor should be asked to sign in and come back to the sign-up when signing up for a tournament

- Covers: `#5013`
- Oracle: the app spec (User Story 3, "Starting"): signed out, the sign-up page asks to sign in over the same page and shows the sign-up afterwards.
- Steps:
  1. Given tournaments are switched on
  2. And a visitor is not signed in
  3. When the visitor chooses Sign up on a tournament whose registration is open
  4. And the visitor signs in as a competitor with a complete profile
- Expected results:
  - Then the visitor is on the sign-up for that tournament
  - And the divisions they may enter are offered
- Why: a competitor who is sent to sign in and lands somewhere else gives up before paying.

Test design: UI · @acceptance · @local-sign-in · creates its own competitor (fresh email, `PW ` prefix) with a complete profile saved through the API in a test-scoped fixture, and deletes the competitor afterwards; the test creates no sign-up and stops on the sign-up page before continuing to payment, so `placesTaken` of `acceptance-open` is unchanged and nothing is held · not mocked · seeded `acceptance-open` · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }`. The visitor reaches the tournament from the list (count 2), chooses "Sign up", then signs in through the local sign-in form that replaces the page. The tournament page's link is "Sign up"; the sign-up heading is "Sign up for <tournament name>". [source]. Needs no Stripe

#### visitor should be offered to sign up when registration is open

- Covers: `#5013`
- Oracle: the app spec (User Story 3, "Starting") and the seeded tournament `acceptance-open`, whose registration is open.
- Steps:
  1. Given tournaments are switched on
  2. When a visitor opens Tournaments
  3. And the visitor searches for "Acceptance Open"
  4. And the visitor opens the "Acceptance Open" tournament
- Expected results:
  - Then a sign-up is offered
  - And the sign-up leads to the sign-up for that tournament
- Why: the pages that say "closed" and "opens later" show no sign-up; without this one a broken link on the open tournament leaves no way to enter.

Test design: UI · @acceptance · seeded `acceptance-open` · not mocked · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · reach the page from the list (count 2, as in the details scenario) · assert the link is present and its target is `/tournaments/acceptance-open/signup`, and do not follow it (the next scenario does). Creates nothing. The link "Sign up" is [source]. This is the positive half of the two "no sign-up" scenarios above, whose "honest limit" notes ("the app has no sign-up control in any state yet") are now out of date: the control exists, so those two checks can fail and are real

#### client should be offered no division when registration is not open for <tournament>

- Covers: `#5003`
- Oracle: the app spec (User Story 3, "Starting"): outside the registration window the API offers no division (409 `registration-not-open`) and takes no place. The seeded `acceptance-opens-later` and `acceptance-closed` are outside their window by construction.
- Steps:
  1. Given the environment has tournaments switched on
  2. And a competitor has signed in with a new email and saved a complete profile
  3. When the competitor asks which divisions they may enter in <tournament>
  4. And the competitor tries to sign up for a division of <tournament>
- Expected results:
  - Then each request is refused as a registration-not-open problem document
  - And no payment page is returned
- Why: an entry taken before the window opens or after it closes breaks the organiser's brackets and refunds.

Test design: API · @acceptance · @local-sign-in · data-driven over `<tournament>`: `acceptance-opens-later`, `acceptance-closed` · creates its own competitor in a test-scoped fixture and deletes the competitor afterwards (no sign-up is created, so deleting is allowed, and `placesTaken` of the seeded tournaments does not change because a refused request takes no place). **The seed expires: `acceptance-opens-later` opens at `now+7d` (seeder `data-test/tournaments/acceptance-opens-later.json`), so a week after the seed it is OPEN and a qualifying sign-up would take a place for good.** Two barriers: (1) the Given step reads `registrationState` from `GET /api/v1/tournament/<slug>` and fails before any request unless it is `NOT_OPEN` (`acceptance-opens-later`) or `CLOSED` (`acceptance-closed`), telling the reader to reseed; (2) the competitor's profile is FEMALE, BLACK belt, born 1990, which no division of either tournament accepts (the seed has no black belt), so even a regressed window check ends in 409 not-eligible, not a hold. Order [source] `RegistrationServiceImpl.create`: tournament and division lookup, then the window, then the profile, age and eligibility, then the place is taken · not mocked · `GET /api/v1/tournament/{id}/eligible-division` and `POST /api/v1/registration` with both consents `true` and a division id from the seed file; ids come from `GET /api/v1/tournament/<slug>` read in the Given step, never literals. Use `expectProblem` with the 409 type `urn:bjjeire:registration-not-open` (confirm the exact urn live; [source] tasks.md "Status 2026-11-15"). The order of the checks is [source] only: if the API answers profile-incomplete or another 409 first, report it as a finding. This is the test most at risk of taking a place if the rule regressed, so if a live run ever answers 201, stop and tell the app owner, because the place cannot be returned

#### client should be refused a sign-up that does not accept both consents when the consent is <value>

- Covers: none, FR-012 in the app spec (both consents are required, as the JSON value `true`) has no requirement issue of its own
- Oracle: the app spec (User Story 3, "Starting"): the API accepts only the JSON value `true` for each consent, not `"true"` or `1`. A refusal is a 400 problem document.
- Steps:
  1. Given the environment has tournaments switched on
  2. And a competitor has signed in with a new email
  3. When the competitor tries to sign up with the public-listing consent as <value>
  4. And the competitor tries to sign up with the terms consent as <value>
- Expected results:
  - Then each request is refused as a bad-request or validation problem document
- Why: a sign-up recorded without a real consent has no valid liability waiver.

Test design: API · @acceptance · @local-sign-in · data-driven over `<value>`: `false`, the string `"true"`, the number `1`, `null`, and the field missing · creates its own competitor token only (no profile, nothing to delete beyond the account the token names, which the fixture deletes if the API created one) · not mocked · **the tournament id is a well-formed object id that exists nowhere**, so even a regressed consent rule ends in 404 and never takes a place; the 400 comes from validation before the tournament is looked up [source]. `POST /api/v1/registration` with the other consent `true`. Problem type is `urn:bjjeire:validation-error` for `false`/missing/`null` and `urn:bjjeire:bad-request` for a wrong JSON type; confirm each live and assert the observed type, reporting any disagreement as a finding

#### client should be refused a sign-up request body that is not JSON when it is sent as <format>

- Covers: none, a request-shape rule from the app's slice 3 status note with no requirement issue of its own
- Oracle: the app's tasks.md "Status 2026-11-15": a body sent as text, XML or a form is a 400 bad-request on every route, not a 500.
- Steps:
  1. Given the environment has tournaments switched on
  2. And a competitor has signed in with a new email
  3. When the competitor sends a sign-up whose body is <format>
- Expected results:
  - Then the response is a bad-request problem document
- Why: a server error on a malformed request hides a client mistake as an outage.

Test design: API · @acceptance · @local-sign-in · data-driven over `<format>`: plain text, XML, form-encoded · competitor token only · not mocked · `POST /api/v1/registration` with that content type (an unknown tournament id inside the body where the format allows, so nothing can be created). `expectProblem` with 400 and `urn:bjjeire:bad-request`. Not verified live

#### client should get not found when signing up for <target> that does not exist

- Covers: none, a not-found rule with no requirement issue of its own
- Oracle: the OpenAPI description of `POST /api/v1/registration`: 404 when there is no published tournament with the id, or no such division in it.
- Steps:
  1. Given the environment has tournaments switched on
  2. And a competitor has signed in with a new email and saved a complete profile
  3. When the competitor signs up for <target>
- Expected results:
  - Then the response is a not-found problem document
- Why: a sign-up for a stale id must end clearly, not as a server error or a charge.

Test design: API · @acceptance · @local-sign-in · data-driven over `<target>`: a tournament id that exists nowhere (both consents `true`), a division id that exists nowhere inside `acceptance-closed` (both consents `true`; the tournament is outside its window, so even a regressed lookup could not take a place, and the API looks the division up before the window check, [source], so the 404 is unchanged; if a live run returns anything but 404 for this row, stop and report) · the competitor (FEMALE, BLACK belt, born 1990, which no seeded division accepts) is created and deleted in a test-scoped fixture · not mocked · `expectProblem` with `ProblemType.NotFound`

#### client should get not found or bad request when resuming payment for a sign-up that is <kind>

- Covers: none, a not-found and malformed-id rule with no requirement issue of its own
- Oracle: the OpenAPI description of `POST /api/v1/registration/{id}/checkout`: 404 when there is no such sign-up; the id is a validated object id.
- Steps:
  1. Given the environment has tournaments switched on
  2. And a competitor has signed in with a new email
  3. When the competitor asks to return to the payment page of a sign-up that is <kind>
- Expected results:
  - Then the response is a problem document of the matching type
- Why: a mistyped or stale payment link must say so, not open somebody else's page.

Test design: API · @acceptance · @local-sign-in · data-driven over `<kind>`: a well-formed id that exists nowhere (404 `urn:bjjeire:not-found`), a malformed id (400, `invalid-values.ts` object-id set) · competitor token only; nothing is created · not mocked. The 403 for another competitor's sign-up and the 409 `hold-expired` need a real sign-up, so they are Held

#### client should list every division of a tournament in order with no competitor private data when asking for its competitors

- Covers: `#5015`
- Oracle: the seeded tournament `acceptance-open` and the app's tasks.md note (T062): the public list returns every division in the tournament's order, empty lists included, built from registration snapshots only. Vacuous when no competitor is listed (the seed holds none, T079): the test annotates `vacuous` then. Not vacuous on the local stack since 2026-11-16 (F7 update): one confirmed competitor is listed in division `...104`.
- Steps:
  1. Given the environment has tournaments switched on
  2. When a client with no token requests the competitors of "acceptance-open"
- Expected results:
  - Then the five seeded divisions are listed in the tournament's order
  - And any listed competitor carries only a name, an academy and an affiliation
- Why: a competitor list that leaks personal data, or drops a division, misleads visitors and breaks privacy for people who only agreed to a name and academy.

Test design: API · @acceptance · seeded `acceptance-open` (division ids and order from `GET /api/v1/tournament/acceptance-open` in the Given step: seed ids `acce99000000000000000101` to `...0105`, [API-fact] 2026-11-15) · not mocked · tagged `@tournaments-on` · `GET /api/v1/tournament/{id}/competitor` by object id: the slug answers 400 [API-fact] · since 2026-11-16 the list is not empty on this stack, because of the owner's hand-made confirmed sign-up (F7, one competitor in division 104), so the private-data check has something to look at; a reseed removes it and the test then annotates `vacuous` (T079). Live 2026-11-16 a hand-made confirmed competitor is listed, and each entry carries exactly `displayName`, `academy` and `affiliation` (the allowed set uses these wire names; the first response row is `{divisionId, competitors[]}`), so the check is real on this stack. Assert the fields of any competitor that is present against the allowed set (name, academy, affiliation) and the absence of the private ones (email, date of birth, phone, address, nationality, competitor id, payment, checkout, registration id); when none is listed the test adds a `vacuous` annotation ('no confirmed competitors on this stack (T079)') instead of passing silently; do not assert that the lists are empty, because another run may have confirmed a sign-up. Creates nothing. The same call through a seeded confirmed sign-up arrives with slice 5's seeded medallists

#### client should get not found or bad request when asking for the competitors of a tournament at <address>

- Covers: none, a not-found rule with no requirement issue of its own
- Oracle: the OpenAPI description of the public competitor list: the id is an object id; an unknown id is not found; a malformed value is a bad request.
- Steps:
  1. Given the environment has tournaments switched on
  2. When a client with no token requests the competitors of a tournament at <address>
- Expected results:
  - Then the response is a problem document of the matching type
- Why: a list that answers 200 for a tournament that does not exist makes a stale link look like an empty tournament.

Test design: API · @acceptance · tagged `@tournaments-on` · data-driven over `<address>`: the slug `acceptance-open` (400, [API-fact] 2026-11-15), a well-formed id that exists nowhere (404 `urn:bjjeire:not-found`, [source], verify live and drop the row if it answers 200 with an empty list, then report it as a finding) · not mocked

#### client should be refused the sign-up routes without a token when requesting <route>

- Covers: `#5013`
- Oracle: the app spec's access rules (`eligible-division`, `POST /registration`, `POST /registration/{id}/checkout` need a competitor token): a request with none is refused as an unauthorised problem document.
- Steps:
  1. Given the environment has tournaments switched on
  2. When a client with no token requests <route>
- Expected results:
  - Then the response is an unauthorised problem document
- Why: a sign-up route that answers a request with no sign-in could start a hold and a Checkout page for nobody.

Test design: API · @acceptance · tagged `@tournaments-on` · data-driven over `<route>`: the eligible divisions = `GET /api/v1/tournament/<any valid id>/eligible-division` ([API-fact] 401 for the seeded id and for an unknown slug, 2026-11-15, so authentication runs before the tournament is looked up), a new sign-up = `POST /api/v1/registration` with no body, a return to payment = `POST /api/v1/registration/<any valid id>/checkout` · not mocked · `urn:bjjeire:unauthorized`. The two POST rows are [source], not verified live; no request can create a sign-up because none carries a token. Extend the existing competitor-routes helper; do not duplicate it

#### client should not find the Stripe webhook in the published API description

- Covers: none, a platform rule (ADR-0013: the webhook is not part of the public contract) with no requirement issue of its own
- Oracle: the app's tasks.md "Status 2026-11-15" and `StripeWebhookController` ("Hidden from the published OpenAPI: only Stripe calls it"): the published OpenAPI document lists no Stripe webhook path.
- Steps:
  1. Given the environment has tournaments switched on
  2. When a client reads the published API description
- Expected results:
  - Then the description lists no Stripe webhook route
- Why: a webhook that shows in the public contract tells the world where payments are confirmed.

Test design: API · @acceptance · tagged `@tournaments-on` · not mocked · **parked, not in the numbered list: no environment the suite reaches serves the description.** Checked 2026-11-15: the app serves it at `/v3/api-docs` (`OpenApiContractIT`), but the relay on :3000 proxies only `/api` (`/v3/api-docs` and `/openapi/v1.json` answer the SPA's HTML; `/api/openapi/v1.json` answers 401) and the API's own ports are unreachable from the dev container. `API_ROUTES.openApiV1` is declared but no spec reads it. The only copy the suite has is `contracts/openapi-v1.json` from `npm run contract:pull`, untracked and stale (10 paths, none for tournaments, no `stripe` anywhere), so a test on it would pass vacuously. Unblock by exposing `/v3/api-docs` through the relay or an environment URL, or by republishing the contract artefact with the tournament paths; then assert no path contains `stripe-webhook`. Creates nothing

#### client should be refused the Stripe webhook when requesting it with <method>

- Covers: none, a platform rule (ADR-0013: the webhook path serves only the signed `POST`) with no requirement issue of its own
- Oracle: the app's tasks.md "Status 2026-11-15": the webhook path is open to every method so a method it does not serve is 405, not 401. Live 2026-11-15: 405 with `Content-Type: application/problem+json`, `Allow: POST`, type `urn:bjjeire:method-not-allowed`.
- Steps:
  1. Given the environment has tournaments switched on
  2. When a client with no token requests the Stripe webhook with <method>
- Expected results:
  - Then the response is a method-not-allowed problem document
- Why: a webhook that answers 401 to a stray method tells the world where payments are confirmed.

Test design: API · @acceptance · tagged `@tournaments-on` · not mocked · data-driven over `<method>`: `GET`, `PUT`, `DELETE` on `/api/v1/registration/stripe-webhook` (all three answer 405 live). **Never `POST`**: that is the real webhook. The signed `POST` is not asserted: with a real secret an unsigned call is 400 and with the placeholder it is 503, so the answer depends on how the stack was started. Creates nothing

#### competitor should be offered only the divisions for their gender, belt and age

- Covers: `#5014`
- Oracle: the seeded divisions of `acceptance-open` (read from `GET /api/v1/tournament/acceptance-open`: GI male adult white `-76 kg`, GI male adult blue `-82.3 kg`, GI female adult white `-64 kg`, NO_GI male master 1 purple `-85.5 kg`, NO_GI female adult blue `-66.5 kg`, [API-fact] 2026-11-15) and the competitor's own profile: only divisions with the same gender and belt, and an age category whose minimum (Adult 18, Master 1 30, Master 2 36, Master 3 41, Master 4 46, Master 5 51) the competitor reaches on the tournament day, 2 June 2035.
- Steps:
  1. Given tournaments are switched on
  2. And a competitor has signed in with a new email and saved a complete profile as a male blue belt aged 35 on the tournament day
  3. When the competitor opens the sign-up for the "Acceptance Open" tournament from its page
- Expected results:
  - Then only the blue-belt male adult division is offered
  - And no division for another gender or belt is offered
  - And the entry fee €25.00 is shown before paying
- Why: a competitor allowed into the wrong division is disqualified on the day after paying.

Test design: UI · @acceptance · @local-sign-in · creates its own competitor (fresh email, `PW ` prefix) with the profile saved through the API and deletes the competitor afterwards; the test creates no sign-up and does not continue to payment, so `placesTaken` of `acceptance-open` is unchanged and nothing is held · seeded tournament · not mocked · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · date of birth computed from the seeded day `2035-06-02` (35 years earlier, comfortably under Master 2 at 36), never a fixed date. Expected division is read from the seed file, recorded in `seeded.ts`. Each option reads "<discipline> · <gender> · <age category> · <belt> · <weight class>" [source]. Needs no Stripe

#### competitor should be told they cannot enter when they are 17 on the tournament day

- Covers: `#5019`
- Oracle: the app spec (FR-017): nobody under 18 on the tournament day may sign up; the API counts the 18th birthday itself as 18 (`EligibilityTest`). The boundary case: born one day after the cut-off, so 17 on the day and 18 the next.
- Steps:
  1. Given tournaments are switched on
  2. And a competitor has signed in with a new email and saved a profile that makes them 17 on the tournament day
  3. When the competitor opens the sign-up for the "Acceptance Open" tournament from its page
- Expected results:
  - Then the competitor is told they must be 18 or over on the tournament day
  - And no division is offered and nothing can be paid
- Why: the tournament takes adults only; an under-18 entry is a safeguarding and insurance problem for the organiser.

Test design: UI · @acceptance · @local-sign-in · creates its own competitor in a test-scoped fixture, competitor deleted afterwards; no sign-up is created, `placesTaken` is unchanged (the fixture aborts any sign-up POST) · seeded `acceptance-open` · not mocked · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · date of birth derived from the seeded tournament day (day minus 18 years plus one day), not a fixed date. The message is "You must be 18 or over on the tournament day to compete in this tournament." [source]. Needs no Stripe

#### competitor should be offered the adult division when they turn 18 on the tournament day

- Covers: `#5019`
- Oracle: the app spec (FR-017): nobody under 18 on the tournament day may sign up; the API counts the 18th birthday itself as 18 (`EligibilityTest`). The other side of the boundary: born exactly 18 years before the day.
- Steps:
  1. Given tournaments are switched on
  2. And a competitor has signed in with a new email and saved a profile that makes them 18 on the tournament day
  3. When the competitor opens the sign-up for the "Acceptance Open" tournament from its page
- Expected results:
  - Then the adult division is offered
  - And the competitor is not told they must be 18 or over on the tournament day
- Why: an 18-year-old turned away on the day of their birthday is a wrong refusal; this guards the cut-off from drifting to 19.

Test design: UI · @acceptance · @local-sign-in · creates its own competitor in a test-scoped fixture, competitor deleted afterwards; no sign-up is created, `placesTaken` is unchanged (the fixture aborts any sign-up POST) · seeded `acceptance-open` · not mocked · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · profile male, white belt, so the one division offered is Gi · Male · Adult · White · -76 kg; date of birth derived from the seeded tournament day (day minus 18 years), not a fixed date. The division is asserted first so the "no notice" check waits for the eligibility result. Needs no Stripe

### Slice 4 — User Story 4, cancellation, refunds and division change

Added 2026-11-16 from the app's slice 4 (`bjjeire-java/specs/features/tournaments.md` § User Story 4; traceability `specs/stc/tournaments/traceability.md` § Slice 4). Rehearsal: **[source]** only, from the app source, its SPA integration tests and its API integration tests; nothing here has been run against a stack yet. The app spec puts `#5022`, `#5023` and `#5024` at T6 and keeps `#5025`, `#5026` and `#5027` at its own lower tiers.

Slice 4 adds `POST /api/v1/registration/{id}/cancel`, which may unblock the Held paid scenarios above: a fixture can cancel a confirmed sign-up in teardown, which gives its place back and allows the competitor to be deleted. It cannot cancel an unpaid sign-up (409; it ends only when its 30-minute hold runs out), so scenarios that hold a place without paying stay Held.

The three UI scenarios that need a confirmed sign-up (refund in full before close, no-refund warning after close, move to another division: `#5022`, `#5023`, `#5024`) were moved to Held on 2026-11-16. Their cleanup is now possible (the cancel route gives the place back), but creating the confirmed sign-up needs a paid Stripe Checkout that the suite cannot drive.

#### competitor should see no sign-ups before signing up for a tournament

- Covers: `#5021`
- Oracle: the app's string for an empty "My sign-ups" page ("You have not signed up for a tournament yet.") and the rule that the page lists only the signed-in competitor's own sign-ups; a fresh `PW` competitor has none.
- Steps:
  1. Given tournaments are switched on
  2. And a competitor has signed in with a new email and saved a complete profile
  3. When the competitor opens their sign-ups
- Expected results:
  - Then the sign-ups page says the competitor has not signed up for a tournament yet
  - And no sign-up is listed
- Why: a sign-ups page that shows someone else's entries, or a blank page with no explanation, makes a new competitor think the site lost their entry.

Test design: UI · @acceptance · @local-sign-in · creates its own competitor (`competitor` fixture, `PW ` prefix, deleted afterwards; no sign-up, so `placesTaken` does not move) · not mocked · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · reach it from the open tournament's page through its "My sign-ups" link, beside "Sign up" (the app has no account menu: the header's account icon leads to the profile, and this is the only route to the list besides the sign-up complete page). Heading "My sign-ups" and empty text are [source] (`config/content/registrations.ts`). Not rehearsed (the planner's browser pins `Tournaments: false`)

#### client should get not found or bad request when cancelling a sign-up that is <kind>

- Covers: none, a not-found and malformed-id rule with no requirement issue of its own
- Oracle: the OpenAPI description of `POST /api/v1/registration/{id}/cancel`: 404 when there is no such sign-up; the id is a validated object id.
- Steps:
  1. Given the environment has tournaments switched on
  2. And a competitor has signed in with a new email
  3. When the competitor cancels a sign-up that is <kind>
- Expected results:
  - Then the response is a problem document of the matching type
- Why: a mistyped or stale cancel link must say so, not cancel somebody else's entry or fail as a server error.

Test design: API · @acceptance · @local-sign-in · data-driven over `<kind>`: a well-formed id that exists nowhere (404 `urn:bjjeire:not-found`), each malformed id in `invalid-values.ts` (400 validation on `Id`) · competitor token only, nothing created · not mocked · mirror the resume-payment scenario's helper. Which of 403 and 404 answers a real sign-up that belongs to another competitor, and 409 for an unpaid one, need a real sign-up: Held

#### client should get not found or bad request when moving a sign-up to another division and the request is <kind>

- Covers: none, a not-found and validation rule with no requirement issue of its own
- Oracle: the OpenAPI description of `PUT /api/v1/registration/{id}/division`: 404 when there is no such sign-up; 400 when the body fails validation or the id is malformed.
- Steps:
  1. Given the environment has tournaments switched on
  2. And a competitor has signed in with a new email
  3. When the competitor asks to move a sign-up and the request is <kind>
- Expected results:
  - Then the response is a problem document of the matching type
- Why: a division change that answers 200 or 500 for a request that cannot be valid hides a client mistake and may move the wrong entry.

Test design: API · @acceptance · @local-sign-in · data-driven over `<kind>`: an id that exists nowhere with a well-formed division id (404 `urn:bjjeire:not-found`), a malformed sign-up id (400), an id that exists nowhere with a missing `divisionId` (400 `urn:bjjeire:validation-error`), the same with a malformed `divisionId` (400) · competitor token only, nothing created · not mocked · [source] for the controller's status list; confirm each type live, and assert the observed one if the order of validation and lookup differs, reporting it as a finding

#### client should be refused changing a directory section with a competitor token when requesting <route>

- Covers: `#5037`
- Oracle: the app spec (`#5037`, `WriteAuthorizationIT`): a competitor token is refused on writes to gyms, events, competitions and stores. A refusal is 403 as a forbidden problem document. Competition and store have no write routes of their own: their rows prove the catch-all write rule for read-only sections.
- Steps:
  1. Given the environment has tournaments switched on
  2. And a competitor has signed in with a new email
  3. When the competitor requests <route>
- Expected results:
  - Then the request is refused as forbidden
- Why: a competitor account is open to anyone, so one that can edit the directory lets any visitor rewrite gyms and events.

Test design: API · @acceptance · @local-sign-in · moved out of Held 2026-11-16: the blocker (no competitor tenant) is gone for the local stack, where the local sign-in issues a competitor token. Data-driven over `<route>`: a new entry with an empty body = `POST`, and a deletion = `DELETE` with an id that exists nowhere, each for `/api/v1/gym`, `/api/v1/bjjevent`, `/api/v1/competition`, `/api/v1/store` (eight rows). Both are safe even if the rule regressed. For gym and event, an empty body fails validation (400) and an id that exists nowhere is 404, so nothing is created or removed. **Competition and store have no write handlers at all**, so their four rows guard only the catch-all write rule for read-only sections (without the filter they would answer 405), not a per-route rule; do not use a seeded id and never `PUT` a real one. Competitor token only, nothing created · not mocked · uses the tournaments `competitor` fixture with a raw request, because a feature never imports another feature. `expectProblem` with 403 `urn:bjjeire:forbidden` (confirm the urn live). The existing gyms, events, competitions and stores suites still prove `#5036` (reads stay open)

#### client should be refused the organiser tournament routes with a competitor token when requesting <route>

- Covers: `#5004`
- Oracle: the app spec's access rules: organiser routes need the organiser's token; a competitor's valid token is refused as a forbidden problem document, not accepted and not 401.
- Steps:
  1. Given the environment has tournaments switched on
  2. And a competitor has signed in with a new email
  3. When the competitor requests <route>
- Expected results:
  - Then the request is refused as forbidden
- Why: the organiser's sign-up list holds other competitors' emails and dates of birth, and a competitor who can open it, or cancel a tournament, harms every entrant.

Test design: API · @acceptance · @local-sign-in · competitor token only · data-driven over `<route>`: the organiser list = `GET /api/v1/tournament/admin`, a new tournament = `POST /api/v1/tournament` with an empty body, a tournament's sign-up list = `GET /api/v1/tournament/<id>/registration`, a tournament cancellation = `POST /api/v1/tournament/<id>/cancel`, a team-name merge = `POST /api/v1/tournament/<id>/team-merge` with an empty body, each id a well-formed object id that exists nowhere. **Never the seeded ids**: a regressed rule must hit 404 or 400, not cancel `acceptance-open` or leak its sign-up list. Not mocked · [source] (`SecurityConfig`: organiser routes need the writer authority); confirm 403 and its problem type live and report any 401 as a finding. Complements the no-token scenario above, which proves only that a token is required

#### competitor should get an empty incomplete profile with their sign-in email before saving one

- Covers: `#5007`
- Oracle: the app spec (User Story 2): before a first save the profile is empty and not complete, and it shows the email the competitor signed in with; reading it creates nothing.
- Steps:
  1. Given the environment has tournaments switched on
  2. And a competitor has signed in with a new email
  3. When the competitor reads their profile
- Expected results:
  - Then the profile is not complete
  - And the profile shows the email they signed in with
  - And the profile has no name
- Why: a competitor who lands on a profile holding another person's details, or an error instead of a blank form, cannot start.

Test design: API · @acceptance · @local-sign-in · own competitor token, no profile saved (the `competitor` fixture with no profile option; deleted afterwards) · not mocked · `GET /api/v1/competitor/me` answers 200 with `profileComplete: false` [source] (`CompetitorServiceImpl.getOwn`; F10: the app's tasks.md says 404, so confirm live). Assert the response against the generated schema if the contract has one, else name the fields

#### client should be refused a profile save with an invalid value when <field> is <value>

- Covers: none, validation bounds from the app's `SaveCompetitorCommand` with no requirement issue of their own
- Oracle: the app's validation rules (T044): first and last name required and at most 60 characters, nationality an ISO 3166-1 alpha-2 code, date of birth required and in the past, affiliation at most 80, phone a phone number, a gym id that is not in the gym directory; a refusal is a 400 problem document.
- Steps:
  1. Given the environment has tournaments switched on
  2. And a competitor has signed in with a new email
  3. When the competitor saves a profile where <field> is <value>
- Expected results:
  - Then the response is a bad-request or validation problem document
  - And no profile is saved
- Why: a profile that accepts a date of birth in the future or a made-up country would produce wrong divisions and a bad public list.

Test design: API · @acceptance · @local-sign-in · data-driven over (`<field>`, `<value>`): first name blank, first name 61 characters, last name blank, nationality `XX1`, date of birth tomorrow (computed, not fixed), date of birth missing, affiliation 81 characters, phone `abc`, academy gym id that exists nowhere · own competitor token with no profile (fixture; deleted afterwards), a complete valid body with one field changed per row · not mocked · `PUT /api/v1/competitor/me`; the last assertion reads the profile back and requires it is still unsaved (`profileComplete` false), proving a refusal saves nothing. [source]; types are `urn:bjjeire:validation-error` for bean validation and probably `urn:bjjeire:bad-request` for the unknown gym: confirm each live, assert the observed type and report any row that answers 200

#### competitor should keep one profile when saving it twice and signing in again with the same email

- Covers: `#5007`
- Oracle: the app spec (User Story 2): the competitor's identity is the sign-in; two saves update one profile, never create two; the second save's values win.
- Steps:
  1. Given the environment has tournaments switched on
  2. And a competitor has signed in with a new email and saved a complete profile
  3. When the competitor saves the profile again with a different name
  4. And the competitor signs in again with the same email
- Expected results:
  - Then the profile shows the second name
  - And the profile is complete
- Why: a second save that creates a duplicate would split a competitor's sign-ups across two people.

Test design: API · @acceptance · @local-sign-in · own competitor (fixture; deleted afterwards) · not mocked · `PUT /api/v1/competitor/me` twice, then a new local sign-in with the same email and `GET /api/v1/competitor/me`. The UI scenario for `#5007` proves the visitor sees it; this owns the update-not-duplicate rule. [source] (`ix_competitor_issuer_subject_unique`, `CompetitorIT`)

#### competitor should find no accessibility violations on the sign-up page

- Covers: none, a cross-cutting accessibility sweep; no requirement issue names it
- Oracle: WCAG 2.1 A and AA as run by the suite's axe sweep. The sign-up page holds a division choice, two consent checkboxes and a fee, none of which an existing sweep covers.
- Steps:
  1. Given tournaments are switched on
  2. And a competitor has signed in with a new email and saved a complete profile
  3. When the competitor opens the sign-up for the "Acceptance Open" tournament from its page
- Expected results:
  - Then the sign-up page has no accessibility violations
- Why: a competitor who uses a screen reader and cannot reach the consent checkboxes cannot enter, and a sign-up that cannot be completed by keyboard excludes them.

Test design: UI · @acceptance · @a11y · @local-sign-in · `.a11y.` spec in the feature slice · own competitor (a profile that makes one division eligible, fixture, deleted afterwards), no sign-up created and nothing paid (the fixture aborts the sign-up POST) · seeded `acceptance-open` · not mocked · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · wait for the offered division before scanning, so the scan sees the form and not the loading state. Not rehearsed

#### competitor should find no accessibility violations on the profile form

- Covers: none, a cross-cutting accessibility sweep; no requirement issue names it
- Oracle: WCAG 2.1 A and AA as run by the suite's axe sweep. The profile form has the academy picker (a search with results), date, gender and belt inputs.
- Steps:
  1. Given tournaments are switched on
  2. And a competitor has signed in with a new email
  3. When the competitor opens their profile
- Expected results:
  - Then the create-profile form has no accessibility violations
- Why: the profile is the first form every competitor fills in; an unlabelled input stops a screen-reader user before they can enter anything.

Test design: UI · @acceptance · @a11y · @local-sign-in · `.a11y.` spec in the feature slice · own competitor with no profile, so the form is the "Create your competitor profile" one (fixture, deleted afterwards) · not mocked · flags stubbed `{ ...ALL_FEATURES_ENABLED, Tournaments: true }` · reach the page through the account link · scan once with the academy picker closed. Not rehearsed

#### client should be refused cancelling or changing a sign-up without a token when requesting <route>

- Covers: none, an access rule (ADR-0012) with no requirement issue of its own
- Oracle: the app's `SecurityConfig`: every `/api/v1/registration/**` route except the Stripe webhook needs a competitor token; a call without one is 401 with a problem document of type `urn:bjjeire:unauthorized` [source].
- Steps:
  1. Given the environment has tournaments switched on
  2. When a client with no token requests <route>
- Expected results:
  - Then the request is refused as unauthenticated
- Why: a sign-up cancelled by someone other than its owner loses the competitor their place and their fee.

Test design: API · @acceptance · tagged `@tournaments-on` · not mocked · data-driven over `<route>`: cancel a sign-up, change a sign-up's division (body `{ "divisionId": … }`), each with an id that exists nowhere. Creates nothing

#### client should be refused the organiser's sign-up tools without a token when requesting <route>

- Covers: none, an access rule (FR-005, FR-006, FR-007) with no requirement issue of its own
- Oracle: the app's `SecurityConfig`: `/api/v1/tournament/*/registration` and everything under it, `/api/v1/tournament/{id}/cancel` and `/api/v1/tournament/{id}/team-merge` need the organiser's token; without one they answer 401 `urn:bjjeire:unauthorized` [source].
- Steps:
  1. Given the environment has tournaments switched on
  2. When a client with no token requests <route>
- Expected results:
  - Then the request is refused as unauthenticated
- Why: the sign-up list holds competitors' emails, phone numbers and dates of birth, and a tournament cancellation refunds everyone.

Test design: API · @acceptance · tagged `@tournaments-on` · not mocked · data-driven over `<route>`: the sign-up list, the CSV export, an organiser move, an organiser cancel, a team-name merge, a tournament cancellation, each on an id that exists nowhere. **Never with an organiser token** against a seeded tournament: a tournament cancellation cannot be undone. Creates nothing

## Held

Re-assessed 2026-11-16 against slice 4: nothing sign-up-creating became safe. The cancel route (`POST /registration/{id}/cancel`) accepts only a CONFIRMED sign-up, so it cannot return an unpaid hold, and a confirmed one needs a paid Stripe Checkout the suite cannot drive. Every scenario below is still Held; only `#5037` left (now planned, it needs a token, not a sign-up). If a test could pay, the cancel-in-teardown fixture would make the paid scenarios safe, and a throwaway organiser-created tournament would make the full, unpaid and cap scenarios safe.

Slice 3 scenarios that need a real sign-up on a seeded tournament. Held because an unpaid or confirmed sign-up blocks deleting its competitor, and the place can only come back when the hold sweep runs (30 minutes), by cancelling a paid sign-up, or when the stack is reseeded, so a test cannot give the place back (data policy rule 5). Owner: the app repo. Unblock with a paid sign-up the fixture can cancel in teardown (slice 4's cancel route exists but takes only confirmed sign-ups), or a test-only way to remove a sign-up, or a throwaway tournament the test creates, publishes and unpublishes as the organiser (needs the organiser account route, see below). `placesTaken` on the seeded `acceptance-open` is already 1 on the Docker stack (see F7), so nothing here would also be absolute.

#### competitor should be signed up and listed after paying for a division

- Covers: `#5015`
- Question: pays through Stripe Checkout and confirms through the webhook, which needs `stripe listen` forwarding that the suite cannot start or check; a confirmed sign-up can never be cancelled, so `placesTaken` stays raised and the public list keeps the entry. The sign-up also blocks deleting the competitor.

#### competitor should be charged nothing and able to try again after leaving the payment page

- Covers: `#5016`
- Question: starting the payment takes a place for 30 minutes that the test cannot return. Oracle when unblocked: "Your payment was not completed and nothing was charged. Your place is still held for a short while." and a "Return to payment" button.

#### competitor should see each sign-up with its tournament, division, amount and status

- Covers: `#5021`
- Question: needs at least one sign-up, which holds a place. Oracle when unblocked: tournament, division, €25.00, "Awaiting payment", and "Pay now" at `/account/signups`.

#### competitor should be refused a second sign-up in a division they already hold

- Covers: `#5017`
- Question: needs a first sign-up; refusal is 409 `already-registered`.

#### competitor should be refused a third unpaid sign-up in one tournament

- Covers: `#5042`
- Question: needs two held sign-ups; refusal is 409 `too-many-unpaid`.

#### competitor should be told the tournament is full and not be charged when it has reached its limit

- Covers: `#5020`
- Question: needs a tournament at its limit; `acceptance-open` holds 200 places and a test would have to take all of them. Needs an organiser-created small tournament, or a seeded full one (gap for the app seeder).

#### competitor should sign up separately for a gi and a no-gi division

- Covers: `#5018`
- Question: needs two sign-ups, each with its own fee, so two held places.

#### competitor should be told Stripe is unavailable when payment cannot start

- Covers: `none` (the 502 `payment-unavailable` and 503 `urn:bjjeire:service-unavailable` refusals)
- Question: needs a stack started with a blank or `REPLACE_ME` Stripe secret (503) or an unreachable Stripe (502). This stack holds a real-looking test key, so neither can be provoked, and the 502 would give the place back. Plan on a placeholder-secret stack with its own profile if wanted.

#### competitor should be refunded in full and leave the competitor list when cancelling before registration closes

- Covers: `#5022`
- Question: moved from Planned 2026-11-16. Needs a confirmed sign-up, which needs a paid Stripe Checkout (hosted page, test card `4242`) and the webhook forwarded; the suite cannot drive either. The cancel route now exists, so cleanup is possible (the test cancels in teardown and deletes the competitor), which is no longer the blocker. Oracle when unblocked: warning "You will be refunded €25.00 in full to your original payment method.", notice "Your sign-up is cancelled. A refund of €25.00 is on its way.", row "Cancelled" with "Refunded" or "Refund pending", competitor gone from the division's list [source]. UI, `@local-sign-in`, `acceptance-open`, own competitor.

#### competitor should be warned that no refund is due before cancelling after registration closes

- Covers: `#5023`
- Question: moved from Planned 2026-11-16. Needs a confirmed sign-up in a tournament whose registration has closed: a seeded one on `acceptance-closed` (the seed holds no sign-ups, T079 deferred to slice 5) or an organiser-created tournament closed after payment (organiser account route, below). Oracle when unblocked: "Registration has closed, so no refund is due. You will be removed from the competitor list."; after confirming "Your sign-up is cancelled. No refund was due." [source].

#### competitor should move to another division at no extra charge while registration is open

- Covers: `#5024`
- Question: moved from Planned 2026-11-16. Needs a confirmed sign-up and two divisions one profile may enter; `acceptance-open` has none (gap for the app seeder: another male white adult weight class). Oracle when unblocked: "Your sign-up was moved. There is no extra charge.", new division, same amount, listed under the new division only [source].

#### competitor should be told to wait when returning to the payment of a sign-up Stripe has already taken

- Covers: none (the 409 `urn:bjjeire:payment-received` added by commit 4883bc8)
- Question: needs a sign-up whose Checkout session is paid with no webhook yet; the suite cannot pay. Likewise `hold-expired` (a 30-minute clock) and 403 for another competitor's sign-up (needs a real sign-up, which holds a place). The app's integration tests with the recording Stripe fake own them.

#### competitor should be refused cancelling an unpaid sign-up and another competitor's sign-up

- Covers: none
- Question: unpaid cancel is 409 `conflict`, another competitor's is 403; both need a real sign-up. A test-created unpaid sign-up holds a place for 30 minutes, cannot be cancelled and blocks deleting its competitor until the hold sweep runs, so it breaks rule 5 (not parallel-safe; leaves accounts behind). Unblock with a test-only way to remove a sign-up, or an organiser-created throwaway tournament.

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

- A UI scenario that the tournament page lists confirmed competitors by division (2026-11-15). The seed holds no confirmed sign-ups and a test cannot create one, so there is nothing to observe; the API competitor-list scenarios own the shape. Revisit with slice 5's seeded results.
- A scenario for the return page's polling ("Waiting for your payment", "Payment not completed", "Try again") (2026-11-15). It needs a sign-up with a Stripe session; the SPA's integration tests (`sign-up-complete-page`) own it.
- Scenarios for the late-payment refund, `hold-expired` and the hold sweep (2026-11-15). They need real payments and a 30-minute clock; the app's integration tests with the recording Stripe fake own them.
- A scenario for the confirmation email in Mailpit (2026-11-15). It needs a confirmed sign-up (Held) and the Mailpit API; the app's tests own mail retries.
- A scenario for competitor profile propagation to active sign-ups (2026-11-15). It needs a sign-up (Held); the app's service tests own it.

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
- Everything from User Story 5 (results, leaderboard, team points). The app has not built it (tasks T095 onward are open). Its scenarios are added here when it ships. User Stories 3 and 4 (sign-up, payment, cancellation, division change, the organiser's sign-up tools) are built; their paid-path scenarios are Held until a test can pay and give the place back. The organiser's sign-up list, CSV export, move, cancel, team merge and tournament cancellation are out of scope here beyond the no-token and competitor-token refusals: they need the organiser's sign-in and a confirmed sign-up, and the app's `AdminRegistrationIT` and `TournamentCancellationIT` own them.
- Profile privacy (`#5009`) and the deletion rules other than signing up again (`#5012`: active sign-up refused, tenant identity removed). The app spec keeps them at its API integration tier (`CompetitorPrivacyIT`, `CompetitorDeletionIT`).
