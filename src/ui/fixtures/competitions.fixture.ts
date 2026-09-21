import { mockCompetitions, mockCompetitionsPages } from '@ui/mocks/competitions.mock';
import { CompetitionsPage } from '@ui/pages/competitions/competitions.page';
import { mockFixture, pageFixture } from './mock-fixture';

export type { CompetitionsPage };
export type MockCompetitions = (body: unknown) => Promise<void>;
export type MockCompetitionsPages = (bodiesByPage: Readonly<Record<number, unknown>>) => Promise<void>;

export const competitionsPageFixture = pageFixture(CompetitionsPage);
export const mockCompetitionsFixture = mockFixture(mockCompetitions);
export const mockCompetitionsPagesFixture = mockFixture(mockCompetitionsPages);
