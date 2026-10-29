# test.step and single-value validation

Forbidden shapes for `api-testing/SKILL.md` Phase 4 and Phase 6. The required pagination test is in Phase 4 of `SKILL.md`. The required loops are in `references/negative-testing.md`.

## Phase 4 — calls and assertions outside Given/When/Then steps

```typescript
// Forbidden: two directory reads in one body. The report shows one step, so a failure on page 2 looks like a failure of the whole test.
test(
  'client should page through the directory in distinct slices with correct links',
  { tag: '@acceptance' },
  async ({ request }) => {
    const firstPage = await getGyms(request, gymsPageSchema, { page: 1, pageSize: SMALL_PAGE_SIZE });
    const secondPage = await getGyms(request, gymsPageSchema, { page: 2, pageSize: SMALL_PAGE_SIZE });

    expectConsecutivePagePagination(firstPage, secondPage, SMALL_PAGE_SIZE);
    expectPagesAreDistinct(firstPage, secondPage, gym => gym.id);
  },
);
```

Wrap the first `getGyms` call in `test.step('When a client requests page 1 of the directory', ...)`, the second in an `And` step, and the two assertions in one `Then` step. The events type filter does the same per loop iteration: a `When a client requests the event listing filtered by ${type}` step, then its `Then` step.

A test that calls the API once, such as the gyms smoke read, still has a `When` step for the call and a `Then` step for the assertions, so its Squash case gets a full scenario.

## Phase 6 — one invalid value standing in for the parameter

```typescript
// Forbidden: a single bad page does not cover county, pageSize, or the paging bounds.
test('client should get a bad request for a non-numeric page', { tag: '@acceptance' }, async ({ request }) => {
  const response = await request.get(API_ROUTES.gyms, { params: { page: 'abc' } });

  await expectProblem(response, 400, ProblemType.BadRequest);
});
```

Build the `malformed` array from `INVALID_ENUM_QUERY_VALUES` and `INVALID_INTEGER_QUERY_VALUES`, and loop `OUT_OF_RANGE_PAGING_VALUES` beside it. Gyms, events, competitions, and stores each list only the parameters that route accepts. A gym or event id uses `INVALID_OBJECT_ID_VALUES`, not this query loop.
