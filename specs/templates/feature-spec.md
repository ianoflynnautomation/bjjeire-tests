# Acceptance spec: <Feature>

**App spec**: `bjjeire-java/specs/features/<feature>.md`
**AC-IDs**: `bjjeire-java/specs/stc/<feature>/spec.md`
**Slice**: `tests/features/<feature>/` · `src/ui/pages/<feature>/` · `src/api/features/<feature>/`
**Seeded**: `tests/features/<feature>/seeded.ts`
**Agent seed**: `tests/agents/seed.spec.ts` (project `agent-seed`: signed in, flags pinned on, shell mounted)
**Status**: living · **Reconciled with tests**: YYYY-MM-DD

<Application overview, one or two sentences: what a visitor can do on this feature, and
which app behaviours this suite deliberately does not re-prove because the app repo's
unit, integration or Pact tests own them.>

## Scenarios (must match test titles)

<Every title below is a Playwright test title, character for character. A title is
listed only when its test exists. Order the list by file, then by the order in the
file, so a reader can scan both side by side. Mark the critical journey `(@smoke)`
and phone-only tests `(@mobile)`. Data-driven titles write the varying part as
`<value>`, one placeholder per `${}` in the code. If the feature has more than one
spec file, say which titles live where in one line after each list.>

### UI

1. visitor should see the <thing> list when opening <Feature> (`@smoke`) · AC-XXX-001
2. visitor should see an empty state when no <thing> matches the search · AC-XXX-002
3. visitor should <outcome> when <context> · AC-XXX-00n

Titles 1–n are in `<feature>.ui.acceptance.spec.ts`.

### API

1. client should receive each published <thing> with its details · AC-XXX-001
2. client should get a bad request for <param> "<value>" · AC-XXX-004

<Add a line for data-driven sets: which `invalid-values.ts` export drives them and
how errors are asserted (RFC 9457 problem: status, `type`, `field` + `errorCode`).>

## Constraints

<Rules that shape every scenario and that a new test must not violate. Short bullets:
how search or filtering behaves, which values are URL state, what the data policy
means for this feature (seeded records, partial names, relative dates), what never
appears.>

- <constraint>
- <constraint>

## Planned

<One `####` block per scenario, implemented or not. The block is the design note the
generator implements from and the healer and reviewer read. Keep it after the test
exists. Group blocks under a `###` heading when they share setup (a map view, a
multi-page mock), and put the shared setup once under that heading. The shape follows
Playwright's test-agent plan: a seed, numbered steps, bulleted expected results. Steps
are the Given/When/And lines and become `test.step`s; each expected result is one Then
or And line and becomes exactly one assertion in the Then step.>

#### <actor> should <outcome> when <context>

- Layer: UI | API · Tags: @acceptance[, @smoke | @mobile | @a11y] · Data: `SEEDED_*` (seeded) | <mock name> · Mocked: no | yes (<empty | error | multi-page | snapshot>, why)
- Covers: AC-XXX-00n | none (<risk or `specs/exploration/<report>.md` F<n>>)
- Oracle: <where the expected value comes from, independently of the app: the seeded record; a rule stated in the app spec; a fixed mock body. Never "the same calculation the app does".>
- Seed: <omit when it is the feature's default, the agent seed above; otherwise the state the test starts from: a flag off, a phone viewport, another timezone>
- Steps:
  1. Given <context, only if the default state is not enough>
  2. When a visitor opens <Feature>
  3. And the visitor <does one thing in domain language>
- Expected results:
  - Then <one observable outcome, one assertion>
  - And <another outcome of the same action, one assertion>
- Why: <the risk this guards, in one line. What breaks for the visitor if it regresses, and why no existing test would catch it.>

#### <next title>

- Layer: … · Tags: … · Data: … · Mocked: …
- Covers: …
- Oracle: …
- Steps:
  1. …
- Expected results:
  - …
- Why: …

## Held for a product decision

<Scenarios that need an answer before they can be written. Do not implement these.>

- `<title>` · Question: <what must be decided> · Asked: YYYY-MM-DD · Owner: <who answers>

## Rejected

<Proposals the planner or a human turned down, with the reason, so they are not
proposed again.>

- `<title>` · Why not: <covered at a cheaper layer | duplicate of n | not visitor-observable | …>

## Findings

<Pointers only. The evidence lives in `specs/exploration/` or the app repo issue.
Give each a status so the list can be pruned.>

- **F1 (open, app repo #<n>)**: <one line in visitor language>. Source: `specs/exploration/<report>.md`.
- **F2 (fixed YYYY-MM-DD)**: <one line>. Guarded by scenario UI n.
