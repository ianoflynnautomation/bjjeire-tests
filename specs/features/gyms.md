# Acceptance spec: Gyms

**App spec**: `bjjeire-java/specs/features/gyms.md`
**Database**: `bjjeire-java/specs/database-contracts/gym.md`
**Slice**: `tests/features/gyms/` · `src/ui/pages/gyms/` · `src/api/features/gyms/`
**Seeded**: `tests/features/gyms/seeded.ts`

## Scenarios (must match test titles)

### UI

1. Given available gyms, when a visitor opens Gyms, then the gym list is displayed (`@smoke`)
2. Given no matching gym, when a visitor searches, then an empty state is displayed
3. Given a gym name, when a visitor searches, then only that gym is displayed
4. Given part of a gym name, when a visitor searches, then the matching gym is displayed
5. Given a gym card, when a visitor views it, then its website and map links point to the right destinations
6. Given gyms in several counties, when a visitor filters by county, then only gyms from that county are displayed
7. Given a county filter is applied, when the visitor resets it to all counties, then gyms from other counties can be found again
8. Given the API returns no gyms / request fails / server error / retry — matching empty and error states

### API

1. Given gyms are published, when a client opens the directory, then each published gym is returned with its details
2. Given gyms are published, when a client filters by county, then only gyms from that county are returned
3. Given gyms are published, when a client opens the directory, then they are ordered by name
4. Pagination slice + empty page-beyond-last
5. Given an unknown county, when a client filters by it, then the request is rejected as a bad request

## Constraints

- After `searchFor`, `expectResultCount(1)` — uniqueness, not merely visible.
- Partial name: `SEEDED_GYM_*_PARTIAL_NAME`, never `name.slice`.
- Maps link: `query=lat,lng` from GeoJSON `[lng, lat]`.
- Status on the wire is `GymStatus` PascalCase; badge copy must follow the
  mapper, not a lowercased guess.
