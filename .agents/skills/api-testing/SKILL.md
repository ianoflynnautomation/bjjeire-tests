---
name: api-testing
description: API acceptance patterns for this suite. Playwright `request` fixture, feature clients (`getGyms`, `getBjjEvents`, `getStores`, `getCompetitions`), generated OpenAPI Zod checked with `expectSchema`, RFC 9457 errors checked with `expectProblem`, `test.step` for multi-call tests, and data-driven query and path validation. Use when writing or updating `*.api.acceptance.spec.ts`, a feature service, or a schema re-export, or when a response disagrees with the OpenAPI contract. Do not use for UI selectors or page objects.
author: Ian O Flynn
---

# API Testing

Acceptance specs for the read-only directory API (gyms, events, competitions, stores). Phases stay in this order. The call path is Playwright's `request` fixture passed into a feature client.

## Critical

- **NEVER** hardcode a base URL, bearer token, or endpoint path. `baseURL` is the api project's `env.apiUrl` (`src/api/config/playwright.ts`). Paths come from `API_ROUTES` and `resourcePath` (`src/api/support/routes.ts`). The bearer is attached by `@api/fixtures` through `apiAuthHeaders()`.
- **ALWAYS** validate a successful JSON body by passing the feature schema into the client (`getGyms(request, gymsPageSchema, query)`). The client runs `expectSchema`. A TypeScript type on its own is not a check.
- **ALWAYS** assert an error status in a feature spec with `request.get` and `expectProblem(response, status, ProblemType.X)`. `get()` throws unless `response.ok()`, so it cannot assert an error.
- **ALWAYS** write the test as top-level Given/When/Then `test.step`s, even for a single call. Each API call is its own `When` / `And` step, and the assertions sit in a `Then` step. A publishing Squash run copies these titles into the case's Gherkin script (see the `squash-tm` skill).
- **NEVER** change the expected status, problem type, or schema to match a bug. **NEVER** hide a contract mismatch with unconditional `test.skip`, `test.fixme`, or `@quarantine`. Conditional `test.skip(condition, reason)` is only an environment gate.
- **NEVER** stop at one invalid value. Every query parameter and every path id uses the shared invalid set for its type.
- **ALWAYS** fuzz a path id with `INVALID_OBJECT_ID_VALUES` when the route has an `{id}`. A malformed id is `400` and `ProblemType.Validation` (`INVALID_FORMAT` on `Id`). `404` is only `UNPUBLISHED_OBJECT_ID`.
- **ALWAYS** call the API from the spec, through the feature client or `request.get`. Assertion helpers take values the spec already fetched. Promote a shared helper only when a second feature would copy it.

This suite does not acceptance-test POST, PUT, or DELETE. Do not add write-method tests from this skill.

## Instructions

### Phase 1: Source the contract (documentation first, exploration only as fallback)

The published OpenAPI contract is the source of truth for success bodies. It is the OCI artifact `ghcr.io/ianoflynnautomation/bjjeire-openapi-contract`.

1. **When the contract exists (gyms, events, competitions, stores):**
   - Pull it with `npm run contract:pull`, then `npm run gen:api-schemas`. That regenerates `src/api/generated/zod.gen.ts`. Do not hand-edit that file.
   - Re-export the generated page schema, and the item schema when the route has get-by-id. Field names and types come from that document.
   - Do not curl the endpoint and then write a schema that matches the live JSON.
   - The published document lists successful responses. Error bodies are not in it. Their schema is the handwritten RFC 9457 document in `src/api/support/problem.ts`, which mirrors `ApiExceptionHandler`. Add a `ProblemType` entry when a spec first needs that URI.
   - If a live response disagrees with the generated schema or with `expectProblem` (missing field, wrong type, wrong status, wrong problem `type`), that is a bug to report. Handle it in Phase 7. Do not loosen the schema.

2. **Only when no contract exists** (the `_template` slice, before a feature is published):
   - The template spec's handwritten `paginatedResponseSchema` is the stand-in.
   - Replace it with a generated re-export once the feature has a contract. A real feature follows `src/api/features/gyms/`.

### Phase 2: Define the Zod schema and TypeScript type

Generated schemas live in `src/api/generated/zod.gen.ts`. A feature re-exports the page it asserts and, when it has get-by-id, the item. Handwritten DTOs and query types stay in `<feature>.types.ts`. The service takes the schema the spec passes and the typed query.

```
src/api/generated/zod.gen.ts                          ← generated; do not edit
src/api/features/gyms/gyms.schemas.ts                 ← gymsPageSchema, gymSchema
src/api/features/events/events.schemas.ts             ← bjjEventsPageSchema, bjjEventSchema
src/api/features/competitions/competitions.schemas.ts ← competitionsPageSchema
src/api/features/stores/stores.schemas.ts             ← storesPageSchema
src/api/support/openapi-schemas.ts                    ← openApiPageSchema, openApiSchema
src/api/support/problem.ts                            ← problemDetailSchema, expectProblem
src/api/features/<feature>/<feature>.types.ts         ← DTO and query type
```

`openApiPageSchema` types the generated page as `PaginatedResponse<Dto>`. The cast is deliberate: the published spec leaves most fields optional, so the inferred Zod type is looser than the handwritten DTO. The runtime check is only as strict as that spec. Generated objects use `z.object`, which strips unknown keys, so an extra field does not fail `expectSchema`. Do not rewrite a generated schema as `z.strictObject` in a spec. Seeded assertions (`toMatchObject`, `expectListingToInclude`) check the business fields.

Page links are wider than the published type. Jackson writes JSON `null` for an absent `nextPageUrl` or `previousPageUrl`. `openApiPageSchema` widens those two fields to `nullish()`.

```typescript
// src/api/features/gyms/gyms.schemas.ts
import { openApiPageSchema, openApiSchema } from '@api/support';
import { zGymDto, zPagedResponseGymDto } from '@api/generated/zod.gen';
import type { GymDto } from './gyms.types';

export const gymsPageSchema = openApiPageSchema<GymDto>(zPagedResponseGymDto);
export const gymSchema = openApiSchema<GymDto>(zGymDto);
```

The client runs `expectSchema`, which asserts `toMatchSchema` and returns the parsed value:

```typescript
// src/api/features/gyms/gyms.service.ts
export async function getGyms(
  request: APIRequestContext,
  schema: ZodType<PaginatedResponse<GymDto>>,
  { county, page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE }: GetGymsByCountyPaginationQuery = {},
): Promise<PaginatedResponse<GymDto>> {
  const body = await get(request, API_ROUTES.gyms, {
    params: { page, pageSize, county },
  });
  return expectSchema(schema, body);
}
```

`getGymById` and `getBjjEventById` do the same with the item schema and `resourcePath`. Competitions and stores publish a list only, so they have a page schema and no item client.

**Error bodies** go through `expectProblem`. It checks the status, parses `problemDetailSchema`, asserts the problem `type`, and returns the body so the spec can check `errors` (`field` and `errorCode`).

```typescript
const response = await request.get(API_ROUTES.gyms, { params: { county: 'Atlantis' } });

await expectProblem(response, 400, ProblemType.BadRequest);
```

`ProblemType` mirrors Java `ProblemTypes`: `BadRequest`, `Unauthorized`, `Forbidden`, `NotFound`, `MethodNotAllowed`, `Conflict`, `Validation`, `RateLimit`, and `Internal`. Each value is the `urn:bjjeire:` URI. Those responses have a JSON body.

### Phase 3: Write the test using the `apiRequest` fixture

This repo has no `apiRequest` fixture. Playwright's `request` fixture, from `@api/fixtures`, is passed into the feature client. An API spec imports `test` and `expect` from `@api/fixtures`.

```typescript
import { test, expect } from '@api/fixtures';
import { gymsPageSchema } from '@api/features/gyms/gyms.schemas';
import { getGyms } from '@api/features/gyms/gyms.service';
import { expectListingToInclude } from '@api/support';
import { SEEDED_GYMS_BY_NAME } from './seeded';

const FULL_PAGE_SIZE = 100;

test.describe('Gyms API acceptance', { tag: ['@gyms', '@api'] }, () => {
  test(
    'client should receive each published gym with its details',
    { tag: ['@smoke', '@acceptance'] },
    async ({ request }) => {
      const { data } = await getGyms(request, gymsPageSchema, {
        page: 1,
        pageSize: FULL_PAGE_SIZE,
      });

      expectListingToInclude(data, 'name', SEEDED_GYMS_BY_NAME);
    },
  );
});
```

The spec passes the schema so the contract check sits beside the business assertion. The client parses the body. The spec then asserts seeded facts. Do not parse the schema a second time in the spec.

Use the same client for every successful call, including another page. `get()` returns `unknown` and takes no schema.

**What the spec does not pass:**

| Concern                 | Where it lives                                                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Base URL, TLS, `accept` | api project in `src/api/config/playwright.ts` (`env.apiUrl`)                                                                  |
| Bearer token            | `@api/fixtures` `extraHTTPHeaders`, from `apiAuthHeaders()`                                                                   |
| Cloudflare Access       | same project headers; clearing the edge is separate from API authorization                                                    |
| Collection path         | `API_ROUTES` inside the client                                                                                                |
| Query shape             | `GetGymsByCountyPaginationQuery`, `GetBjjEventsPaginationQuery`, `GetStoresPaginationQuery`, `GetCompetitionsPaginationQuery` |

`requestAuth` defaults to `'default'` (bearer on when `env.apiAuth.required`). The only file that withholds it is `tests/api/authorization.api.acceptance.spec.ts`, via `test.use({ requestAuth: 'none' })`.

Titles are `<actor> should <outcome> [when <context>]`, with `client` as the actor. Every test is `@acceptance`. The critical read is also `@smoke`. The `describe` carries the feature tag and `@api`.

A filter the contract accepts needs a success call through the typed query, not only a rejection test. Gyms pass `county`. Events pass `county` and `types`.

### Phase 4: Write the scenario as Given/When/Then `test.step`s

Every test is a Gherkin scenario. Each API call is a `When` (or `And`) step named for what the client asks for, and the assertions are one `Then` step that says what the client receives. Step titles use domain words, not status codes or field names.

```typescript
test(
  'client should page through the directory in distinct slices with correct links',
  { tag: '@acceptance' },
  async ({ request }) => {
    const firstPage = await test.step('When a client requests page 1 of the directory', () =>
      getGyms(request, gymsPageSchema, { page: 1, pageSize: SMALL_PAGE_SIZE }));

    const secondPage = await test.step('And the client requests page 2 of the directory', () =>
      getGyms(request, gymsPageSchema, { page: 2, pageSize: SMALL_PAGE_SIZE }));

    await test.step('Then the two pages hold different entries and link to each other', () => {
      expectConsecutivePagePagination(firstPage, secondPage, SMALL_PAGE_SIZE);
      expectPagesAreDistinct(firstPage, secondPage, gym => gym.id);
    });
  },
);
```

Each step still passes `gymsPageSchema`, so each page is parsed. The events spec uses the same rule inside `client should receive an event with several types when filtering by any one of them`: each loop iteration is a `When a client requests the event listing filtered by ${type}` step followed by its `Then` step. A call or assertion outside a Given/When/Then step is forbidden. That shape is in `references/test-step-patterns.md`.

### Phase 5: Cover the full status-code matrix

For each list or get-by-id route this suite covers, assert the rows below. The published OpenAPI document lists the 200. The 400 and 404 rows stay required: the handler returns them and `problem.ts` is their contract. Add a 403, 405, 409, or 422 test only when a living spec in `specs/features/` asks for that behaviour.

| Scenario                                                         | Status | What to assert                                                                                                                   |
| ---------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Published list, filtered list, or get-by-id                      | 200    | Client plus schema. Seeded fields via `expectListingToInclude`, `expectAllFromCounty`, `expectRelativeOrder`, or `toMatchObject` |
| Page past the end                                                | 200    | `data` is `[]`. Pagination matches the requested page. `nextPageUrl` is `null`                                                   |
| Two consecutive pages                                            | 200    | `expectConsecutivePagePagination` and `expectPagesAreDistinct`. One `test.step` per page                                         |
| Malformed query (unknown enum, non-numeric integer, non-boolean) | 400    | `expectProblem(..., ProblemType.BadRequest)`                                                                                     |
| `page` or `pageSize` out of range                                | 400    | `expectProblem(..., ProblemType.Validation)` and `errors` contains `{ field, errorCode: ValueOutOfRange }`                       |
| Malformed path id                                                | 400    | `expectProblem(..., ProblemType.Validation)` and `{ field: 'Id', errorCode: InvalidFormat }`                                     |
| Well-formed id that is not seeded                                | 404    | `expectProblem(..., ProblemType.NotFound)` with `UNPUBLISHED_OBJECT_ID`                                                          |
| No bearer, and the environment enforces API auth                 | 401    | `tests/api/authorization.api.acceptance.spec.ts` only. See Phase 7                                                               |

**Structure.** One `*.api.acceptance.spec.ts` per feature. A nested `test.describe` groups query-parameter rejection and, where the route exists, get-by-id. Gyms and events have `/{id}`. Competitions and stores do not, so they have no path-id tests.

Rows come from the app seeder and `tests/features/<feature>/seeded.ts`. Do not create or delete them in `beforeAll` or `afterAll`. Request a page size that covers the seeded rows, or pass a filter, then assert with `expectListingToInclude`. A full environment has more rows than the acceptance fixtures.

### Phase 6: Add per-field negative / validation coverage

One bad value is not coverage. These routes take query parameters and, for gyms and events, a path id. This suite has no request body.

**Checklist for a list route:**

1. Each query parameter, with the shared invalid set for its type (integer, boolean, or enum).
2. `page` and `pageSize` bounds from `OUT_OF_RANGE_PAGING_VALUES` (`page >= 1`, `1 <= pageSize <= 100`).
3. A path `{id}`, when the route has one: `INVALID_OBJECT_ID_VALUES`, then `UNPUBLISHED_OBJECT_ID` for 404.

**Shared sets** live in `tests/features/common/testdata/invalid-values.ts`. Import them. Do not paste the arrays into a spec.

| Constant                                        | Rejected as                                                         |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| `INVALID_INTEGER_QUERY_VALUES` (`abc`, `1.5`)   | `ProblemType.BadRequest` on `page` and `pageSize`                   |
| `INVALID_BOOLEAN_QUERY_VALUES` (`maybe`, `2`)   | `ProblemType.BadRequest` on `includeInactive`                       |
| `INVALID_ENUM_QUERY_VALUES` (`Atlantis`, `123`) | `ProblemType.BadRequest` on `county` and event `types`              |
| `INVALID_OBJECT_ID_VALUES`                      | `ProblemType.Validation`, `InvalidFormat` on `Id`                   |
| `OUT_OF_RANGE_PAGING_VALUES`                    | `ProblemType.Validation`, `ValueOutOfRange` on `Page` or `PageSize` |
| `UNPUBLISHED_OBJECT_ID`                         | `ProblemType.NotFound`                                              |

Query values are strings on the wire. Spring's boolean converter accepts `true`, `false`, `on`, `off`, `yes`, `no`, `1`, and `0`, so those are not invalid booleans. Path values must not contain `/` or `\`. Tomcat rejects those before the API sees them.

Gyms is the pattern: `county` plus `page` and `pageSize`. Events adds `types` and `includeInactive`. Competitions adds `includeInactive` and has no `county`. Stores has `page` and `pageSize` only. The loops are in `references/negative-testing.md`.

```typescript
const malformed = [
  ...INVALID_ENUM_QUERY_VALUES.map(value => ({ param: 'county', label: 'an unknown county', value })),
  ...INVALID_INTEGER_QUERY_VALUES.map(value => ({ param: 'page', label: 'a non-numeric page', value })),
  ...INVALID_INTEGER_QUERY_VALUES.map(value => ({ param: 'pageSize', label: 'a non-numeric page size', value })),
];
for (const { param, label, value } of malformed) {
  test(`client should get a bad request for ${label} "${value}"`, { tag: '@acceptance' }, async ({ request }) => {
    const response = await request.get(API_ROUTES.gyms, { params: { [param]: value } });

    await expectProblem(response, 400, ProblemType.BadRequest);
  });
}
```

**Three-tier rule for where invalid values live:**

1. **Shared type-mismatch and paging bounds** go in `tests/features/common/testdata/invalid-values.ts` as `as const` exports. The listings import them.
2. **A curated set used by one feature across more than one of its specs** lives beside that feature and is imported. Keep it in `.ts` so it can hold non-JSON values. No feature has needed this tier yet. Happy-path rows stay in `seeded.ts`.
3. **A boundary set meaningful to exactly one field** stays inline in that spec. Promote it when a second feature would copy it. `OUT_OF_RANGE_PAGING_VALUES` moved to tier 1 because all four listings share the same bounds.

### Phase 7: Handle behavior mismatches

When a response disagrees with the generated schema or with the status and problem type in Phase 5:

1. Leave the test in the file, written the way the contract says it works.
2. Do not change the expected status, problem `type`, or schema to the value the bug returns.
3. Do not wrap it in unconditional `test.skip` or `test.fixme`. `playwright/no-skipped-test` allows only `test.skip(condition, reason)`. Do not tag it `@quarantine` to hide a contract bug. `@quarantine` is for a known-flaky test, and config `grepInvert` already drops it.
4. Stop and report the mismatch. The app repo owns the wire change and the oasdiff gate.

The only skip in the API suite is an environment gate. Local and docker targets do not enforce authorization. The body is a problem document, so the spec uses `expectProblem`.

```typescript
// tests/api/authorization.api.acceptance.spec.ts
test.use({ requestAuth: 'none' });

test(
  'client should be rejected when calling a protected environment without a bearer token',
  { tag: '@acceptance' },
  async ({ request }) => {
    test.skip(!env.apiAuth.required, 'this environment does not enforce API authorization');

    const response = await request.get(API_ROUTES.gyms, { params: { page: 1, pageSize: 1 } });

    await expectProblem(response, 401, ProblemType.Unauthorized);
  },
);
```

### Phase 8: (When needed) Promote to a helper fixture

Do not add a fixture that performs the HTTP call. The spec calls the feature client or `request.get`. A helper that fetches hides the call and the schema.

Promote when a second feature would copy the same code:

| Module                                             | Role                                                                                                                               |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `@api/fixtures`                                    | Bearer, trace headers, and `requestAuth`. This is the request lifecycle.                                                           |
| Feature `*.service.ts`                             | The call plus `expectSchema`. One client per feature.                                                                              |
| `src/api/support/listing-assertions.ts`            | `expectListingToInclude`, `expectConsecutivePagePagination`, and the other list checks. They take a page the spec already fetched. |
| `tests/features/common/testdata/invalid-values.ts` | Invalid query values, path ids, and paging bounds.                                                                                 |

`listing-assertions.ts` is the promotion that already happened. Every list spec needed the same pagination checks, and the helpers still do not call `get()`.

There is no per-test create or teardown fixture. The seeder in the app repo owns the rows. `seeded.ts` names the ones a spec asserts.

## API Architecture

```
src/api/
├── config/playwright.ts                  ← api project: baseURL, TLS, Cloudflare headers
├── fixtures/index.ts                     ← requestAuth, bearer, traceparent
├── generated/zod.gen.ts                  ← generated OpenAPI Zod
├── features/<feature>/
│   ├── <feature>.service.ts              ← getX(request, schema, query)
│   ├── <feature>.schemas.ts              ← re-export of the generated page or item
│   └── <feature>.types.ts                ← DTO and query type
└── support/
    ├── client.ts                         ← get(); throws unless response.ok()
    ├── schemas.ts                        ← expectSchema, toMatchSchema
    ├── openapi-schemas.ts                ← openApiPageSchema, openApiSchema
    ├── problem.ts                        ← expectProblem, ProblemType
    ├── routes.ts                         ← API_ROUTES, resourcePath
    └── listing-assertions.ts             ← list assertions; no I/O
tests/features/<feature>/<feature>.api.acceptance.spec.ts
tests/features/common/testdata/invalid-values.ts
tests/api/authorization.api.acceptance.spec.ts
```

## See Also

- `references/negative-testing.md` — Phase 6 loops for malformed queries, paging bounds, and path ids.
- `references/test-step-patterns.md` — a multi-call body with no `test.step`, and one invalid value standing in for Phase 6.
- `AGENTS.md` — file naming, tags, and the rule that the spec passes the schema and asserts the business outcome outside the parse.
