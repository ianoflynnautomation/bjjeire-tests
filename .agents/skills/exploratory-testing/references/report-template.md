# Exploration: <charter in one line>

- **Date**: YYYY-MM-DD · **Environment**: `APP_ENV` / `BASE_URL` · **App ref**: <image tag or commit, if known>
- **Charter**: Explore <target> with <resources> to discover <information>
- **Budget**: <actions used> / <budget> actions · <minutes> min
- **Effort**: design and execution <n>% · bug investigation <n>% · setup <n>%
- **Coverage**: routes, viewports, colour schemes and tours actually exercised

## Findings

Severity is the visitor's: **S1** blocks the purpose, **S2** is a wrong result with a workaround, **S3** is a degraded experience, **S4** is cosmetic. The full scale is in the exploratory-testing skill.

HICCUPPS names the oracle when no spec line applies: **H**istory, **I**mage, **C**omparable products, **C**laims, **U**ser expectations, **P**roduct, **P**urpose, **S**tatutes. Write the letter.

### F1 · S2 · <one-line summary in visitor language>

- **Steps** (from a fresh load of `<start URL>`):
  1. …
  2. …
- **Expected**: … (claim: `specs/features/<f>.md`, or HICCUPPS letter)
- **Actual**: …
- **Reproduced**: 2/2 from a fresh load
- **Oracle**: probe field and value, or the console error
- **Evidence**: `.playwright-cli/<file>.png`, trace path

## Questions for the product owner

Behaviour the specs do not settle. Not bugs.

## Environment notes

429s, cold starts, missing seed records: anything that limited the session.

## Candidate scenarios

For `playwright-test-planner` to accept or reject. Not yet in `specs/features/`.

- `visitor should … when …` · Layer: UI · Why: covers F1; no test owns this today
- `client should … when …` · Layer: API · Why: …

## Follow-up charters

- Explore … with … to discover …

## Session notes

Terse, in order: what was tried, what was seen. Enough for someone else to rerun the session.
