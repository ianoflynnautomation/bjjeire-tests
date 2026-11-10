# Acceptance spec: Support modal

**Slice**: `tests/features/support/` · `src/ui/pages/support/` (`bitcoin-support.modal.ts`, a section on the core fixtures)
**Agent seed**: `tests/agents/seed.spec.ts` (project `agent-seed`: signed in, flags pinned on, shell mounted)
**Seeded**: none
**Status**: living · **Reconciled with tests**: 2026-11-10

The support option in the shell opens a modal with a bitcoin address. It is part of the
shell, so its page object is a cross-cutting section on `@ui/fixtures`, not a feature
slice; the specs live under `tests/features/support/` for the Squash folder mapping.

## Scenarios (must match test titles)

### UI

1. visitor should see the bitcoin support modal after selecting the support option · none
2. visitor should be able to close the support modal · none
3. visitor should be able to dismiss the support modal with Escape · none
4. bitcoin support modal should keep its accessible structure · none (aria baseline)

Scenarios 1–3 are in `support.ui.acceptance.spec.ts`; 4 in `support.snapshot.acceptance.spec.ts`.

## Constraints

- Navigate with `gotoAppShell`; the modal needs no feature route.
- Oracle for the modal's copy and address: the constants beside the modal page object,
  which mirror the app's.

## Planned

None.
