import { expect, type APIRequestContext } from '@playwright/test';
import { z } from 'zod';
import { API_ROUTES, apiAuthHeaders, expectSchema, resourcePath } from '@api/support';
import { env } from '@shared/config';
import { dublinDateTime } from './dublin-time';

const registrationWindowSchema = z.object({
  registrationOpensAt: z.iso.datetime({ offset: true }),
  registrationClosesAt: z.iso.datetime({ offset: true }),
});

export type RegistrationWindow = z.infer<typeof registrationWindowSchema>;

/**
 * The seeded BJJ Éire competition's registration instants from an API response body. The seed sets them relative
 * to the seed run, so tests read them at run time. Offset-less local times are refused, so the oracle cannot shift.
 */
export function registrationWindowFrom(body: unknown): RegistrationWindow {
  return expectSchema(registrationWindowSchema, body);
}

/**
 * Reads a seeded competition's registration window for a UI test's oracle. A UI spec's `request` has the site as its
 * base URL, so the API address is absolute; the feature client (`getBjjEireCompetitionBySlug`) is relative to the API
 * project's base URL, which is why this small read lives here rather than in the client.
 */
export async function readRegistrationWindow(request: APIRequestContext, slug: string): Promise<RegistrationWindow> {
  const response = await request.get(`${env.apiUrl}${resourcePath(API_ROUTES.bjjEireCompetitions, slug)}`, {
    headers: await apiAuthHeaders(),
  });
  expect(response.ok(), `${response.url()} status ${response.status()}`).toBe(true);
  return registrationWindowFrom(await response.json());
}

/** The not-open-yet sentence as the page words it: `Registration opens on <Irish opening time> (Irish time).` */
export function registrationOpensSentence(window: RegistrationWindow): string {
  return `Registration opens on ${dublinDateTime(window.registrationOpensAt)} (Irish time).`;
}
