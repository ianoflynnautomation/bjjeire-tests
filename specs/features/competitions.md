# Acceptance spec: Competitions

**App spec**: `bjjeire-java/specs/features/competitions.md`
**Requirements**: `bjjeire/requirements` · epic `&3` (`#3001`–`#3017`) · epic `&11` (`#5001`–`#5042`, BJJ Éire competitions)
**Slice**: `tests/features/competitions/` · `src/ui/pages/competitions/` · `src/api/features/competitions/`
**Agent seed**: `tests/agents/seed.spec.ts` (project `agent-seed`: signed in, flags pinned on, shell mounted)
**Seeded**: `tests/features/competitions/seeded.ts`. Directory competitions from `bjjeire-java/seeder/data-test/competitions/`; four acceptance BJJ Éire competitions from `bjjeire-java/seeder/data-test/bjjeire-competitions/`: `acceptance-open` (registration open, limit 200), `acceptance-opens-later` (a fixed window in 2035: opens 1 May, closes 25 May), `acceptance-closed` (closed the day before the seed run), each with five divisions, and the finished `acceptance-finished` with recorded results. `acceptance-open` and `acceptance-opens-later` share 2 June 2035, a €25.00 fee and the National Indoor Arena; `acceptance-closed` has its own day (14 July 2035), fee (€30.00) and venue (UL Sport Arena). Only two windows are relative to the seed run: `acceptance-open` (opens 7 days before it, closes 30 days after it, so Open for about 30 days after a seed) and `acceptance-closed` (closed the day before it, so Closed from then on). `acceptance-opens-later` is fixed in 2035 and stays Not open yet until 1 May 2035.
**Status**: living · **Reconciled with tests**: 2026-11-17

A visitor opens Competitions and scans, searches and pages a list of upcoming
competitions, each card linking to the organiser's website and registration. There is no
county filter. Search matches the name only, on the loaded page. Finished competitions
are excluded unless a client asks for inactive ones.

The competitions BJJ Éire runs itself are **BJJ Éire competitions** (ADR-0015; formerly the
separate Tournaments feature, whose spec folded into this one on 2026-11-17). Upcoming ones are
featured above the directory. Each has a page at `/competitions/{slug}` with its fee,
registration window in Irish time, divisions and confirmed competitors; a competitor signs in,
keeps a profile and signs up at `/competitions/{slug}/signup`; the organiser manages them at
`/admin/competitions`. All of it sits behind the `BjjEireCompetitions` flag, which is separate
from the directory's `Competitions` flag and off unless an environment enables it.

## Scenarios (must match test titles)

### UI

1. visitor should see the competition list when opening Competitions (`@smoke`) · `#3001`
2. visitor should see an empty state when no competition matches the search · `#3003`
3. visitor should find only the competition searched for by name · `#3003`
4. visitor should find a competition by part of its name · `#3003`
5. visitor should see different competitions on each page · `#3004`
6. visitor should see the no-data message when there are no competitions to show · `#3004`
7. visitor should see a network error message when competitions cannot be loaded because the connection fails · `#3004`
8. visitor should see a server error message when competitions cannot be loaded because of a server problem · `#3004`
9. visitor should see how many competitions were found · none (decided 2026-10-31)
10. visitor should not find a competition by anything other than its name · `#3003`
11. visitor should reach a competition's website and registration from its card · none (exploration 2026-10-31)
12. visitor should see a competition's dates on its card · none (exploration 2026-10-31)
13. visitor should see the competition list after retrying when competitions failed to load · `#3004`
14. visitor should see website unavailable when a competition has no safe links · none (exploration 2026-10-31)
15. visitor should see the same page of competitions after reloading · `#3004`
16. visitor should see the shared search when opening a search link · none (exploration 2026-10-31)
17. visitor should see every competition again after clearing the search · `#3003`
18. visitor should stay in the search box after clearing the search · none (exploration 2026-10-31)
19. visitor should see a competition's dates in Irish time wherever they are · none (decided 2026-10-31)
20. visitor should see upcoming BJJ Éire competitions featured above the competition list (`@smoke`) · `#3006`
21. visitor should see no featured section when no BJJ Éire competition is upcoming · `#3007`
22. visitor should keep the featured BJJ Éire competitions while searching the competition list · `#3008`
23. visitor should still see the competition list when BJJ Éire competitions cannot be loaded · `#3007`
24. visitor should keep the featured BJJ Éire competitions while paging the competition list · `#3008`
25. visitor should open a featured BJJ Éire competition's page at its competitions address · `#3009`
26. visitor should be told a competition was not found for an unknown competitions address · `#3009`
27. visitor should keep their theme when opening a BJJ Éire competition · none (product spec theme edge case, ADR-0011)
28. visitor should land on the default page when opening a retired address "<address>" · `#3016`
29. visitor should see the featured BJJ Éire competitions before the search box on a phone (`@smoke`) · `#3006`
30. visitor should see no sign-up when registration is <state> · `#5003`
31. visitor should see a finished competition's page with its results and no sign-up · `#5002`
32. visitor should see each division's confirmed competitors with their academy and affiliation · `#5015`
33. visitor should be told a one-competitor division adds no team points · `#5032`
34. visitor should see no account entry when BJJ Éire competitions are switched off · `#5038`, `#3014`
35. visitor should see no retired-name entry in the navigation when BJJ Éire competitions are switched on · `#3011`
36. visitor should be asked to sign in as an organiser when opening competition management · `#5004`, `#3013`
37. visitor should see a BJJ Éire competition's details, fee, registration window and divisions · `#5002`, `#3009`
38. visitor should be offered to sign up when registration is open · `#5013`, `#3010`
39. visitor should see registration times in Irish time when the browser is in another time zone · `#5002`, `#3009`
40. competitor should be told they cannot enter when they are 17 on the competition day · `#5019`, `#3011`
41. competitor should be offered the adult division when they turn 18 on the competition day · `#5019`
42. competitor should see no sign-ups before signing up for a competition · `#5021`, `#3011`
43. competitor should be offered only the divisions for their gender, belt and age · `#5014`, `#3010`
44. visitor should be asked to sign in and come back to the sign-up when signing up for a BJJ Éire competition · `#5013`, `#3010`
45. visitor should be offered competitor sign-in or registration when opening their account · `#5006`
46. competitor should see their saved profile again after signing back in · `#5007`
47. competitor should be saved with a gym from the directory as their academy · `#5008`
48. competitor should be saved with an academy typed by hand when theirs is not listed · `#5008`
49. competitor should be saved with no academy and no affiliation when they choose neither · `#5008`
50. competitor should see no medals and no competitions entered before any results · `#5039`, `#3011`
51. competitor should be able to sign up again with the same email after deleting their account · `#5012`
52. visitor should find no accessibility violations on the featured BJJ Éire competitions · none
53. visitor should find no accessibility violations on a BJJ Éire competition's page · none
54. competitor should find no accessibility violations on the sign-up page · none
55. competitor should find no accessibility violations on the profile form · none

Scenarios 1–8 are in `competitions.ui.acceptance.spec.ts` (5–8 mocked); 9–19 in
`competitions-details.ui.acceptance.spec.ts`. Design notes for 9–19 are in [Planned](#planned).
Scenarios 20–24 are in `competitions-featured.ui.acceptance.spec.ts` (21, 23 and 24 mocked);
25–28 in `competitions-address.ui.acceptance.spec.ts`; 29 in
`competitions-featured-mobile.ui.acceptance.spec.ts` (`@mobile`); 30 in
`competitions-registration.ui.acceptance.spec.ts` (data-driven over `not open yet` and `closed`); 31 in
`competitions-finished.ui.acceptance.spec.ts`; 32 in `competitions-competitors.ui.acceptance.spec.ts`; 33 in `competitions-finished.ui.acceptance.spec.ts`.
Scenarios 34 to 55 came from the tournaments spec (see [Folded from the tournaments spec](#folded-from-the-tournaments-spec-2026-11-17)):
34 to 36 are in `competitions-bjjeire.ui.acceptance.spec.ts` (34 pins the flag off in the browser, so it runs on any
environment), 37 to 39 in `competitions-bjjeire-details.ui.acceptance.spec.ts`, 40 to 44 in
`competitions-sign-up.ui.acceptance.spec.ts`, 45 to 51 in `competitions-account.ui.acceptance.spec.ts`, and 52 to 55 in
`competitions.a11y.acceptance.spec.ts` (project `a11y`). 40 to 44, 46 to 51, 54 and 55 are `@local-sign-in`.

### API

1. client should receive each published competition with its details (`@smoke`) · `#3001`
2. client should not receive finished competitions · `#3001`
3. client should receive competitions ordered by start date · `#3001`
4. client should page through the listing in distinct slices with correct links · `#3004`
5. client should receive finished competitions when asking to include inactive ones · `#3002`
6. client should receive an empty page with valid pagination for a page beyond the last · `#3004`
7. client should get a bad request for <param> "<value>" · `#3002`
8. client should get a validation error on <param> when <param> <value> is out of range · `#3004`
9. client should get the same answer at a retired API route as at a route that never existed · `#3016`
10. client should receive upcoming BJJ Éire competitions, earliest day first, and not the finished one · `#3006`
11. client should page through BJJ Éire competitions in distinct slices with correct links · `#3006`
12. client should get a bad request for paging <param> "<value>" on the BJJ Éire competitions listing · none (no requirement issue names paging of this endpoint)
13. client should get a bad request for paging <param> "<value>" that is not a number · none (same reason)
14. client should receive a competition by its address name with its details and divisions · `#5002`
15. client should get not found for a competition address name that is <description> · `#3009`
16. client should receive each division's confirmed competitors with academy and affiliation and nothing private · `#5015`, `#5009`
17. client should receive the academy and affiliation rankings and winners of a finished competition · `#5029`, `#5040`, `#5041`
18. client should receive an empty leaderboard before any result is recorded · `#5034`
19. client should get not found for the leaderboard of an unknown competition · none (the product spec says only that a draft or cancelled competition is 404; no requirement issue names an unknown id)
20. client should get a bad request for the leaderboard at <description> · none (no requirement issue names a malformed id)
21. client should get not found or bad request when asking for the competitors of a competition at <address> · none
22. client should be refused the Stripe webhook when requesting it with <method> · none
23. client should be refused the organiser competition routes without a token when requesting <route> · `#5004`, `#3013`
24. client should be refused the competitor routes without a token when requesting <route> · `#5009`
25. client should be refused the sign-up routes without a token when requesting <route> · `#5013`, `#3010`
26. client should be offered no division when registration is not open for <competition> · `#5003`
27. client should get not found when signing up for <target> that does not exist · none
28. client should be refused a sign-up that does not accept both consents when the consent is <value> · none
29. client should be refused a sign-up request body that is not JSON when it is sent as <format> · none
30. client should get not found or bad request when resuming payment for a sign-up that is <kind> · none
31. client should get not found or bad request when cancelling a sign-up that is <kind> · none
32. client should get not found or bad request when moving a sign-up to another division and the request is <kind> · none
33. client should be refused changing a directory section with a competitor token when requesting <route> · `#5037`
34. client should be refused the organiser competition routes with a competitor token when requesting <route> · `#5004`, `#3013`
35. competitor should get an empty incomplete profile with their sign-in email before saving one · `#5007`
36. client should be refused a profile save with an invalid value when <field> is <value> · none
37. competitor should keep one profile when saving it twice and signing in again with the same email · `#5007`
38. client should receive every division of a competition with no confirmed competitors as an empty list · `#5015`

Scenarios 7 and 8 are data-driven over `tests/features/common/testdata/invalid-values.ts`
(7 covers malformed `includeInactive` and paging values). Scenarios 10 to 13 are in
`competitions-upcoming.api.acceptance.spec.ts`, scenarios 14 to 20 and 38 in `competitions-detail.api.acceptance.spec.ts`. Errors are asserted as RFC 9457
problem documents (`expectProblem`).

Scenarios 21 to 37 came from the tournaments spec: 21 to 25 are in `competitions-access.api.acceptance.spec.ts`; 26 to 30 in
`competitions-sign-up.api.acceptance.spec.ts`; 31 and 32 in `competitions-sign-up-changes.api.acceptance.spec.ts`; 33 and
34 in `competitions-competitor-access.api.acceptance.spec.ts`; 35 to 37 in `competitions-profile.api.acceptance.spec.ts`.
They need the environment's flag on (`@bjjeire-competitions-on`); 26 to 37 are `@local-sign-in`. The switched-off API
scenario (tournaments API 1) was deleted on 2026-11-17: flag-off behaviour is owned by the app's API integration tests.
Data-driven rows are listed in each block's Test design.

## Constraints

- No county filter (aggregate has no county).
- Search is client-side and matches the name only; unique search → `expectResultCount(1)`.
- Dates are shown in Irish time, wherever the visitor is.
- `slug` uniqueness is an API/index concern — do not assert it only in UI.
- **`BjjEireCompetitions` flag.** Off by default in the app. `ALL_FEATURES_ENABLED` pins it off, so shared chrome is the
  same on every environment; `competitionsTestConfig` pins it on for every competitions UI spec. Pinning the browser is
  not enough: the API hides every BJJ Éire competition, competitor and registration route when the flag is off, so
  specs that need the API to serve it carry `@bjjeire-competitions-on`, and their Given step reads the environment's
  flag endpoint, failing with a message naming `BJJEIRE_COMPETITIONS_FLAG` when the two disagree. There is no `-off`
  tag: flag-off behaviour is owned by the app's API integration tests. `BJJEIRE_COMPETITIONS_FLAG=on` runs the
  `@bjjeire-competitions-on` set; `off` or unset excludes it (`src/shared/config/profile-defaults.ts`: on for `local`
  and `docker`, off for `dev` and `staging`; a stack started with the compose default
  `FEATURE_BJJEIRE_COMPETITIONS=false` needs `BJJEIRE_COMPETITIONS_FLAG=off`).
- **Local competitor sign-in.** Competitor scenarios sign in through the stack's local route
  (`POST /api/v1/local-sign-in/competitor`, local profile only), which issues a token for any email. They carry
  `@local-sign-in`; `LOCAL_SIGN_IN=off` (dev, staging) excludes them. The `competitor` fixture (`fixtures.ts` for UI,
  `fixtures.api.ts` for API, both on `src/api/features/competitions/competitor.service.ts`) creates a fresh
  `pw-<token>@example.test` account, optionally saves a profile, and deletes it after the test. It never creates a
  sign-up: a sign-up takes a seeded place that cannot be given back and blocks deleting the competitor. The UI fixture
  aborts any POST to the sign-up and checkout routes and fails the test if the page sent one.
- Registration times are shown in Irish time whatever the browser's time zone. `acceptance-open`'s and
  `acceptance-closed`'s windows are relative to the seed run, so oracles read the instants from the API and render them with the suite's own `dublin-time.ts`.
- A draft is never visible to a visitor (`#5001`). The app's API integration tests own that rule; the test dataset
  seeds no drafts.
- `#5036` (the directory stays readable without an account) is proven by the gyms, events, competitions and stores
  suites passing unchanged. It gets no scenario of its own.

## Planned

UI scenarios 9–19 and API 5–6 were accepted from
`specs/exploration/2026-10-31-competitions-review.md` and implemented on 2026-10-31; their
blocks stay as the design notes. Scenarios 1–8 and API 1–4 predate the convention. Phone
reflow and page titles belong to `specs/features/layout.md`.

#### visitor should reach a competition's website and registration from its card

- Layer: UI · Tags: @acceptance · Data: `SEEDED_COMPETITION_DONEGAL_GI_CLASSIC` (seeded) · Mocked: no
- Covers: none (exploration 2026-10-31)
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. When a visitor opens Competitions
  2. And the visitor searches for <name>
- Expected results:
  - Then the card links to its website and registration
- Why: reaching the organiser is the point of the page. High impact, and no test checks the targets.

#### visitor should see a competition's dates on its card

- Layer: UI · Tags: @acceptance · Data: one competition each for a single day, days in one month, and days across months · Mocked: yes (seeded dates roll, and `seeded.ts` holds none)
- Covers: none (exploration 2026-10-31)
- Oracle: the fixed mock body named on the test-design line. The expected value is that body, not a calculation shared with the app.
- Steps:
  1. Given competitions run on one day, within a month and across months
  2. When a visitor opens Competitions
- Expected results:
  - Then each card shows its dates in full
- Why: three date formats had no coverage.

#### visitor should see the competition list after retrying when competitions failed to load

- Layer: UI · Tags: @acceptance · Data: `competitions-pagination-page-1.json` · Mocked: yes
- Covers: `#3004`
- Oracle: the fixed mock body named on the test-design line. The expected value is that body, not a calculation shared with the app.
- Steps:
  1. Given the competition service is briefly unavailable
  2. When a visitor opens Competitions
  3. Then a server error message is displayed
  4. When the visitor retries
- Expected results:
  - Then the competition list is displayed
- Why: the existing error scenarios stop at the message. Gyms already has this one.

#### visitor should see website unavailable when a competition has no safe links

- Layer: UI · Tags: @acceptance · Data: a competition with unsafe website and registration addresses · Mocked: yes
- Covers: none (exploration 2026-10-31)
- Oracle: the fixed mock body named on the test-design line. The expected value is that body, not a calculation shared with the app.
- Steps:
  1. Given a competition has only unsafe links
  2. When a visitor opens Competitions
- Expected results:
  - Then its card offers no link and says the website is unavailable
- Why: guards link blocking, which seed data cannot exercise.

#### visitor should see the same page of competitions after reloading

- Layer: UI · Tags: @acceptance · Data: `paginatePages` over the existing fixture · Mocked: yes
- Covers: `#3004`
- Oracle: the fixed mock body named on the test-design line. The expected value is that body, not a calculation shared with the app.
- Steps:
  1. Given the competition list has two pages
  2. When a visitor opens Competitions
  3. And the visitor opens the next page
  4. And the visitor reloads the page
- Expected results:
  - Then the second page is still shown
- Why: page state is shared, but Competitions only covers moving between pages.

#### visitor should see the shared search when opening a search link

- Layer: UI · Tags: @acceptance · Data: `SEEDED_COMPETITION_DONEGAL_GI_CLASSIC_PARTIAL_NAME` (seeded) · Mocked: no
- Covers: none (exploration 2026-10-31)
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. When a visitor opens a link to a search for "<name>"
- Expected results:
  - Then the search is filled in
  - And only that competition is listed
- Why: shared links are a visitor-facing promise of URL state, and untested here.

#### visitor should see every competition again after clearing the search

- Layer: UI · Tags: @acceptance · Data: `SEEDED_COMPETITION_DONEGAL_GI_CLASSIC_PARTIAL_NAME` (seeded) · Mocked: no
- Covers: `#3003`
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. Given a visitor has searched for "<name>"
  2. When the visitor clears the search
- Expected results:
  - Then other competitions are listed again
- Why: a stuck filter would hide the directory. Proves a second card returns, not a total, because environments hold full datasets.

#### client should receive finished competitions when asking to include inactive ones

- Layer: API · Tags: @acceptance · Data: `SEEDED_COMPETITION_FINISHED_KERRY_COAST` (seeded) · Mocked: no
- Covers: `#3002`
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. When a client requests the listing including inactive competitions
- Expected results:
  - Then the finished competition "<name>" is listed
- Why: only malformed values of this option are tested. Page size must be large enough to reach the record.

#### client should receive an empty page with valid pagination for a page beyond the last

- Layer: API · Tags: @acceptance · Data: seeded listing · Mocked: no
- Covers: `#3004`
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. When a client requests a page beyond the last page of the listing
- Expected results:
  - Then the page is empty and its pagination points back, not forward
- Why: Gyms has this bound and Competitions does not.

#### visitor should see how many competitions were found

- Layer: UI · Tags: @acceptance · Data: `SEEDED_COMPETITION_DONEGAL_GI_CLASSIC_PARTIAL_NAME` (seeded) · Mocked: no · Needs: F2 fixed
- Covers: none (decided 2026-10-31)
- Oracle: the seeded record named on the test-design line, as the visitor sees it. Not a calculation shared with the app.
- Steps:
  1. When a visitor opens Competitions
  2. And the visitor searches for <name>
- Expected results:
  - Then the page says one competition was found
- Why: decided 2026-10-31. A search narrows the count to one, so it holds on a full dataset.

#### visitor should not find a competition by anything other than its name

- Layer: UI · Tags: @acceptance · Data: seeded DTOs; terms for description, organisation, country and tag · Mocked: yes (a real dataset may have "Ireland" in a name) · Needs: F3 fixed
- Covers: `#3003`
- Oracle: the fixed mock body named on the test-design line. The expected value is that body, not a calculation shared with the app.
- Steps:
  1. Given a competition with a description, an organisation, a country and tags
  2. When a visitor opens Competitions
  3. And the visitor searches for a word only in its <field>
- Expected results:
  - Then no competitions are listed
- Why: decided 2026-10-31, and matches the product spec. Same rule as Stores.

#### visitor should see a competition's dates in Irish time wherever they are

- Layer: UI · Tags: @acceptance · Data: one competition with fixed dates · Mocked: yes · Timezone: America/New_York, set with `test.use` · Needs: F1 fixed
- Covers: none (decided 2026-10-31)
- Oracle: the fixed mock body named on the test-design line. The expected value is that body, not a calculation shared with the app.
- Steps:
  1. Given a competition running on two days in Ireland
  2. When a visitor behind Ireland opens Competitions
- Expected results:
  - Then its dates are those of the event in Ireland
- Why: decided 2026-10-31. Fails today, showing the day before.

### BJJ Éire competitions on Competitions (implemented 2026-11-16)

From `bjjeire-java/specs/002-merge-tournaments-competitions/spec.md` (ADR-0015). The
competitions BJJ Éire runs itself are now **BJJ Éire competitions** inside this feature:
upcoming ones are featured above the directory, their pages live at `/competitions/{slug}`
(`/signup`, `/signup/complete`) and `/admin/competitions[/{id}]`, the API is
`/api/v1/bjjeire-competition`, the flag is `BjjEireCompetitions`, and the full-competition
problem is `urn:bjjeire:competition-full`. The scenarios of the retired tournaments spec were folded into this
file on 2026-11-17 (see [Folded from the tournaments spec](#folded-from-the-tournaments-spec-2026-11-17)).
**Tags.** Specs that need the flag on in the environment carry `@bjjeire-competitions-on`, which
`BJJEIRE_COMPETITIONS_FLAG` other than `on` excludes (renamed from `@tournaments-on` / `TOURNAMENTS_FLAG` in the
fold; the `-off` tag was removed on 2026-11-17 because no spec here needs the flag off).
`src/ui/fixtures/feature-flags.fixture.ts` pins `BjjEireCompetitions: false` in `ALL_FEATURES_ENABLED`, and
`competitionsTestConfig` pins it on, so a scenario that needs the flag off in the UI sets it to `false` in its own
`featureFlagOverrides`. Seed: the three acceptance BJJ Éire competitions now live in
`bjjeire-java/seeder/data-test/bjjeire-competitions/` with the same slugs and content.
`#3012`, `#3015` and `#3017` are proven below T6 (contract, unit and IT layers).

#### visitor should see upcoming BJJ Éire competitions featured above the competition list

- Covers: `#3006`
- Oracle: the seeded acceptance BJJ Éire competitions (`acceptance-open` and `acceptance-opens-later` on 2 June 2035, €25.00, National Indoor Arena, five divisions each; `acceptance-closed` on 14 July 2035, €30.00, UL Sport Arena). All three are upcoming because their days have not passed.
- Steps:
  1. When a visitor opens Competitions
- Expected results:
  - Then a "BJJ Éire competitions" section appears above the search box
  - And it shows the three seeded BJJ Éire competitions, earliest day first
  - And each card shows its day, venue, fee in euro and five divisions
  - And the cards say Open, Not open yet and Closed respectively
- Why: the merge exists so visitors find BJJ Éire's own competitions first; a missing or misordered section hides the revenue path.

Test design: UI · @smoke @acceptance @bjjeire-competitions-on · seeded acceptance BJJ Éire competitions (this is the feature's second critical journey; observed 2026-11-16: badges Open, Not open yet, Closed; "Acceptance Open" before "Acceptance Opens Later" on the shared day, by name) · not mocked · default seed. Other competitions may be featured on a full dataset, so assert the three by name, in that relative order, not a total. Holds on freshly seeded environments: only `acceptance-open`'s window is seed-relative, so its Open badge drifts about 30 days after a seed; Not open yet (`acceptance-opens-later`, fixed in 2035) and Closed (`acceptance-closed`, closed the day before the seed run) do not (see `seeded.ts`).

#### visitor should see no featured section when no BJJ Éire competition is upcoming

- Covers: `#3007`
- Oracle: a fixed mock body for `GET /api/v1/bjjeire-competition` with no items, and the product spec's rule that there is no placeholder.
- Steps:
  1. Given no BJJ Éire competition is upcoming
  2. When a visitor opens Competitions
- Expected results:
  - Then the competition list shows as before
  - And there is no "BJJ Éire competitions" section and no empty placeholder
- Why: an empty featured block would push the directory down for nothing on a phone.

Test design: UI · @acceptance @bjjeire-competitions-on · mocked empty page from `/api/v1/bjjeire-competition` (the query asks for page 1, size 100), seeded directory · mocked

#### visitor should keep the featured BJJ Éire competitions while searching the competition list

- Covers: `#3008`
- Oracle: a random 12-character search term that matches no directory competition name, and the seeded acceptance BJJ Éire competitions.
- Steps:
  1. When a visitor opens Competitions
  2. And the visitor searches for a name that matches no directory competition
- Expected results:
  - Then the list shows its no-results message
  - And the three featured BJJ Éire competitions are still shown
- Why: search must filter the directory only; hiding the featured section on a search loses the sign-up path.

Test design: UI · @acceptance @bjjeire-competitions-on · a random non-matching search term and the seeded BJJ Éire competitions (`SEEDED_FEATURED_COMPETITIONS`) · not mocked · default seed. Search for a string no directory name contains; the featured cards are not part of the search, so assert them by name.

#### visitor should still see the competition list when BJJ Éire competitions cannot be loaded

- Covers: `#3007`
- Oracle: a fixed 500 problem body for `GET /api/v1/bjjeire-competition`; the seeded directory competitions.
- Steps:
  1. Given BJJ Éire competitions fail to load
  2. When a visitor opens Competitions
- Expected results:
  - Then the competition list shows the seeded directory competitions
  - And there is no featured section and no error message for it
- Why: spec edge case: one feature failing must not hide the other.

Test design: UI · @acceptance @bjjeire-competitions-on · mocked 500 problem on `/api/v1/bjjeire-competition` only, seeded directory · mocked

#### visitor should open a featured BJJ Éire competition's page at its competitions address

- Covers: `#3009`
- Oracle: the seeded `acceptance-open` record (name, day, venue, fee, five divisions, registration window in Irish time).
- Steps:
  1. When a visitor opens Competitions
  2. And the visitor opens the featured Acceptance Open card
- Expected results:
  - Then the address is the address of the Acceptance Open competition under Competitions
  - And the page shows its details, fee, registration window in Irish time and divisions
- Why: the card is the only way in after the list page was removed.

Test design: UI · @acceptance @bjjeire-competitions-on · seeded `acceptance-open` (observed 2026-11-16: details, "€25.00 per division", registration window "(Irish time)", places "0 of 200 taken", divisions grouped Gi/No-Gi by gender; the window rolls with the seed run, so assert its Irish-time suffix and format, not fixed dates) · not mocked · default seed

#### visitor should be told a competition was not found for an unknown competitions address

- Covers: `#3009`
- Oracle: the product spec's copy ("Competition not found", link "See all competitions" to `/competitions`).
- Steps:
  1. When a visitor opens a competitions address no competition has
- Expected results:
  - Then the page says "Competition not found"
  - And its link leads back to Competitions
- Why: a draft or mistyped address must not show a blank page or another competition.

Test design: UI · @acceptance @bjjeire-competitions-on · no data · not mocked (observed 2026-11-16: "Competition not found", "There is no competition at this address.", link "See all competitions" to `/competitions`; the page needs a moment to resolve, so use a web-first wait)

#### visitor should land on the default page when opening a retired address "<address>"

- Covers: `#3016`
- Oracle: the product spec: retired addresses are unknown addresses, with no redirect to the new ones.
- Steps:
  1. When a visitor opens <address>
- Expected results:
  - Then they land on the Events page
- Why: a leftover route would double the surface to secure and keep the old name alive.

Test design: UI · @acceptance @bjjeire-competitions-on · observed 2026-11-16: `/tournaments/acceptance-open` lands on `/events` · data-driven over `/tournaments`, `/tournaments/acceptance-open`, `/admin/tournaments` · not mocked

#### client should get the same answer at a retired API route as at a route that never existed

- Covers: `#3016`
- Oracle: the answer of `GET /api/v1/no-such-feature` in the same environment (401 with no token, as the security catch-all asks for sign-in first). The app spec records that a signed-in organiser gets 404.
- Steps:
  1. When a client calls a retired competitions route and a route that never existed with no token
- Expected results:
  - Then both answers have the same status and the retired route does not succeed
  - And both answers are the same problem document
  - And neither redirects
- Why: an old route answering differently would mean the rename left a live endpoint.

Test design: API · @acceptance · no data · not mocked · observed 2026-11-16: both answer 401 with no token. Limit: with no token the security catch-all answers 401 before routing, so this cannot show that the retired route is gone, only that it is not open and not distinguishable from an unknown one. The signed-in organiser's 404 is not covered here (no organiser token in the API project). The retired route is `RETIRED_API_ROUTE` in the spec file (the old `/api/v1/tournament` prefix; `API_ROUTES` no longer carries it), the unknown one `API_ROUTES.noSuchFeature`.

#### visitor should keep the featured BJJ Éire competitions while paging the competition list

- Covers: `#3008`
- Oracle: a fixed mock body: two pages of the directory, from the existing pagination fixtures, and one featured competition.
- Steps:
  1. Given the competition list has two pages and a BJJ Éire competition is upcoming
  2. When a visitor opens Competitions
  3. And the visitor opens the next page
- Expected results:
  - Then the second page of the list is shown
  - And the featured BJJ Éire competition is still shown
  - And the featured BJJ Éire competitions are not loaded again
- Why: the product spec says paging touches the list alone; a refetch that clears the featured block would lose the sign-up path.

Test design: UI · @acceptance @bjjeire-competitions-on · `paginatePages` over the existing fixture plus a fixed featured body · mocked

#### visitor should see the featured BJJ Éire competitions before the search box on a phone

- Covers: `#3006`
- Oracle: the seeded acceptance BJJ Éire competitions and the product spec's placement: between the page header and the search box.
- Steps:
  1. When the visitor opens Competitions
- Expected results:
  - Then the featured BJJ Éire competition "Acceptance Open" is shown above the search box
- Why: SC-002 of the merge spec. On 375 px the featured block is the first thing seen, and a layout that pushes it below a long list defeats the merge.

Test design: UI · @mobile @acceptance @bjjeire-competitions-on · seeded `acceptance-open` · not mocked · phone viewport comes from the mobile projects (smoke-only per AGENTS.md, so tag `@smoke` to run it there)

#### visitor should keep their theme when opening a BJJ Éire competition

- Covers: none (the product spec's theme edge case, ADR-0011; no requirement issue names it)
- Oracle: the product spec: opening the featured section and a BJJ Éire competition page never changes the visitor's theme.
- Steps:
  1. Given a visitor who has chosen competition mode
  2. When the visitor opens Competitions
  3. And the visitor opens the featured "Acceptance Open" card
- Expected results:
  - Then the competition mode is still on
- Why: the BJJ Éire pages are new surfaces on a themed site; a page that resets the theme is a visible regression.

Test design: UI · @acceptance @bjjeire-competitions-on · seeded `acceptance-open` · not mocked · the theme toggle is "Switch to competition mode" in the header (observed 2026-11-16); the suite defaults to dark, so assert on the toggle's state, not a colour

### Still planned (not yet implemented)

No test claims these blocks yet. Both need an app change or a stack feature (see Findings). Behaviour with the environment's `BjjEireCompetitions` flag off is owned by the app's API integration tests in `bjjeire-java`, not this suite (owner decision 2026-11-17); UI 34 still proves the browser half of the navigation rule by pinning the flag off in the browser.

#### competitor should never see the retired name along the sign-up journey

- Covers: `#3011`
- Oracle: the product spec: every visible text about a BJJ Éire competition says "competition". The retired word is fixed in the test, not read from the app.
- Steps:
  1. Given a signed-in competitor with a complete profile
  2. When the competitor opens Competitions, the featured `acceptance-open` page, its sign-up page, My sign-ups and their profile
- Expected results:
  - Then no BJJ Éire competition card or page, header link or page title contains the retired word, in any case
  - And the profile's medal table is headed "Competitions entered"
- Why: SC-001 of the merge; a half-renamed page is the confusion the change removes.

Test design: UI · @acceptance @bjjeire-competitions-on @local-sign-in · seeded `acceptance-open` · not mocked · local and docker only. Scope the text check to the header, the featured section and the BJJ Éire pages, not the directory list: the seeded directory record "Donegal Winter Gi Classic" carries the retired word in its description in `seeded.ts` and in the app's seeder (see Findings F8). Observed 2026-11-16: the header has no entry with the retired name.

#### organiser should manage BJJ Éire competitions at the competitions admin address

- Covers: `#3013`
- Oracle: the seeded acceptance BJJ Éire competitions, and a draft the test creates with a unique slug.
- Steps:
  1. Given the organiser is signed in with the local organiser sign-in
  2. When the organiser opens `/admin/competitions`
  3. And creates a draft and publishes it
- Expected results:
  - Then the list shows every BJJ Éire competition with its status, the new one included
  - And the published one appears in the featured section on Competitions
  - And no navigation entry leads to the admin screens
- Why: the organiser's tools moved address; a break leaves no way to publish a competition.

Test design: UI · @acceptance @bjjeire-competitions-on @local-sign-in · creates its own draft with a unique slug, publishes it, and deletes or cancels it afterwards (rule 5 of the data policy; the published draft is featured on Competitions until cancelled, so other scenarios must not count the featured cards) · not mocked · local and docker only. Never edits the three seeded records.

### Featured card logo (planned 2026-11-17, slice 6)

Behaviour: `bjjeire-java/specs/features/competitions.md` § `#3006`. Each featured BJJ Éire competition card is headed by the BJJ Éire logo, served by the SPA at `/bjjeire-competition.jpg`. The image is decorative (`alt=""`), so it adds nothing to the card's accessible name. No test claims this block yet.

#### visitor should see the BJJ Éire logo at the top of each featured competition card

- Covers: `#3006`
- Oracle: the seeded acceptance BJJ Éire competitions (`acceptance-open`, `acceptance-opens-later`, `acceptance-closed`), and the product spec's rule that every featured card is headed by the BJJ Éire logo.
- Steps:
  1. When a visitor opens Competitions
- Expected results:
  - Then each of the three seeded featured cards shows the BJJ Éire logo above its name
  - And the logo has loaded (it is not a broken image)
  - And the card's accessible name is still just the competition's name
- Why: the logo is what marks BJJ Éire's own competitions apart from the directory cards below; a broken image on the featured cards is the first thing a visitor sees on Competitions.

Test design: UI · @acceptance @bjjeire-competitions-on · seeded acceptance BJJ Éire competitions · not mocked · default seed. Find the image by the card test id `bjjeire-competition-card-image` within each featured card (`bjjeire-competitions-featured-card`), never by alt text: the alt is empty on purpose. "Loaded" means the image's `naturalWidth` is greater than 0 after scrolling it into view (it loads lazily). Assert on the three seeded cards by name, not on a total count of featured cards. Leave the `@smoke` featured-section scenario as it is.

### Results and leaderboard (planned 2026-11-16, slice 5)

Behaviour: `bjjeire-java/specs/features/competitions.md` § User Story BE5. No test claims these blocks yet. The test dataset seeds `acceptance-finished` (`/competitions/acceptance-finished`, id `acce88000000000000000004`): a finished competition with a recorded podium in each of five divisions, and the profile `medallist@acceptance.bjjeire.test` (local competitor sign-in) owning a gold and a silver. Expected leaderboard, worked out from the seed files: academies Lee Valley Jiu-Jitsu 22, Liffey BJJ 15, Corrib Grappling 12, Shannon Combat Club 2; affiliations Atlantic Alliance 27, Celtic Collective 22; winners Lee Valley Jiu-Jitsu and Atlantic Alliance; the brown belt -94.3 kg division had one competitor and adds no points. The seed is fixed: a scenario that records, corrects or finishes must use its own competition. The public leaderboard is `GET /api/v1/bjjeire-competition/{id}/leaderboard`; the organiser's results section reads `GET /api/v1/bjjeire-competition/admin/{id}/result`.

#### visitor should see that results will follow before any division has finished

- Covers: `#5034`
- Oracle: the product spec's empty-state copy, "No results yet. Results will appear here as divisions finish."
- Steps:
  1. Given the seeded `acceptance-open` competition with no recorded result
  2. When a visitor opens `/competitions/acceptance-open`
- Expected results:
  - Then the Results section says results will appear as divisions finish
  - And no podium, ranking or winners are shown
- Why: the first thing every visitor sees on the day; a blank or broken section reads as a fault.

Test design: UI · @acceptance @bjjeire-competitions-on · seeded `acceptance-open` · not mocked · needs no medallists, so it can run before T079.

#### visitor should see a division's podium once the organiser records it

- Covers: `#5028`
- Oracle: the seeded `acceptance-finished` podium of the Gi female adult blue -64 kg division: gold Aoife Ní Bhriain (Liffey BJJ, Atlantic Alliance), silver Róisín Doyle (Corrib Grappling), bronze Niamh Brennan (Lee Valley Jiu-Jitsu).
- Steps:
  1. Given the seeded finished competition with a recorded podium in that division
  2. When a visitor opens `/competitions/acceptance-finished`
- Expected results:
  - Then the division's podium shows the gold, silver and bronze medallists in that order
  - And each medallist shows their name, academy and affiliation and nothing private
- Why: the podium is the reason competitors come back to the page after the event.

Test design: UI · @acceptance @bjjeire-competitions-on · seeded `acceptance-finished` · not mocked. Recording a podium through the organiser's results section is a separate scenario on a competition the test creates.

#### visitor should see academies and affiliations ranked by points

- Covers: `#5029`, `#5040`
- Oracle: points worked out by hand from the seed files (see the intro): 9 per gold, 3 per silver, 1 per bronze, added per academy and per affiliation; Liffey BJJ and Corrib Grappling are both under Atlantic Alliance.
- Steps:
  1. Given the seeded finished competition with recorded podiums
  2. When a visitor opens `/competitions/acceptance-finished`
- Expected results:
  - Then the academy ranking lists each academy with its points, highest first
  - And the affiliation ranking adds those academies' points together under their affiliation
- Why: team points are what academies compete for; a wrong total is a public dispute.

Test design: UI · @acceptance @bjjeire-competitions-on · seeded `acceptance-finished` · not mocked. Tie-breaks, single-competitor divisions and missing academies are owned by the API's unit tests (`LeaderboardsTest`), not here.

#### visitor should see the winning academy and affiliation once the competition is finished

- Covers: `#5041`
- Oracle: the seeded `acceptance-finished` competition, finished, whose rankings are led by Lee Valley Jiu-Jitsu and Atlantic Alliance.
- Steps:
  1. Given the seeded finished competition with recorded podiums
  2. When a visitor opens `/competitions/acceptance-finished`
- Expected results:
  - Then the winners show the academy and the affiliation with the most points
- Why: finishing is the organiser's one public announcement of the result.

Test design: UI · @acceptance @bjjeire-competitions-on · seeded `acceptance-finished` · not mocked. The organiser's "Mark competition finished" action, and no winners before it, need a competition the test creates (finishing cannot be undone, so never the seeded records) with confirmed sign-ups (Stripe test mode); that stays a separate, local-only scenario.

#### competitor should see their medals on their profile once results are recorded

- Covers: `#5039`
- Oracle: the seeded profile `medallist@acceptance.bjjeire.test`, gold in the Gi female adult blue -64 kg division and silver in the No-Gi one of `acceptance-finished`.
- Steps:
  1. Given the seeded medallist signed in with the local competitor sign-in
  2. When the competitor opens their profile
- Expected results:
  - Then the medal totals show one gold, one silver and no bronze
  - And the competitions entered list Acceptance Finished with its gold and silver
- Why: the medal history is the one thing a competitor's account shows them after the day.

Test design: UI · @acceptance @bjjeire-competitions-on @local-sign-in · seeded profile and competition · not mocked · local and docker only. Never save or delete the seeded profile: deleting it would anonymise the seeded medals until the next reseed. The empty-history scenario (UI 50) stays as it is.

### Public pages and public API of BJJ Éire competitions (planned 2026-11-17)

Gaps found against the live Docker stack on 2026-11-17: the public `bjjeire-competition` API
(listing, by address name, competitors, leaderboard) had no scenario at its new address, and
the tournaments spec still tested the retired addresses (folded on 2026-11-17). The API blocks are the cheapest owner of
the ranking, points and winners rules; the UI blocks under "Results and leaderboard" above
prove a visitor sees them once, and should not recheck the arithmetic. The seeded finished
competition `acceptance-finished` (`acce88000000000000000004`, address name
`acceptance-finished`, 14 March 2026, 13 of 64 places taken, five divisions
`acce99000000000000000401` to `405`) is fixed: its dates and results do not roll. The
published OpenAPI contract has no `bjjeire-competition` schema yet, so API blocks parse with
`bjjeire-competitions.schemas.ts` (extended for the by-address, competitors and leaderboard
bodies) until the contract publishes them.

#### visitor should see no sign-up when registration is <state>

- Covers: `#5003`
- Oracle: the seeded `acceptance-opens-later` (opens in the future) and `acceptance-closed` (closed in the past), and the product spec's rule that the page states when registration opens or that it is closed and offers no sign-up.
- Steps:
  1. Given the seeded registration window of the competition "<name>"
  2. When a visitor opens the page of the competition "<name>"
- Expected results:
  - Then the registration status says "<badge>"
  - And the page states <sentence>
  - And no sign-up link is offered
- Why: a sign-up offered outside the window sends a competitor to a payment that the API refuses.

Test design: UI · @acceptance @bjjeire-competitions-on · data-driven over `acceptance-opens-later` (badge "Not open yet"; the whole sentence "Registration opens on <opening instant on the Irish clock> (Irish time).", built from `registrationOpensAt` read from the API in the Given step and rendered by the suite's `dublin-time.ts`, as UI 37 does) and `acceptance-closed` (badge "Closed", the fixed sentence "Registration is closed.") · not mocked · default seed. The Given step reads the window for both rows; the closed row does not use it. Restored on 2026-11-17 from the tournaments version, which asserted the whole opening sentence: a prefix alone would pass with a wrong or local-time date. Fail-first 2026-11-17: an oracle built from the closing instant failed with Expected "Registration opens on 25 May 2035, 21:00." / Received "Registration opens on 1 May 2035, 10:00 (Irish time).". The old `/tournaments` versions (tournaments spec UI 5 and 6) are superseded by this block and were dropped in the fold.

#### visitor should see a finished competition's page with its results and no sign-up

- Covers: `#5002`
- Oracle: the seeded `acceptance-finished`: status Finished, "This competition has finished.", 13 of 64 places taken.
- Steps:
  1. When a visitor opens the page of the competition "Acceptance Finished"
- Expected results:
  - Then the registration status says "Finished"
  - And the page says the competition has finished
  - And no sign-up link is offered
  - And its Results section shows a recorded podium
  - And the "No results yet" message is not shown
- Why: finished competitions keep their page, and a finished page that offers sign-up or hides its results loses the reason people return.

Test design: UI · @acceptance @bjjeire-competitions-on · seeded `acceptance-finished` · not mocked · default seed. The page needs a moment to resolve (the title shows the site default first), so use a web-first wait. That the finished competition is absent from the featured section is owned by the API listing block below, not asserted here.

#### visitor should see each division's confirmed competitors with their academy and affiliation

- Covers: `#5015`
- Oracle: the seeded `acceptance-finished` competitors per division, as the competitors endpoint returns them: Gi male adult white -76 kg has four (Cian Walsh, Liffey BJJ, Atlantic Alliance; Darragh Kelly, no academy; Oisín Byrne, Shannon Combat Club; Seán Murphy, Lee Valley Jiu-Jitsu, Celtic Collective), and Gi male adult brown -94.3 kg has one (Tadhg Quinn, Shannon Combat Club).
- Steps:
  1. When a visitor opens the page of the competition "Acceptance Finished"
- Expected results:
  - Then the Gi male adult white -76 kg division is headed "4 competitors" and lists those four, Darragh Kelly with no academy
  - And the brown -94.3 kg division is headed "1 competitor" and lists Tadhg Quinn
- Why: the public list is the one place competitors check that they are entered and that their team is spelled right.

Test design: UI · @acceptance @bjjeire-competitions-on · seeded `acceptance-finished` · not mocked · default seed. Scope assertions to the Competitors section (names also appear under Results). Privacy (no email, date of birth or id) is owned by the API block below.

#### visitor should be told a one-competitor division adds no team points

- Covers: `#5032`
- Oracle: the seeded `acceptance-finished` Gi male adult brown -94.3 kg division: Tadhg Quinn alone, recorded as gold; the product spec's copy "Only one competitor took part, so this division adds no team points."
- Steps:
  1. When a visitor opens the page of the competition "Acceptance Finished"
- Expected results:
  - Then the brown -94.3 kg podium shows Tadhg Quinn as gold
  - And it says only one competitor took part and no team points were added
- Why: without the note, a visitor reads the missing points in the ranking as a scoring fault.

Test design: UI · @acceptance @bjjeire-competitions-on · seeded `acceptance-finished` · not mocked · default seed. Whether Shannon Combat Club's total excludes this division is owned by the API leaderboard block (`pointsAwarded` false), not recomputed here.

#### client should receive upcoming BJJ Éire competitions, earliest day first, and not the finished one

- Covers: `#3006`
- Oracle: the seeded acceptance competitions: `acceptance-open` and `acceptance-opens-later` on 2 June 2035, `acceptance-closed` on 14 July 2035, each with five divisions; `acceptance-finished` (14 March 2026, status Finished) is seeded but its day has passed. Order is the product spec's rule: earliest day, then name.
- Steps:
  1. When a client requests the BJJ Éire competitions listing
- Expected results:
  - Then Acceptance Open, Acceptance Opens Later and Acceptance Closed are listed in that order
  - And each carries its day, venue, fee in euro cents, registration state and division count
  - And Acceptance Finished is not listed
  - And no further page follows
- Why: the featured section on Competitions renders this response as it stands; a finished or misordered entry reaches every visitor.

Test design: API · @acceptance @bjjeire-competitions-on (the route is gated server-side by `BjjEireCompetitions`; `BJJEIRE_COMPETITIONS_FLAG` selects the set) · seeded `acceptance-open`, `acceptance-opens-later`, `acceptance-closed`, finished `acceptance-finished` · not mocked · default seed · parsed with the hand-written `bjjeire-competitions.schemas.ts` (no published contract schema yet). Asserts relative order and membership by slug, the stable card fields including the day (`2035-06-02`, `2035-06-02`, `2035-07-14`, the seeder's fixed dates), `acceptance-opens-later` registration state exactly `NOT_OPEN` (its window is fixed in 2035) and `acceptance-closed` exactly `CLOSED` (it closed the day before the seed run, so it never rolls back), and for `acceptance-open` only that the state is a valid enum value (its window is seed-relative: Open for about 30 days after a seed, so the exact `OPEN` is not asserted). Fail-first 2026-11-17: expecting `OPEN` for `acceptance-opens-later` failed with Received "NOT_OPEN", that `acceptance-finished` is absent, and that no further page follows (page size 100; the count of listed competitions is not asserted). Observed 2026-11-17: three listed, in that order, `OPEN`, `NOT_OPEN`, `CLOSED`.

#### client should page through BJJ Éire competitions in distinct slices with correct links

- Covers: `#3006`
- Oracle: the listing's own envelope rules (total items, page count and links agree) and the seeded acceptance competitions, which guarantee at least three items.
- Steps:
  1. When a client requests the first and second page of the BJJ Éire competitions listing with a page size of two
  2. And the client requests the first and second page with a page size of one
- Expected results:
  - Then the two pages share no competition and the seeded data spans more than one page
  - And the first page has a next link and no previous link
  - And the second page has a previous link that leads back to the first
  - And one at a time the first two pages hold the first page of two, in the same order
- Why: the featured section asks for one page of 100, but any other client that pages gets a broken or repeating list if the links lie.

Test design: API · @acceptance @bjjeire-competitions-on · seeded acceptance competitions (three upcoming, so a page size of two gives two pages from real data; the test first asserts more than two items exist, so a single page cannot pass) · not mocked · default seed. Compare slices to each other, not to names; the last step joins pages 1 and 2 of size 1 and requires the same slugs, in order, as page 1 of size 2, so a competition skipped or repeated at a page boundary fails (restored from the tournaments paging scenario; live 2026-11-17: `acceptance-open`, `acceptance-opens-later` both ways). Observed 2026-11-17: page 1 of size 2 has `nextPageUrl` with `page=2`; page 2 holds the third item with a `previousPageUrl`.

#### client should get a bad request for paging <param> "<value>" that is not a number

- Covers: none (no requirement issue names paging of this endpoint; the app spec's rule that every route answers an invalid value with 400)
- Oracle: the app spec's "Changes outside BJJ Éire competitions": a value a field cannot take answers 400 as an RFC 9457 problem. Values come from `INVALID_INTEGER_QUERY_VALUES` in `tests/features/common/testdata/invalid-values.ts`.
- Steps:
  1. When a client requests the BJJ Éire competitions listing with <param> set to "<value>"
- Expected results:
  - Then the answer is a bad request problem
- Why: the featured listing is public and unauthenticated, so a malformed query must never reach a 500 with an error id.

Test design: API · @acceptance @bjjeire-competitions-on · data-driven over `INVALID_INTEGER_QUERY_VALUES` (`abc`, `1.5`) for both `page` and `pageSize`, 4 cases, answered 400 `urn:bjjeire:bad-request` (confirmed live 2026-11-17) · `expectProblem` · not mocked.

#### client should get a bad request for paging <param> "<value>" on the BJJ Éire competitions listing

- Covers: none (no requirement issue names paging of this endpoint; the app spec's rule that every route answers an invalid value with 400)
- Oracle: the app spec's "Changes outside BJJ Éire competitions": a value a field cannot take answers 400 as an RFC 9457 problem. Values come from `OUT_OF_RANGE_PAGING_VALUES` in `tests/features/common/testdata/invalid-values.ts`.
- Steps:
  1. When a client requests the BJJ Éire competitions listing with <param> set to "<value>"
- Expected results:
  - Then the answer is a bad request problem that names the field
- Why: the featured listing is public and unauthenticated, so a malformed query must never reach a 500 with an error id.

Test design: API · @acceptance @bjjeire-competitions-on · data-driven over `OUT_OF_RANGE_PAGING_VALUES` (`page` 0 and -1, `pageSize` 0 and 101), 4 cases, answered 400 `urn:bjjeire:validation-error` on field `Page` or `PageSize` with `VALUE_OUT_OF_RANGE` (confirmed live 2026-11-17) · `expectProblem` · not mocked. The tournaments spec's version at the retired route was dropped in the fold.

#### client should receive a competition by its address name with its details and divisions

- Covers: `#5002`
- Oracle: the seeded `acceptance-finished`: id `acce88000000000000000004`, name "Acceptance Finished", 14 March 2026, University of Galway Sports Centre, €30.00, limit 64, 13 places taken, status FINISHED, registration CLOSED, five divisions (Gi male adult white -76 kg, Gi female adult blue -64 kg, No-Gi male Master 1 purple -85.5 kg, No-Gi female adult blue -64 kg, Gi male adult brown -94.3 kg).
- Steps:
  1. When a client requests the competition with the address name "acceptance-finished"
- Expected results:
  - Then it is returned with its name, day, venue, fee, limit and places taken
  - And its status is finished and its registration is closed
  - And its five divisions are listed in the order above
- Why: this response is the competition page; a missing division or wrong status misleads every visitor of a finished event.

Test design: API · @acceptance @bjjeire-competitions-on (the route is gated server-side by `BjjEireCompetitions`; `BJJEIRE_COMPETITIONS_FLAG` selects the set) · seeded `acceptance-finished` (fixed dates, so it does not roll; registration CLOSED is fixed too) · parsed with the stand-in `bjjEireCompetitionSchema` (CONTRACT GAP) · not mocked · default seed. `version` is an organiser concurrency token, not asserted. `acceptance-open` is not used because its window rolls with the seed run.

#### client should get not found for a competition address name that is <description>

- Covers: `#3009`
- Oracle: the product spec: an unknown (or draft) address name is not found, as a problem document.
- Steps:
  1. When a client requests the competition with an address name that is <description>
- Expected results:
  - Then the answer is not found as a problem document
- Why: the SPA's "Competition not found" page depends on this answer and must never receive another competition's body.
- Gap: draft and cancelled addresses are owned by the app's API integration tests in `bjjeire-java` (no draft or cancelled competition is seeded), so only never-existing names are driven here.

Test design: API · @acceptance @bjjeire-competitions-on (the route is gated server-side by `BjjEireCompetitions`; `BJJEIRE_COMPETITIONS_FLAG` selects the set) · data-driven over six names no competition has (titles name the kind, because one value is 300 characters long): an unknown name `no-such-competition`, a name with a space `no such competition`, markup `<script>`, a query injection attempt `1 OR 1=1`, a seeded name with capitals `Acceptance-Open` (address names are case-sensitive), and an over-long name of 300 `a` (all answered 404 `urn:bjjeire:not-found`, checked live 2026-11-17; the last two restored from the tournaments unknown-address scenario) · `expectProblem` · not mocked. The reserved word `admin` is left out: `/admin` needs the organiser's token, so the app answers 401 `urn:bjjeire:unauthorized` before it looks up the route (by design, confirmed by the owner 2026-11-17). A draft slug is left out: draft and cancelled competitions are owned by the app's API integration tests (no draft is seeded).

#### client should receive each division's confirmed competitors with academy and affiliation and nothing private

- Covers: `#5015`, `#5009`
- Oracle: the seeded `acceptance-finished` competitors: four in the Gi male adult white -76 kg division, three in Gi female blue -64 kg, three in No-Gi male purple -85.5 kg, two in No-Gi female blue -64 kg, one in Gi male brown -94.3 kg; 13 in all, matching 13 places taken. Darragh Kelly has no academy. FR-011: name, academy and affiliation only.
- Steps:
  1. When a client requests the competitors of the competition "Acceptance Finished"
- Expected results:
  - Then the divisions are listed in the competition's order
  - And each division lists the seeded competitors by display name
  - And a competitor with no academy carries none
  - And no entry carries anything beyond name, academy and affiliation
- Why: a leaked email or date of birth on a public endpoint is a privacy breach for every entrant.

Test design: API · @acceptance @bjjeire-competitions-on (the route is gated server-side by `BjjEireCompetitions`; `BJJEIRE_COMPETITIONS_FLAG` selects the set) · `GET /api/v1/bjjeire-competition/{id}/competitor` (id from the seeded detail) · seeded `acceptance-finished` · not mocked · default seed. Entries are compared with `toStrictEqual` against the seeder's confirmed registrations (the cancelled Fionn Daly is absent), so any extra key fails, not only the fields that are present. An absent academy or affiliation is an absent key, not null. Division ids are compared as returned, unsorted, against the seeded order (`acce99000000000000000401` to `405`). API 38 owns empty divisions.

#### client should receive every division of a competition with no confirmed competitors as an empty list

- Covers: `#5015`
- Oracle: the seeded `acceptance-open` (`acce88000000000000000001`) and its five divisions `acce99000000000000000101` to `105`, in the seeder's order; the seed holds no sign-up for it. The app's competitor-list rule (T062): every division is returned in the competition's order, empty lists included.
- Steps:
  1. When a client requests the competitors of the competition "Acceptance Open"
- Expected results:
  - Then each of its five divisions is listed in the competition's order
  - And every division lists no competitor
- Why: a list that drops a division with no entrants hides that division from the public page.

Test design: API · @acceptance @bjjeire-competitions-on · `GET /api/v1/bjjeire-competition/{id}/competitor` with `SEEDED_OPEN_COMPETITION_ID`, expected ids `SEEDED_OPEN_DIVISION_IDS` · seeded `acceptance-open` · not mocked · freshly seeded stack. Restored on 2026-11-17 from the dropped tournaments scenario "client should list every division of a tournament in order with no competitor private data when asking for its competitors", whose empty-division half API 16 does not cover. Observed 2026-11-17: five divisions, each `competitors: []`. A hand-made confirmed sign-up on `acceptance-open` (as in F25) makes it fail until the next reseed; that is the seed's state, not an app fault.

#### client should receive the academy and affiliation rankings and winners of a finished competition

- Covers: `#5029`, `#5040`, `#5041`
- Oracle: points worked out by hand from the seed (9 per gold, 3 per silver, 1 per bronze): academies Lee Valley Jiu-Jitsu 22 (2 gold, 1 silver, 1 bronze), Liffey BJJ 15 (1, 2, 0), Corrib Grappling 12 (1, 1, 0), Shannon Combat Club 2 (0, 0, 2); affiliations Atlantic Alliance 27 (2, 3, 0) and Celtic Collective 22 (2, 1, 1); winners Lee Valley Jiu-Jitsu and Atlantic Alliance. Tadhg Quinn's gold in the one-competitor division adds nothing (Shannon Combat Club has no gold).
- Steps:
  1. When a client requests the leaderboard of the competition "Acceptance Finished"
- Expected results:
  - Then the academies are ranked 1 to 4 with those points and medal counts
  - And the affiliations are ranked 1 and 2 with those points and medal counts
  - And the winners are Lee Valley Jiu-Jitsu and Atlantic Alliance
  - And the division with one competitor awards no points while the other four do
- Why: team points are what academies compete for, and this response is the arithmetic; a UI test cannot see a wrong tie or a wrongly counted division.
- Note: this is the layer that owns `#5029`, `#5040` and `#5041`. The UI blocks above these (podium, rankings, winners) prove the visitor sees the same numbers once; keep their assertions to what the card shows, not a second calculation.

Test design: API · @acceptance @bjjeire-competitions-on (the route is gated server-side by `BjjEireCompetitions`; `BJJEIRE_COMPETITIONS_FLAG` selects the set) · `GET /{id}/leaderboard` (id from the seeded detail) · seeded `acceptance-finished` · not mocked · default seed. The oracle is `SEEDED_FINISHED_LEADERBOARD` in `seeded.ts`, written from the hand-worked points, not from a response; rankings and winners are compared with `toStrictEqual`. Observed 2026-11-17: the live body matches the oracle exactly. The one-competitor division has `pointsAwarded` false (`#5032`); the spec asserts `pointsAwarded` for all five divisions in order. Client `getBjjEireLeaderboard` and `bjjEireLeaderboardSchema` are reused by the empty-leaderboard and not-found scenarios.

#### client should receive an empty leaderboard before any result is recorded

- Covers: `#5034`
- Oracle: the seeded `acceptance-open` has no recorded result; the product spec says the page then shows "No results yet".
- Steps:
  1. When a client requests the leaderboard of the competition "Acceptance Open"
- Expected results:
  - Then it has no podiums and no rankings
  - And it names no winners
- Why: the UI's empty state is driven by this shape, and a stray ranking before any result would publish scores that do not exist.

Test design: API · @acceptance @bjjeire-competitions-on (the route is gated server-side by `BjjEireCompetitions`; `BJJEIRE_COMPETITIONS_FLAG` selects the set) · `GET /{id}/leaderboard` · seeded `acceptance-open` (id `acce88000000000000000001`, `SEEDED_OPEN_COMPETITION_ID`) · not mocked · default seed. Observed 2026-11-17: `{"podiums":[],"academyRanking":[],"affiliationRanking":[]}` with no `winners` key. The test asserts the three arrays are empty and `winners` is absent, not null, because the contract gives winners only once FINISHED.

#### client should get not found for the leaderboard of an unknown competition

- Covers: none (the product spec says only that a draft or cancelled competition is 404; no requirement issue names an unknown id)
- Oracle: the app spec's rule that an unknown id is not found, as a problem document.
- Steps:
  1. When a client requests the leaderboard of a competition that does not exist
- Expected results:
  - Then the answer is not found as a problem document
- Why: the leaderboard is public; an unknown id must never reach a 500 or another competition's body.
- Gap: draft and cancelled competitions answer 404 by the app spec; that case is owned by the app's API integration tests in `bjjeire-java` (none is seeded here).

Test design: API · @acceptance @bjjeire-competitions-on (the route is gated server-side by `BjjEireCompetitions`; `BJJEIRE_COMPETITIONS_FLAG` selects the set) · `GET /{id}/leaderboard` with `UNPUBLISHED_OBJECT_ID` (observed 404 `urn:bjjeire:not-found` on 2026-11-17) · `expectProblem` · not mocked.

#### client should get a bad request for the leaderboard at <description>

- Covers: none (no requirement issue names a malformed id)
- Oracle: the app spec's rule that a malformed id is a bad request, as a problem document naming the `Id` field.
- Steps:
  1. When a client requests the leaderboard of the competition at <description>
- Expected results:
  - Then the answer is a bad request problem document that names the malformed id
- Why: the leaderboard is public; a malformed id must never reach a 500.

Test design: API · @acceptance @bjjeire-competitions-on · `GET /{id}/leaderboard` · data-driven over `INVALID_OBJECT_ID_VALUES` from `tests/features/common/testdata/invalid-values.ts`, titled by each entry's `description` (observed 400 `urn:bjjeire:validation-error` with `Id` / `INVALID_FORMAT` on 2026-11-17) · `expectProblem` · not mocked.

### Folded from the tournaments spec (2026-11-17)

Task T049 of `bjjeire-java/specs/002-merge-tournaments-competitions/` folded the retired
`specs/features/tournaments.md` and `tests/features/tournaments/` into this feature. Every scenario
keeps its `Covers:`; the T6 issues of the merge spec's Acceptance Coverage (`#3009`, `#3010`,
`#3011`, `#3013`, `#3014`) were added where the scenario proves them. Scenarios that only tested the
retired `/tournaments`, `/admin/tournaments` or `/api/v1/tournament` addresses were dropped or rewritten
to the new addresses; [Dropped in the fold](#dropped-in-the-fold-2026-11-17) under Rejected lists
which and why. Retired-address behaviour is owned by UI 28 and API 9. The behaviour of `#5001`–`#5042`
is unchanged (FR-012): only names, addresses, the flag and the wire fields changed (`competitionId` in
the sign-up body and in `RegistrationDto`, `competitions[]` in the competitor history,
`urn:bjjeire:competition-full`).

Rehearsal: the source blocks were rehearsed against the Docker stack between 2026-11-13 and
2026-11-16 at the old addresses. On 2026-11-17 every folded test was run against the Docker stack
at the new addresses (`APP_ENV=local`, `BJJEIRE_COMPETITIONS_FLAG` on by default): all passed.
Competitor-facing copy is from the app's `config/content/` (`registrations.ts`, `competitor.ts`,
`bjjeire-competitions.ts`).

#### visitor should see no account entry when BJJ Éire competitions are switched off

- Covers: `#5038`, `#3014`
- Oracle: the rule in the app spec (FR-038) and the merge spec (`#3014`): with the flag off there is no account entry point. The expected navigation is the fixed list of directory sections plus About, and no header entry may carry the retired name (FR-005).
- Steps:
  1. When a visitor opens the site
- Expected results:
  - Then the navigation lists Events, Gyms, Competitions, Shop and About
  - And the navigation has no entry with the retired name
  - And the navigation has no sign-in or account entry
- Why: a switched-off feature leaking an account entry into the menu sends every visitor to a sign-in that does not work.

Test design: UI · @acceptance · no data · flags pinned in the browser `{ ...ALL_FEATURES_ENABLED, BjjEireCompetitions: false }`, so it runs on any environment whatever the API's flag says (no environment tag) · not mocked. Folded from tournaments UI 1. The app's `use-nav-items` unit test owns the rule at unit level. The featured section and the BJJ Éire page with the flag off are the still-planned `#3014` block above.

#### visitor should see no retired-name entry in the navigation when BJJ Éire competitions are switched on

- Covers: `#3011`
- Oracle: the merge spec (FR-005, `#3015`): the header's "Tournaments" entry is removed; the navigation is the directory sections plus About whatever the flags. The retired word is fixed in the test (`RETIRED_NAME_ENTRY_PATTERN`), not read from the app.
- Steps:
  1. Given BJJ Éire competitions are switched on
  2. When a visitor opens the site
- Expected results:
  - Then the navigation lists Events, Gyms, Competitions, Shop and About
  - And the navigation has no entry with the retired name
- Why: a leftover entry leads every visitor to an address that no longer exists.

Test design: UI · @acceptance @bjjeire-competitions-on · no data · not mocked. Rewritten from tournaments UI 3 ("a tournament entry in the navigation when tournaments are switched on"), whose expected entry the merge removed (findings F9, F10). The account icon sits outside the desktop page links, so the list is the same as with the flag off.

#### visitor should be asked to sign in as an organiser when opening competition management

- Covers: `#5004`, `#3013`
- Oracle: the app spec: `/admin/competitions` asks for the organiser's sign-in before loading anything and is not in the site navigation (`AdminSignInGate`: "Organiser sign-in", button "Sign in").
- Steps:
  1. Given BJJ Éire competitions are switched on
  2. When a visitor with no organiser sign-in opens competition management
- Expected results:
  - Then the organiser sign-in prompt is shown
  - And no competition is listed
  - And the navigation has no management entry
- Why: a management screen that loads for anyone shows draft competitions to the public.

Test design: UI · @acceptance @bjjeire-competitions-on · no data · not mocked · empty `storageState`, so the browser holds no organiser account by construction · `gotoRoute` to `/admin/competitions` (no link leads there). Rewritten from tournaments UI 10 at the new address. An organiser who signs in is the still-planned `#3013` block above (finding F13).

#### visitor should see a BJJ Éire competition's details, fee, registration window and divisions

- Covers: `#5002`, `#3009`
- Oracle: the seeded `acceptance-open`: 2 June 2035, National Indoor Arena, €25.00 per division, registration open, and its five seeded divisions in four groups by discipline and gender: Gi · Male (2), Gi · Female (1), No-Gi · Male (1), No-Gi · Female (1). The window is the API's opening and closing instants, read in the Given step and rendered on the Irish clock by the suite's `dublin-time.ts`.
- Steps:
  1. Given BJJ Éire competitions are switched on
  2. When a visitor opens the page of the competition "Acceptance Open"
- Expected results:
  - Then the competition day, the venue and the entry fee per division are shown
  - And the registration window is shown in Irish time
  - And registration is shown as open
  - And the divisions are listed in four groups by discipline and gender
- Why: the page is where a competitor decides whether to enter; a wrong fee, day or division list misleads every one of them.

Test design: UI · @acceptance @bjjeire-competitions-on · seeded `acceptance-open` · not mocked · a direct load of `/competitions/acceptance-open` (the shared-link case; folds tournaments UI 4 and UI 9). UI 25 proves the featured card leads here and checks the window's shape only; this one checks the exact instants and the division groups. The "Open" badge is seed-relative (about 30 days after a seed).

#### visitor should see registration times in Irish time when the browser is in another time zone

- Covers: `#5002`, `#3009`
- Oracle: the app spec: the window is shown in Irish time whatever the visitor's time zone. The expected times are the seeded instants read from the API and rendered in Europe/Dublin by the suite's helper, with the app's display options; it would not catch a wrong format that both share.
- Steps:
  1. Given BJJ Éire competitions are switched on
  2. When a visitor opens the page of the competition "Acceptance Open"
- Expected results:
  - Then the registration window shows the Irish opening and closing times
  - And the window is labelled as Irish time
- Why: a competitor in another zone who reads the window in their own clock enters a day early or misses the close.

Test design: UI · @acceptance @bjjeire-competitions-on · seeded `acceptance-open` · not mocked · `timezoneId: 'Pacific/Auckland'` with `test.use` (a 12-13 hour offset moves the calendar day). Rewritten from tournaments UI 7 (title unchanged) at the new address.

#### visitor should be offered to sign up when registration is open

- Covers: `#5013`, `#3010`
- Oracle: the app spec (User Story 3, "Starting") and the seeded `acceptance-open`, whose registration is open; the merge spec's sign-up address `/competitions/{slug}/signup`.
- Steps:
  1. Given BJJ Éire competitions are switched on
  2. When a visitor opens the page of the competition "Acceptance Open"
- Expected results:
  - Then a sign-up is offered
  - And the sign-up leads to the sign-up for that competition
- Why: UI 30 shows no sign-up outside the window; without this one a broken link on the open competition leaves no way to enter.

Test design: UI · @acceptance @bjjeire-competitions-on · seeded `acceptance-open` · not mocked · asserts the "Sign up" link's target is `/competitions/acceptance-open/signup` and does not follow it (creates nothing). Rewritten from tournaments UI 16 (title unchanged).

#### visitor should be asked to sign in and come back to the sign-up when signing up for a BJJ Éire competition

- Covers: `#5013`, `#3010`
- Oracle: the app spec (User Story 3, "Starting"): signed out, the sign-up page asks to sign in over the same page and shows the sign-up afterwards; the seeded `acceptance-open` division a white-belt adult man may enter.
- Steps:
  1. Given BJJ Éire competitions are switched on
  2. And a visitor is not signed in
  3. When the visitor chooses Sign up on a competition whose registration is open
  4. And the visitor signs in as a competitor with a complete profile
- Expected results:
  - Then the visitor is on the sign-up for that competition
  - And the divisions they may enter are offered
- Why: a competitor who is sent to sign in and lands somewhere else gives up before paying.

Test design: UI · @acceptance @bjjeire-competitions-on @local-sign-in · own competitor (fresh `pw-` email, male white belt born 1990, profile saved through the API, deleted afterwards); no sign-up is created and the fixture aborts any sign-up POST · seeded `acceptance-open` · not mocked · empty `storageState`. The heading is "Sign up for Acceptance Open". Renamed from "…when signing up for a tournament".

#### competitor should be offered only the divisions for their gender, belt and age

- Covers: `#5014`, `#3010`
- Oracle: the seeded divisions of `acceptance-open` (Gi male adult white -76 kg, Gi male adult blue -82.3 kg, Gi female adult white -64 kg, No-Gi male Master 1 purple -85.5 kg, No-Gi female adult blue -66.5 kg) and the competitor's own profile: only divisions with the same gender and belt and an age category whose minimum (Adult 18, Master 1 30, Master 2 36) the competitor reaches on the competition day.
- Steps:
  1. Given BJJ Éire competitions are switched on
  2. And a competitor has signed in with a new email and saved a complete profile as a male blue belt aged 35 on the competition day
  3. When the competitor opens the sign-up for the "Acceptance Open" competition from its page
- Expected results:
  - Then only the blue-belt male adult division is offered
  - And no division for another gender or belt is offered
  - And the entry fee €25.00 is shown before paying
- Why: a competitor allowed into the wrong division is disqualified on the day after paying.

Test design: UI · @acceptance @bjjeire-competitions-on @local-sign-in · own competitor, date of birth computed from the seeded day (35 years earlier, under Master 2), deleted afterwards; nothing submitted · seeded `acceptance-open` · not mocked. Each option reads "<discipline> · <gender> · <age category> · <belt> · <weight class>"; the expected options are in `seeded.ts`.

#### competitor should be told they cannot enter when they are 17 on the competition day

- Covers: `#5019`, `#3011`
- Oracle: the app spec (FR-017): nobody under 18 on the competition day may sign up; the 18th birthday itself counts as 18. Born one day after the cut-off, so 17 on the day. The copy is the app's: "You must be 18 or over on the competition day to compete in this competition."
- Steps:
  1. Given BJJ Éire competitions are switched on
  2. And a competitor has signed in with a new email and saved a profile that makes them 17 on the competition day
  3. When the competitor opens the sign-up for the "Acceptance Open" competition from its page
- Expected results:
  - Then the competitor is told they must be 18 or over on the competition day
  - And no division is offered and nothing can be paid
- Why: the competition takes adults only; an under-18 entry is a safeguarding and insurance problem for the organiser.

Test design: UI · @acceptance @bjjeire-competitions-on @local-sign-in · own competitor (male white belt, born the seeded day minus 18 years plus one day), deleted afterwards; nothing submitted · seeded `acceptance-open` · not mocked. Renamed from "…17 on the tournament day"; the asserted copy is the renamed one, so the test also guards `#3011` on this message.

#### competitor should be offered the adult division when they turn 18 on the competition day

- Covers: `#5019`
- Oracle: the app spec (FR-017): the 18th birthday itself counts as 18. Born exactly 18 years before the day, the one division offered to a male white-belt adult is Gi · Male · Adult · White · -76 kg.
- Steps:
  1. Given BJJ Éire competitions are switched on
  2. And a competitor has signed in with a new email and saved a profile that makes them 18 on the competition day
  3. When the competitor opens the sign-up for the "Acceptance Open" competition from its page
- Expected results:
  - Then the adult division is offered
  - And the competitor is not told they must be 18 or over on the competition day
- Why: an 18-year-old turned away on their birthday is a wrong refusal; this guards the cut-off from drifting to 19.

Test design: UI · @acceptance @bjjeire-competitions-on @local-sign-in · own competitor, deleted afterwards; nothing submitted · seeded `acceptance-open` · not mocked. The division is asserted first so the "no notice" check waits for the eligibility result.

#### competitor should see no sign-ups before signing up for a competition

- Covers: `#5021`, `#3011`
- Oracle: the app's copy for an empty "My sign-ups" page ("You have not signed up for a competition yet.") and the rule that the page lists only the signed-in competitor's own sign-ups; a fresh `PW` competitor has none.
- Steps:
  1. Given BJJ Éire competitions are switched on
  2. And a competitor has signed in with a new email and saved a complete profile
  3. When the competitor opens their sign-ups
- Expected results:
  - Then the sign-ups page says the competitor has not signed up for a competition yet
  - And no sign-up is listed
- Why: a sign-ups page that shows someone else's entries, or a blank page with no explanation, makes a new competitor think the site lost their entry.

Test design: UI · @acceptance @bjjeire-competitions-on @local-sign-in · own competitor, deleted afterwards · not mocked · reached from `acceptance-open`'s page through its "My sign-ups" link beside "Sign up" (finding F23: the only route besides the sign-up-complete page). Renamed from "…for a tournament".

#### visitor should be offered competitor sign-in or registration when opening their account

- Covers: `#5006`
- Oracle: the app spec (User Story 2, "Signing in"): signed out, the account page offers sign-in or registration in one place and loads no profile ("Competitor sign-in", button "Sign in or create an account").
- Steps:
  1. Given BJJ Éire competitions are switched on
  2. When a visitor opens their account from the navigation
- Expected results:
  - Then the visitor is asked to sign in as a competitor
  - And the visitor is offered to sign in or create an account
  - And no profile is shown
- Why: a visitor who cannot find where to sign up for an account can never enter a competition.

Test design: UI · @acceptance @bjjeire-competitions-on · no data · not mocked · empty `storageState` · starts on Competitions and follows the header's account icon (`competitor-account-link`). Checks only the signed-out page, so it is not `@local-sign-in`.

#### competitor should see their saved profile again after signing back in

- Covers: `#5007`
- Oracle: the app spec (User Story 2, "Profile"): the first save creates the profile and it is shown back as saved; the email shown is the one used to sign in.
- Steps:
  1. Given BJJ Éire competitions are switched on
  2. And a competitor has signed in with a new email
  3. When the competitor saves their name, nationality, date of birth, gender, belt and an academy
  4. And the competitor signs out and signs back in with the same email
- Expected results:
  - Then the profile shows the details they saved
  - And the profile shows the email they signed in with
- Why: a profile that is lost between visits sends competitors to the sign-up with nothing filled in.

Test design: UI · @acceptance @bjjeire-competitions-on @local-sign-in · own competitor (no profile; the form save is the behaviour under test), deleted afterwards · typed academy name (`PW <token> Academy`), so it does not depend on the gym seed · not mocked.

#### competitor should be saved with a gym from the directory as their academy

- Covers: `#5008`
- Oracle: a gym from the app's test dataset, "Blackwater Valley BJJ", found by part of its name (`SEEDED_DIRECTORY_GYM_*` in `seeded.ts`, recorded there because a feature never imports another feature).
- Steps:
  1. Given BJJ Éire competitions are switched on
  2. And a competitor has signed in with a new email
  3. And the competitor has filled in their name, date of birth, gender and belt
  4. When the competitor says their academy is in the gym directory
  5. And the competitor searches for part of a seeded gym's name and picks it
  6. And the competitor saves the profile
- Expected results:
  - Then the profile shows that gym as their academy
- Why: points are added up per academy; a competitor who cannot find their gym splits its points across spellings.

Test design: UI · @acceptance @bjjeire-competitions-on @local-sign-in · own competitor, deleted afterwards · seeded gym · not mocked. After picking, the page shows "Selected: <gym name>".

#### competitor should be saved with an academy typed by hand when theirs is not listed

- Covers: `#5008`
- Oracle: the app spec: "My academy is not listed" stores the typed name.
- Steps:
  1. Given BJJ Éire competitions are switched on
  2. And a competitor has signed in with a new email
  3. And the competitor has filled in their name, date of birth, gender and belt
  4. When the competitor says their academy is not listed and types its name
  5. And the competitor saves the profile
- Expected results:
  - Then the profile shows the typed academy name
- Why: small clubs are missing from the directory; their members must still be able to name them.

Test design: UI · @acceptance @bjjeire-competitions-on @local-sign-in · own competitor, deleted afterwards · not mocked.

#### competitor should be saved with no academy and no affiliation when they choose neither

- Covers: `#5008`
- Oracle: the app spec: "No academy" stores none, and the affiliation is optional.
- Steps:
  1. Given BJJ Éire competitions are switched on
  2. And a competitor has signed in with a new email
  3. And the competitor has filled in their name, date of birth, gender and belt
  4. When the competitor chooses no academy and leaves the affiliation empty
  5. And the competitor saves the profile
- Expected results:
  - Then the profile shows no academy
  - And the profile shows no affiliation
- Why: a competitor who trains alone must not be forced to invent a club that would then collect team points.

Test design: UI · @acceptance @bjjeire-competitions-on @local-sign-in · own competitor, deleted afterwards · not mocked.

#### competitor should see no medals and no competitions entered before any results

- Covers: `#5039`, `#3011`
- Oracle: the app spec ("Medals"): totals and competitions entered come from recorded results, which a fresh competitor has none of. The empty copy is the app's: "You have not entered a competition yet. Your medals will appear here."
- Steps:
  1. Given BJJ Éire competitions are switched on
  2. And a competitor has signed in with a new email and saved a profile
  3. When the competitor opens their profile
- Expected results:
  - Then the profile shows 0 gold, 0 silver and 0 bronze
  - And the profile says they have not entered a competition yet
- Why: a medal count that shows someone else's results, or invents some, makes the leaderboard look wrong to the person it is about.

Test design: UI · @acceptance @bjjeire-competitions-on @local-sign-in · own competitor with a saved profile, deleted afterwards · not mocked. Renamed from "…no tournaments entered…". The seeded medallist's history is the planned `#5039` block under Results and leaderboard.

#### competitor should be able to sign up again with the same email after deleting their account

- Covers: `#5012`
- Oracle: the owner's defect report (2026-11-15) and the app spec (User Story 2, "Deleting the account"): deletion removes the profile and ends the session; signing up again with the same email starts a new, empty account.
- Steps:
  1. Given BJJ Éire competitions are switched on
  2. And a competitor has signed in with a new email and saved a profile
  3. When the competitor deletes their account
  4. And signs up again with the same email
- Expected results:
  - Then the visitor is offered to create a competitor profile
  - And none of the deleted profile's details are shown
- Why: someone who deleted their account and comes back must not be locked out of competitions for good.

Test design: UI · @acceptance @bjjeire-competitions-on @local-sign-in · creates and deletes a competitor · not mocked. As setup, the test waits until the API accepts a fresh sign-in for the email (`sign-in-again.ts`, a bounded poll that writes nothing): a token issued in the deletion's own second is refused (finding F24), which this scenario does not cover.

#### visitor should find no accessibility violations on the featured BJJ Éire competitions

- Covers: none, a cross-cutting accessibility sweep; no requirement issue names it
- Oracle: WCAG 2.1 A and AA as run by the suite's axe sweep. The route sweep in `tests/accessibility/` opens Competitions with the flag pinned off, so it never scans the featured section or its registration badges.
- Steps:
  1. Given BJJ Éire competitions are switched on
  2. When a visitor opens Competitions
- Expected results:
  - Then Competitions and its featured section have no accessibility violations
- Why: the registration state is shown by a badge; a visitor who cannot read it cannot tell whether entries are open (finding F21, a contrast failure on that badge, was caught by this sweep's predecessor).

Test design: UI · @acceptance @bjjeire-competitions-on · `.a11y.` spec, project `a11y` (and `a11y-light`) · seeded featured competitions and directory · not mocked · waits for the three featured badges and the directory list before scanning. Rewritten from tournaments UI 13 ("…on the tournament list"), whose list page no longer exists.

#### visitor should find no accessibility violations on a BJJ Éire competition's page

- Covers: none, a cross-cutting accessibility sweep; no requirement issue names it
- Oracle: WCAG 2.1 A and AA as run by the suite's axe sweep.
- Steps:
  1. Given BJJ Éire competitions are switched on
  2. When a visitor opens the page of the competition "Acceptance Closed"
- Expected results:
  - Then the competition's page has no accessibility violations
- Why: the registration state is shown by a badge and wording; a screen-reader visitor who cannot read it cannot tell whether entries are open.

Test design: UI · @acceptance @bjjeire-competitions-on · `.a11y.` spec · seeded `acceptance-closed` (loads without an open window) · not mocked · direct load; the page-ready check (name shown) sits in the When step. Rewritten from tournaments UI 14.

#### competitor should find no accessibility violations on the sign-up page

- Covers: none, a cross-cutting accessibility sweep; no requirement issue names it
- Oracle: WCAG 2.1 A and AA as run by the suite's axe sweep. The sign-up page holds a division choice, two consent checkboxes and a fee.
- Steps:
  1. Given BJJ Éire competitions are switched on
  2. And a competitor has signed in with a new email and saved a complete profile
  3. When the competitor opens the sign-up for the "Acceptance Open" competition from its page
- Expected results:
  - Then the sign-up page has no accessibility violations
- Why: a competitor who uses a screen reader and cannot reach the consent checkboxes cannot enter.

Test design: UI · @acceptance @bjjeire-competitions-on @local-sign-in · `.a11y.` spec · own competitor (male white belt, one division eligible), deleted afterwards; nothing submitted · seeded `acceptance-open` · not mocked · waits for the offered division before scanning.

#### competitor should find no accessibility violations on the profile form

- Covers: none, a cross-cutting accessibility sweep; no requirement issue names it
- Oracle: WCAG 2.1 A and AA as run by the suite's axe sweep. The profile form has the academy picker, date, gender and belt inputs.
- Steps:
  1. Given BJJ Éire competitions are switched on
  2. And a competitor has signed in with a new email
  3. When the competitor opens their profile
- Expected results:
  - Then the create-profile form has no accessibility violations
- Why: the profile is the first form every competitor fills in; an unlabelled input stops a screen-reader user before they start.

Test design: UI · @acceptance @bjjeire-competitions-on @local-sign-in · `.a11y.` spec · own competitor with no profile (the "Create your competitor profile" form), deleted afterwards · not mocked · reached through the account link from Competitions.

#### client should get not found or bad request when asking for the competitors of a competition at <address>

- Covers: none, a not-found rule with no requirement issue of its own
- Oracle: the OpenAPI description of the public competitor list: the id is an object id; an unknown id is not found; a malformed value is a bad request naming `Id`.
- Steps:
  1. Given the environment has BJJ Éire competitions switched on
  2. When a client with no token requests the competitors of a competition at <address>
- Expected results:
  - Then the response is a problem document of the matching type
- Why: a list that answers 200 for a competition that does not exist makes a stale link look like an empty competition.

Test design: API · @acceptance @bjjeire-competitions-on · data-driven over `<address>`: the address name of a competition that exists (`acceptance-open`, 400 validation on `Id`, finding F19), an id that exists nowhere (404 `urn:bjjeire:not-found`) · not mocked. API 16 owns the competitor list's content.

#### client should be refused the Stripe webhook when requesting it with <method>

- Covers: none, a platform rule (ADR-0013: the webhook path serves only the signed `POST`) with no requirement issue of its own
- Oracle: the app's slice 3 status note: the webhook path is open to every method, so a method it does not serve is 405, not 401 (live: `Allow: POST`, type `urn:bjjeire:method-not-allowed`).
- Steps:
  1. Given the environment has BJJ Éire competitions switched on
  2. When a client with no token requests the Stripe webhook with <method>
- Expected results:
  - Then the response is a method-not-allowed problem document
- Why: a webhook that answers 401 to a stray method tells the world where payments are confirmed.

Test design: API · @acceptance @bjjeire-competitions-on · data-driven over `GET`, `PUT`, `DELETE` on `/api/v1/registration/stripe-webhook` (path unchanged by the merge) · **never `POST`**, the real webhook · not mocked · creates nothing.

#### client should be refused the organiser competition routes without a token when requesting <route>

- Covers: `#5004`, `#3013`
- Oracle: the app spec's access rules: the organiser list, an organiser read by id, create, update and publish need the organiser's token; a request with none is refused as an unauthorised problem document.
- Steps:
  1. Given the environment has BJJ Éire competitions switched on
  2. When a client with no token requests <route>
- Expected results:
  - Then the response is an unauthorised problem document
- Why: an organiser route that answers a visitor would expose drafts, which the public listing never shows.

Test design: API · @acceptance @bjjeire-competitions-on · data-driven over `<route>`: the organiser list = `GET /api/v1/bjjeire-competition/admin`, an organiser read = `GET …/admin/<id>`, a new competition = `POST /api/v1/bjjeire-competition` (no body), an update = `PUT …/<id>`, a publish = `POST …/<id>/publish`; every id a well-formed object id that exists nowhere · 401 `urn:bjjeire:unauthorized` · not mocked. A thin environment check that the routes are guarded; the app's admin integration tests own the rule in depth. Renamed from "…organiser tournament routes…" and re-pointed from `/api/v1/tournament`; the row "a new tournament" is now "a new competition".

#### client should be refused the competitor routes without a token when requesting <route>

- Covers: `#5009`
- Oracle: the app spec's access rules: the competitor's own profile, history and registrations need a competitor token; a request with none is refused as an unauthorised problem document. There is no public profile page.
- Steps:
  1. Given the environment has BJJ Éire competitions switched on
  2. When a client with no token requests <route>
- Expected results:
  - Then the response is an unauthorised problem document
- Why: a competitor route that answers a request with no sign-in would expose a person's date of birth and address to anyone.

Test design: API · @acceptance @bjjeire-competitions-on · data-driven over `<route>`: the competitor's own profile = `GET /api/v1/competitor/me`, a profile save = `PUT` (no body), a profile deletion = `DELETE`, the competitor's history = `GET …/me/history`, the competitor's registrations = `GET /api/v1/registration/me` (prefixes unchanged by the merge) · 401 `urn:bjjeire:unauthorized` · not mocked · the Given step proves the context carries no `authorization` header, because the deletion would remove a real profile otherwise.

#### client should be refused the sign-up routes without a token when requesting <route>

- Covers: `#5013`, `#3010`
- Oracle: the app spec's access rules (`eligible-division`, `POST /registration`, `POST /registration/{id}/checkout` need a competitor token): a request with none is refused as an unauthorised problem document.
- Steps:
  1. Given the environment has BJJ Éire competitions switched on
  2. When a client with no token requests <route>
- Expected results:
  - Then the response is an unauthorised problem document
- Why: a sign-up route that answers a request with no sign-in could start a hold and a Checkout page for nobody.

Test design: API · @acceptance @bjjeire-competitions-on · data-driven over `<route>`: the eligible divisions = `GET /api/v1/bjjeire-competition/<id>/eligible-division`, a new sign-up = `POST /api/v1/registration` (no body), a return to payment = `POST /api/v1/registration/<id>/checkout`; every id exists nowhere · `urn:bjjeire:unauthorized` · not mocked · no request can create a sign-up because none carries a token.

#### client should be offered no division when registration is not open for <competition>

- Covers: `#5003`
- Oracle: the app spec (User Story 3, "Starting"): outside the registration window the API offers no division (409 `urn:bjjeire:registration-not-open`) and takes no place. The seeded `acceptance-opens-later` and `acceptance-closed` are outside their window by construction.
- Steps:
  1. Given the environment has BJJ Éire competitions switched on
  2. And a competitor has signed in with a new email and saved a complete profile
  3. When the competitor asks which divisions they may enter in <competition>
  4. And the competitor tries to sign up for a division of <competition>
- Expected results:
  - Then each request is refused as a registration-not-open problem document
  - And no payment page is returned
- Why: an entry taken before the window opens or after it closes breaks the organiser's brackets and refunds.

Test design: API · @acceptance @bjjeire-competitions-on @local-sign-in · data-driven over `acceptance-opens-later`, `acceptance-closed` (the title carries the slug) · own competitor (female black belt born 1990, which no seeded division accepts, so a regressed window check still ends in not-eligible), deleted afterwards · not mocked. **Barrier:** `acceptance-opens-later` has a fixed window in 2035 (opens 1 May 2035) and `acceptance-closed` closed the day before the seed run, so neither should open; the Given step still reads `registrationState` from `GET /api/v1/bjjeire-competition/<slug>` and fails before any sign-up unless it is `NOT_OPEN` / `CLOSED`, so a seed change cannot let a sign-up take a place. The sign-up body carries `competitionId` (renamed from `tournamentId`). If a live run ever answers 201, stop and tell the app owner: the place cannot be returned.

#### client should get not found when signing up for <target> that does not exist

- Covers: none, a not-found rule with no requirement issue of its own
- Oracle: the OpenAPI description of `POST /api/v1/registration`: 404 when there is no published competition with the id, or no such division in it.
- Steps:
  1. Given the environment has BJJ Éire competitions switched on
  2. And a competitor has signed in with a new email and saved a complete profile
  3. When the competitor signs up for <target>
- Expected results:
  - Then the response is a not-found problem document
- Why: a sign-up for a stale id must end clearly, not as a server error or a charge.

Test design: API · @acceptance @bjjeire-competitions-on @local-sign-in · data-driven over `<target>`: a competition (an id that exists nowhere), a division (an id that exists nowhere inside `acceptance-closed`, which is outside its window, so even a regressed lookup could not take a place) · own competitor (no seeded division accepts the profile), deleted afterwards · `expectProblem` 404 `urn:bjjeire:not-found` · not mocked. The row "a tournament" is now "a competition".

#### client should be refused a sign-up that does not accept both consents when the consent is <value>

- Covers: none, FR-012 in the app spec (both consents are required, as the JSON value `true`) has no requirement issue of its own
- Oracle: the app spec (User Story 3, "Starting"): the API accepts only the JSON value `true` for each consent (`StrictBooleanDeserializer`); a refusal is a 400 problem document.
- Steps:
  1. Given the environment has BJJ Éire competitions switched on
  2. And a competitor has signed in with a new email
  3. When the competitor tries to sign up with the public-listing consent as <value>
  4. And the competitor tries to sign up with the terms consent as <value>
- Expected results:
  - Then each request is refused as a bad-request or validation problem document
- Why: a sign-up recorded without a real consent has no valid liability waiver.

Test design: API · @acceptance @bjjeire-competitions-on @local-sign-in · data-driven over `false`, the string "true", the number 1, `null`, missing (`urn:bjjeire:validation-error` on the field for `false`/`null`/missing, `urn:bjjeire:bad-request` for a wrong JSON type) · competitor token only, no profile · the competition id exists nowhere, so even a regressed consent rule ends in 404 and never takes a place · not mocked.

#### client should be refused a sign-up request body that is not JSON when it is sent as <format>

- Covers: none, a request-shape rule from the app's slice 3 status note with no requirement issue of its own
- Oracle: the app's slice 3 status note: a body sent as text, XML or a form is a 400 bad request on every route, not a 500.
- Steps:
  1. Given the environment has BJJ Éire competitions switched on
  2. And a competitor has signed in with a new email
  3. When the competitor sends a sign-up whose body is <format>
- Expected results:
  - Then the response is a bad-request problem document
- Why: a server error on a malformed request hides a client mistake as an outage.

Test design: API · @acceptance @bjjeire-competitions-on @local-sign-in · data-driven over plain text, XML, form-encoded (each naming `competitionId` = an id that exists nowhere) · competitor token only · `expectProblem` 400 `urn:bjjeire:bad-request` · not mocked.

#### client should get not found or bad request when resuming payment for a sign-up that is <kind>

- Covers: none, a not-found and malformed-id rule with no requirement issue of its own
- Oracle: the OpenAPI description of `POST /api/v1/registration/{id}/checkout`: 404 when there is no such sign-up; the id is a validated object id.
- Steps:
  1. Given the environment has BJJ Éire competitions switched on
  2. And a competitor has signed in with a new email
  3. When the competitor asks to return to the payment page of a sign-up that is <kind>
- Expected results:
  - Then the response is a problem document of the matching type
- Why: a mistyped or stale payment link must say so, not open somebody else's page.

Test design: API · @acceptance @bjjeire-competitions-on @local-sign-in · data-driven over an id that exists nowhere (404) and each malformed id in `invalid-values.ts` (400 on `Id`) · competitor token only; nothing created · not mocked. The 403 for another competitor's sign-up and the 409s (`hold-expired`, `payment-received`) need a real sign-up: Held.

#### client should get not found or bad request when cancelling a sign-up that is <kind>

- Covers: none, a not-found and malformed-id rule with no requirement issue of its own
- Oracle: the OpenAPI description of `POST /api/v1/registration/{id}/cancel`: 404 when there is no such sign-up; the id is a validated object id.
- Steps:
  1. Given the environment has BJJ Éire competitions switched on
  2. And a competitor has signed in with a new email
  3. When the competitor cancels a sign-up that is <kind>
- Expected results:
  - Then the response is a problem document of the matching type
- Why: a mistyped or stale cancel link must say so, not cancel somebody else's entry or fail as a server error.

Test design: API · @acceptance @bjjeire-competitions-on @local-sign-in · data-driven over an id that exists nowhere (404 `urn:bjjeire:not-found`) and each malformed id in `invalid-values.ts` (400 on `Id`) · competitor token only, nothing created · not mocked.

#### client should get not found or bad request when moving a sign-up to another division and the request is <kind>

- Covers: none, a not-found and validation rule with no requirement issue of its own
- Oracle: the OpenAPI description of `PUT /api/v1/registration/{id}/division`: 404 when there is no such sign-up; 400 when the body fails validation or the id is malformed.
- Steps:
  1. Given the environment has BJJ Éire competitions switched on
  2. And a competitor has signed in with a new email
  3. When the competitor asks to move a sign-up and the request is <kind>
- Expected results:
  - Then the response is a problem document of the matching type
- Why: a division change that answers 200 or 500 for a request that cannot be valid hides a client mistake and may move the wrong entry.

Test design: API · @acceptance @bjjeire-competitions-on @local-sign-in · data-driven over a sign-up that does not exist with a real division id of `acceptance-closed` (404), a malformed sign-up id (400 `Id` INVALID_FORMAT), a missing division (400 `DivisionId` NOT_NULL), a malformed division id (400 `DivisionId` INVALID_FORMAT); validation runs before the lookup · competitor token only, nothing moved · not mocked.

#### client should be refused changing a directory section with a competitor token when requesting <route>

- Covers: `#5037`
- Oracle: the app spec (`#5037`, `WriteAuthorizationIT`): a competitor token is refused on writes to gyms, events, competitions and stores, as a 403 forbidden problem document. Competition and store have no write routes: their rows prove the catch-all write rule for read-only sections.
- Steps:
  1. Given the environment has BJJ Éire competitions switched on
  2. And a competitor has signed in with a new email
  3. When the competitor requests <route>
- Expected results:
  - Then the request is refused as forbidden
- Why: a competitor account is open to anyone, so one that can edit the directory lets any visitor rewrite gyms and events.

Test design: API · @acceptance @bjjeire-competitions-on @local-sign-in · data-driven over a new entry (`POST`, empty body) and a deletion (`DELETE`, an id that exists nowhere) for gym, event, competition and store (eight rows) · competitor token only, nothing created or removed even if the rule regressed · `expectProblem` 403 `urn:bjjeire:forbidden` · not mocked. Uses raw requests, because a feature never imports another feature's client.

#### client should be refused the organiser competition routes with a competitor token when requesting <route>

- Covers: `#5004`, `#3013`
- Oracle: the app spec's access rules: organiser routes need the organiser's token; a competitor's valid token is refused as a forbidden problem document, not accepted and not 401.
- Steps:
  1. Given the environment has BJJ Éire competitions switched on
  2. And a competitor has signed in with a new email
  3. When the competitor requests <route>
- Expected results:
  - Then the request is refused as forbidden
- Why: the organiser's sign-up list holds other competitors' emails and dates of birth, and a competitor who can open it, or cancel a competition, harms every entrant.

Test design: API · @acceptance @bjjeire-competitions-on @local-sign-in · data-driven over the organiser list = `GET /api/v1/bjjeire-competition/admin`, a new competition = `POST /api/v1/bjjeire-competition` (empty body), a competition's sign-up list = `GET …/<id>/registration`, a competition cancellation = `POST …/<id>/cancel`, a team-name merge = `POST …/<id>/team-merge` (empty body); every id exists nowhere, **never a seeded one** · 403 `urn:bjjeire:forbidden` · not mocked. Renamed from "…organiser tournament routes…"; its rows "a new tournament", "a tournament's sign-up list" and "a tournament cancellation" are now "a new competition", "a competition's sign-up list" and "a competition cancellation".

#### competitor should get an empty incomplete profile with their sign-in email before saving one

- Covers: `#5007`
- Oracle: the app spec (User Story 2): before a first save the profile is empty and not complete, and it shows the email the competitor signed in with; reading it creates nothing (`CompetitorServiceImpl.getOwn` answers 200, finding F22).
- Steps:
  1. Given the environment has BJJ Éire competitions switched on
  2. And a competitor has signed in with a new email
  3. When the competitor reads their profile
- Expected results:
  - Then the profile is not complete
  - And the profile shows the email they signed in with
  - And the profile has no name
- Why: a competitor who lands on a profile holding another person's details, or an error instead of a blank form, cannot start.

Test design: API · @acceptance @bjjeire-competitions-on @local-sign-in · own competitor with no profile, deleted afterwards · not mocked.

#### client should be refused a profile save with an invalid value when <field> is <value>

- Covers: none, validation bounds from the app's `SaveCompetitorCommand` with no requirement issue of their own
- Oracle: the app's validation rules: first and last name required and at most 60 characters, nationality an ISO 3166-1 alpha-2 code, date of birth required and in the past, affiliation at most 80, phone a phone number, a gym id that is in the gym directory; a refusal is a 400 validation problem on the field.
- Steps:
  1. Given the environment has BJJ Éire competitions switched on
  2. And a competitor has signed in with a new email
  3. When the competitor saves a profile where <field> is <value>
- Expected results:
  - Then the response is a bad-request or validation problem document
  - And no profile is saved
- Why: a profile that accepts a date of birth in the future or a made-up country would produce wrong divisions and a bad public list.

Test design: API · @acceptance @bjjeire-competitions-on @local-sign-in · data-driven over first name blank and 61 characters, last name blank, nationality `XX1`, date of birth tomorrow (computed) and missing, affiliation 81 characters, phone `abc`, an academy gym id that exists nowhere · own competitor with no profile, deleted afterwards · not mocked · the last step reads the profile back and requires it is still unsaved.

#### competitor should keep one profile when saving it twice and signing in again with the same email

- Covers: `#5007`
- Oracle: the app spec (User Story 2): the competitor's identity is the sign-in; two saves update one profile, never create two; the second save's values win.
- Steps:
  1. Given the environment has BJJ Éire competitions switched on
  2. And a competitor has signed in with a new email and saved a complete profile
  3. When the competitor saves the profile again with a different name
  4. And the competitor signs in again with the same email
- Expected results:
  - Then the profile shows the second name
  - And the profile is complete
- Why: a second save that creates a duplicate would split a competitor's sign-ups across two people.

Test design: API · @acceptance @bjjeire-competitions-on @local-sign-in · own competitor (deleted afterwards, also through the second sign-in's token) · not mocked. UI 46 proves the visitor sees it; this owns the update-not-duplicate rule.

## Held for a product decision

- **competitor should return to the competitions sign-up address after leaving payment** (`#3010`): the return address is only reached by abandoning Stripe's hosted Checkout, which the suite cannot drive (F26 below, and the Held entries for the paid scenarios). It was planned here first on 2026-11-16 and withdrawn the same day. Lower tiers own the return URLs.

Folded from the tournaments spec on 2026-11-17 (titles renamed; nothing here is implemented). Re-assessed against
slice 4 on 2026-11-16: nothing sign-up-creating is safe. The cancel route (`POST /api/v1/registration/{id}/cancel`)
accepts only a CONFIRMED sign-up, so it cannot return an unpaid hold, and a confirmed one needs a paid Stripe Checkout
the suite cannot drive (F26). An unpaid or confirmed sign-up blocks deleting its competitor and takes a seeded place
that only the 30-minute hold sweep, a paid cancel or a reseed gives back (data policy rule 5). Owner: the app repo.
Unblock with a paid sign-up the fixture can cancel in teardown, a test-only way to remove a sign-up, or a throwaway
competition the test creates and publishes as the organiser (needs the organiser sign-in, F13).

- **competitor should be signed up and listed after paying for a division** (`#5015`): pays through Stripe Checkout and confirms through the webhook; a confirmed sign-up stays in the public list.
- **competitor should be charged nothing and able to try again after leaving the payment page** (`#5016`): starting payment holds a place for 30 minutes. Oracle when unblocked: "Your payment was not completed and nothing was charged. Your place is still held for a short while." and "Return to payment".
- **competitor should see each sign-up with its competition, division, amount and status** (`#5021`): needs a sign-up. Oracle when unblocked: competition, division, €25.00, "Awaiting payment", "Pay now" at `/account/signups`.
- **competitor should be refused a second sign-up in a division they already hold** (`#5017`): needs a first sign-up; 409 `already-registered`.
- **competitor should be refused a third unpaid sign-up in one competition** (`#5042`): needs two held sign-ups; 409 `too-many-unpaid`.
- **competitor should be told the competition is full and not be charged when it has reached its limit** (`#5020`, `#3012` at T2): needs a competition at its limit; `acceptance-open` holds 200 places. The problem is `urn:bjjeire:competition-full`.
- **competitor should sign up separately for a gi and a no-gi division** (`#5018`): two held places.
- **competitor should be told Stripe is unavailable when payment cannot start** (none): needs a stack with a placeholder Stripe secret (503) or an unreachable Stripe (502).
- **competitor should be refunded in full and leave the competitor list when cancelling before registration closes** (`#5022`): needs a confirmed sign-up. Oracle when unblocked: "You will be refunded €25.00 in full to your original payment method.", then "Your sign-up is cancelled. A refund of €25.00 is on its way."
- **competitor should be warned that no refund is due before cancelling after registration closes** (`#5023`): needs a confirmed sign-up on a closed competition. Oracle: "Registration has closed, so no refund is due. You will be removed from the competitor list."
- **competitor should move to another division at no extra charge while registration is open** (`#5024`): needs a confirmed sign-up and two divisions one profile may enter (gap for the app seeder). Oracle: "Your sign-up was moved. There is no extra charge."
- **competitor should be told to wait when returning to the payment of a sign-up Stripe has already taken** (none): 409 `payment-received`, `hold-expired` and 403 for another competitor's sign-up need a real sign-up; the app's integration tests with the recording Stripe fake own them.
- **competitor should be refused cancelling an unpaid sign-up and another competitor's sign-up** (none): 409 `conflict` and 403 both need a real sign-up.
- **visitor should create an account, confirm their email and sign in** (`#5006`), **visitor should not get a second account when registering with an email that already has one** (`#5010`), **competitor should regain access through their email after forgetting their password** (`#5011`): the competitor tenant's hosted pages exist in no environment yet. Owner: Ian.
- **visitor should see the organiser's screens after signing in as the organiser** (`#5001`, `#3013`): needs an organiser browser sign-in (MSAL, or the local organiser sign-in the Docker stack lacks, F13). Owner: Ian.
- **client should not find the Stripe webhook in the published API description** (none, ADR-0013): no environment the suite reaches serves `/v3/api-docs`, and the pulled contract lists no BJJ Éire competition paths, so a test would pass vacuously.

Decided on 2026-10-31 and made in the app the same day (nothing else is open for the directory):

- **Noun: competitions, route still `/competitions`.** Count reads `Found 1 competition.` / `Found 9 competitions.` Title: `BJJ Competitions | BJJ Éire` (wording assumed).
- **Search: names only.** Placeholder: `Search by name`, the same as Stores.
- **Dates: always Irish time** (`Europe/Dublin`).

## Rejected

- Hostile names and descriptions rendered as text: one seeded-independent rule shared with other list pages, and already safe in React. Low likelihood.
- Finished competitions absent, and start-date order, in the UI: the API scenarios own both.
- Long unbroken text and 320px reflow: no failure here, and `tests/layout/` covers reflow.

Folded from the tournaments spec on 2026-11-17:

- A UI scenario for the return page's polling ("Waiting for your payment", "Payment not completed", "Try again"): needs a sign-up with a Stripe session; the SPA's integration tests own it.
- Scenarios for the late-payment refund, `hold-expired` and the hold sweep: real payments and a 30-minute clock; the app's integration tests own them.
- A scenario for the confirmation email in Mailpit: needs a confirmed sign-up (Held).
- A scenario for competitor profile propagation to active sign-ups: needs a sign-up (Held); the app's service tests own it.
- An API scenario that an unknown route answers 401 while BJJ Éire competition routes answer 404 when off: flag-off behaviour is owned by the app's API integration tests, and it tests the framework's default.
- A UI scenario that the directory stays browsable without an account (`#5036`): see Constraints.

### Dropped in the fold (2026-11-17)

These tournaments scenarios tested only a retired address or a page the merge removed, and the behaviour is already
owned at its new address. Their tests were deleted with them.

- UI "visitor should find a published tournament in the tournament list" (`@smoke`, `#5002`): there is no list page; UI 20 (featured, `@smoke`) owns finding a BJJ Éire competition.
- UI "visitor should see a tournament entry in the navigation when tournaments are switched on": the entry was removed by design (FR-005); rewritten as UI 35.
- UI "visitor should see when registration opens and no sign-up when registration has not opened" and "…that registration is closed and no sign-up when registration has closed" (`#5003`): superseded by UI 30 (data-driven over both states).
- UI "visitor should see no results when no tournament matches the search": there is no BJJ Éire list to search; UI 2 owns the directory's empty search, and UI 22 that search leaves the featured section alone.
- UI "visitor should see a tournament's details when opening its address directly" (`#5002`): folded into UI 37, which loads the address directly.
- UI "visitor should see a tournament is not found when opening the address of one that does not exist" (`#5002`): owned by UI 26.
- UI "visitor should see how many divisions a tournament has on its list card" (`#5002`): owned by UI 20 (each featured card shows "5 divisions").
- UI "visitor should see the number of tournaments in the list header matching the tournaments listed" (`#5002`): the featured section has no header total.
- API "client should get not found for a tournament that does not exist when the address is <address>" (`#5002`): owned by API 15 at the new address, which took over its over-long and capitalised names.
- API "client should be refused a tournament list request with an out-of-range or malformed paging value (<parameters>)": owned by API 12 and 13.
- API "client should get consecutive tournaments on consecutive pages when paging one at a time": owned by API 11, which took over its check that pages 1 and 2 of size 1 equal page 1 of size 2.
- API "client should list every division of a tournament in order with no competitor private data when asking for its competitors" (`#5015`): split: API 16 owns the private-data check (strict keys, on the seeded finished competition, so it is never vacuous) and the division order; API 38 owns the empty divisions, on `acceptance-open`.

## Findings

Source: `specs/exploration/2026-10-31-competitions-review.md`.

- **F1–F4, F6, F7 (fixed 2026-10-31)** in the app working tree; F1–F3 are guarded by UI 19, 9 and 10.
- **F5 (open)**: the no-results message tells visitors to adjust filters that do not exist.

Source: planner review against the live Docker stack, 2026-11-16.

- **F8 (open)**: seed drift on the directory record "Donegal Winter Gi Classic". `seeded.ts:50` and `bjjeire-java/seeder/data-test/competitions/donegal-winter-gi-classic.json:6` say "North-west winter gi tournament in Letterkenny."; the live stack serves "North-west winter gi competition in Letterkenny." Either the stack was seeded from a newer dataset or the repo seeder was missed by the rename. Also `competitions-pagination-page-*.json` mock bodies say "tournament". No test asserts the description today.
- **F9 (fixed 2026-11-17 in the fold)**: `src/ui/fixtures/feature-flags.fixture.ts` no longer has a `Tournaments` key; `ALL_FEATURES_ENABLED` pins `BjjEireCompetitions: false`, so specs outside competitions no longer see the featured section or the account icon, and `competitionsTestConfig` pins it on.
- **F10 (fixed 2026-11-17 in the fold)**: `HEADER_NAV_LINKS_TOURNAMENTS_ON` and `tournaments.constants.ts` are gone; UI 34 and 35 assert the header carries no entry with the retired name.
- **F11 (open, seed data)**: "Wicklow No-Gi Open" is described as one-day but its dates are 15 to 18 November 2026 on the live stack.
- **F12 (open)**: the competitor profile's medal section is headed "My medals", not "Competitions entered" as the retired-name scenario expects (observed 2026-11-16; its empty copy says "You have not entered a competition yet."). Either the spec's wording or the app's heading changes before that scenario is written.
- **F14 (open, spec drift)**: F8 above is stale. On 2026-11-17 the live stack serves "North-west winter gi tournament in Letterkenny." for Donegal Winter Gi Classic, the same as the repo seeder; it is `seeded.ts:51` (and this spec) that say "competition".
- **F15 (resolved 2026-11-17 by the fold)**: the tournaments spec listed scenarios at the retired addresses. They were rewritten to the new addresses or dropped (see Dropped in the fold), and the spec was deleted.
- **F16 (resolved 2026-11-17)**: the product spec (`bjjeire-java/specs/features/competitions.md:78` and `:112`) now names the fourth seeded competition, `acceptance-finished`, alongside the three published ones.
- **F17 (resolved 2026-11-17)**: the status sentence now carries the "(Irish time)" suffix, as the Registration row does (product spec `:108`). UI 30 asserts the whole not-open-yet sentence with the suffix.
- **F13 (open)**: the Docker stack has no local organiser sign-in (`/api/v1/local-sign-in/organiser` answers 401; a competitor token gets 403 on `/api/v1/bjjeire-competition/admin`), so the organiser scenario cannot be driven.

Source: the tournaments spec's findings, folded on 2026-11-17 (its F1, F3, F6 and the first F7 note were resolved
before the fold and are not carried over; its F9 and F10 are F26 and F22 here, not the F9 and F10 above).

- **F18 (spec, informational)**: an address holding an encoded slash is refused with 400, not 404, by the server before the app (observed 2026-11-14 at the old prefix). The contract says nothing about malformed slugs, so no row asserts it.
- **F19 (spec, informational)**: the public competitor list is addressed by object id, not slug: the address name answers 400 (API 21 asserts it).
- **F20 (spec, informational)**: with the flag off the SPA answered a direct load of a feature address by redirecting to `/events` (observed 2026-11-15 at the old addresses). FR-038 says only that no entry point is shown; no row asserts the redirect.
- **F21 (app, resolved 2026-11-15)**: the "Not open yet" registration badge failed WCAG 2.1 AA colour contrast (4.32:1, dark theme); fixed by `--color-info-300`. UI 52 keeps scanning the badges.
- **F22 (spec vs app, informational)**: the app's tasks say `GET /api/v1/competitor/me` is 404 before a profile exists; the code answers 200 with an unsaved profile, which API 36 asserts.
- **F23 (app, informational)**: "My sign-ups" (`/account/signups`) is linked only from an open competition's page and the sign-up-complete page; the header's account icon leads to the profile. UI 42 reaches the list through the competition page.
- **F24 (app, open, 2026-11-16)**: signing in again in the same second as deleting the account leaves the competitor stuck on "Failed to load your profile" with only Retry: the API refuses a token whose whole-second `iat` is not later than the deletion, but the SPA treats the sign-in as successful. UI 51 waits for the API to accept a fresh sign-in; it does not encode the dead end.
- **F25 (stack data, open)**: `acceptance-open` carries one confirmed competitor on the Docker stack (`placesTaken: 1`, the owner's manual Stripe test-mode run, observed 2026-11-16), so no scenario asserts "0 of 200 taken" on it. A reseed removes it.
- **F26 (not automatable)**: Stripe test-mode checkout works on the Docker stack (F25 is a paid sign-up), but the suite cannot drive Stripe's hosted page, so no scenario depends on a paid sign-up.

## Out of scope

- Whether a flag is present on the wire. The app's unit and Pact tests own that.
- The organiser's set-up screens beyond the sign-in gate (create, divisions, publish, sign-up tools, results: `#5001`, `#5004`, `#5005`): they need the organiser's sign-in (F13); the app's API and SPA integration tiers own them. The no-token and competitor-token refusals (API 24, 35) are the thin environment checks here.
- Profile privacy (`#5009`) and the deletion rules other than signing up again (`#5012`: active sign-up refused, tenant identity removed): the app's API integration tier owns them.
- `#3012` (the full-competition URN), `#3015` (flag combinations) and `#3017` (collection names): the merge spec proves them below T6.
