import { env } from '@shared/config';

/**
 * The Given step's failure message when `MERCH_FLAG` selected the `@merch-on` set but the environment's flag endpoint
 * reports the flag off. Shared by the API and UI Given helpers, which sit on separate fixture chains.
 */
export const MERCH_FLAG_MISMATCH_MESSAGE = `MERCH_FLAG=${env.merchFlag ?? 'unset'} selected the @merch-on set but the environment's flag endpoint reports Merch: false`;
