import { env } from '@shared/config';

/**
 * The Given step's failure message when `BJJEIRE_COMPETITIONS_FLAG` selected the `@bjjeire-competitions-on` set but the
 * environment's flag endpoint reports the flag off. Shared by the API and UI Given helpers, which sit on separate
 * fixture chains.
 */
export const FLAG_MISMATCH_MESSAGE = `BJJEIRE_COMPETITIONS_FLAG=${env.bjjEireCompetitionsFlag ?? 'unset'} selected the @bjjeire-competitions-on set but the environment's flag endpoint reports BjjEireCompetitions: false`;
