import { test } from '@api/fixtures/app-fixtures';
import { getBjjEvents, type BjjEventDto } from '@api/features/events/events.api';

test.describe('Events API @events @api', () => {
  test.beforeEach(({ featureFlags }) => {
    test.skip(!featureFlags.BjjEvents, "feature 'BjjEvents' disabled");
  });

  test('GET /api/BjjEvent returns PagedResponse<BjjEventDto> @smoke', async ({ request }) => {
    const response = await getBjjEvents(request, { page: 1, pageSize: 25 });

    test.expect(response.pagination.currentPage).toBe(1);
    test.expect(response.pagination.pageSize).toBe(25);
    test.expect(response.data.length).toBeLessThanOrEqual(25);

    for (const event of response.data) {
      const typedEvent: BjjEventDto = event;
      test.expect(typedEvent.name).toBeTruthy();
      test.expect(typeof typedEvent.type).toBe('number');
      test.expect(typedEvent.socialMedia).toBeTruthy();
      test.expect(Array.isArray(typedEvent.schedule.hours)).toBeTruthy();
    }
  });
});
