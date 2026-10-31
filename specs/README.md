# Acceptance specifications

This repository proves the product from the outside. Product architecture and
Mongo/OpenAPI contracts live in **`bjjeire-java/specs/`**. Files here are the
visitor-observable contract and the mapping onto Playwright.

```
specs/
├── README.md
├── system-architecture.md    # how this suite attaches to the app
├── features/                 # scenarios owned by this repo (= test titles)
│   ├── gyms.md
│   ├── events.md
│   ├── competitions.md
│   └── stores.md
├── exploration/              # exploratory session reports (evidence, not the spec)
└── mutation/                 # mutation audits: which wrong data the UI specs miss
```

Process: `.specify/` (constitution, Playwright rules, templates).
Agentic checks: `.github/workflows-aw/spec-review.md` and `playwright-fix.md`.

Healing engine: the `atest` repo, published as `@aplaytest/*`. See its
`docs/11-adoption-bjjeire.md` and `docs/14-bjjeire-ci-integration.md`.
Do not run `aplaytest ci generate` as a drop-in — this suite is invoked from
`bjjeire-java` via `bjjeire-ci-templates`.
