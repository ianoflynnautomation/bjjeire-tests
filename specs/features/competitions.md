# Acceptance spec: Competitions

**App spec**: `bjjeire-java/specs/features/competitions.md`
**Slice**: `tests/features/competitions/`
**Seeded**: `tests/features/competitions/seeded.ts`

## UI scenarios

List (`@smoke`), search (full and partial), client pagination, empty/error
states — titles in `competitions.ui.acceptance.spec.ts`.

## API scenarios

Published details; finished excluded; ordered by start date; pagination;
malformed `includeInactive` / paging params rejected as bad requests;
out-of-range paging fails validation — titles in `competitions.api.acceptance.spec.ts`.

## Constraints

- No county filter (aggregate has no county).
- Search is client-side and matches the name only; unique search → `expectResultCount(1)`.
- Dates are shown in Irish time, wherever the visitor is.
- `slug` uniqueness is an API/index concern — do not assert it only in UI.

## Implemented on 2026-10-31

Accepted from `specs/exploration/2026-10-31-competitions-review.md`. All are implemented: UI in `competitions-details.ui.acceptance.spec.ts`, API in `competitions.api.acceptance.spec.ts`.
Phone reflow and page titles already belong to `tests/layout/`.

### UI

1. visitor should reach a competition's website and registration from its card
2. visitor should see a competition's dates on its card
3. visitor should see the competition list after retrying when competitions failed to load
4. visitor should see website unavailable when a competition has no safe links
5. visitor should see the same page of competitions after reloading
6. visitor should see the shared search when opening a search link
7. visitor should see every competition again after clearing the search
8. visitor should see how many competitions were found
9. visitor should not find a competition by anything other than its name
10. visitor should see a competition's dates in Irish time wherever they are

### API

1. client should receive finished competitions when asking to include inactive ones
2. client should receive an empty page with valid pagination for a page beyond the last

#### visitor should reach a competition's website and registration from its card

- Layer: UI · Tags: @acceptance · Data: `SEEDED_COMPETITION_DONEGAL_GI_CLASSIC` (seeded) · Mocked: no
- Given/When/Then:
  - When a visitor opens Competitions
  - And the visitor searches for the Donegal Winter Gi Classic
  - Then the competition's website and registration can be reached from its card
- Why: reaching the organiser is the point of the page. High impact, and no test checks the targets.

#### visitor should see a competition's dates on its card

- Layer: UI · Tags: @acceptance · Data: one competition each for a single day, days in one month, and days across months · Mocked: yes (seeded dates roll, and `seeded.ts` holds none)
- Given/When/Then:
  - Given competitions run on one day, within a month and across months
  - When a visitor opens Competitions
  - Then each card shows its dates in full
- Why: three date formats had no coverage.

#### visitor should see the competition list after retrying when competitions failed to load

- Layer: UI · Tags: @acceptance · Data: `competitions-pagination-page-1.json` · Mocked: yes
- Given/When/Then:
  - Given the competition service is unavailable
  - And a visitor sees the error on Competitions
  - When the service recovers and the visitor retries
  - Then the competition list is displayed
- Why: the existing error scenarios stop at the message. Gyms already has this one.

#### visitor should see website unavailable when a competition has no safe links

- Layer: UI · Tags: @acceptance · Data: a competition with unsafe website and registration addresses · Mocked: yes
- Given/When/Then:
  - Given a competition has only unsafe links
  - When a visitor opens Competitions
  - Then its card offers no link and says the website is unavailable
- Why: guards link blocking, which seed data cannot exercise.

#### visitor should see the same page of competitions after reloading

- Layer: UI · Tags: @acceptance · Data: `paginatePages` over the existing fixture · Mocked: yes
- Given/When/Then:
  - Given the competition list has two pages
  - And a visitor is on the second page
  - When the visitor reloads
  - Then the second page is still shown
- Why: page state is shared, but Competitions only covers moving between pages.

#### visitor should see the shared search when opening a search link

- Layer: UI · Tags: @acceptance · Data: `SEEDED_COMPETITION_DONEGAL_GI_CLASSIC_PARTIAL_NAME` (seeded) · Mocked: no
- Given/When/Then:
  - When a visitor opens a link to a search for the Donegal Winter competition
  - Then the search is filled in
  - And only that competition is listed
- Why: shared links are a visitor-facing promise of URL state, and untested here.

#### visitor should see every competition again after clearing the search

- Layer: UI · Tags: @acceptance · Data: `SEEDED_COMPETITION_DONEGAL_GI_CLASSIC_PARTIAL_NAME` (seeded) · Mocked: no
- Given/When/Then:
  - Given a visitor has searched for the Donegal Winter competition
  - When the visitor clears the search
  - Then other competitions are listed again
- Why: a stuck filter would hide the directory. Proves a second card returns, not a total, because environments hold full datasets.

#### client should receive finished competitions when asking to include inactive ones

- Layer: API · Tags: @acceptance · Data: `SEEDED_COMPETITION_FINISHED_KERRY_COAST` (seeded) · Mocked: no
- Given/When/Then:
  - When a client asks for the listing including inactive competitions
  - Then the finished competition is returned
- Why: only malformed values of this option are tested. Page size must be large enough to reach the record.

#### client should receive an empty page with valid pagination for a page beyond the last

- Layer: API · Tags: @acceptance · Data: seeded listing · Mocked: no
- Given/When/Then:
  - When a client asks for a page beyond the last
  - Then no competitions are returned
  - And the pagination still describes the listing
- Why: Gyms has this bound and Competitions does not.

#### visitor should see how many competitions were found

- Layer: UI · Tags: @acceptance · Data: `SEEDED_COMPETITION_DONEGAL_GI_CLASSIC_PARTIAL_NAME` (seeded) · Mocked: no · Needs: F2 fixed
- Given/When/Then:
  - When a visitor opens Competitions
  - And the visitor searches for the Donegal Winter competition
  - Then the page says one competition was found
- Why: decided 2026-10-31. A search narrows the count to one, so it holds on a full dataset.

#### visitor should not find a competition by anything other than its name

- Layer: UI · Tags: @acceptance · Data: seeded DTOs; terms for description, organisation, country and tag · Mocked: yes (a real dataset may have "Ireland" in a name) · Needs: F3 fixed
- Given/When/Then:
  - Given a competition whose description, organisation, country and tags do not appear in any name
  - When a visitor searches for each of those in turn
  - Then no competitions are listed
- Why: decided 2026-10-31, and matches the product spec. Same rule as Stores.

#### visitor should see a competition's dates in Irish time wherever they are

- Layer: UI · Tags: @acceptance · Data: one competition with fixed dates · Mocked: yes · Timezone: America/New_York, set with `test.use` · Needs: F1 fixed
- Given/When/Then:
  - Given a visitor is in a timezone behind Ireland
  - When the visitor opens Competitions
  - Then the competition's dates are those of the event in Ireland
- Why: decided 2026-10-31. Fails today, showing the day before.

### Decided 2026-10-31

Made in the app on 2026-10-31.

- **Noun: competitions, route still `/competitions`.** Count reads `Found 1 competition.` / `Found 9 competitions.` Title: `BJJ Competitions | BJJ Éire` (wording assumed).
- **Search: names only.** Placeholder: `Search by name`, the same as Stores.
- **Dates: always Irish time** (`Europe/Dublin`).

### Rejected

- Hostile names and descriptions rendered as text: one seeded-independent rule shared with other list pages, and already safe in React. Low likelihood.
- Finished competitions absent, and start-date order, in the UI: the API scenarios own both.
- Long unbroken text and 320px reflow: no failure here, and `tests/layout/` covers reflow.

### Findings

F1–F4 and F7 are fixed in the app working tree. F5 and F6 are open in the exploration report.
