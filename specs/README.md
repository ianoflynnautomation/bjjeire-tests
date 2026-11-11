# Acceptance specifications

This repository proves the product from the outside. Product architecture and Mongo/OpenAPI contracts live in `bjjeire-java/specs/`. Files here are the visitor-observable behaviour and the mapping onto Playwright.

```
specs/
├── README.md
├── system-architecture.md   # how a scenario becomes a test, and how CI runs this suite
├── templates/               # copy these. The filled example is in templates/README.md
├── features/                # one living spec per area. The directory is the list
├── exploration/             # dated session reports. Evidence, not the spec
└── mutation/                # dated mutation audits. Evidence, not the spec
```

The feature specs are `about`, `accessibility`, `authorization`, `competitions`, `events`, `gyms`, `layout`, `performance`, `stores` and `support`.

Start with [`docs/spec-guide.md`](../docs/spec-guide.md). The end-to-end loop is the diagram there. The contract, the scenario lifecycle and a filled block are in [`templates/README.md`](templates/README.md). Copy [`templates/feature-spec.md`](templates/feature-spec.md) for a new feature. `npm run spec:check` is the drift check.

Principles: [`.specify/memory/constitution.md`](../.specify/memory/constitution.md). Agentic checks: `.github/workflows-aw/spec-review.md` and `playwright-fix.md`.
