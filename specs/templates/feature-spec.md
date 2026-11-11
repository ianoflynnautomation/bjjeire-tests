# Acceptance spec: <Feature>

<!--
Copy this file to specs/features/<feature>.md and delete these comments.
Steps, expected results and Why are the behaviour a product owner can read.
The Test design line is for the generator. Keep selectors, test ids, URLs,
status codes and field names out of the steps.
Add a title under ## Scenarios only in the change that adds its test.
spec:check requires Covers and Oracle on every block. See specs/templates/README.md.
-->

**App spec**: `bjjeire-java/specs/features/<feature>.md`
**AC-IDs**: `bjjeire-java/specs/stc/<feature>/spec.md`
**Slice**: `tests/features/<feature>/` · `src/ui/pages/<feature>/` · `src/api/features/<feature>/`
**Seeded**: `tests/features/<feature>/seeded.ts`
**Agent seed**: `tests/agents/seed.spec.ts`
**Status**: living · **Reconciled**: YYYY-MM-DD

<One or two sentences: what a visitor can do, and which behaviours this suite does not re-prove because the app repo owns them.>

## Coverage

<!-- One row per AC-ID the header points at. "Owned by" is scenario numbers, or "App repo". -->

| Criterion  | Owned by    |
| ---------- | ----------- |
| AC-XXX-001 | UI 1, API 1 |
| AC-XXX-006 | App repo    |

## Scenarios

<!--
Numbered titles are the Playwright test titles, in file order.
(@smoke) marks the critical journey. (@mobile) marks a phone-only test.
A data-driven title uses one <placeholder> per ${} in the test.
-->

### UI

1. visitor should see the <thing> list when opening <Feature> (`@smoke`) · AC-XXX-001

### API

1. client should receive each published <thing> with its details (`@smoke`) · AC-XXX-001

## Constraints

- <A rule every scenario obeys, in visitor language.>

## Planned

<!--
One #### block per scenario. Keep the block after the test exists.
Group blocks under a ### heading when they share setup, and write that setup once.
-->

#### <actor> should <outcome> when <context>

- Covers: AC-XXX-00n
- Oracle: <the seeded record, a rule in the app spec, or a fixed mock body. Never the app's own calculation.>
- Steps:
  1. When a visitor opens <Feature>
  2. And the visitor <does one thing>
- Expected results:
  - Then <one observable outcome>
- Why: <One sentence: what breaks for the visitor, and why no other test would catch it.>

Test design: UI · @acceptance · `SEEDED_*` · not mocked · default seed

## Held for a product decision

- `<title>` · Question: <what must be decided> · Asked: YYYY-MM-DD · Owner: <who answers>

## Rejected

- `<title>` · Why not: <covered at a cheaper layer, duplicate, or not visitor-observable>

## Findings

- **F1 (open, app repo #<n>)**: <one line in visitor language>. Source: `specs/exploration/<report>.md`.
