import type { Page } from '@playwright/test';
import { gymsPageSchema } from '@api/features/gyms/gyms.schemas';
import type { GymDto } from '@api/features/gyms/gyms.types';
import { API_ROUTES, DEFAULT_PAGE_SIZE } from '@api/support';
import { mockJsonResponse, parseMockBody } from '@ui/mocks/json-response.mock';
import { paginatePages } from '@ui/mocks/paginate.mock';

export const GYMS_ROUTE = /\/api\/v[12]\/gym(?:\?|$)/i;

export async function mockGyms(page: Page, body: unknown): Promise<void> {
  await mockJsonResponse(page, GYMS_ROUTE, parseMockBody(gymsPageSchema, body, 'gyms'));
}

/** Answers every request as the API would: filtered by county and sliced to the requested page. */
export async function mockGymDirectory(page: Page, gyms: readonly GymDto[]): Promise<void> {
  await page.route(GYMS_ROUTE, route => {
    const { searchParams } = new URL(route.request().url());
    const county = searchParams.get('county');
    const pageSize = Number(searchParams.get('pageSize') ?? DEFAULT_PAGE_SIZE);
    const matching = county ? gyms.filter(gym => gym.county === county) : gyms;
    const body = paginatePages(matching, pageSize, API_ROUTES.gyms)[Number(searchParams.get('page') ?? 1)];
    return route.fulfill({ json: parseMockBody(gymsPageSchema, body, 'gyms') });
  });
}
