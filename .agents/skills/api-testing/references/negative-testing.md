# Negative testing — query parameters and path ids

Long-form loops for `api-testing/SKILL.md` Phase 6. The critical rules, the constant table, and the three-tier rule stay in `SKILL.md`. This file is the gyms directory, which the other listings follow.

Successful calls go through the feature client. These loops use `request.get` because `get()` throws on a non-OK status. `expectProblem` checks the status, the RFC 9457 body, and the problem `type`.

Import the sets from `tests/features/common/testdata/invalid-values.ts`. Do not paste them into the spec.

Which parameters each listing rejects:

| Listing      | Malformed params                                         | Path id                                                |
| ------------ | -------------------------------------------------------- | ------------------------------------------------------ |
| Gyms         | `county`, `page`, `pageSize`                             | `INVALID_OBJECT_ID_VALUES` and `UNPUBLISHED_OBJECT_ID` |
| Events       | `county`, `types`, `includeInactive`, `page`, `pageSize` | same as gyms                                           |
| Competitions | `includeInactive`, `page`, `pageSize`                    | no `{id}` route                                        |
| Stores       | `page`, `pageSize`                                       | no `{id}` route                                        |

`includeInactive` uses `INVALID_BOOLEAN_QUERY_VALUES`. `county` and event `types` use `INVALID_ENUM_QUERY_VALUES`. `page` and `pageSize` use `INVALID_INTEGER_QUERY_VALUES` for a bad token and `OUT_OF_RANGE_PAGING_VALUES` for bounds.

Spring accepts `true`, `false`, `on`, `off`, `yes`, `no`, `1`, and `0` as booleans. Those values do not belong in `INVALID_BOOLEAN_QUERY_VALUES`.

## Malformed query

The gyms loop is Phase 6 of `SKILL.md` (`county`, `page`, `pageSize`). Events uses the same `for` body against `API_ROUTES.bjjEvents` and spreads two more rows. Competitions uses `API_ROUTES.competitions` and spreads `includeInactive` plus the two integer rows.

```typescript
const malformed = [
  ...INVALID_ENUM_QUERY_VALUES.map(value => ({ param: 'county', label: 'an unknown county', value })),
  ...INVALID_ENUM_QUERY_VALUES.map(value => ({ param: 'types', label: 'an unknown event type', value })),
  ...INVALID_BOOLEAN_QUERY_VALUES.map(value => ({ param: 'includeInactive', label: 'a non-boolean flag', value })),
  ...INVALID_INTEGER_QUERY_VALUES.map(value => ({ param: 'page', label: 'a non-numeric page', value })),
  ...INVALID_INTEGER_QUERY_VALUES.map(value => ({ param: 'pageSize', label: 'a non-numeric page size', value })),
];
```

## Paging bounds

Same describe. The `field` on the problem is `Page` or `PageSize`, from the constant, not the query name.

```typescript
for (const { param, field, value } of OUT_OF_RANGE_PAGING_VALUES) {
  test(
    `client should get a validation error on ${param} when ${param} ${value} is out of range`,
    { tag: '@acceptance' },
    async ({ request }) => {
      const response = await request.get(API_ROUTES.gyms, { params: { [param]: value } });

      const problem = await expectProblem(response, 400, ProblemType.Validation);
      expect(problem.errors).toContainEqual(
        expect.objectContaining({ field, errorCode: ValidationErrorCode.ValueOutOfRange }),
      );
    },
  );
}
```

## Path id

Gyms and events only. `resourcePath` encodes the id so a fuzzed value stays one segment. A malformed id fails validation. A well-formed id that no environment seeds is the not-found case. Do not expect `404` for `not-an-id` or `true`.

```typescript
test.describe('Gym details', () => {
  test('client should get not found for a gym id that does not exist', { tag: '@acceptance' }, async ({ request }) => {
    const response = await request.get(resourcePath(API_ROUTES.gyms, UNPUBLISHED_OBJECT_ID));

    await expectProblem(response, 404, ProblemType.NotFound);
  });

  for (const { description, value } of INVALID_OBJECT_ID_VALUES) {
    test(
      `client should get a validation error on the id for a gym id that is ${description}`,
      { tag: '@acceptance' },
      async ({ request }) => {
        const response = await request.get(resourcePath(API_ROUTES.gyms, value));

        const problem = await expectProblem(response, 400, ProblemType.Validation);
        expect(problem.errors).toContainEqual(
          expect.objectContaining({ field: 'Id', errorCode: ValidationErrorCode.InvalidFormat }),
        );
      },
    );
  }
});
```

The matching success call is `getGymById(request, gymSchema, SEEDED_GYM_BLACKWATER_VALLEY_ID)` and `expect(gym).toMatchObject(SEEDED_GYM_BLACKWATER_VALLEY)`. Events uses `getBjjEventById` and `SEEDED_EVENT_LEINSTER_OPEN_MAT_ID`.

A new set follows the three-tier rule in Phase 6 of `SKILL.md`. Paging bounds were inline until every listing used them, then they moved to `OUT_OF_RANGE_PAGING_VALUES`.
