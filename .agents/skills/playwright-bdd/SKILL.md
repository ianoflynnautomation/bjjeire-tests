---
name: playwright-bdd
description: Project-agnostic BDD guidelines for Playwright acceptance tests written from the user's perspective in declarative Gherkin style (per Cucumber's "Writing better Gherkin"). Covers behaviour-focused test titles, Given/When/Then as test.step titles or .feature files, declarative versus imperative steps, domain language, one behaviour per scenario, data tables and scenario outlines, and a review checklist. Use when writing, naming, or reviewing acceptance scenarios, test titles, test.step titles, or .feature files. For TypeScript coding rules see playwright-typescript-standards; for spec file structure see playwright-spec-practices.
metadata:
  author: Ian O Flynn
---

# BDD for Playwright: declarative, user-perspective scenarios

A scenario describes **what a user can do and what they observe**, in the language of
the business. It never describes **how** the UI or system implements it. The code
underneath (page objects, fixtures, API clients) owns the how.

Reference: <https://cucumber.io/docs/bdd/better-gherkin>

## Critical rules

1. **Declarative, not imperative.** Describe intent and outcome ("the visitor searches
   for a gym"), not mechanics ("the visitor clicks the search box and types…").
2. **No implementation detail** in titles or steps: no selectors, test ids, CSS, URLs,
   HTTP verbs, status codes, JSON, DTO/field names, button colours, or element types.
3. **Users are the actor.** Name a role (`visitor`, `customer`, `admin`, `client` for
   API consumers) and write from their point of view.
4. **One behaviour per scenario.** If the title needs "and", it is probably two tests.
5. **Given = context, When = action, Then = observable outcome.** Assertions live only
   in Then steps.
6. **Steps read as a story to a non-developer.** A product owner should be able to
   approve the scenario without seeing the code.
7. **The steps and the code must agree.** A step titled "Then only that gym is listed"
   must assert exactly that — not more, not less.

## Declarative vs imperative

Imperative (avoid) — couples the scenario to the UI, breaks on every redesign:

```gherkin
Scenario: Search for a gym
  Given I navigate to "/gyms"
  When I click the "search-input" field
  And I type "Blackwater" into the search box
  And I press Enter
  Then the element ".gym-card" should have count 1
  And the h3 inside ".gym-card" should contain "Blackwater Valley BJJ"
```

Declarative (prefer) — survives redesigns, documents the business rule:

```gherkin
Scenario: Visitor finds a gym by part of its name
  When a visitor opens Gyms
  And the visitor searches for "Blackwater"
  Then only "Blackwater Valley BJJ" is listed
```

The rule of thumb from Cucumber: **if the step would still be true after the UI is
rebuilt in a different framework, it is declarative enough.**

## Test titles

Pattern: `<actor> should <observable outcome> [when <context>]`

| Avoid                                   | Prefer                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| `search test`                           | `visitor should find only the gym searched for by name`                               |
| `should render empty-state component`   | `visitor should see an empty state when no gym matches the search`                    |
| `GET /orders returns 500 handling`      | `customer should see a server error message when orders cannot load`                  |
| `clicking reset button clears dropdown` | `visitor should see gyms from other counties again after resetting the county filter` |
| `verify data-testid=card-link href`     | `visitor should see website and map links pointing to the right destinations`         |

- Present tense, outcome-focused, domain vocabulary.
- The context clause (`when …`) names the business condition, not the mechanism.
- API tests use the same pattern with the API consumer as actor
  (`client should receive a validation problem when the page size is too large`).

## Mapping Gherkin to Playwright

You can express BDD either in plain Playwright specs with `test.step`, or in
`.feature` files bound to step definitions (e.g. `playwright-bdd`, Cucumber). The
writing rules are identical.

### Plain Playwright with `test.step`

Each top-level `test.step` title starts with `Given`, `When`, `Then`, `And`, or
`But`. The step body calls one or two intent-level page-object methods — no raw
locators.

```ts
test('visitor should see an empty state when no gym matches the search', async ({ gymsPage }) => {
  await test.step('When a visitor opens Gyms', async () => {
    await gymsPage.goTo();
  });

  await test.step('And the visitor searches for a name that matches nothing', async () => {
    await gymsPage.searchFor(faker.string.alphanumeric({ length: 12 }));
  });

  await test.step('Then no gyms are listed', async () => {
    await gymsPage.expectNoResults();
  });
});
```

Notes on this example:

- The step says "a name that matches nothing" — the **intent** — while the code uses
  a random string. The random value is an implementation detail and stays out of the
  title.
- When a concrete value **is** meaningful to the reader (a known record), put the
  business value in the title: ``test.step(`And the visitor searches for "${gym.name}"`, …)``.
  Interpolate domain values, never ids or technical keys.
- `Then` steps call assertion methods only; `When` steps call action methods only.

### `.feature` files

```gherkin
Feature: Find a gym
  Visitors look for a gym near them before booking a trial class.

  Background:
    Given a visitor is on the Gyms page

  Scenario: Filtering by county shows only that county's gyms
    When the visitor filters by "Cork"
    Then only gyms in Cork are listed

  Scenario Outline: Searching by part of a name
    When the visitor searches for "<term>"
    Then "<gym>" is listed

    Examples:
      | term       | gym                   |
      | Blackwater | Blackwater Valley BJJ |
      | Liffey     | Liffey Grappling      |
```

- The `Feature` description states the user goal (the "why"), not the page structure.
- Step definitions are thin: they translate the step into page-object calls.
  Business logic and selectors never live in step definitions.
- Keep step phrases reusable but not generic — `the visitor filters by {string}` is
  good; `I click {string}` is an imperative trap.

## Given / When / Then in detail

**Given — the world before the action.**

- Establishes state: data that exists, who the user is, system conditions.
- Written in past or present state: "Given a customer has an order awaiting dispatch".
- How it is achieved (API seeding, route mock, login via storage state) is hidden.
  "Given the orders service is unavailable" — not "Given route `/api/orders` returns 500".
- Omit Given when the starting state is the default; start with When.

**When — the single user action under test.**

- One meaningful action, possibly with an `And` for a tightly coupled second action.
- Use the user's verb: searches, filters, books, cancels, retries, signs in.
- Not: clicks, types, presses, scrolls, hovers (unless the gesture itself is the feature,
  e.g. accessibility keyboard navigation).

**Then — what the user can observe.**

- Visible outcomes: what is listed, shown, enabled, announced, or where the user ends up.
- Not internal state: database rows, local storage, network calls, component props.
- Be precise: "Then only that gym is listed" (count + identity) beats "Then results
  are shown".

**And / But** continue the previous keyword. A second `When … Then …` pair is acceptable
for a short, coherent journey (error → retry → recovery), but more than two pairs
usually means the scenario should be split.

## Domain language

- Build a shared glossary with the product team and use it consistently
  ("gym", "open mat", "county" — not "item", "record", "dropdown option").
- Name UI concepts by purpose: "the search", "the county filter", "the gym card" —
  not "the input", "the select", "the div".
- Describe errors by user impact: "a network error message is displayed", not
  "a `TypeError: Failed to fetch` is logged".
- Prefer realistic, meaningful example data in scenarios ("Cork", "Blackwater Valley
  BJJ") over `foo`, `test1`, `abc`.

## Scope and granularity

- **One rule per scenario.** Search-by-full-name and search-by-partial-name are two
  scenarios because they are two rules.
- **Independent scenarios.** Each sets up its own context; never rely on a previous
  scenario's state.
- **Short.** Aim for 3–6 steps. Long scenarios hide the behaviour under test; move
  setup into Given steps backed by fixtures or a `Background` / `beforeEach`.
- **Cover rules, not permutations.** Use a Scenario Outline or a data-driven loop of
  typed cases for input variations; keep one representative scenario per rule in
  the smoke tier.
- **Edge and failure states are behaviours too**: empty results, no data, server
  error, network failure, retry recovery. Each deserves a named scenario.

## Review checklist

- [ ] Title follows `<actor> should <outcome> [when <context>]` and contains no
      technical terms.
- [ ] Every top-level step starts with Given / When / Then / And / But.
- [ ] No selectors, URLs, status codes, HTTP verbs, JSON, or field names in any title.
- [ ] No UI mechanics verbs (click, type, press, hover) unless the gesture is the feature.
- [ ] Given steps describe state; how it is set up is hidden in code.
- [ ] Exactly one behaviour is tested; the title has no "and".
- [ ] Assertions appear only in Then steps; actions only in Given/When steps.
- [ ] Step text and code agree — the Then step asserts exactly what it claims.
- [ ] Concrete values in titles are business values a stakeholder recognises.
- [ ] A product owner could read the scenario aloud and agree it is the rule.

## Common rewrites

| Imperative / technical                             | Declarative                                 |
| -------------------------------------------------- | ------------------------------------------- |
| Given I go to `/login` and enter user and password | Given the customer is signed in             |
| When I click `[data-testid=filter-county]` → Cork  | When the visitor filters by Cork            |
| Then the API returns 200 and 1 item                | Then only that gym is listed                |
| Given the mock returns `{ data: [] }`              | Given there are no gyms to show             |
| Then `.alert-error` is visible with text "500"     | Then a server error message is displayed    |
| When I click Retry button                          | When the visitor retries                    |
| Then the href equals `https://maps…?query=lat,lng` | Then the gym card links to its map location |
