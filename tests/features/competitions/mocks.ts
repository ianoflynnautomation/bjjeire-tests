import type { Page } from '@playwright/test';
import { bjjEireCompetitionsPageSchema } from '@api/features/competitions/bjjeire-competitions.schemas';
import { competitionsPageSchema } from '@api/features/competitions/competitions.schemas';
import { BJJEIRE_COMPETITIONS_API_ROUTE } from '@ui/pages/competitions/competitions.constants';
import { mockServerError } from '@ui/mocks/failure.mock';
import { mockJsonResponse, mockPagedJsonResponse, parseMockBody } from '@ui/mocks/json-response.mock';

export const COMPETITIONS_ROUTE = /\/api\/v[12]\/competition(?:\?|$)/i;

export const BJJEIRE_COMPETITIONS_ROUTE = BJJEIRE_COMPETITIONS_API_ROUTE;

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

/** The pulled contract has no BJJ Éire competition page yet; the slice's own schema checks the body. */
export async function mockBjjEireCompetitions(page: Page, body: unknown): Promise<void> {
  await mockJsonResponse(
    page,
    BJJEIRE_COMPETITIONS_ROUTE,
    parseMockBody(bjjEireCompetitionsPageSchema, body, 'BJJ Éire competitions'),
  );
}

export async function mockBjjEireCompetitionsServerError(page: Page): Promise<void> {
  await mockServerError(page, BJJEIRE_COMPETITIONS_ROUTE);
}
