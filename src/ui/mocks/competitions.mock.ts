import type { Page } from '@playwright/test';
import { competitionsPageSchema } from '@api/features/competitions/competitions.schemas';
import { mockJsonResponse, mockPagedJsonResponse, parseMockBody } from './json-response.mock';

export const COMPETITIONS_ROUTE = /\/api\/v[12]\/competition(?:\?|$)/i;

export async function mockCompetitions(page: Page, body: unknown): Promise<void> {
  await mockJsonResponse(page, COMPETITIONS_ROUTE, parseMockBody(competitionsPageSchema, body, 'competitions'));
}

export async function mockCompetitionsPages(
  page: Page,
  bodiesByPage: Readonly<Record<number, unknown>>,
): Promise<void> {
  const validated = Object.fromEntries(
    Object.entries(bodiesByPage).map(([pageNumber, body]) => [
      pageNumber,
      parseMockBody(competitionsPageSchema, body, `competitions page ${pageNumber}`),
    ]),
  );
  await mockPagedJsonResponse(page, COMPETITIONS_ROUTE, validated);
}
