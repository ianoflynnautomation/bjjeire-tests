import { expect, type PlaywrightWorkerArgs } from '@playwright/test';
import {
  newCompetitorApiContext,
  requestOwnCompetitor,
  signInLocalCompetitor,
} from '@api/features/competitions/competitor.service';

const FIRST_RETRY_MS = 250;
const SECOND_RETRY_MS = 500;
const LATER_RETRY_MS = 1000;
const INTERVALS_MS = [FIRST_RETRY_MS, SECOND_RETRY_MS, LATER_RETRY_MS];
const TIMEOUT_MS = 10_000;
const HTTP_OK = 200;

/**
 * Waits until the API accepts a fresh sign-in for `email`, with no clock compared: the API refuses a token whose
 * whole-second `iat` is not later than the account's deletion (`MongoRevokedCompetitors`, finding F13), so the poll
 * signs in and reads the own profile until that read answers 200. A later UI sign-in is then accepted too.
 * Safe to repeat: a local sign-in writes nothing and reading the own profile creates nothing.
 */
export async function waitUntilApiAcceptsSignIn(
  playwright: PlaywrightWorkerArgs['playwright'],
  email: string,
): Promise<void> {
  const context = await newCompetitorApiContext(playwright);
  try {
    await expect
      .poll(
        async () => {
          const session = await signInLocalCompetitor(context, email);
          return (await requestOwnCompetitor(context, session.accessToken)).status();
        },
        {
          message: `the API never accepted a fresh sign-in for ${email} after its account was deleted (F13 explains a brief refusal in the deletion's own second; a refusal lasting the whole timeout is a regression)`,
          intervals: INTERVALS_MS,
          timeout: TIMEOUT_MS,
        },
      )
      .toBe(HTTP_OK);
  } finally {
    await context.dispose();
  }
}
