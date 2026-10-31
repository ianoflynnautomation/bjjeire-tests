# Exploration: Stores search, content, URL state and failure states

- **Date**: 2026-10-31 · **Environment**: `APP_ENV=docker` / `http://localhost:3000` · **App ref**: local rebuild of the `bjjeire-java` working tree, 10 stores
- **Charter**: Explore Stores search and cards, with hostile content and failing or slow responses, against the other list pages to discover wrong results and inconsistencies
- **Budget**: over the 60-action default if each scripted step counts as one (about 75 steps) · about 10 min
- **Effort**: design and execution 75% · bug investigation 15% · setup 10%
- **Coverage**: `/stores` at 1280×720, 360px and 320px, dark scheme; saboteur tour; paging only through a mock, because 10 stores fit on one page. Light theme and cold-cache boot not touched.

## Findings

### F1 · S3 · (Resolved 2026-10-31: search now covers names only) The search box says "Search by name" but also matches descriptions

- **Steps** (from a fresh load of `/stores`):
  1. Note the placeholder `Search by name`.
  2. Search for `Irish`.
- **Expected**: Only names match, so no store is listed. Claim: the placeholder, and `bjjeire-java/specs/features/stores.md` ("a store name / part of a name").
- **Actual**: `BattleReady Fightwear` and `Wolfhound Fightwear` are listed, with nothing in their names to explain why. `gis` finds `Scramble` the same way. On Gyms, search was narrowed on 2026-10-31 to what the visitor would expect (HICCUPPS **P**).
- **Cause**: `storeMatchesSearch` in `src/bjjeire-app/src/features/stores/hooks/useStoresPage.ts` also checks `description`.
- **Reproduced**: 2/2 from a fresh load.
- **Oracle**: card names against the placeholder.

### F2 · S3 · One long unbroken word pushes the whole page sideways on a phone

- **Steps** (from a fresh load of `/stores` at 360px, with a mocked store):
  1. Give a store a description containing a 123-character URL.
- **Expected**: The text wraps inside its card (HICCUPPS **U**).
- **Actual**: The page becomes 986px wide on a 360px screen. A 30-character unbroken name makes it 512px. At 1280px a 120-character name is 1920px wide inside a 389px card, and the page does not grow. Names with spaces wrap correctly. Neither field has a length limit in `bjjeire-java/specs/database-contracts/store.md`, so a pasted URL in a description is plausible; no seeded store triggers this today.
- **Reproduced**: 2/2 at 360px for the URL; once for each name length.
- **Oracle**: `scrollWidth` against viewport width.

### F3 · S3 · At 320px the header pushes the page sideways

- **Steps** (from a fresh load of `/stores` at 320×740):
  1. Measure the page width.
- **Expected**: No sideways scrolling at 320 CSS px. Claim: WCAG 2.1 SC 1.4.10 Reflow (HICCUPPS **S**).
- **Actual**: The document is 325px wide because the menu button ends at 325px. Store cards fit, so the cause is the shared header. This is probably part of F3 in `2026-10-31-gyms-search-paging-states.md`, which also has clipped badges. There is no overflow at 360px.
- **Reproduced**: 2/2 by measurement.
- **Oracle**: `scrollWidth` 325 against `clientWidth` 320.
- **Evidence**: `.playwright-cli/stores-320.png`

### F4 · S3 · The page has no main heading

- **Steps** (from a fresh load of `/stores`):
  1. List the `h1` elements.
- **Expected**: One `h1`, as on Gyms, Events and About (HICCUPPS **P**; WCAG 2.1 SC 1.3.1 and 2.4.6 are the closest rules). Screen-reader users navigate by headings.
- **Actual**: There is none. `stores.hero` in `src/bjjeire-app/src/config/content/stores.ts` has a tagline and subtitle, but nothing renders them; Gyms and Events show their equivalent as a hero banner with the `h1`. From the code, Competitions has no `h1` either (not opened in this session).
- **Reproduced**: 1/1; this comes from static markup, and the code confirms it.
- **Oracle**: DOM read. axe stays quiet because the probe runs only WCAG A/AA rules.

### F5 · S4 · The no-results message tells visitors to adjust filters that do not exist

- **Steps** (from a fresh load of `/stores`):
  1. Search for `zzz`.
- **Expected**: Advice that applies to a page with only a search box.
- **Actual**: `Try adjusting your filters or check back later.` Stores has no filters. The suite currently expects this text (`EMPTY_LINE2` in `src/ui/pages/common/empty.page.ts`), and its title, `No Results Found`, also differs from `No gyms match your search`.
- **Reproduced**: 2/2 from a fresh load.
- **Oracle**: visible text.

## Questions for the product owner

1. **Answered 2026-10-31: names only.** Descriptions were removed from `storeMatchesSearch`, which resolves F1.
2. **Decided 2026-10-31: yes, following usual accessibility and SEO practice.** Every page now names itself in the tab (WCAG 2.1 SC 2.4.2). `index.html` keeps the site title for anything that does not run JavaScript.
3. **Answered 2026-10-31: no.** The seed does not reach public environments, so this is not a finding.

## Environment notes

No 429s. The probe was clean on `/stores` (every array empty) and the console had no errors. The probe ran on the default list only. Paging, broken logos and missing fields were tested with mocks, because the 10 real stores do not produce them.

## Candidate scenarios

For `playwright-test-planner` to accept or reject. Not yet in `specs/features/`.

- `visitor should reach a store's website from its card` · Layer: UI · Why: no UI test checks the link target, though it is the point of the page
- `visitor should see a store's description on its card` · Layer: UI · Why: `TEST_IDS.description` exists, but no Stores spec asserts the text
- `visitor should see the store list after retrying when stores failed to load` · Layer: UI · Why: Gyms has this; Stores stops at the error message. Works today
- `visitor should see website unavailable when a store has no safe website` · Layer: UI · Why: guards the `javascript:` and `data:` blocking below. Mocked. Works today
- `visitor should see the same page of stores after reloading` · Layer: UI · Why: covers the shared URL state on a page with no filters. Mocked. Works today
- `visitor should not find a store by a word only in its description` · Layer: UI · Why: pins the agreed search scope. Implemented 2026-10-31

## Follow-up charters

- Explore Competitions with the same content and search checks to discover whether F1, F2, F4 and F5 repeat.
- Explore long unbroken text on Gyms and Events cards at 360px to discover whether F2 is shared.
- Explore every list page in the light theme to discover contrast and placeholder-image problems.

## Session notes

1. 10 stores in name order, header `Found 10 stores.` Cards with no description keep their button aligned. All external links open in a new tab with `noopener noreferrer` and name the store in their label.
2. Inputs: case and surrounding spaces fine. `%`, `'`, `<b>` and 200 characters → no results, nothing rendered as HTML. `aran-fight-gear` (website text) → no results, correctly.
3. URL: `?q=Aran` restored. `?page=2` with one page → `/stores`. `?page=abc&county=Cork` ignored with no error, and the junk stays in the URL.
4. Mocked 45 stores: 20 per page; next, reload and Back all correct. `?page=99` → page 3. Searching finds a store on a later page.
5. Hostile data, mocked: `javascript:` and `data:` websites → disabled `Website Unavailable`, no link. Bare domain → `https://` added. Empty name → `Unnamed store`. HTML in a description → shown as text, script did not run. Broken logo URL → placeholder icon, not a broken image.
6. Failures: 500 → error with Retry, and Retry recovers. Slow list → search disabled with a loading status. `Showing 0 stores` on a failed search is `sr-only`: screen readers hear it, sighted visitors do not.
7. Keyboard: Tab goes from search to each `Visit Website` in order.
8. Confirm ×2: F1, F3 and F5 from fresh loads, and F2 for the URL at 360px.
