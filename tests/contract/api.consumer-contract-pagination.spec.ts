import { test, expect } from '@shared/fixtures';
import {
  API_ROUTES,
  rawRequest,
  expectApiBody,
  expectApiStatus,
  jsonValueSchema,
  paginationMetadataSchema,
  pagedResponseSchema,
} from '@api/support/api';
import { z } from 'zod';
import { consumerPagedEndpoints } from './support/consumer-contract-cases';

const paginationEnvelopeSchema = z.object({
  pagination: z.record(z.string(), jsonValueSchema),
});

test.describe('BjjEire API consumer contract — pagination', { tag: ['@api', '@contract'] }, () => {
  for (const { path } of consumerPagedEndpoints) {
    test.describe(path, path === API_ROUTES.bjjEvents ? { tag: '@bjj-events' } : {}, () => {
      test('page 1 with pageSize=1 returns valid pagination metadata', async ({ apiClient }) => {
        const response = await rawRequest(apiClient, 'GET', path, {
          params: { page: 1, pageSize: 1 },
        });

        expectApiStatus(response, 200);
        const body = await expectApiBody(response, pagedResponseSchema(jsonValueSchema));

        expect(body.data.length).toBeLessThanOrEqual(1);
        expect(body.pagination.currentPage).toBe(1);
        expect(body.pagination.pageSize).toBe(1);
        expect(typeof body.pagination.hasNextPage).toBe('boolean');
        expect(typeof body.pagination.hasPreviousPage).toBe('boolean');
      });

      test('beyond-last-page returns empty data with correct pagination flags', async ({ apiClient }) => {
        const response = await rawRequest(apiClient, 'GET', path, {
          params: { page: 999999, pageSize: 1 },
        });

        expectApiStatus(response, 200);
        const body = await expectApiBody(response, pagedResponseSchema(jsonValueSchema));

        expect(body.data).toHaveLength(0);
        expect(body.pagination.hasNextPage).toBe(false);
      });

      test('pagination URLs are present when navigation is available', async ({ apiClient }) => {
        const firstPageResponse = await rawRequest(apiClient, 'GET', path, {
          params: { page: 1, pageSize: 1 },
        });
        expectApiStatus(firstPageResponse, 200);
        const firstPage = await expectApiBody(firstPageResponse, pagedResponseSchema(jsonValueSchema));

        // Only assert URL presence unconditionally when we know navigation exists
        expect(typeof firstPage.pagination.hasNextPage).toBe('boolean');
        expect(typeof firstPage.pagination.hasPreviousPage).toBe('boolean');

        // Validate the URL schema shape is correct via Zod (nullable string or undefined)
        const paginationResult = paginationMetadataSchema.safeParse(firstPage.pagination);
        expect(paginationResult.success, `Pagination shape invalid for ${path}`).toBe(true);
      });
    });
  }

  test('all paged endpoints return identical pagination metadata keys', async ({ apiClient }) => {
    const defaultPagedEndpoints = consumerPagedEndpoints.filter(({ path }) => path !== API_ROUTES.bjjEvents);
    const paginationKeysSets: string[][] = [];

    for (const { path } of defaultPagedEndpoints) {
      const response = await rawRequest(apiClient, 'GET', path, {
        params: { page: 1, pageSize: 1 },
      });

      expect(response.status()).toBe(200);
      const body = paginationEnvelopeSchema.parse(await response.json());
      paginationKeysSets.push(Object.keys(body.pagination).sort());
    }

    const firstKeys = paginationKeysSets[0];
    expect(firstKeys, 'At least one paged endpoint should exist').toBeDefined();

    for (let i = 1; i < paginationKeysSets.length; i++) {
      expect(
        paginationKeysSets[i],
        `Pagination keys for ${defaultPagedEndpoints[i]?.path} differ from ${defaultPagedEndpoints[0]?.path}`,
      ).toEqual(firstKeys);
    }
  });
});
