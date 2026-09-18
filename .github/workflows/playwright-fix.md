---
emoji: 🩹
name: playwright-fix
description: Propose a test-only fix from Playwright / atest evidence
on:
  workflow_dispatch:
    inputs:
      run_id:
        description: GitHub Actions run ID of the failed Playwright job (usually bjjeire-java CI)
        required: false
      artifact_name:
        description: Artifact name that contains results.json or atest evidence
        required: false
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
  create-pull-request:
    title-prefix: 'fix(test): '
    labels: [playwright-heal]
    allowed-files:
      - 'tests/**'
      - 'src/ui/**'
      - 'src/api/**'
      - 'specs/features/**'
  add-comment:
    max: 1
---

# Playwright fix (atest-backed)

## Task

Repair **this repository's tests** from evidence. Do not change the product.

Read:

1. `.specify/memory/constitution.md`
2. `.specify/rules/playwright-rules.md`
3. `.github/aw/instructions.md`
4. `specs/features/` for the failing feature
5. `specs/system-architecture.md` (CI attachment / atest notes)

Dispatch inputs:

- run id: `${{ github.event.inputs.run_id }}`
- artifact: `${{ github.event.inputs.artifact_name }}`

If a run id is present, use `gh` to inspect that workflow run and download
available artifacts (`results.json`, blob report, `.atest/evidence` if
uploaded). If atest CLI is not installed in the job, reason from the JSON
report and any evidence files already on disk.

Preferred evidence, in order:

1. atest evidence bundle (ARIA snapshot, network ledger, page-object intent)
2. Playwright JSON report (`results.json`) — same adapter path as
   `aplaytest history ingest --playwright-json`
3. HTML report / error-context.md under `test-results/`

atest lives at `/Users/ianoflynn/Sources/atest` locally and publishes
`@aplaytest/*`. Do not vendor it. Do not run `aplaytest ci generate`.
Do not re-run the full Playwright suite in this job.

## Allowed repairs

- Locator that drifted (`data-testid`, role, page-object method)
- Missing `gotoRoute` / web-first assertion instead of a timeout
- Test title / spec mapping only if the scenario was already specified
- Page-object helper that still asserts the same business outcome

## Forbidden

- Weakening an assertion to match an application bug
- Adding `@quarantine`
- Regenerating screenshot baselines unless the dispatch text explicitly says
  the change is visual and both darwin and linux will be updated
- Editing anything outside `allowed-files`
- Opening a PR against `bjjeire-java`
- Introducing `waitForTimeout`

## Required effects

- If the evidence supports a **test** defect: `create-pull-request` with a
  focused patch and a body that cites the failing title, project, and evidence.
- If the evidence supports an **application** defect: `add-comment` (or PR
  body on this run's summary) describing the app finding; do **not** patch tests.
- If artifacts are missing: `noop` explaining what the caller must upload
  (`results.json` and/or `.atest/evidence` via `extra-output-paths` in the
  templates — not yet present; JSON ingest is the current seam).

## No-op

Call `noop` when there is no failure, the only failures are classified infra,
or the repair would be speculative.

Do not approve or merge.
