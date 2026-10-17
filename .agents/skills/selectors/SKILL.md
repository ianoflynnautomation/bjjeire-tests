---
name: selectors
description: Locator strategy for this Playwright suite. Scope to a page section, card, or dialog, then use getByRole when the accessible name is unique and getByTestId when the app publishes a data-testid. Use when creating or changing page-object locators or UI specs. Explore the live app with npx playwright cli before writing a new locator. Repeated UI strings live in the feature constants; see the enums skill. Exploration commands are in the playwright-cli skill.
author: Ian O Flynn
---

# Selector Strategy

## Critical

- Explore with `npx playwright cli` from the repo root before writing a new locator. The skill is `.agents/skills/playwright-cli/SKILL.md`. The shell is blank until MSAL and the feature-flag fetch settle, so snapshot again before choosing a selector.
- Scope first. A locator that is unique on the page stays on `page`. A locator that repeats is scoped to the card, the filter bar, or the dialog.
- Inside that scope, use `getByRole` when the accessible name is unique. Use `getByTestId` when the app publishes a `data-testid` for a repeated widget, or for a landmark that shares its role with another landmark. The ids are in `bjjeire-app` `src/constants/*DataTestIds.ts` and `src/constants/commonDataTestIds.ts`. The suite copies the ones it uses into `src/ui/pages/<feature>/<feature>.constants.ts`, or into `src/ui/pages/sections/header.constants.ts` for the header.
- Do not use an unscoped `getByRole('navigation')`. On `/gyms` the header `<nav data-testid="navigation">` and the pagination `<nav aria-label="Pagination navigation">` are both navigation landmarks.
- No XPath. No CSS class or id as the strategy. The Entra page in `src/ui/pages/microsoft/microsoft.login.page.ts` is the exception: role and label first, then `input[name]` or an id, because that page does not keep a stable accessible name.
- Repeated visible strings come from the feature constants (`NO_DATA_COPY`, `NO_SEARCH_RESULTS_COPY`, `HEADER_NAV_LINKS`, `EMPTY_LINE2`). See the `enums` skill. A string used once stays inline.
- This directory has no create, update, or delete forms. List pages already assert the empty state and the error alert. Do not add success-toast locators for writes the suite does not perform.
- If the app cannot be reached, stop and tell the human. Do not ship a guessed locator.

## Instructions

### Phase 1: Open and authenticate

Open the running app from the repo root. Docker is `http://localhost:3000`. A minikube port-forward is `http://127.0.0.1:8080`. Do not open production.

```bash
npx playwright cli open http://localhost:3000/ --browser=chromium
npx playwright cli snapshot
```

The public directory pages do not show a login form when `PW_UI_ENTRA_AUTH` is off. A blank shell means MSAL or the feature-flag fetch has not finished. Snapshot again. If the page stays blank or returns an error, stop and tell the human the URL and the status. Wait for a reachable app before writing locators.

### Phase 2: Explore like a user

Walk `/gyms`, `/events`, `/competitions`, `/stores`, and `/about`. On each page read the search label, the county select, the header links, and the footer links. Search for a term that matches nothing and read the empty state. On events, read the type buttons. Open Support and read the dialog. On a list with more than one page, count the navigation landmarks.

```bash
npx playwright cli snapshot
npx playwright cli fill "getByTestId('search-input')" "zzz-no-match-xyz"
npx playwright cli snapshot
```

Capture the exact rendered text. It goes into the feature constants through the `enums` skill.

Event type buttons read `All Types`, `Open Mat`, `Seminar`, `Camp`, `Other`. The card badge is those words with CSS `uppercase`, so `innerText` on the badge is `OPEN MAT`. A button locator uses the button label. A badge assertion uses the uppercased text.

The support dialog title is `Support BJJ Eire`. The close button's accessible name is `Close support modal`. The logo text is `BJJ Éire`.

### Phase 3: Plan test coverage

Coverage is the acceptance specs under `tests/features/<feature>/` and `tests/layout/`, specified in `specs/features/`. The paths are open a list, search, filter, the empty state, the error alert, header, footer, the mobile menu, and the support dialog. There is no write-method UI flow.

### Phase 4: Generate selectors

Inside the chosen scope, use the first locator that stays unique:

1. **`getByRole()`** — the accessible name is unique in that scope (footer link, event-type button, dialog close button, Entra controls).
2. **`getByLabel()`** — a single form control whose label is unique on the page (`Select County`, `Search gyms`).
3. **`getByPlaceholder()`** — an input that has no label. These search inputs have a label and a placeholder, so the placeholder is not the locator.
4. **`getByText()`** — a one-off message that has no test id.
5. **`getByTestId()`** — the app's published id. Scope it so a repeated id matches one element.

## Correct Examples

```typescript
// Header. Pagination is a second navigation landmark on /gyms.
page.getByTestId('navigation').getByRole('link', { name: 'Gyms', exact: true });

// Footer. The same labels also sit in the header, so the link is scoped to contentinfo.
page.getByRole('contentinfo').getByRole('link', { name: 'Events', exact: true });

// Search. The accessible name is "Search gyms" and the placeholder is "Search gyms...".
// The input test id is shared by every list, so the page wrapper scopes it.
page.getByTestId('gyms-page-search').getByTestId('search-input');

// County select. The label is "Select County". Events also scopes it under the filter bar.
page.getByTestId('events-page-filters').getByTestId('select-filter-select');

// Event type button. The name is the label, not the uppercased badge.
page.getByTestId('events-page-filters').getByRole('button', { name: 'Seminar', exact: true });

// One field on one card.
card.getByTestId('gym-card-name');

// Empty state (role="status") and error alert (role="alert").
page.getByTestId('no-data-state-title');
page.getByTestId('error-state-title');
```

Page-object classes keep locators in private getters (`HeaderSection`, `FooterSection`, `ListPage`). Card readers and the Entra helpers are functions that take a `Locator` or a `Page`.

## Forbidden (NEVER Use)

```typescript
page.locator('//nav');
page.locator('.btn-primary');
page.locator('#submit-button');
page.getByRole('navigation');
```

`getByRole('navigation')` matches the header and, on a multi-page list, the pagination nav. The header locator is `getByTestId('navigation')` (`HEADER_TEST_IDS.navigation`). Pagination is `getByTestId('pagination')`, and its accessible name is `Pagination navigation`.

## Choosing Between Similar Locators

- A header link uses the header test id, then `getByRole('link', { name, exact: true })`. `exact: true` keeps a short label from matching a longer one. The logo name is `BJJ Éire`, so it does not match `Events`.
- A footer link uses `getByRole('contentinfo')`, then the link role. Header and footer render the same labels.
- Several cards share `gym-card-name`. Scope the test id to the card (`cardByName` in `src/ui/pages/common/card.page.ts`).
- The county `<select>` can be `getByLabel('Select County')`. The suite uses `select-filter-select` because that id is the widget contract in `SelectFilterTestIds`, and events scopes it under `events-page-filters`.
- The support control is a `<dialog>` (accessible role `dialog`, test id `support-modal-overlay`). The suite asserts `support-modal-title`, `support-modal-qr-code`, and `support-modal-warning`.

## Feedback & Validation Message Selectors

List pages cover the feedback this app shows. There is no save-success toast.

| Feedback         | Where it appears              | Locator                                                                                                                     |
| ---------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Search empty     | A search that matches nothing | `no-data-state-title`, `no-data-state-message-line1`, `no-data-state-message-line2`, asserted with `NO_SEARCH_RESULTS_COPY` |
| Unfiltered empty | The API returns an empty page | The same test ids, asserted with `NO_DATA_COPY`                                                                             |
| Error            | A failed list request         | `role="alert"`, `error-state-title`, `error-state-message-line1`, retry `error-state-button` (`Retry`)                      |
| Support warning  | The support dialog            | `support-modal-warning`                                                                                                     |
| Loading          | The list is fetching          | `loading-state`                                                                                                             |

`expectNoResults` asserts the search-empty copy. `expectEmptyStateMessage` asserts the unfiltered copy. `expectNetworkErrorMessage` and `expectServerErrorMessage` assert the alert. A new list page uses those methods. It does not add a second set of message locators.

## See Also

- `enums` skill — where repeated copy and test ids live, and how to read them from the app.
- `.agents/skills/playwright-cli/SKILL.md` — `npx playwright cli` from the repo root.
- `AGENTS.md` — `gotoRoute` / `gotoAppShell`, and the rule that specs do not call `page.goto` for an app route.
