import { test, expect } from '@shared/fixtures';
import { getCompetitions } from '@api/features/competitions/competitions.api';
import { expectPaginatedResponse } from '../../shared/pagination-contract';

test.describe('Competitions API Acceptance', { tag: ['@competitions', '@api'] }, () => {
  test(
    'GET /api/Competition returns PagedResponse<CompetitionDto>',
    { tag: ['@smoke', '@acceptance'] },
    async ({ apiClient }) => {
      const response = await getCompetitions(apiClient, { page: 1, pageSize: 25 });
      expectPaginatedResponse(response, { page: 1, pageSize: 25 });
      expect(response.data[0]?.name).toBeTruthy();
    },
  );
});
