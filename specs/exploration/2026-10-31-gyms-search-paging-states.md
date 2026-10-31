# Exploration: Gyms search, county filter, paging and failure states

- **Date**: 2026-10-31 · **Environment**: `APP_ENV=docker` / `http://localhost:3000` · **App ref**: local rebuild of the `bjjeire-java` working tree, 62 gyms
- **Charter**: Explore Gyms search, the county filter and paging, with hostile inputs and failing or slow responses, to discover state bugs and wrong results
- **Budget**: over the 60-action default if each scripted step counts as one (about 110 steps) · about 15 min
- **Effort**: design and execution 70% · bug investigation 20% · setup 10%
- **Coverage**: `/gyms` at 1280×720, 360px and 320px, dark scheme; saboteur tour (500, aborted and slow responses); every card compared with the API. Theme, cold-cache boot and keyboard not touched.

## Findings

### F1 · S2 · (Resolved 2026-10-31: search now covers name and county only) Searching for a class shown on the cards misses most of the gyms that offer it

- **Steps** (from a fresh load of `/gyms`):
  1. Note that 15 gyms show a **Muay Thai** badge and 61 show **BJJ No-Gi (All Levels)**.
  2. Search for `Muay Thai`, then `BJJ No-Gi`.
  3. Search for `MuayThai`, then `NoGi`.
- **Expected**: Searching the words on the badge finds the gyms showing that badge. Claim: none in `bjjeire-java/specs/features/gyms.md`, which only names name and county; the oracle is HICCUPPS **P** (the search disagrees with the page) and **U**.
- **Actual**: `Muay Thai` finds 2 and `BJJ No-Gi` finds 0, while the raw codes `MuayThai` and `NoGi`, which a visitor never sees, find 15 and 61. Likewise `Competition Training`, `Kids BJJ`, `Women's Only`, `Yoga/Pilates`, `Strength Training` and `BJJ Gi` all find 0 (each of those badges is on 1–59 cards).
- **Side effect**: `Levels`, `GiAll` and `BJJ` match all 62 gyms, so a short term can look as if the search did nothing.
- **Cause**: `gymMatchesSearch` in `src/bjjeire-app/src/features/gyms/hooks/useGymsPage.ts` compares against the raw `offeredClasses` wire values rather than their display labels.
- **Reproduced**: 2/2 from a fresh load.
- **Oracle**: card counts against API data; the probe does not detect this.

### F2 · S3 · A gym with an accent in its name cannot be found without typing the accent

- **Steps** (from a fresh load of `/gyms`):
  1. Search for `Lotus`, `Bru`, then `Barao`.
  2. Search for `Lótus`, `Brú`, then `Barão`.
- **Expected**: The unaccented spelling finds `GFS Team Lótus BJJ`, `Brú Grappling Studio` and `Barão Jiu Jitsu Cork`. Claim: none; the oracle is HICCUPPS **U** and **P**urpose (an Irish directory where many visitors will not type a fada). Search does ignore case.
- **Actual**: Each unaccented term finds 0; each accented term finds 1.
- **Reproduced**: 2/2 from a fresh load.
- **Oracle**: card counts.

### F3 · S3 · At 320px the page scrolls sideways and the status badge is cut off

- **Steps** (from a fresh load of `/gyms` at 320×740):
  1. Look at the first cards, then scroll the page sideways.
- **Expected**: Content reflows with no sideways scrolling at 320 CSS px. Claim: WCAG 2.1 SC 1.4.10 Reflow (HICCUPPS **S**).
- **Actual**: The document is 325px wide. Badges end at up to 335px and read `ACTIV`. In the same screenshot the Support button covers the end of the `BJJ Éire` logo (seen once, not measured). There is no overflow at 360px.
- **Reproduced**: 2/2 by measurement.
- **Oracle**: `scrollWidth` 325 against `clientWidth` 320. axe does not report this.
- **Evidence**: `.playwright-cli/gyms-320.png`

### F4 · S4 · A failed search announces "Showing 0 gyms" to screen readers above the error

- **Steps** (from a fresh load of `/gyms`, with requests for 100 gyms returning 500):
  1. Search for `Liffey`.
- **Expected**: Only the error, as on a failed page change or county change, which show no count (HICCUPPS **P**).
- **Actual**: `Showing 0 gyms` is in the page above `Error Loading Data`, which suggests a result when the search never ran. Corrected on 2026-10-31: this text is `sr-only`, so screen readers hear it and sighted visitors do not. Retry recovers correctly.
- **Reproduced**: 2/2 from a fresh load.
- **Oracle**: DOM text; `getByText(...).isVisible()` reports true for a 1px `sr-only` element.

## Questions for the product owner

1. **Answered 2026-10-31: search covers gym name and county only.** Classes, descriptions and addresses were removed from `gymMatchesSearch`, which resolves F1.
2. **Decided 2026-10-31: yes, following usual UX practice.** Page and county are URL state on Gyms, and page, county and type on Events; Competitions and Stores get the page. Reload and shared links work, and Back steps through pages and filters. Typing a search replaces the history entry.
3. **Decided 2026-10-31: yes.** A changed result set restarts at page 1, for both search and filters.
4. Is the 100-gym search limit acceptable? `bjjeire-java/specs/features/gyms.md` and `AGENTS.md` say search runs "on the loaded page", but it fetches up to 100 gyms (`DEFAULT_SEARCH_PAGE_SIZE`). That is fine with 62 gyms; beyond 100, the rest could not be found. Read from code and requests, not tested with more than 100.

## Environment notes

No 429s. The probe was clean on `/gyms` (`listInvariant` only noted 62 total with 20 shown, which is correct paging) and the console had no errors. The probe ran on the unfiltered list only.

## Candidate scenarios

Accepted and implemented on 2026-10-31 unless marked otherwise; see `specs/features/gyms.md`. The accent and 320px candidates are not implemented, because they fail until F2 and F3 are fixed.

- `visitor should find a gym by its county name` · Layer: UI · Why: pins the agreed search scope, which replaced F1; no test owns it today
- `visitor should not find a gym by anything other than its name or county` · Layer: UI · Why: pins the same scope; needs a mock, because seeded descriptions depend on the environment
- `visitor should return to the previous page of gyms with Back` · Layer: UI · Why: covers the new URL state; no test owns it today
- `visitor should see the same page of gyms after reloading` · Layer: UI · Why: covers the new URL state; no test owns it today
- `visitor should find a gym with an accented name without typing the accent` · Layer: UI · Why: covers F2. Fails today
- `visitor should reach the next page of gyms` · Layer: UI · Why: paging is tested only at the API layer; works today. Assert seeded data only where the dataset allows it
- `visitor should stay within the chosen county when moving to its next page` · Layer: UI · Why: county plus paging is untested and works today. Needs a mock, because the county totals depend on the environment
- `visitor should see a gym's free trial offer on its card` · Layer: UI · Why: the seeded Liffey card shows `7 free days. One free trial week.` and no UI test mentions it
- `visitor should see gym cards fit the screen on the narrowest phone` · Layer: UI (`@mobile`) · Why: covers F3. Fails today, and neither mobile project is as narrow as 320px, so it needs its own viewport

## Follow-up charters

- Explore search on Events, Competitions and Stores with their displayed labels and accented terms to discover whether F1 and F2 repeat.
- Explore the Gyms boot path with a slow or failing feature-flag request and route chunk to discover blank screens and wrong redirects (the charter this session replaced).
- Explore every list page at 320px to discover whether F3 and the header overlap are shared.

## Session notes

1. Page 1 to 4 of 62 gyms: 20, 20, 20, 2; Next disables on the last page. Scrolls to top on page change.
2. Reload on page 2 → page 1. Back from page 4 → left Gyms. `?page=2`, `?page=abc` and `?county=Cork` ignored without error. `?q=Liffey` restored.
3. Cork 16 cards. Cork + `Harbour` 1. Cork + `Liffey` no results. Clearing keeps Cork. Reset → 62. Kerry → no-data state.
4. Dublin 21: page 1 has 20, page 2 has 1, both only Dublin (2/2). Reset → page 1 of all. Search and clear on Dublin page 2 → page 1 of Dublin.
5. Inputs: case and surrounding spaces fine. `%`, `<b>`, `é` and 200 characters → no results, nothing rendered as HTML. `'` → 5.
6. All 62 cards against the API: county, website (13 with none show no link), map coordinates and class counts all match. Class labels are readable. All 62 are Active.
7. Failures: 500 on page 2, on search and on county, and an aborted county request, each show the error with Retry. Retry recovered page 2 and search. Choosing another county recovers from an aborted one.
8. Race: Cork delayed 2.5s, Dublin chosen meanwhile → stays on Dublin, no stale cards.
9. Slow list: filters are disabled while loading. Oracle clean, console clean.
10. Confirm ×2: F1, F2, F3 and F4 from fresh loads. 360px clean; 320px overflows.
