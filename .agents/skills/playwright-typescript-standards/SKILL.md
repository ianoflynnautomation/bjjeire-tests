---
name: playwright-typescript-standards
description: Project-agnostic TypeScript coding standards for Playwright test suites. Covers strict typing, choosing the right collection (array, tuple, Record, Map, Set, as const objects), typed records and factories for test data, unique UI input data with faker, object parameters instead of positional strings, page objects, fixtures, locators, web-first assertions, and parametrised tests. Use when writing, reviewing, or refactoring any Playwright TypeScript code - specs, page objects, fixtures, data builders, or helpers. Project-specific skills and AGENTS.md rules take precedence where they are more specific.
metadata:
  author: Ian O Flynn
---

# Playwright + TypeScript Coding Standards

General guidelines for any Playwright TypeScript suite. A repository's own
conventions (AGENTS.md, local skills) win where they are more specific.

## Critical rules

1. **Strict TypeScript.** `strict: true`, plus `noUncheckedIndexedAccess` and
   `exactOptionalPropertyTypes` where the codebase allows. No `any`; use `unknown`
   and narrow it.
2. **No floating promises.** Every Playwright call is `await`ed. Turn on
   `@typescript-eslint/no-floating-promises` and `playwright/missing-playwright-await`.
3. **Web-first assertions only.** `await expect(locator).toBeVisible()`, never
   `expect(await locator.isVisible()).toBe(true)`. No `waitForTimeout`, no polling loops.
4. **Data is typed records, not loose strings.** Test inputs are interfaces / types,
   built by factories, and passed as one object.
5. **Unique UI-entered data is generated** (faker + a unique suffix). Fixed, known data
   comes from seeded fixtures or constants, never from faker.
6. **Specs never construct page objects or hold raw selectors.** Fixtures provide page
   objects; page objects own locators.
7. **Tests are independent.** Each test creates or selects its own data, runs in any
   order, and can run in parallel.

## Choosing the right collection

| Need                                         | Use                               | Example                                                    |
| -------------------------------------------- | --------------------------------- | ---------------------------------------------------------- |
| Ordered list of same-shaped items            | `readonly T[]`                    | `const users: readonly User[] = [admin, guest]`            |
| Fixed-length, positional pair/triple         | tuple `readonly [A, B]`           | `type Range = readonly [min: number, max: number]`         |
| Closed set of named constants (enum-like)    | `as const` object + derived union | `const Role = { Admin: 'admin', Guest: 'guest' } as const` |
| Lookup keyed by a **known, finite** union    | `Record<K, V>` with `satisfies`   | `const LABELS = {...} satisfies Record<Role, string>`      |
| Lookup keyed by **dynamic** / runtime values | `Map<K, V>`                       | `new Map<string, Order>()` built while the test runs       |
| Uniqueness / membership checks               | `Set<T>`                          | `new Set(names).size === names.length`                     |
| Data-driven cases                            | `readonly Case[]` of records      | `const cases = [{ input, expected }] as const`             |
| One entity's fields                          | `interface` / `type`              | `interface Address { street: string; city: string }`       |

Guidance:

- **Prefer `as const` objects over TS `enum`.** They are plain JS, tree-shake, and
  give you both a value and a union type:

  ```ts
  export const OrderStatus = {
    Pending: 'Pending',
    Shipped: 'Shipped',
    Cancelled: 'Cancelled',
  } as const;
  export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
  ```

- **Use `Record<Union, V>` + `satisfies` for exhaustive mappings.** Adding a new union
  member becomes a compile error until every map handles it:

  ```ts
  const STATUS_BADGE = {
    Pending: 'Awaiting dispatch',
    Shipped: 'On its way',
    Cancelled: 'Cancelled',
  } as const satisfies Record<OrderStatus, string>;
  ```

- Avoid `Record<string, V>` for known keys — it hides typos and returns `V` (not
  `V | undefined`) for missing keys. Use a union key or a `Map`.
- `Map` when keys arrive at runtime, insertion order matters, or keys are not strings.
  Don't use a `Map` for static configuration.
- `Set` for "have I seen this?" and de-duplication. Don't build arrays and `includes`
  in a loop.
- Mark shared test data `readonly` (or `as const`) so one test can't mutate another's
  input. Use `structuredClone` when a test genuinely needs a modified copy.

## Test data: records, factories, faker

### Model data as types

```ts
export interface Customer {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone?: string;
}
```

Mirror the application's DTOs where they exist (ideally generated from an OpenAPI or
GraphQL schema). Hand-written types drift.

### Build with a factory that accepts overrides

```ts
import { faker } from '@faker-js/faker';

export function buildCustomer(overrides: Partial<Customer> = {}): Customer {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    firstName,
    lastName,
    email: faker.internet.email({ firstName, lastName, provider: 'example.test' }).toLowerCase(),
    ...overrides,
  };
}
```

- A test states only the fields its behaviour depends on:
  `buildCustomer({ email: 'not-an-email' })`. Everything else is valid noise.
- Keep factories pure: they return data; they never call the UI or API. A separate
  helper (`createCustomerViaApi(request, customer)`) persists it.
- For nested objects, compose factories (`buildOrder({ customer: buildCustomer() })`).

### Uniqueness for data entered through the UI

Parallel workers and re-runs share an environment, so any value the UI persists and
later searches for must be unique:

```ts
export const uniqueSuffix = (): string => `${Date.now().toString(36)}-${faker.string.alphanumeric(6).toLowerCase()}`;

const product = buildProduct({ name: `E2E ${faker.commerce.productName()} ${uniqueSuffix()}` });
```

- Prefix generated records (`E2E`, `qa-`) so they are easy to find and clean up.
- Use `faker.string.alphanumeric({ length: 12 })` (or a UUID) for "matches nothing"
  searches — a guaranteed miss without a hard-coded magic string.
- Use reserved domains (`example.com`, `example.test`) for emails and URLs.
- **Reproducibility:** log or attach the seed when a test fails, or call
  `faker.seed(n)` for snapshot/visual tests that need stable values. Never seed
  globally in a parallel suite — every worker would generate the same "unique" data.
- **Faker is not for assertions against known data.** Seeded, pre-existing fixtures
  are typed constants (`SEEDED_ADMIN_USER`), not random values.
- Respect field constraints (max length, allowed characters). Wrap faker in the
  factory so constraints live in one place.

## Function inputs: objects over positional strings

Positional string parameters are easy to swap and impossible to read at the call site.

```ts
// Avoid
await checkout.fillAddress('1 Main St', 'Dublin', 'D01', 'IE');

// Prefer
await checkout.fillAddress({ street: '1 Main St', city: 'Dublin', postcode: 'D01', country: 'IE' });
await checkout.fillAddress(buildAddress({ country: 'IE' }));
```

Rules:

- **More than one parameter of the same primitive type → use an object.** One
  obvious argument (`searchFor(term)`, `openOrder(id)`) may stay positional.
- No boolean flags as positional parameters (`login(user, true)`). Use an options
  object (`login(user, { rememberMe: true })`) or two intent-named methods.
- Accept the domain type, not its fields: `expectCardShows(customer)` instead of
  `expectCardShows(name, email, phone)`.
- With `exactOptionalPropertyTypes`, build optional fields conditionally
  (`...(input.phone ? { phone: input.phone } : {})`) instead of passing `undefined`.
- Typed ids/strings: use branded types or literal unions (`Role`, `OrderStatus`)
  rather than `string` for values with a closed set.

## Page objects

- One class per page/component, constructor takes `page: Page` (or a root `Locator`
  for a component). No other mutable state.
- Locators are `readonly` properties or getters, defined once.
- Methods describe **user intent** (`searchFor`, `addToBasket`, `submitOrder`), not
  mechanics (`clickButton3`, `typeIntoInput`).
- Action methods do not assert; assertion methods start with `expect` / `verify` and
  contain web-first `expect` calls. Keep the two separate so steps read cleanly.
- Use composition for shared regions (header, modal, table) and a base class only
  for genuinely shared behaviour (e.g. a list page with search + pagination).
- Return data as typed records (`readCard(): Promise<ProductCard>`), not tuples of
  strings.
- Repeated strings and test ids live in a `*.constants.ts` file next to the page
  object, as `as const` objects.

```ts
export class BasketPage {
  readonly items: Locator;
  readonly checkoutButton: Locator;

  constructor(private readonly page: Page) {
    this.items = page.getByRole('list', { name: 'Basket items' }).getByRole('listitem');
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
  }

  async goTo(): Promise<void> {
    await this.page.goto('/basket');
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }

  async expectItemCount(count: number): Promise<void> {
    await expect(this.items).toHaveCount(count);
  }
}
```

## Locators

Priority: `getByRole` (with `name`) → `getByLabel` / `getByPlaceholder` / `getByText`
→ `getByTestId` → CSS as a last resort. Never XPath, never generated class names.

- Scope repeated elements to a container: `card.getByRole('link', { name: 'Edit' })`.
- Use `filter({ hasText })` / `filter({ has })` to pick one row among many.
- Don't use `nth()` / `first()` unless order is the behaviour under test.
- Don't cache element handles (`$`, `elementHandle`); locators re-resolve.

## Fixtures

- Extend `test` with typed fixtures for page objects, API clients, test data, and
  route mocks. Specs request what they need by name.
- Setup that must always run (auth, feature flags, tracing headers) is an
  `{ auto: true }` fixture.
- Configurable behaviour is an **option** fixture (`[default, { option: true }]`) so a
  file can override it with `test.use(...)`.
- Fixtures that create data also clean it up after `use()`.
- Keep a feature's fixtures next to its specs; avoid a single global registry.

```ts
type ShopFixtures = { basketPage: BasketPage; customer: Customer };

export const test = base.extend<ShopFixtures>({
  basketPage: async ({ page }, use) => use(new BasketPage(page)),
  customer: async ({ request }, use) => {
    const customer = buildCustomer();
    const { id } = await createCustomerViaApi(request, customer);
    await use(customer);
    await deleteCustomerViaApi(request, id);
  },
});
export { expect } from '@playwright/test';
```

## Assertions

- Auto-retrying assertions: `toBeVisible`, `toHaveText`, `toHaveCount`, `toHaveURL`,
  `toHaveValue`, `toBeEnabled`, `toHaveAttribute`.
- Use `expect.soft` to report several independent field mismatches in one run; follow
  with a hard assertion when later steps depend on it.
- Use `expect.poll` / `toPass` only for non-DOM conditions (an API reaching a state),
  with an explicit timeout.
- Add a message for non-obvious assertions: `expect(row, 'cancelled order row').toBeVisible()`.
- Validate API responses against a schema (e.g. Zod) once in the client, then assert
  business values in the test.

## Structure and readability

- Group with `test.describe`; tag suites and tests (`{ tag: ['@smoke'] }`) instead of
  encoding tags in titles.
- Wrap each Given/When/Then phase in `test.step` (see the `playwright-bdd` skill).
- Data-driven tests: iterate a typed `readonly` array of records and put the case in
  the title.

  ```ts
  const invalidEmails = [
    { case: 'missing @', value: 'user.example.com' },
    { case: 'missing domain', value: 'user@' },
  ] as const;

  for (const { case: name, value } of invalidEmails) {
    test(`visitor should see an email error when the email is ${name}`, async ({ signUpPage }) => {
      await signUpPage.register(buildCustomer({ email: value }));
      await signUpPage.expectEmailError();
    });
  }
  ```

- Use `route.fulfill` mocks only for states that are hard to reproduce for real
  (empty lists, errors, pagination edge cases); type mocked bodies and validate them
  against the same schema as real responses.
- Conditional skips (`test.skip(condition, reason)`) for environment gating;
  never commit an unconditional `test.only` or `test.skip`.
- Prefer `import type` for type-only imports; use path aliases instead of deep
  relative paths.

## Naming

| Thing               | Convention                          | Example                      |
| ------------------- | ----------------------------------- | ---------------------------- |
| Page object class   | `PascalCase` + `Page` / `Component` | `CheckoutPage`, `CartDrawer` |
| Fixture             | `camelCase` noun                    | `checkoutPage`, `adminUser`  |
| Factory             | `build<Entity>`                     | `buildCustomer`              |
| Persisting helper   | `create<Entity>Via<Channel>`        | `createOrderViaApi`          |
| Assertion method    | `expect<Outcome>`                   | `expectOrderConfirmed`       |
| Constant object     | `PascalCase` or `SCREAMING_SNAKE`   | `OrderStatus`, `NAV_LINKS`   |
| Seeded fixture data | `SEEDED_<ENTITY>_<NAME>`            | `SEEDED_CUSTOMER_JANE`       |

## Anti-patterns checklist

- `page.waitForTimeout(...)` or `setTimeout` waits.
- `expect(await locator.textContent()).toBe(...)` — non-retrying.
- Selectors or `page.locator(...)` written directly in specs.
- `any`, non-null `!` assertions to silence the compiler, or `as` casts on response bodies.
- Several string parameters in a row; boolean positional flags.
- Hard-coded "unique" names (`'Test Product 1'`) entered through the UI.
- Random (faker) values used to assert pre-existing data.
- Tests that depend on another test's data or on execution order.
- `Record<string, T>` for a known key set; TS `enum` where an `as const` object works.
- Asserting the first page of an unfiltered list contains a specific item when the
  environment holds more data than the fixture set.
