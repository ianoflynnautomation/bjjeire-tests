import { expect, type Locator, type Page } from '@playwright/test';
import { TIMEOUTS } from '@shared/config/timeouts';

/**
 * Block until a route is actually mounted in the DOM.
 *
 * `page.goto` resolves on a document lifecycle event, which for this SPA is a
 * long way short of "the page is there". Nothing renders until `bootstrap()`
 * has awaited MSAL init *and* the feature-flag fetch, and only after that first
 * render does React request the route's `lazy()` chunk. Between navigation and
 * the route appearing there are two serial round trips that no `waitUntil`
 * covers — until the chunk lands, the app shows its Suspense fallback and the
 * route's own elements do not exist at all.
 *
 * That gap is invisible on a warm environment and opens up on a cold one, so it
 * surfaced as the *first* test in each spec file failing with "element(s) not
 * found" while every later test in the file passed on the warmed HTTP cache.
 */
export async function waitForRouteMounted(routeAnchor: Locator): Promise<void> {
  await expect(routeAnchor).toBeAttached({ timeout: TIMEOUTS.appBoot });
}

/**
 * Open an app route and wait for it to mount.
 *
 * Navigation settles on `domcontentloaded` rather than `load` on purpose: the
 * readiness signal we care about is the route anchor, not every last image and
 * font on the page. Waiting for the element instead of the lifecycle event is
 * both the web-first pattern and considerably faster.
 */
export async function gotoRoute(page: Page, path: string, routeAnchor: Locator): Promise<void> {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await waitForRouteMounted(routeAnchor);
}

/**
 * Open an app route and wait only for the shared shell (header/footer) to
 * mount. For specs that exercise chrome rather than a specific route's content.
 */
export async function goto(page: Page, path: string): Promise<void> {
  await gotoRoute(page, path, page.getByRole('navigation'));
}
