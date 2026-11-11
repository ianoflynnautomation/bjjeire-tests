# Spec templates

Copy a template, fill it, and delete the HTML comments. The agents in `.claude/agents/` read these files as they are. There is one filled block below. Do not copy a living feature spec as the pattern. Several of them predate this shape.

| Template                                         | Produces                                | Written by                              |
| ------------------------------------------------ | --------------------------------------- | --------------------------------------- |
| [`feature-spec.md`](feature-spec.md)             | `specs/features/<feature>.md`           | You, or `playwright-test-planner`       |
| [`exploration-report.md`](exploration-report.md) | `specs/exploration/<date>-<charter>.md` | `playwright-exploratory-tester`, or you |
| [`mutation-report.md`](mutation-report.md)       | `specs/mutation/<date>-<feature>.md`    | `playwright-mutation-auditor`           |

`exploration-report.md` is a symlink to the exploratory-testing skill, so there is one copy.

## The contract

A feature spec is the visitor-observable behaviour and the index of the tests that prove it.

- The numbered titles under `## Scenarios` are the Playwright `test()` titles. A title is listed only when its test exists, in that same change.
- A `####` block under `## Planned` with no numbered title is work not yet done. Keep the block after the test exists. The healer and the reviewer read it.
- `Covers:` is the GitLab requirement issue (`#142` in `bjjeire/requirements`), or `none` with the reason. The epic (`&<n>`) stays on the **Requirements** line. Never cite an epic, and never invent an id. CI for this repo stays on GitHub.
- `Oracle:` says where the expected value comes from, independently of the app. The seeded record, a rule in the app spec, or a fixed mock body. A calculation shared with the app is not an oracle. Events finding F1 is the case: a per-day price was multiplied by the number of days and still labelled per day, and a mapper that did the same multiplication would have passed.
- `Steps:` are Given, When and And. `Expected results:` are Then and And. Each line is one `test.step` and one assertion. Three to six steps.
- `Why:` is one sentence of visitor risk.
- `Test design:` is one line for the generator: layer, tags, data, mock, seed. An older block may say `Layer:` instead. Selectors and pixel tolerances stay there, or in the page object.

The issue numbers in the living specs are placeholders until those GitLab issues exist. Gyms are epic `&1`, issues `#1001`–`#1016`. Events are `&2`, `#2001`–`#2017`. Competitions are `&3`, `#3001`–`#3004`. Stores are `&4`, `#4001`–`#4004`. About, accessibility, authorization, layout, performance and support are epics `&5` to `&10` and have no issues yet. Replace a placeholder with the real issue id when the issue exists.

## A filled block

```markdown
#### visitor should find a gym by part of its name

- Covers: `#142`
- Oracle: the seeded gym's name. The search term is that gym's seeded partial name.
- Steps:
  1. When a visitor opens Gyms
  2. And the visitor searches for part of that gym's name
- Expected results:
  - Then only that gym is listed
- Why: a search that returns the wrong gym, or more than one, is invisible to the full-name scenario.

Test design: UI · @acceptance · `SEEDED_GYM_*_PARTIAL_NAME` · not mocked · default seed
```

## Lifecycle of a scenario

```text
exploration report (candidate)  ──┐
GitLab requirement issue        ──┼──▶  ## Planned block  ──▶  numbered title + test
risk the planner found          ──┘           │
                                              ├──▶  ## Held (product question open)
                                              └──▶  ## Rejected (with the reason)
```

- **Planned.** The block exists. The title is not in the numbered list. The planner writes this and stops.
- **Implemented.** The generator, the API tester, or you add the test and the numbered title together. The block stays.
- **Held.** A product decision is required. Name the question and the owner. Do not implement it.
- **Rejected.** Say why, so the next planner does not propose it again.

That is the life of one block. The full loop is the [diagram in the spec guide](../../docs/spec-guide.md#end-to-end).

## What `spec:check` fails on

`npm run spec:check` (lint-staged and CI) fails when:

- a numbered title and a `test()` title differ, a `*.spec.ts` has no spec, or `// spec:` names the wrong file
- a `####` block has no `Covers:` or `Oracle:`, or `Covers:` is not a GitLab issue id (`#142`) or `none`
- an expected result is a visitor action (`goes`, `searches`, `filters`, `chooses`, and the same class of verb)
- a block and a test both exist and their step titles differ

A numbered scenario with no block is grandfathered. 133 scenarios predate the convention. New scenarios get a block first. The reviewer rejects a changed test that has no block.

The reviewer, not the script, judges oracle quality, declarative wording, and whether the scenario sits at the cheapest layer.

## Rules that keep a spec honest

1. **Titles are the contract.** `<actor> should <outcome> [when <context>]`. The actor is `visitor` for UI and `client` for API. A data-driven title writes `<value>` in the spec for each `${}` in the test.
2. **Steps are declarative.** No selectors, test ids, URLs, status codes or field names. The `playwright-bdd` skill is the wording reference.
3. **Name the oracle.** "The seeded record and the spec's rule" is an oracle. A mapper that repeats the app's formula is not.
4. **The cheapest layer wins.** Validation, ordering, paging and filter correctness are API scenarios. The UI scenario proves the visitor sees the result once.
5. **Mock only what cannot be seeded.** Empty, error, multi-page and snapshot states. Say so on `Test design`.
6. **A finding is evidence, not a scenario.** Link it from `## Findings`. Do not encode a bug as the expected result.
7. **Rename or delete a test in the same change as its title.** If the test is `@squash`, the Squash skill says how to keep the case history.
