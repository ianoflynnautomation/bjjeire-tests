# Acceptance spec: API authorization

**Requirements**: `bjjeire/requirements` · epic `&7`
**Slice**: `tests/api/` (`authorization.api.acceptance.spec.ts`)
**Agent seed**: none (API; no browser)
**Support**: `requestAuth` option on `@api/fixtures`; `env.apiAuth.required` in `src/shared/config`
**Status**: living · **Reconciled with tests**: 2026-11-10

Protected environments (dev, staging) require an Entra bearer on every API call. Local
and Docker targets do not enforce it, so this spec gates itself on the environment: it
is the one place a conditional `test.skip` is allowed.

## Scenarios (must match test titles)

### API

1. client should be rejected when calling a protected environment without a bearer token · none

## Constraints

- `test.use({ requestAuth: 'none' })` withholds the bearer; Cloudflare Access headers
  still apply (they clear the edge, not the API).
- Skipped with `test.skip(!env.apiAuth.required, …)` where auth is not enforced.
- Writes (POST/PUT/DELETE) are not tested here: the API is read-only for this suite and
  the app repo owns write authorization (`#1006`, `#2006`).

## Planned

None.
