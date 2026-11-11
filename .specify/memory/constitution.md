# BjjEire Tests Constitution

Principles for every acceptance spec, page object, and agent run in this
repository. Product architecture and database contracts live in `bjjeire-java`;
this constitution governs how those contracts are proven from the outside.

## Core Principles

### I. Acceptance-level only

This suite proves observable product behaviour against a running app. Unit,
integration, Pact, and OpenAPI tests live in `bjjeire-java`. Do not duplicate
them here. Do not assert DTO field names, CSS selectors, or HTTP status
integers as the story — assert the business outcome. Each rule has one owning
layer; a UI scenario does not re-prove a rule an API scenario owns.

### II. Spec is the oracle; seeded data is the fixture

Feature behaviour is specified in `specs/features/` here and in
`bjjeire-java/specs/`. The numbered titles in a feature spec **are** the test
titles, and `npm run spec:check` fails when they differ. Every scenario names
the requirement it covers (`Covers:`): the GitLab requirement issue (`#142`
in `bjjeire/requirements`), or `none` with the reason. The epic stays on the
spec's **Requirements** line. It also names
its oracle: the seeded record, the app spec's
rule, or a fixed mock body. An expected value that re-implements the app's own
calculation is not an oracle. Tests consume the seeded DTOs in
`tests/features/<feature>/seeded.ts`. Partial search terms live next to those
DTOs (`SEEDED_*_PARTIAL_NAME`), never `name.slice(...)` in a spec. Environments
hold full datasets — search or filter before asserting a specific card.

### III. Web-first assertions (NON-NEGOTIABLE)

Playwright web-first assertions only. `waitForTimeout()` is a lint error.
Never open an app route with a bare `page.goto` — use `gotoRoute` /
`gotoAppShell` from `@ui/support` so the feature-flag fetch and route chunk
settle. Feature flags are pinned on via the auto fixture; never assert the
flag API. Rules a machine can check are enforced by lint, hooks and
`spec:check`, not by prose.

### IV. Feature-slice layout

A feature is three directories and does not import another feature.

```
tests/features/<feature>/     # specs, fixtures.ts, seeded.ts, mocks.ts, testdata/
src/ui/pages/<feature>/       # page object; list pages extend ListPage
src/api/features/<feature>/   # <feature>.service.ts, <feature>.types.ts, <feature>.schemas.ts
```

Page objects are classes taking `page` in the constructor. No page singletons, no
state beyond `page`.
`route.fulfill()` only for empty, error, multi-page and snapshot cases,
and every mocked body is parsed with the feature Zod page schema.

### V. Healing may patch tests, never the product

The `playwright-fix` agentic workflow and the atest heal engine may propose
locator, wait, and assertion repairs in this repository. They must not open
PRs against `bjjeire-java`. If evidence says the app is wrong, file a finding
and stop. Flake analysis is advisory (ADR-0005 in the app repo) — do not
gate delivery on an atest score.

### VI. Evidence is kept, and it is not the spec

Exploration reports (`specs/exploration/`) and mutation audits
(`specs/mutation/`) are evidence: dated, reproducible, never edited to fit a
later result. A candidate scenario from a report enters `specs/features/` only
when the planner or a human accepts it. A finding is linked from the feature
spec with a status; it is never encoded as expected behaviour. A test that an
agent wrote must have been seen to fail (missing behaviour, mutant, or broken
assertion) before its pass is trusted, and is reviewed by a different context
than the one that wrote it.

## Additional Constraints

- Every test carries `@acceptance`. `@smoke` is the critical subset on top.
- `@quarantine` is excluded from every run; fix or delete promptly. Quarantine
  is a human decision; no agent adds it.
- Chromium desktop is the system of record. Firefox, WebKit, and light
  Chromium pay the `@smoke` tax only.
- Screenshot baselines are per-platform (`-darwin.png` + `-linux.png`).
- Never run against production. Staging only as an explicit task.
- Never commit or push from an agent session; leave changes in the working tree
  unless a gh-aw safe-output `create-pull-request` is the configured write path.
- New specs start from `specs/templates/`; new slices from `/add-feature`.

## Governance

This constitution supersedes local convenience for tests. Agentic reviews
(`spec-review`, `playwright-fix`) must check it. Amendments land in the same
PR as the convention change, and `AGENTS.md` is updated in that PR.

**Version**: 1.2.1 | **Ratified**: 2026-09-18 | **Last Amended**: 2026-11-11

Amendment 1.2.1 (2026-11-11): II names the GitLab requirement issue as `Covers`. The epic stays on the spec's Requirements line. Requirement ids in the living specs are placeholders until the GitLab issues exist.

Amendment 1.2.0 (2026-11-10): IV names the real slice. Specs, fixtures,
seeded data and mocks live together under `tests/features/<feature>/`.
The API file is `<feature>.service.ts`.

Amendment 1.1.0 (2026-11-10): II gains the title contract, `spec:check`,
`Covers` and the oracle rule; III names tooling over prose; VI (evidence,
agent-authored tests) added; templates moved to `specs/templates/`.
