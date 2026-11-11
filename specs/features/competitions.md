# Acceptance spec: Competitions

**App spec**: `bjjeire-java/specs/features/competitions.md`
**Requirements**: `bjjeire/requirements` · epic `&3`
**Slice**: `tests/features/competitions/` · `src/ui/pages/competitions/` · `src/api/features/competitions/`
**Agent seed**: `tests/agents/seed.spec.ts` (project `agent-seed`: signed in, flags pinned on, shell mounted)
**Seeded**: `tests/features/competitions/seeded.ts`
**Status**: living · **Reconciled with tests**: 2026-11-10

A visitor opens Competitions and scans, searches and pages a list of upcoming
competitions, each card linking to the organiser's website and registration. There is no
county filter. Search matches the name only, on the loaded page. Finished competitions
are excluded unless a client asks for inactive ones.

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

Scenarios 1–8 are in `competitions.ui.acceptance.spec.ts` (5–8 mocked); 9–19 in
`competitions-details.ui.acceptance.spec.ts`. Design notes for 9–19 are in [Planned](#planned).

### API

1. client should receive each published competition with its details (`@smoke`) · `#3001`
2. client should not receive finished competitions · `#3001`
3. client should receive competitions ordered by start date · `#3001`
4. client should page through the listing in distinct slices with correct links · `#3004`
5. client should receive finished competitions when asking to include inactive ones · `#3002`
6. client should receive an empty page with valid pagination for a page beyond the last · `#3004`
7. client should get a bad request for <param> "<value>" · `#3002`
8. client should get a validation error on <param> when <param> <value> is out of range · `#3004`

Scenarios 7 and 8 are data-driven over `tests/features/common/testdata/invalid-values.ts`
(7 covers malformed `includeInactive` and paging values). Errors are asserted as RFC 9457
problem documents (`expectProblem`).

## Constraints

- No county filter (aggregate has no county).
- Search is client-side and matches the name only; unique search → `expectResultCount(1)`.
- Dates are shown in Irish time, wherever the visitor is.
- `slug` uniqueness is an API/index concern — do not assert it only in UI.

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

## Held for a product decision

None open. Decided on 2026-10-31 and made in the app the same day:

- **Noun: competitions, route still `/competitions`.** Count reads `Found 1 competition.` / `Found 9 competitions.` Title: `BJJ Competitions | BJJ Éire` (wording assumed).
- **Search: names only.** Placeholder: `Search by name`, the same as Stores.
- **Dates: always Irish time** (`Europe/Dublin`).

## Rejected

- Hostile names and descriptions rendered as text: one seeded-independent rule shared with other list pages, and already safe in React. Low likelihood.
- Finished competitions absent, and start-date order, in the UI: the API scenarios own both.
- Long unbroken text and 320px reflow: no failure here, and `tests/layout/` covers reflow.

## Findings

Source: `specs/exploration/2026-10-31-competitions-review.md`.

- **F1–F4, F6, F7 (fixed 2026-10-31)** in the app working tree; F1–F3 are guarded by UI 19, 9 and 10.
- **F5 (open)**: the no-results message tells visitors to adjust filters that do not exist.
