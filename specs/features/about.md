# Acceptance spec: About

**Slice**: `tests/features/about/` · `src/ui/pages/about/`
**Agent seed**: `tests/agents/seed.spec.ts` (project `agent-seed`: signed in, flags pinned on, shell mounted)
**Seeded**: none (static page)
**Status**: living · **Reconciled with tests**: 2026-11-10

The About page is the static landing and fallback page: the root URL and any unknown URL
resolve to it (see `specs/features/layout.md` 5–6), and a feature whose flag is off
redirects to it.

## Scenarios (must match test titles)

### UI

1. visitor should see the About page when opening it (`@smoke`) · none
2. About page should match the approved image (`@smoke`, `@quarantine`) · none (visual baseline)
3. About page sections should keep their accessible structure · none (aria baseline)

Scenarios 2–3 are in `about.snapshot.acceptance.spec.ts`. Scenario 2 is quarantined: `@quarantine` is excluded from every run. Fix or delete it;
the list must not grow.

## Constraints

- The screenshot baseline is per platform (`-darwin.png` and `-linux.png`); regenerate
  both with `/update-snapshots`.

## Planned

None.
