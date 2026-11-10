# Spec guide for new joiners

How acceptance behaviour is specified, turned into tests, and kept honest in this
suite. Read this once; after that the templates and `npm run spec:check` carry you.

## What "spec-driven" means here

1. **The spec comes first.** Behaviour a visitor can observe is written down in
   `specs/features/<feature>.md` before (or with) the Playwright test. Product
   internals are not here; they live in `bjjeire-java/specs/`.
2. **The spec is the index of the tests.** The numbered titles in a feature spec are
   the test titles, character for character. If they differ, `npm run spec:check`
   fails, locally (lint-staged) and in CI.
3. **Agents read and write the same file.** The planner adds scenarios, the generator
   implements one, the reviewer checks the diff against it, the healer consults it
   before deciding whether the app or the test is wrong. Writing a good spec block
   is the highest-leverage thing you can do for them.

## The map

| Path                              | What it is                                                 |
| --------------------------------- | ---------------------------------------------------------- |
| `specs/features/<feature>.md`     | The living spec: scenarios, constraints, planned blocks    |
| `specs/templates/`                | Copy from here. Start with `feature-spec.example.md`       |
| `specs/exploration/`              | Dated exploratory session reports (evidence, not the spec) |
| `specs/mutation/`                 | Dated mutation audits: which wrong data the tests miss     |
| `bjjeire-java/specs/stc/<f>/`     | Acceptance criteria with IDs (`AC-GYM-003`) you cite       |
| `.specify/memory/constitution.md` | The principles; short, read it                             |
| `scripts/spec-check.mjs`          | The drift check behind `npm run spec:check`                |

## Anatomy of a feature spec

```
# Acceptance spec: <Feature>
**App spec** · **AC-IDs** · **Slice** · **Seeded** · **Status**   ← header
## Scenarios (must match test titles)
### UI   1. visitor should … (`@smoke`) · AC-XXX-001             ← the contract
### API  1. client should … · AC-XXX-004
## Constraints                                                     ← rules every test obeys
## Planned                                                         ← one #### block per scenario
#### visitor should …
- Layer · Tags · Data · Mocked
- Covers: AC-XXX-00n | none (<risk or report>)
- Oracle: where the expected value comes from
- Given/When/Then: …
- Why: …
## Held for a product decision · ## Rejected · ## Findings
```

The `**Slice**:` line is what `spec:check` uses to find the tests: the first backticked
`tests/...` path. Every `*.spec.ts` under `tests/` must be claimed by one spec.

## Adding a scenario by hand

1. Open the feature spec. Check `## Rejected` and `## Held` so you do not re-propose
   something already decided.
2. Find the acceptance criterion in `bjjeire-java/specs/stc/<feature>/spec.md`. If none
   fits, write `Covers: none` and name the risk or the exploration finding.
3. Write the `####` block under `## Planned`: layer, data, whether it mocks and why, the
   oracle, declarative Given/When/Then, and the one-line Why.
4. Write the test with the same title and the same step wording. Watch it fail first
   (against missing behaviour, a mutant with `PW_MUTANT=…`, or a deliberately broken
   assertion), then make it pass, then run it with `--repeat-each=5`.
5. Add the title to the numbered list, with its tags and AC-ID.
6. Run `npm run spec:check`, then ask `@agent-playwright-test-reviewer` to review the diff.

Or let the agents do steps 3 to 6: `/cover-feature <feature>` runs planner, generator or
API tester, and reviewer. You still read the plan before the generator runs.

## Writing a good block

- **Titles**: `<actor> should <outcome> [when <context>]`. `visitor` for UI, `client`
  for API. Snapshot and a11y tests name the component instead
  (`Gyms map popup should keep its accessible structure`).
- **Steps** are what a product owner would say: no selectors, test ids, URLs, status
  codes or field names. The `playwright-bdd` skill has the wording rules.
- **Data** is a seeded record from `tests/features/<feature>/seeded.ts`. Mock only
  empty, error, multi-page and snapshot states, and say so.
- **Oracle**: the seeded record, the app spec's rule, or the mock body. If you catch
  yourself computing the expected value the way the app does, stop: that test passes
  with the app's bug (events finding F1 is the cautionary tale).
- **Placeholders**: a data-driven test writes `${label}` in code and `<label>` in the
  spec, one placeholder per `${}`:
  `client should get a bad request for <param> "<value>"`.
- **Why** names the risk and why no existing test catches it. "Untested" is not a
  reason; "a swapped URL passes every current test" is.

## Keeping it honest

- **Rename a test, rename the title**, in the same commit. `spec:check` blocks the
  commit otherwise. If the test was `@squash`, the Squash skill explains how to keep
  its case history.
- **Delete a test, delete its title.** Move it to `## Rejected` with the reason if the
  behaviour is now owned elsewhere.
- **A bug is a finding, not a scenario.** Link it from `## Findings` with a status.
  Never loosen an assertion to go green; if the test is right and the app is wrong,
  the test stays red and the finding goes to the app repo.
- **Quarantine is a human decision.** Agents and hooks refuse to add `@quarantine`.
- **Measure the suite** now and then: `npm run mutation:audit -- --feature <f>` and
  the auditor agent tell you which card fields nobody asserts.

## Reading the evidence folders

- `specs/exploration/<date>-<charter>.md`: a chartered bug hunt. Findings are
  reproduced twice from a fresh load; candidate scenarios at the end are proposals
  until the planner accepts them into the feature spec.
- `specs/mutation/<date>-<feature>.md`: each surviving mutant is a gap, owned by the
  API, equivalent (never shown) or out of contract. "Tests that do not prove their
  title" is the section to read first.

## Commands

```sh
npm run spec:check                      # every spec against its slice
npm run spec:check -- --feature gyms    # one feature
/cover-feature gyms                     # plan → generate → review with the agents
npm run mutation:audit -- --feature gyms
```

Related: [`AGENTS.md`](../AGENTS.md) (conventions), [`docs/agents.md`](agents.md)
(running the agents), [`specs/templates/README.md`](../specs/templates/README.md)
(scenario lifecycle), the `suite-conventions` and `playwright-spec-practices` skills.

## How this maps to Playwright's test agents

The planner, generator and healer started from Playwright's own agents
(`npx playwright init-agents --loop=claude`; see
[playwright.dev/docs/test-agents](https://playwright.dev/docs/test-agents)). The plan
shape is theirs; the wording and the guardrails are this suite's.

| Playwright recommends                                                           | Here                                                                                                                       |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| A Markdown plan per area with an application overview                           | The living spec `specs/features/<feature>.md`; the overview is the paragraph under the header                              |
| Per scenario: **Seed**, numbered **Steps**, bulleted **Expected Results**       | Per `####` block: `Seed:` (default `tests/agents/seed.spec.ts`), `Steps:` (Given/When/And), `Expected results:` (Then/And) |
| A seed test that runs the project's fixtures so agents start in the right state | `tests/agents/seed.spec.ts` on project `agent-seed`: signed in, flags pinned on, shell mounted                             |
| Generated tests begin with `// spec:` and `// seed:` comments                   | Every `*.spec.ts` starts with them; `npm run spec:check` fails if the `// spec:` line names the wrong spec                 |
| One comment per plan step, one `expect` per expected result                     | One `test.step` per step (its title is the step), one assertion per expected result inside the Then step                   |
| Imperative steps ("click the input, type, press Enter")                         | Declarative steps ("the visitor searches for a gym"): a product owner reads them, and Squash publishes them                |
| Role and text locators                                                          | The same, scoped to a section or card, held by the page object (the `selectors` skill)                                     |
| The healer may skip a test it believes is broken functionality                  | Never. The healer reports an app bug and leaves the test red; quarantine is a human decision                               |
| Regenerate the agent definitions whenever Playwright is updated                 | Compare, do not overwrite: `docs/agents.md`, "Updating the agents"                                                         |

The two deliberate deviations are the declarative wording and the no-skip rule. Both
exist so that a spec stays readable by someone who never opens the code, and so that a
green run never hides a broken product.
