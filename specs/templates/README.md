# Spec templates

Copy a template, fill it, delete the guidance lines in `<angle brackets>`. Each
template matches what the agents in `.claude/agents/` read and write, so a file
made from one is usable by the planner, generator, reviewer and the `spec-review`
workflow without translation.

| Template                                             | Produces                                    | Written by                              |
| ---------------------------------------------------- | ------------------------------------------- | --------------------------------------- |
| [`feature-spec.md`](feature-spec.md)                 | `specs/features/<feature>.md`               | You, or `playwright-test-planner`       |
| [`feature-spec.example.md`](feature-spec.example.md) | A filled example (Stores, real seeded data) | Read it before your first spec          |
| [`exploration-report.md`](exploration-report.md)     | `specs/exploration/<date>-<charter>.md`     | `playwright-exploratory-tester`, or you |
| [`mutation-report.md`](mutation-report.md)           | `specs/mutation/<date>-<feature>.md`        | `playwright-mutation-auditor`           |

`exploration-report.md` is a symlink to the exploratory-testing skill's own
template, so there is one copy to maintain.

## The contract in one paragraph

A feature spec is the **visitor-observable contract** and the **index of the tests
that prove it**. Its numbered scenario titles are the Playwright test titles,
character for character. A title appears in the numbered list only when its test
exists; a `####` block under `## Planned` with no numbered entry is work not yet
done. Each scenario names the acceptance criterion it covers (`Covers: AC-…` from
`bjjeire-java/specs/stc/<feature>/spec.md`), the data it uses, whether it mocks,
and the **oracle**: where the expected value comes from, independently of the app.
Its block follows the shape of a Playwright test-agent plan
([playwright.dev/docs/test-agents](https://playwright.dev/docs/test-agents)): a seed,
numbered **Steps** and bulleted **Expected results**, each expected result being one
assertion. Every test file points back with a `// spec: specs/features/<feature>.md`
first line, which `npm run spec:check` verifies.

## Lifecycle of a scenario

```
exploration report (candidate)  ──┐
product spec AC-ID              ──┼──▶  ## Planned block  ──▶  numbered title + test
risk the planner found          ──┘           │
                                              ├──▶  ## Held (product question open)
                                              └──▶  ## Rejected (with the reason)
```

- **Planned**: the block exists, the title is not yet in the numbered list.
- **Implemented**: the title is in the numbered list. Keep the block; it is the
  design note the healer and reviewer read.
- **Held**: a product decision is needed first. Say what the question is and who
  owns it. Never implement a held scenario.
- **Rejected**: say why, so the next planner does not propose it again.

## Rules that keep a spec honest

1. **Titles are the contract.** `<actor> should <outcome> [when <context>]`, actor
   `visitor` (UI) or `client` (API). Data-driven tests write the varying part as
   `<value>` in the spec (`for a non-numeric page size "<value>"`).
2. **Steps are declarative.** No selectors, test ids, URLs, status codes or field
   names. The `playwright-bdd` skill has the wording rules.
3. **Name the oracle.** A test is only as strong as where its expected value comes
   from. "Seeded record + the spec's rule" is an oracle. A mapper that re-implements
   the app's own formula is not (see finding F1 in `specs/features/events.md`: the
   test and the app shared the same wrong multiplication).
4. **Cheapest layer wins.** Validation, ordering, paging and filter correctness are
   API scenarios. The UI scenario proves the visitor sees the result once.
5. **Mock only what cannot be seeded**: empty, error, multi-page and snapshot states.
   Say `Mocked: yes (<why>)` on the block.
6. **Findings are evidence, not scenarios.** App bugs go to the exploration report
   or the app repo issue, with a link from the spec's `## Findings` list. Do not
   encode a bug as expected behaviour.
7. **Reconcile when tests change.** A renamed, added or deleted test changes the
   numbered list in the same commit. `npm run spec:check` (lint-staged and CI) fails on any difference; the reviewer agent and `spec-review` judge the rest.
