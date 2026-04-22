import { test } from '@api/fixtures/app-fixtures';
import { getCompetitions, type CompetitionDto } from '@api/features/competitions/competitions.api';

test.describe('Competitions API @competitions @api', () => {
  test('GET /api/Competition returns PagedResponse<CompetitionDto> @smoke', async ({ request }) => {
    const response = await getCompetitions(request, { page: 1, pageSize: 25 });

    test.expect(response.pagination.currentPage).toBe(1);
    test.expect(response.pagination.pageSize).toBe(25);
    test.expect(response.data.length).toBeLessThanOrEqual(25);

    for (const competition of response.data) {
      const typedCompetition: CompetitionDto = competition;
      test.expect(typedCompetition.name).toBeTruthy();
      test.expect(Array.isArray(typedCompetition.tags)).toBeTruthy();
      test.expect(typeof typedCompetition.isActive).toBe('boolean');
    }
  });
});
