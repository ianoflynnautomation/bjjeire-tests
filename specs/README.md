# Acceptance specifications

This repository proves the product from the outside. Product architecture and
Mongo/OpenAPI contracts live in **`bjjeire-java/specs/`**. Files here are the
visitor-observable contract and the mapping onto Playwright.

```
specs/
├── README.md
├── system-architecture.md    # how this suite attaches to the app
└── features/                 # Given/When/Then owned by this repo
    ├── gyms.md
    ├── events.md
    ├── competitions.md
    └── stores.md
```

Process: `.specify/` (constitution, Playwright rules, templates).
Agentic checks: `.github/workflows-aw/spec-review.md` and `playwright-fix.md`.

Healing engine: `/Users/ianoflynn/Sources/atest` (`@aplaytest/*`). See
`atest/docs/11-adoption-bjjeire.md` and `14-bjjeire-ci-integration.md`.
Do not run `aplaytest ci generate` as a drop-in — this suite is invoked from
`bjjeire-java` via `bjjeire-ci-templates`.
