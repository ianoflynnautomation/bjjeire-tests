---
emoji: 📋
name: spec-review
description: Evaluate a pull request against acceptance feature specs and Playwright rules
on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
    paths:
      - 'tests/**'
      - 'src/**'
      - 'specs/**'
      - '.specify/**'
permissions:
  contents: read
  pull-requests: read
  issues: read
  actions: read
engine: claude
strict: true
network:
  allowed: [defaults, github]
tools:
  github:
    mode: gh-proxy
    toolsets: [default]
safe-outputs:
  add-comment:
    max: 1
---

# Spec review (acceptance)

## Task

Review pull request ${{ github.event.pull_request.number }} against this
repository's acceptance specs.

Read:

1. `.specify/memory/constitution.md`
2. `.github/aw/instructions.md`
3. `.specify/rules/playwright-rules.md`
4. `specs/features/<feature>.md` for each touched feature
5. The corresponding spec files under `tests/features/<feature>/`

Use `gh` to read the PR diff.

## Required effects

Comment when:

- A test title does not use `Given …, when …, then …` domain language
- A new scenario is added in code but not listed in `specs/features/`
- A spec scenario is listed but has no matching test
- Search assertions omit `expectResultCount(1)` after a unique `searchFor`
- Partial names are derived with `name.slice` instead of `SEEDED_*_PARTIAL_NAME`
- `waitForTimeout` or a bare `page.goto` is introduced
- `route.fulfill` is used for a happy-path that should be seeded data
- Feature-flag API is asserted
- The change belongs in `bjjeire-java` (app bug) rather than this suite

## No-op

Call `noop` when the PR is a draft, lint-only, or the tests and
`specs/features/` already agree.

Do not approve. Do not edit files. Do not open PRs against the app repo.
