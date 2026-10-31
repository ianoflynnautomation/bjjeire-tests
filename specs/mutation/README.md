# Mutation audits

One triaged report per audit, written by the `playwright-mutation-auditor` agent:
`<YYYY-MM-DD>-<feature>.md`. The raw runner output (`npm run mutation:audit`) stays in
the gitignored `playwright/.cache/mutation/`.

A report answers one question: _which wrong data would a visitor see while every test
stays green?_ Each surviving mutant is classified as a **gap** (shown but not asserted,
with the exact fix), **owned by API**, **equivalent** (never shown) or **out of
contract**. Gaps become assertions in the page object and mapper, or candidate scenarios
for `specs/features/`. Re-audit after fixing to show the adjusted score moved.
