---
name: enums
description: Const-object conventions for this suite. Wire enums are PascalCase `as const` objects whose keys and values match the Java and OpenAPI names (`BjjEventType.OpenMat`). They live in `src/api/features/<feature>/<feature>.types.ts`. Collection paths live on `API_ROUTES` in `src/api/support/routes.ts`. Problem URIs live in `src/api/support/problem.ts`. UI test ids and copy live in `src/ui/pages/<feature>/<feature>.constants.ts`. Use when adding an endpoint path, a problem type, a wire-enum member, or repeated UI copy or test ids. Do not use for environment URLs (`src/shared/config`) or invalid-input arrays (`tests/features/common/testdata/invalid-values.ts`).
author: Ian O Flynn
---

# Enums

This suite does not use the TypeScript `enum` keyword. A wire enum is an `as const` object plus a type alias of the same name. Member names are the published wire strings.

## Critical

- **Shape:** `export const Name = { Member: 'Member' } as const` and `export type Name = (typeof Name)[keyof typeof Name]`.
- **Wire-enum name:** PascalCase, the same name as the Java enum (`BjjEventType`, `GymStatus`, `ClassCategory`, `PricingType`, `EventStatus`, `ScheduleKind`, `County`, `ProblemType`, `ValidationErrorCode`).
- **Wire-enum member:** PascalCase, the same spelling as the Java constant and the OpenAPI `z.enum` entry. Key and value are that spelling (`OpenMat: 'OpenMat'`). `ValidationErrorCode` is the exception: PascalCase key, SCREAMING_SNAKE value (`InvalidFormat: 'INVALID_FORMAT'`).
- **Map name:** SCREAMING_SNAKE for a group that is not a wire enum (`API_ROUTES`, `TEST_IDS`, `NO_DATA_COPY`). Keys on those maps are camelCase (`bjjEvents`, `headerTitle`).
- **Location:** wire enums live in `src/api/features/<feature>/<feature>.types.ts`. Paths live in `src/api/support/routes.ts`. Problem URIs live in `src/api/support/problem.ts`. UI test ids and copy live in `src/ui/pages/<feature>/<feature>.constants.ts`, or under `src/ui/pages/sections/` and `src/ui/pages/common/` when more than one feature shares them. Do not add an `enums/` directory.
- **Repeated strings** that the app defines (paths, wire values, test ids, empty-state copy) come from those modules. A string used in one place stays inline.
- **UI copy** matches the rendered app. Read it from the live page with `npx playwright cli` before writing a new value. The skill is `.agents/skills/playwright-cli/SKILL.md`.
- **Changing a key or a wire value** is a search across specs, seeded fixtures, page objects, and badge maps. There is no separate refactor skill.

## File locations

`<feature>` is `gyms`, `events`, `competitions`, or `stores`.

| Kind                                  | File                                                               | Names in this repo                                                                         |
| ------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Wire enum for one feature             | `src/api/features/<feature>/<feature>.types.ts`                    | `GymStatus`, `ClassCategory`, `BjjEventType`, `PricingType`, `EventStatus`, `ScheduleKind` |
| Problem URI and validation code       | `src/api/support/problem.ts`                                       | `ProblemType`, `ValidationErrorCode`                                                       |
| County name                           | `src/api/support/types.ts`                                         | `County`                                                                                   |
| API collection path                   | `src/api/support/routes.ts`                                        | `API_ROUTES`, `resourcePath`                                                               |
| Feature test ids and empty-state copy | `src/ui/pages/<feature>/<feature>.constants.ts`                    | `TEST_IDS`, `NO_DATA_COPY`, `GYM_CARD_TEST_IDS`, `EVENT_CARD_TEST_IDS`                     |
| Shared chrome                         | `src/ui/pages/sections/header.constants.ts`, `footer.constants.ts` | `HEADER_NAV_LINKS`, `FOOTER_QUICK_LINKS`                                                   |
| Shared empty and error test ids       | `src/ui/pages/common/empty.page.ts`, `error.page.ts`               | `NO_DATA`, `ERROR`                                                                         |

## Instructions

### Phase 1: Decide if the value belongs in an enum

| Value                                                                               | Home                                                                                                                                    |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Java/OpenAPI enum name the API returns or accepts (`OpenMat`, `Active`, `FlatRate`) | The feature `*.types.ts` const                                                                                                          |
| Problem `type` URI or validation `errorCode`                                        | `ProblemType` or `ValidationErrorCode`                                                                                                  |
| Collection path (`/api/v1/gym`, `/api/v1/bjjevent`)                                 | `API_ROUTES`                                                                                                                            |
| `data-testid` or empty-state title shared by a page object and its specs            | That feature's `*.constants.ts`                                                                                                         |
| Header or footer link label and path                                                | `header.constants.ts`. `FOOTER_QUICK_LINKS` is that same list: header and footer both render `useNavItems()` with every feature flag on |
| Base URL, credential, token                                                         | `src/shared/config` (`env`). Never a const of environment URLs                                                                          |
| Invalid query tokens, bad ObjectIds, paging bounds                                  | `tests/features/common/testdata/invalid-values.ts`. The `api-testing` skill owns that file                                              |
| Timeout                                                                             | `TIMEOUTS` in `src/shared/config/timeouts.ts`                                                                                           |
| Playwright project tuning                                                           | `src/shared/config/playwright.ts` and the api/ui project files                                                                          |
| String used in one spec or one function                                             | Inline                                                                                                                                  |

County names come from `County` in `src/api/support/types.ts`. That const is the gyms and events select: the 26 counties in `bjjeire-app` `constants/counties.ts`, in that order. `CountyFilter` adds `'all'`, the "All Counties" option. The OpenAPI enum also lists `None`, `Antrim`, `Armagh`, `Derry`, `Down`, `Fermanagh`, and `Tyrone`. The select does not offer them, so they are not members. Seeded fixtures and county filters use `County.Cork`, not a bare `'Cork'`.

If the value fits none of these rows, stop and ask.

### Phase 2: Pick the home — new file or extend existing

Extend the const that already owns the group.

- A new gym or event wire value goes on `GymStatus`, `ClassCategory`, `BjjEventType`, `PricingType`, `EventStatus`, or `ScheduleKind` in that feature's `*.types.ts`.
- A new collection path goes on `API_ROUTES`. A single resource under that collection uses `resourcePath(API_ROUTES.gyms, id)`.
- `ProblemType` already lists every Java `ProblemTypes` URI. A new URI is a new member there and a new assertion that uses it.
- A new test id or empty-state line goes on the feature's existing `TEST_IDS`, `NO_DATA_COPY`, or `NO_SEARCH_RESULTS_COPY`. Each list page has both copy objects: `NO_DATA_COPY` is the unfiltered empty state, and `NO_SEARCH_RESULTS_COPY` is the search-empty state. Search omits its own second line, so `line2` is `EMPTY_LINE2` from `src/ui/pages/common/empty.page.ts`.
- A new feature's constants file is created with the page object (`<feature>.constants.ts` beside `<feature>.page.ts`). Do not create `enums/` under `src/api` or `src/ui`.

### Phase 3: Name the enum and its members

Wire enums use the Java name as the object name and as each member. The value is that same string. The generated schema in `zod.gen.ts` is the checklist. `BjjEventType`, `PricingType`, `ScheduleKind`, and `ClassCategory` match it. `EventStatus` has the same seven names.

```typescript
// src/api/features/events/events.types.ts
export const BjjEventType = {
  OpenMat: 'OpenMat',
  Seminar: 'Seminar',
  Camp: 'Camp',
  Other: 'Other',
} as const;
export type BjjEventType = (typeof BjjEventType)[keyof typeof BjjEventType];
```

`API_ROUTES` is a path map. Keys are camelCase. Values are the published paths, built from `API_BASE_PATH` (`/api/v1`). The collections are singular: `gym`, `bjjevent`, `competition`, `store`.

```typescript
// src/api/support/routes.ts
export const API_ROUTES = {
  gyms: `${API_BASE_PATH}/gym`,
  bjjEvents: `${API_BASE_PATH}/bjjevent`,
  competitions: `${API_BASE_PATH}/competition`,
  stores: `${API_BASE_PATH}/store`,
  donateBitcoinQr: `${API_BASE_PATH}/donate/bitcoin/qr`,
  openApiV1: `/openapi/${API_VERSION}.json`,
} as const;
```

| Wrong                                              | What is wrong                                  | What this repo uses                                    |
| -------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------ |
| `export enum BjjEventType { OpenMat = 'OpenMat' }` | The `enum` keyword. This suite uses `as const` | The block above                                        |
| `OPEN_MAT: 'OpenMat'`                              | Member key is not the wire name                | `OpenMat: 'OpenMat'`                                   |
| `OpenMat: 'open-mat'`                              | Value drifted from the Java constant           | `OpenMat: 'OpenMat'`                                   |
| `API_ENDPOINTS.BJJ_EVENTS = '/api/events'`         | Wrong object, wrong key, wrong path            | `API_ROUTES.bjjEvents` → `/api/v1/bjjevent`            |
| `ProblemType.BAD_REQUEST`                          | Key is SCREAMING_SNAKE                         | `ProblemType.BadRequest` → `'urn:bjjeire:bad-request'` |

`GymStatus` matches the app enum: `Active`, `PendingApproval`, `TemporarilyClosed`, `PermanentlyClosed`, `OpeningSoon`, `Draft`, `Rejected`. The OpenAPI schema also lists `None`. The app enum does not, and the select never shows it, so it is not a member. The badge class is `uppercase`, and `getText` reads `innerText`, so `STATUS_BADGE_LABELS` stores the visible text (`Active` is `'ACTIVE'`). Add a new `GymStatus` member to that record in the same change. The record is exhaustive. `CLASS_CATEGORY_LABELS` is the same kind of record for `ClassCategory`. Its values are the app's `classCategoryLabels`, and those chips are not uppercased. `EventStatus` uses the app enum order, starting with `Postponed`.

### Phase 4: Verify message values against the real app

Wire-enum values come from the Java enum and `zod.gen.ts`, not from a guess about how the UI might abbreviate them.

UI copy and test ids come from the rendered app. `NO_DATA_COPY` on gyms is the pattern: the strings are what the empty state shows, and the page object passes them to `expectNoDataState`.

1. Read `.agents/skills/playwright-cli/SKILL.md`.
2. From the repo root, run `npx playwright cli`, open the route, and snapshot the text or `data-testid`.
3. Put that exact string on the feature constants object.
4. The page object consumes it. Specs call the page object. They do not repeat the sentence.

If the app is not running, stop. Do not invent the copy and leave a FIXME.

### Phase 5: Add JSDoc and export

Export the const and the type alias, as `BjjEventType` does. A comment is for a fact the name does not say. `County` records that it follows the app select, not the wider OpenAPI enum. `ValidationErrorCode` stores a different string from its key, so the value has to be the wire code.

`ProblemType` in `src/api/support/problem.ts` is the full Java set: `BadRequest`, `Unauthorized`, `Forbidden`, `NotFound`, `MethodNotAllowed`, `Conflict`, `Validation`, `RateLimit`, `Internal`. Each value is the `urn:bjjeire:` URI. `ValidationErrorCode` stores a different string from its key:

```typescript
export const ValidationErrorCode = {
  InvalidFormat: 'INVALID_FORMAT',
  ValueOutOfRange: 'VALUE_OUT_OF_RANGE',
} as const;
```

`GymStatus` and `BjjEventType` have no comment. Do not add one that only repeats the name.

### Phase 6: Editing existing enum values

Changing a wire string or a member key touches every consumer. Search before editing.

- `BjjEventType` and `EventStatus` are imported by `events.types.ts` consumers, `tests/features/events/seeded.ts`, and the events API spec (`types: [BjjEventType.Seminar]`).
- `GymStatus` is imported by `gyms.types.ts` consumers, `tests/features/gyms/seeded.ts`, and `STATUS_BADGE_LABELS` in `src/ui/pages/gyms/gyms.card.mapper.ts`.
- `API_ROUTES` is imported by every feature service and by the negative `request.get` calls.
- `TEST_IDS` and `NO_DATA_COPY` are imported by that feature's page object.

Rename the const member and update those sites in the same change. Do not leave the old wire string in a spec.

## Examples

### Example 1: Add an API path

The path belongs on `API_ROUTES`. Extend the object. Do not add a new file.

`getGyms` already calls `get(request, API_ROUTES.gyms, ...)`. A spec that asserts an error calls `request.get(API_ROUTES.gyms, { params })`. A get-by-id path is `resourcePath(API_ROUTES.gyms, id)`, which encodes the id.

A new collection follows the same shape: a camelCase key and `` `${API_BASE_PATH}/<singular-resource>` `` matching the app route. Consumers import `API_ROUTES` from `@api/support`.

### Example 2: Add UI copy

Empty-state copy for gyms lives on `NO_DATA_COPY` in `src/ui/pages/gyms/gyms.constants.ts`. The page passes it in:

```typescript
super(page, { route: '/gyms', testIds: TEST_IDS, noDataCopy: NO_DATA_COPY });
```

`ListPage` asserts the unfiltered empty state through `expectEmptyStateMessage`. A search with no matches calls `expectNoResults`, which asserts `NO_SEARCH_RESULTS_COPY`. A new line is a new camelCase key (`title`, `line1`, `line2` are the keys `NoDataCopy` requires). Capture the sentence from the live empty state first. Search-empty `line2` stays `EMPTY_LINE2`.

### Example 3: Assert a shared problem URI

`tests/api/authorization.api.acceptance.spec.ts` withholds the bearer and calls `expectProblem(response, 401, ProblemType.Unauthorized)`. The key is `Unauthorized`. The value is `urn:bjjeire:unauthorized`, not `401`. Do not add a `Roles` const. This suite has one client-credentials caller and no role enum.

## Troubleshooting

**A spec hardcodes `/api/v1/gym`.**
Use `API_ROUTES.gyms`. The service and the error calls already do.

**A spec hardcodes `'OpenMat'` or `'Active'`.**
Use `BjjEventType.OpenMat` or `GymStatus.Active` from the feature types module.

**An assertion looks for `'Invalid credentials'` or `'Successfully logged in'`.**
This app has no login-message enum. UI copy that the suite owns is on `NO_DATA_COPY`, `NO_SEARCH_RESULTS_COPY`, `ERROR_TITLE`, `NETWORK_ERROR_MESSAGE`, and `SERVER_ERROR_MESSAGE`.

**A wire value fails schema parse.**
Compare the member to `zod.gen.ts` and the Java enum. The usual drift is a renamed spelling (`Cancelled` against the published `Canceled`) or a missing `None` on a status the document still lists.

**The new value is a list of bad inputs.**
That is `invalid-values.ts`, owned by the `api-testing` skill. It is an `as const` array, not a wire enum.

**The new value is `https://dev.bjjeire.com` or a bearer token.**
That is `env` in `src/shared/config`. The api project sets `baseURL` from `env.apiUrl`. The fixture attaches the bearer.

## See Also

- `api-testing` skill — `API_ROUTES`, `ProblemType`, `expectProblem`, and `invalid-values.ts`.
- `.agents/skills/playwright-cli/SKILL.md` — how to read rendered copy and `data-testid`s. Invoke it as `npx playwright cli` from the repo root.
- `AGENTS.md` — feature slice layout and the rule that paths live in `src/api/support/routes.ts`.
