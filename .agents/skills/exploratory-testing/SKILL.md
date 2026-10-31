---
name: exploratory-testing
description: Charter-based exploratory testing of the BjjEire app in a live browser. Covers writing a charter, session-based test management (time-boxed sessions, session sheet), test heuristics (SFDPOT, tours, interrupts, state and URL sync), oracles (automatic probe script, HICCUPPS), BjjEire risk areas, how to confirm and minimise a finding, severity, and the findings report. Use when asked to explore, bug-hunt, "try to break" a page, or find what the scripted suite misses. Do not use for planning scenarios from a spec (playwright-test-planner) or writing spec code.
metadata:
  author: Ian O Flynn
---

# Exploratory testing

Scripted tests confirm what the spec already says. Exploration looks for what nobody
wrote down. A session is **time-boxed, chartered and reported**. It is not open-ended
clicking, and its output is evidence, not test code.

## 1. Charter

One sentence: **Explore** _target_ **with** _resources / techniques_ **to discover**
_information_. Examples:

- Explore Events filtering with rapid filter, search and back/forward changes to discover state-sync bugs.
- Explore every list page at 360px with long seeded names to discover layout and truncation defects.
- Explore Gyms with a failing and a slow API (mocked) to discover error-handling and retry gaps.
- Explore deep links with malformed query parameters to discover crashes and silent wrong results.

A charter names one target and one risk. "Test the app" is not a charter. If you were
given none, pick the highest-ranked unexplored row in §5 and state it at the top of the report.

## 2. Session shape (SBTM)

- **Budget**: default 60 browser actions or 30 minutes, whichever comes first. Stop
  when you hit it. A long session finds less per minute than two short ones.
- **Split of effort**: aim for most of the session in test design and execution. Time
  spent investigating a bug or fighting setup is recorded separately in the report.
- **Session sheet**: keep running notes as you go: what you tried, what you saw, and
  what you would try next. The report is built from these notes, not from memory.
- **Opportunity**: when you notice something off-charter, write it under "Follow-up
  charters" and carry on with the charter. Don't chase it.

## 3. Heuristics: what to vary

**SFDPOT** (one row = one direction to push):

| Letter     | Ask                     | BjjEire examples                                                 |
| ---------- | ----------------------- | ---------------------------------------------------------------- |
| Structure  | What is it made of?     | Lazy route chunks, cards, header total, filters, footer links    |
| Function   | What does it do?        | Search, county/type filters, reset, retry, theme toggle          |
| Data       | What does it process?   | Long names, Irish fadas (Éire), apostrophes, emoji, empty fields |
| Platform   | What does it depend on? | MSAL boot, feature-flag fetch, API, viewport, colour scheme      |
| Operations | How is it used?         | Deep links, refresh, back/forward, new tab, slow mobile          |
| Time       | What changes over time? | Event dates near midnight, DST in Europe/Dublin, finished events |

**Interrupts and state**: refresh mid-load; back/forward after each filter change;
open the current URL in a new tab and compare it with the original; change a filter
while the previous request is still in flight; clear search with the filter still set;
resize across the mobile breakpoint mid-interaction; toggle theme then reload.

**Input**: empty, one char, a partial seeded name (`SEEDED_*_PARTIAL_NAME`), the full
name in other case, leading and trailing spaces, `%`, `'`, `<b>`, 200 chars,
accented vs unaccented (`Eire` vs `Éire`).

**Tours** (pick one per session): the _landmark_ tour (every route via nav only), the
_back-alley_ tour (least-used controls: footer, support modal, external links), the
_saboteur_ tour (break the network with mocks), the _couch-potato_ tour (do nothing:
let a page sit, and reload with a cold cache).

## 4. Oracles: how you know something is wrong

**Automatic, after every state worth judging.** Run both:

```sh
npx playwright cli -s=<session> --raw run-code --filename=.agents/skills/exploratory-testing/scripts/oracles.js
npx playwright cli -s=<session> console error
```

The probe returns arrays: axe WCAG 2.1 A/AA violations, horizontal overflow, leaked
`undefined`/`NaN`/`Invalid Date`/`[object Object]`, broken images, dead links, duplicate
ids, failed/slow/repeated API calls, and the list-page invariant (stated total vs cards
vs empty state). `[]` means pass. Probe results are suspicions: confirm each one (§6).

**Judgement (HICCUPPS).** A behaviour is suspect when it is inconsistent with:
**H**istory (what it did before or in another feature), **I**mage (BjjEire's look and tone),
**C**omparable products (other directory sites), **C**laims (`specs/features/<f>.md`,
`bjjeire-java/specs/features/`), **U**ser expectations, the **P**roduct itself (Gyms
behaves unlike Events), **P**urpose (finding a class or event in Ireland), **S**tatutes
(WCAG, GDPR on external links and tracking).

The strongest oracle is the product being inconsistent with itself. If the four list
pages handle the same situation four different ways, that is a finding.

## 5. Risk catalogue (rank before choosing a charter)

| Rank | Area                       | Why it is risky here                                                              |
| ---- | -------------------------- | --------------------------------------------------------------------------------- |
| 1    | Filter / search / URL sync | Client-side search on the loaded page combined with server filters; back/forward  |
| 2    | Boot path                  | MSAL init → `/featureflag` → `lazy()` chunk; a 429 on flags redirects to `/about` |
| 3    | Error, empty, retry states | Four pages share `ListPage`; one may diverge                                      |
| 4    | Paging beyond page 1       | Environments hold full datasets; header total vs shown cards                      |
| 5    | Dates and finished events  | Upcoming-only rule, Europe/Dublin timezone, DST                                   |
| 6    | Mobile layout              | Long names, badges and filters at 360px                                           |
| 7    | Theme and persistence      | Dark default, stored theme, `prefers-color-scheme` fallback                       |
| 8    | External links and modal   | Gym websites, maps, support modal focus trap and Escape                           |

Before choosing, check `specs/exploration/` for sessions already run on that area and
`specs/features/<f>.md` for what is already covered by tests.

## 6. Confirming a finding

1. **Reproduce twice from a fresh load** (`goto` the start URL, then the minimal steps).
   A suspicion seen only once is reported as "seen once, not reproduced", never as a bug.
2. **Minimise**: remove steps until it stops failing; the last set that fails is the repro.
3. **Check the environment first**: a 429, a cold API or a missing seed is an
   environment note, not a product bug.
4. **Check the claims**: if the spec says this is intended, it is not a bug. If the spec
   is silent, it is a question for the product owner.
5. **Capture**: the URL, the oracle output and a screenshot
   (`npx playwright cli -s=<session> screenshot --filename=<id>.png`, which lands in the
   gitignored `.playwright-cli/`). The written steps must reproduce it without the
   screenshot.

**Severity**: **S1** blocks the purpose (no listings, wrong data shown as right, crash).
**S2** is a wrong result with a workaround (filter ignored after back, count wrong). **S3**
is a degraded experience (layout overflow, a11y serious/critical, a slow call). **S4** is
cosmetic. Severity is about the visitor, not about how interesting the bug is.

**Not a finding**: copy or style preferences, behaviour the spec describes, anything
already covered by a failing test, or an axe `minor` on third-party content.

## 7. Report

Write `specs/exploration/<YYYY-MM-DD>-<charter-slug>.md` using
[`references/report-template.md`](references/report-template.md). Findings carry repro
steps, expected (with the claim it comes from), actual, severity and evidence paths.
**Candidate scenarios** are proposals in `<actor> should <outcome> [when <context>]`
form, each with the layer (UI or API) and why the suite should own it. The
`playwright-test-planner` decides whether they enter `specs/features/`. Exploration
never writes spec code.
