# Mutation audit: <feature> (<YYYY-MM-DD>)

<Written by `playwright-mutation-auditor` after `npm run mutation:audit -- --feature <f>`.
One question: which wrong data would a visitor see while every test stays green?
Previous report, if any: `specs/mutation/<date>-<feature>.md` (keep it; this one says
what moved).>

- Environment: `APP_ENV=<local|docker>`, `<BASE_URL>`, project `chromium-desktop`, working tree `<branch or sha>`
- Specs audited: `<feature>.ui.acceptance.spec.ts` (<n> tests), `<feature>-<area>.ui.acceptance.spec.ts` (<n> tests)
- Mutants: <resource> only, <n> per spec. <Say if the run also enumerated other resources and that they are out of scope.>

## Scores

| Spec                              | Tests | Killed | Survived | No-op | Raw |
| --------------------------------- | ----- | ------ | -------- | ----- | --- |
| `<feature>.ui.acceptance.spec.ts` | n     | n      | n        | n     | nn% |
| **Union (real-data specs)**       |       | n      | n        | n     | nn% |

Adjusted score (killed / (killed + gaps + owned-by-API)): **nn%**. <Before → after, when re-auditing.>

## Gaps (ranked by visitor impact)

<Wrong price, date or link first; cosmetic text last. Each gap: the mutants, what the
visitor would see, why no test failed, and the exact fix. The fix is either a reader
and assertion to add (file and function) or a candidate scenario title.>

### Gap 1 · `<resource>:<operator>:<field>` (and `…`)

- Visitor sees: <e.g. another event's price on this card>
- Why no test failed: <e.g. the card reader never reads the price; `ExpectedEventCard` has no `price`>
- Fix: <e.g. add `price` to `ExpectedEventCard` and `cardFromDto`, read it in `readCardData`, assert in scenario UI 5> · or · Candidate scenario: `visitor should see <outcome> when <context>`

## Tests that do not prove their title

<The most serious finding: a test whose title claims a behaviour that a mutant of that
behaviour slipped past. "None found" is a valid entry.>

- `<title>` · slipped: `<mutant>` · because: <what the Then step actually asserts>

## Owned by API

- `<mutant>` · owned by `<api spec title>`; the UI renders API order/totals.

## Equivalent

<Only after looking at the rendered card or popup, not the DTO.>

- `<mutant>` · never shown: <where you looked>

## Out of contract

- `<mutant>` · a value the OpenAPI contract forbids; a kill here is robustness, not adequacy.

## Questions for the product owner

<Data the API sends that the page never shows but a visitor might need.>

- <question>

## Raw runner output

`playwright/.cache/mutation/<feature>-<timestamp>.md` (gitignored). Union survivors:

| Verdict  | Mutant                          |
| -------- | ------------------------------- |
| survived | `<resource>:<operator>:<field>` |
