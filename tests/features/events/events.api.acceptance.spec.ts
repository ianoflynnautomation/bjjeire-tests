import { test, expect } from '@shared/fixtures';
import { getBjjEvents } from '@api/features/events/events.api';
import { expectPaginatedResponse } from '../../shared/pagination-contract';

test.describe('Events API Acceptance', { tag: ['@events', '@api'] }, () => {
  test.beforeEach(({ featureFlags }) => {
    test.skip(!featureFlags.BjjEvents, "feature 'BjjEvents' disabled");
  });

  test(
    'GET /api/v1/BjjEvent returns PagedResponse<BjjEventDto>',
    { tag: ['@smoke', '@acceptance'] },
    async ({ apiClient }) => {
      const response = await getBjjEvents(apiClient, { page: 1, pageSize: 25 });
      expectPaginatedResponse(response, { page: 1, pageSize: 25 });
      expect(response.data[0]?.name).toBeTruthy();
    },
  );
});
