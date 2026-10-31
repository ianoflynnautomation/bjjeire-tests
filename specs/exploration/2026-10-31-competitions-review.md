# Exploration: Competitions cards, search, URL state and failure states

- **Date**: 2026-10-31 · **Environment**: `APP_ENV=docker` / `http://localhost:3000` · **App ref**: stack running on the host, commit not read; 9 published competitions after seeding
- **Charter**: Explore Competitions cards and search, with hostile content and failing or slow responses, to discover wrong results and repeats of the Stores findings
- **Budget**: about 90 scripted steps · about 25 min
- **Effort**: design and execution 60% · bug investigation 25% · setup 15%
- **Coverage**: `/competitions` at 1440×900, 360px and 320px, dark scheme, with real data and mocks. Timezones: Dublin, New York, Tokyo. Light theme and cold-cache boot not touched. No outbound link was followed.

## Findings

### F1 · S3 · (Fixed in the app working tree 2026-10-31) Visitors west of UTC see the wrong competition dates

- **Steps** (from a fresh load of `/competitions` with the browser timezone set to `America/New_York`):
  1. Find `Grappling Industries Dublin`, which the API dates 15 November 2026.
- **Expected**: `15 November 2026`, the date of the event in Ireland (HICCUPPS **P**: a date should not depend on where the reader is).
- **Actual**: `14 November 2026`. `National MMA League Round 31` shows `27–28 November 2026` instead of `28–29 November 2026`. Dublin and Tokyo show the right dates.
- **Cause**: `formatDateRange` in `src/bjjeire-app/src/features/competitions/components/competition-card/competition-card.tsx` formats the midnight UTC value in the browser's timezone.
- **Reproduced**: 2/2 with real data.
- **Oracle**: card text against the API value.

### F2 · S3 · (Fixed in the app working tree 2026-10-31) The page counts competitions but calls them organisations

- **Steps** (from a fresh load of `/competitions`):
  1. Read the header.
  2. Search for `Sub Only`.
- **Expected**: The count names what is listed. Claim: `bjjeire-java/specs/features/competitions.md` calls this the competition list.
- **Actual**: `Found 9 organisations.` for 9 competitions from 7 organisations. Searching for one organisation gives `Found 2 organisations.` Screen readers get both `Found 2 organisations.` and `Showing 2 competitions`.
- **Reproduced**: 2/2 with real data.
- **Oracle**: visible text against the API's `organisation` values.

### F3 · S3 · (Fixed in the app working tree 2026-10-31) Search matches text the visitor cannot see or was not told about

- **Steps** (from a fresh load of `/competitions`):
  1. Note the placeholder `Search by name, organisation, country…`.
  2. Search for `Ireland`, then `Sub Only`, then `Letterkenny`, then `no-gi`.
- **Expected**: Results the visitor can explain. Claim: the product spec says "a competition name / part of a name"; the placeholder is wider. On 2026-10-31 Stores was narrowed to names only (HICCUPPS **P**).
- **Actual**: `Ireland` lists all 9, though no card shows a country. `Sub Only` lists 2, though cards do not show the organisation. `Letterkenny` matches only a description and `no-gi` also matches tags. `no-gi` finds 3 and `No Gi` finds none.
- **Cause**: `competitionMatchesSearch` in `src/bjjeire-app/src/features/competitions/hooks/useCompetitionsPage.ts` checks name, description, country, organisation and tags.
- **Reproduced**: 2/2, once mocked and once with real data.
- **Oracle**: card text against the placeholder and product spec.

### F4 · S3 · (Fixed in the app working tree 2026-10-31) A server failure shows the visitor a raw HTTP message

- **Steps** (from a fresh load of `/competitions`, with the list mocked to fail):
  1. Return a 500, then a 429.
- **Expected**: Plain advice, as the connection failure gives (`Could not connect to the server…`). `competitions.errors.loadFailed` already holds `Failed to load competitions. Please try again.`
- **Actual**: `Request failed with status code 500` and `Request failed with status code 429`. Retry works. The suite pins the 500 text (`SERVER_ERROR_MESSAGE` in `src/ui/pages/common/error.page.ts`), so fixing this means updating that constant.
- **Reproduced**: 2/2 for the 500; once for the 429.
- **Oracle**: visible text.

### F5 · S3 · Search silently misses anything after the first 100 records

- **Steps** (from a fresh load of `/competitions`, with 150 competitions mocked):
  1. Search for `Over 140`, the name of a record that exists.
- **Expected**: That competition is listed.
- **Actual**: `No Results Found`. Search requests `page=1&pageSize=100` once and filters that. `Over 05` finds its 10 records, all inside the first 100. This cannot happen with today's 9 real competitions.
- **Reproduced**: 2/2 with mocks.
- **Oracle**: card count against the mocked data and request log.

### F6 · S4 · (Fixed in the app working tree 2026-10-31) Clearing the search drops keyboard focus to the top of the page

- **Steps** (from a fresh load of `/competitions`):
  1. Search for `Donegal`.
  2. Activate `Clear search`.
- **Expected**: Focus stays in the search box. WCAG 2.1 SC 2.4.3 is the closest rule.
- **Actual**: The focused element becomes `body`, because the button removes itself.
- **Reproduced**: 2/2.
- **Oracle**: `document.activeElement`.

### F7 · S3 · (Fixed in the app working tree 2026-10-31) The search box pushes the page sideways on small tablets

- **Steps** (from a fresh load of `/competitions` or `/stores`):
  1. Set the screen width to 640px.
- **Expected**: No sideways scrolling.
- **Actual**: The page is 24px too wide, because the search box wrapper is a fixed 640px (`sm:w-160`) from the 640px breakpoint up. `visitor should not need to scroll sideways at common screen widths` catches this on Stores. With that fixed, Events still overflowed 19px at 640px because its event-type filter could not shrink.
- **Reproduced**: 2/2 on Stores (test and direct measurement).
- **Oracle**: `scrollWidth` against `clientWidth`.

## Questions for the product owner

1. **Answered 2026-10-31: competitions, at `/competitions`.** Fixed.
2. **Answered 2026-10-31: names only.** Fixed, including the placeholder.
3. **Answered 2026-10-31: yes, always Irish time.** Fixed.

## Environment notes

**The empty lists were a stale API cache, not a code bug.** The stack came up with an empty database, so the default query cached an empty page. After seeding, `?page=1&pageSize=20` and the no-parameter call returned 0 records while `pageSize=19` returned all of them. That is why Gyms appeared only with a county filter and Events, Stores and Competitions stayed empty. `ApiCache` holds each query for 5 minutes in the API process, and the seeder runs in its own process, so it cannot clear that cache. The default queries recovered with no code change, and all four pages then listed real records (Gyms 20 of 62, Events 5, Stores 10, Competitions 9).

The early requests in this session included the default query, so they may have helped fill that cache. Any page load would do the same. To avoid this, seed before the first request, or restart the API after seeding.

Before seeding, the real empty state rendered correctly. No 429s. The automatic probe was clean on the real list and the console had no errors. Paging, failures and hostile data used mocks, because 9 real records fit on one page.

## Candidate scenarios

All accepted and implemented in `specs/features/competitions.md`.

- `visitor should reach a competition's website and registration from its card` · Layer: UI · Why: no Competitions test checks the link targets
- `visitor should see a competition's dates on its card` · Layer: UI · Why: no test checks the date text. Mocked, with fixed dates
- `visitor should see the competition list after retrying when competitions failed to load` · Layer: UI · Why: Gyms has this. Works today
- `visitor should see website unavailable when a competition has no safe links` · Layer: UI · Why: guards `javascript:` and `data:` blocking. Mocked. Works today
- `visitor should see the same page of competitions after reloading` · Layer: UI · Why: shared URL state. Mocked. Works today
- `visitor should see the shared search when opening a search link` · Layer: UI · Why: `?q=` restore is untested here. Works today
- `visitor should see every competition again after clearing the search` · Layer: UI · Why: clearing is untested here. Works today
- `client should receive finished competitions when asking to include inactive ones` · Layer: API · Why: only malformed values of this option are tested
- `client should receive an empty page with valid pagination for a page beyond the last` · Layer: API · Why: Gyms has this

## Follow-up charters

- Explore search on Gyms, Events and Stores with more than 100 records to discover whether F5 is shared.
- Explore Competitions in the light theme to discover contrast and fallback-image problems.

## Session notes

F1 follow-up, 2026-10-31: Events had the same fault (Tokyo showed 6 November for a 5 November event) and is fixed. Gyms shows no dates.

1. Real data: 9 cards in start-date order, with same-day ties in name order. `Kerry Coast Open Mat` (finished) absent. Logos load (1200px wide) or fall back to the trophy icon.
2. Stores report follow-up: F1 repeats, as F3 here. Its F2 (long words, mocked 60-character name and 120-character URL) and F3 (320px) do not: no sideways scroll at 1440, 360 or 320. Its F4 does not: the page has one `h1`. Its F5 does not: the hint is `Check the spelling or try fewer words.`
3. Search: case and surrounding spaces fine. `%`, `<b>x</b>` and `zzzzz` → no results, nothing rendered as HTML. `smoothcomp` (website text) → no results, correctly. `June` → no results, so dates are not searched.
4. URL, mocked 45 records: 20 per page; next, reload and Back correct. `?page=99` → page 3. Searching from page 2 drops `page` and finds records on later pages. `?q=` restored on reload.
5. URL, real data: `?page=2` with one page → `/competitions`. `?page=abc&county=Cork` ignored with no error, and the junk stays in the URL. Search replaces the history entry, so Back leaves the search.
6. Hostile data, mocked: `javascript:` and `data:` links removed. With no website, a disabled `Website Unavailable` appears beside any valid registration link. Bare domains get `https://`. Empty name → `Unnamed Competition`. HTML in name and description shown as text, script did not run. Missing or invalid dates → no date row. Broken logo → icon. End before start renders `1 July – 1 June 2026`, which is outside the contract.
7. Failures, mocked: network failure gives the connection message and Retry; Retry recovers from a 500. Slow list: search disabled with a loading status. Once, with `?q=` and a 500, a hidden `Showing 0 competitions` was also present (not repeated, so not reported as a finding).
8. Keyboard: Tab goes from search to each card's links in order.
