import type { Page, Route } from '@playwright/test';

export type ResourceCategory = 'image' | 'media' | 'font' | 'analytics' | 'thirdParty';

export type BlockHeavyResourcesOptions = Readonly<{
  readonly categories?: readonly ResourceCategory[];
  readonly allowHosts?: readonly string[];
}>;

const ANALYTICS_HOSTS = [
  'google-analytics.com',
  'googletagmanager.com',
  'doubleclick.net',
  'segment.io',
  'segment.com',
  'sentry.io',
  'hotjar.com',
  'mixpanel.com',
  'amplitude.com',
  'fullstory.com',
  'datadoghq.com',
  'cloudflareinsights.com',
];

function isThirdParty(url: URL, allowHosts: readonly string[]): boolean {
  return !allowHosts.some(h => url.hostname === h || url.hostname.endsWith(`.${h}`));
}

function isAnalytics(url: URL): boolean {
  return ANALYTICS_HOSTS.some(h => url.hostname === h || url.hostname.endsWith(`.${h}`));
}

/**
 * Opt-in route blocker for heavy/irrelevant resources. Call from a test or
 * fixture that doesn't depend on the blocked categories. Visual snapshot specs
 * MUST NOT call this — blocking images/fonts changes the rendered output.
 */
export async function blockHeavyResources(page: Page, options: BlockHeavyResourcesOptions = {}): Promise<void> {
  const categories = new Set<ResourceCategory>(options.categories ?? ['analytics']);
  const allowHosts = options.allowHosts ?? [];

  await page.route('**/*', (route: Route) => {
    const request = route.request();
    const type = request.resourceType();
    const url = new URL(request.url());

    if (categories.has('image') && type === 'image') return route.abort();
    if (categories.has('media') && type === 'media') return route.abort();
    if (categories.has('font') && type === 'font') return route.abort();
    if (categories.has('analytics') && isAnalytics(url)) return route.abort();
    if (categories.has('thirdParty') && isThirdParty(url, allowHosts)) return route.abort();

    return route.continue();
  });
}
