# test.step and single-value validation

Forbidden shapes for `api-testing/SKILL.md` Phase 4 and Phase 6. The required pagination test is in Phase 4 of `SKILL.md`. The required loops are in `references/negative-testing.md`.

## Phase 4 — more than one call, no step

```typescript
// Forbidden: two directory reads in one body. The report shows one step, so a failure on page 2 looks like a failure of the whole test.
test(
  'Given the directory spans more than one page, when a client pages through it, then each page is a distinct slice with correct links',
  { tag: '@acceptance' },
  async ({ request }) => {
    const firstPage = await getGyms(request, gymsPageSchema, { page: 1, pageSize: SMALL_PAGE_SIZE });
    const secondPage = await getGyms(request, gymsPageSchema, { page: 2, pageSize: SMALL_PAGE_SIZE });

    expectConsecutivePagePagination(firstPage, secondPage, SMALL_PAGE_SIZE);
    expectPagesAreDistinct(firstPage, secondPage, gym => gym.id);
  },
);
```

Wrap each `getGyms` call in `test.step('Request page N of the directory', ...)`. The events type filter does the same: the `for` loop over `SEEDED_EVENT_ATLANTIC_COAST_CAMP.types` puts each `getBjjEvents` inside `test.step(\`Filter the listing by ${type}\`, ...)`.

A test that calls the API once, such as the gyms smoke read, leaves the call in the test body.

## Phase 6 — one invalid value standing in for the parameter

```typescript
// Forbidden: a single bad page does not cover county, pageSize, or the paging bounds.
test(
  'Given a non-numeric page, when a client opens the directory, then the request is rejected as a bad request',
  { tag: '@acceptance' },
  async ({ request }) => {
    const response = await request.get(API_ROUTES.gyms, { params: { page: 'abc' } });

    await expectProblem(response, 400, ProblemType.BadRequest);
  },
);
```

Build the `malformed` array from `INVALID_ENUM_QUERY_VALUES` and `INVALID_INTEGER_QUERY_VALUES`, and loop `OUT_OF_RANGE_PAGING_VALUES` beside it. Gyms, events, competitions, and stores each list only the parameters that route accepts. A gym or event id uses `INVALID_OBJECT_ID_VALUES`, not this query loop.
