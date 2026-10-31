# Exploration: Events search and county filter state across navigation

- **Date**: 2026-10-29 · **Environment**: `APP_ENV=docker` / `http://localhost:3000` · **App ref**: local compose stack (main)
- **Charter**: Explore Events search and the county filter with back/forward, reload and deep links to discover state-sync bugs
- **Budget**: 18 / 20 actions · about 10 min (first run of the agent procedure, done by hand)
- **Effort**: design and execution 60% · bug investigation 30% · setup 10%
- **Coverage**: `/events` and `/gyms` at 1440×900, dark scheme; interrupts tour (reload, back/forward, deep link). Type filter, mobile and paging not touched.

## Findings

### F1 · S3 · The county filter is lost on reload, back/forward and shared links, while search survives them

- **Steps** (from a fresh load of `/events`):
  1. Choose county **Cork**. One card is shown and the URL stays `/events`.
  2. Reload the page.
- **Expected**: Cork is still selected with the same single card, as search does (`/events?q=Rebel` restores both the term and the result). Claim: none in `specs/features/events.md`; the oracle is HICCUPPS **P** (the product is inconsistent with itself: search is URL state, the filter is not) and **U** (a shared or bookmarked filtered view should open filtered).
- **Actual**: County resets to **All**, and 5 cards are shown. `/events?county=Cork` as a deep link is ignored, as is going back then forward after filtering.
- **Reproduced**: 2/2 from a fresh load. The deep link and back/forward each seen once.
- **Also on**: `/gyms`. Choosing Cork leaves the URL at `/gyms`.
- **Oracle**: state read (`location.search`, select value, card count); the probe was clean (`[]` everywhere) and the console had no errors.
- **Evidence**: trace `.playwright-cli/traces/trace-1793307296733.trace`

## Questions for the product owner

1. **Decided 2026-10-31: yes.** County and type are now URL state, which resolves F1. Should filters (county, type) be URL state like search, so filtered views can be shared, bookmarked and survive a reload?
2. **Decided 2026-10-31: no, not for filters.** Filter and page changes now add history entries so Back steps through them. Typing a search still replaces the entry, so each keystroke is not a step.

## Environment notes

None. The probe ran clean, and there were no 429s.

## Candidate scenarios

- `visitor should see the search results when opening a shared search link` · Layer: UI · Why: `?q=` restore works today and no test owns it; cheap regression guard.
- `visitor should keep the chosen county when reloading the events page` · Layer: UI · Why: only if the answer to question 1 is yes. Then it applies to every list page through `ListPage`.

## Follow-up charters

- Explore the type filter combined with county and search on Events to discover combination bugs (not covered this session).
- Explore every list page at 360px with long seeded names to discover layout defects.

## Session notes

1. Search "Leinster" → `?q=Leinster`, 1 card, "Found 1 event."
2. County Cork with the search still set → 0 cards, URL unchanged (`?q=Leinster`), no county param.
3. Clear search → URL `/events`, county still Cork in the UI, 1 card.
4. Back → left the app (session started on it, so `about:blank`). Forward → `/events`, county reset to All, 5 cards.
5. Reload → All, 5 cards. Probe clean, console clean.
6. Confirm ×2: fresh `/events`, Cork, reload → All. Same both times.
7. Deep link `/events?county=Cork` → All, 5 cards. Deep link `/events?q=Rebel` → term restored, 1 card.
8. `/gyms`, Cork → URL `/gyms`. Same pattern.
