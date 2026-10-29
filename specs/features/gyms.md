# Acceptance spec: Gyms

**App spec**: `bjjeire-java/specs/features/gyms.md`
**Database**: `bjjeire-java/specs/database-contracts/gym.md`
**Slice**: `tests/features/gyms/` · `src/ui/pages/gyms/` · `src/api/features/gyms/`
**Seeded**: `tests/features/gyms/seeded.ts`

## Scenarios (must match test titles)

### UI

1. visitor should see the gym list when opening Gyms (`@smoke`)
2. visitor should see an empty state when no gym matches the search
3. visitor should find only the gym searched for by name
4. visitor should find a gym by part of its name
5. visitor should reach a gym's website and map location from its card
6. visitor should see only gyms from the chosen county when filtering by county
7. visitor should find gyms from other counties again after resetting the county filter
8. visitor should see the no-data message when there are no gyms to show
9. visitor should see a network error message when gyms cannot be loaded because the connection fails
10. visitor should see a server error message when gyms cannot be loaded because of a server problem
11. visitor should see the gym list after retrying when gyms failed to load

### API

1. client should receive each published gym with its details
2. client should receive only gyms from the chosen county when filtering by county
3. client should receive gyms ordered by name
4. client should page through the directory in distinct slices with correct links; client should receive an empty page with valid pagination for a page beyond the last
5. client should get a bad request for an unknown county "<value>"
6. client should get a bad request for a non-numeric page / page size "<value>"
7. client should get a validation error on page / pageSize when `<value>` is out of range
8. client should receive the details of a published gym by id
9. client should get not found for a gym id that does not exist
10. client should get a validation error on the id for a gym id that is `<malformed>`

Scenarios 5–7 and 10 are data-driven over `tests/features/common/testdata/invalid-values.ts`.
Errors are asserted as RFC 9457 problem documents (`expectProblem`): status, `type`, and
for validation failures the offending `field` + `errorCode`.

## Constraints

- After `searchFor`, `expectResultCount(1)` — uniqueness, not merely visible.
- Partial name: `SEEDED_GYM_*_PARTIAL_NAME`, never `name.slice`.
- Maps link: `query=lat,lng` from GeoJSON `[lng, lat]`.
- Status on the wire is `GymStatus` PascalCase; badge copy must follow the
  mapper, not a lowercased guess.
