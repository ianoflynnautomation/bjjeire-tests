import type { Page } from '@playwright/test';
import { gymsPageSchema } from '@api/features/gyms/gyms.schemas';
import { mockJsonResponse, parseMockBody } from './json-response.mock';

export const GYMS_ROUTE = /\/api\/v[12]\/gym(?:\?|$)/i;

export async function mockGyms(page: Page, body: unknown): Promise<void> {
  await mockJsonResponse(page, GYMS_ROUTE, parseMockBody(gymsPageSchema, body, 'gyms'));
}
