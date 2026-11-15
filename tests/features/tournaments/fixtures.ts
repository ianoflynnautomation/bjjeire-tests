import { TournamentAdminPage } from '@ui/pages/tournaments/tournament-admin.page';
import { TournamentPage } from '@ui/pages/tournaments/tournament.page';
import { TournamentsPage } from '@ui/pages/tournaments/tournaments.page';
import { test as core } from '@ui/fixtures';
import { pageFixture } from '@ui/fixtures/page-fixture';

export type TournamentsUiFixtures = {
  tournamentsPage: TournamentsPage;
  tournamentPage: TournamentPage;
  tournamentAdminPage: TournamentAdminPage;
};

export const test = core.extend<TournamentsUiFixtures>({
  tournamentsPage: pageFixture(TournamentsPage),
  tournamentPage: pageFixture(TournamentPage),
  tournamentAdminPage: pageFixture(TournamentAdminPage),
});

/**
 * Option values every tournaments UI spec runs with — each of them calls
 * `test.use(tournamentsTestConfig)`. Tournaments is off unless an environment
 * enables it, so a spec that needs it on sets it here or in the file.
 */
export const tournamentsTestConfig: Parameters<typeof test.use>[0] = {};

export { expect } from '@ui/fixtures';
