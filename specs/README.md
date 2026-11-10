# Acceptance specifications

This repository proves the product from the outside. Product architecture and
Mongo/OpenAPI contracts live in **`bjjeire-java/specs/`**. Files here are the
visitor-observable contract and the mapping onto Playwright.

```
specs/
├── README.md
├── system-architecture.md    # how this suite attaches to the app
├── templates/                # copy these: feature spec (+ filled example), exploration and mutation reports
├── features/                 # scenarios owned by this repo (= test titles)
│   ├── gyms.md
│   ├── events.md
│   ├── competitions.md
│   ├── stores.md
│   └── performance.md        # boot budgets per route (opt-in perf project)
├── exploration/              # exploratory session reports (evidence, not the spec)
└── mutation/                 # mutation audits: which wrong data the UI specs miss
```

New here? Read [`docs/spec-guide.md`](../docs/spec-guide.md). Start a new feature spec
from [`templates/feature-spec.md`](templates/feature-spec.md);
[`templates/README.md`](templates/README.md) has the scenario lifecycle and the rules
that keep a spec honest. `npm run spec:check` proves every spec's numbered titles match
its tests and that every spec file under `tests/` is claimed by a spec. Cross-cutting
suites have their own specs here too: `layout.md`, `accessibility.md`, `about.md`,
`support.md`, `authorization.md`, `performance.md`.

Process: `.specify/` (constitution). Templates live here, not in `.specify/templates/`.
Agentic checks: `.github/workflows-aw/spec-review.md` and `playwright-fix.md`.

Healing engine: the `atest` repo, published as `@aplaytest/*`. See its
`docs/11-adoption-bjjeire.md` and `docs/14-bjjeire-ci-integration.md`.
Do not run `aplaytest ci generate` as a drop-in — this suite is invoked from
`bjjeire-java` via `bjjeire-ci-templates`.
