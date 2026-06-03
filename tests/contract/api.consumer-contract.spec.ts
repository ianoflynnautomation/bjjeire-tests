import { test, expect } from '@shared/fixtures';
import {
  expectOpenApiField,
  expectOpenApiPath,
  expectResponseMatchesOpenApi,
  loadOpenApiContract,
  toJsonValue,
} from '@api/support/api/contracts/openapi-contract';
import {
  expectOpenApiRequestSchemaRef,
  expectRequestBodyMatchesOpenApi,
} from '@api/support/api/contracts/openapi-request-validator';
import {
  rawRequest,
  API_ROUTES,
  expectApiBody,
  expectApiStatus,
  pagedResponseSchema,
  gymSchema,
  bjjEventSchema,
  competitionSchema,
  storeSchema,
  featureFlagMapSchema,
} from '@api/support/api';
import { buildGym } from '@api/features/gyms/gyms.builder';
import { buildBjjEvent } from '@api/features/events/events.builder';
import type { RunId } from '@shared/types';
import { consumerReadEndpoints, consumerSchemaFields, consumerWriteEndpoints } from './support/consumer-contract-cases';

test.describe('BjjEire API consumer contract', { tag: ['@api', '@contract'] }, () => {
  test.describe('OpenAPI structural assertions', () => {
    test('provider contract exposes consumer-critical v1 read endpoints', async ({ apiClient }) => {
      const contract = await loadOpenApiContract(apiClient);
      const defaultReadEndpoints = consumerReadEndpoints.filter(([, path]) => path !== API_ROUTES.bjjEvents);

      for (const [method, path] of defaultReadEndpoints) {
        expectOpenApiPath(contract, method, path);
      }
    });

    test('provider contract keeps consumer-critical fields compatible', async ({ apiClient }) => {
      const contract = await loadOpenApiContract(apiClient);

      for (const { schemaName, fieldName, expected } of consumerSchemaFields) {
        expectOpenApiField(contract, schemaName, fieldName, expected);
      }
    });
  });

  test.describe('OpenAPI response validation', () => {
    test(
      'GET /api/v1/gym paged envelope satisfies the published provider contract',
      { tag: ['@gyms'] },
      async ({ apiClient }) => {
        const contract = await loadOpenApiContract(apiClient);
        const response = await rawRequest(apiClient, 'GET', API_ROUTES.gyms, {
          params: { page: 999999, pageSize: 1 },
        });

        const body = await expectResponseMatchesOpenApi(response, contract, 'GET', API_ROUTES.gyms);
        expect(body).toMatchObject({ data: expect.any(Array), pagination: expect.any(Object) });
      },
    );

    test(
      'GET /api/v1/bjjevent paged envelope satisfies the published provider contract',
      { tag: ['@bjj-events'] },
      async ({ apiClient }) => {
        const contract = await loadOpenApiContract(apiClient);
        const response = await rawRequest(apiClient, 'GET', API_ROUTES.bjjEvents, {
          params: { page: 1, pageSize: 1 },
        });

        const body = await expectResponseMatchesOpenApi(response, contract, 'GET', API_ROUTES.bjjEvents);
        expect(body).toMatchObject({ data: expect.any(Array), pagination: expect.any(Object) });
      },
    );

    test(
      'GET /api/v1/competition paged envelope satisfies the published provider contract',
      { tag: ['@competitions'] },
      async ({ apiClient }) => {
        const contract = await loadOpenApiContract(apiClient);
        const response = await rawRequest(apiClient, 'GET', API_ROUTES.competitions, {
          params: { page: 1, pageSize: 1 },
        });

        const body = await expectResponseMatchesOpenApi(response, contract, 'GET', API_ROUTES.competitions);
        expect(body).toMatchObject({ data: expect.any(Array), pagination: expect.any(Object) });
      },
    );

    test(
      'GET /api/v1/store paged envelope satisfies the published provider contract',
      { tag: ['@stores'] },
      async ({ apiClient }) => {
        const contract = await loadOpenApiContract(apiClient);
        const response = await rawRequest(apiClient, 'GET', API_ROUTES.stores, {
          params: { page: 1, pageSize: 1 },
        });

        const body = await expectResponseMatchesOpenApi(response, contract, 'GET', API_ROUTES.stores);
        expect(body).toMatchObject({ data: expect.any(Array), pagination: expect.any(Object) });
      },
    );

    test(
      'GET /api/v1/featureflag map satisfies the published provider contract',
      { tag: ['@feature-flags'] },
      async ({ apiClient }) => {
        const contract = await loadOpenApiContract(apiClient);
        const response = await rawRequest(apiClient, 'GET', API_ROUTES.featureFlags);

        const body = await expectResponseMatchesOpenApi(response, contract, 'GET', API_ROUTES.featureFlags);
        expect(body).toEqual(expect.any(Object));
      },
    );
  });

  test.describe('OpenAPI request body validation', () => {
    const runId = 'contract-test' as RunId;

    test('POST /api/v1/gym factory body matches the published provider request schema', async ({ apiClient }) => {
      const contract = await loadOpenApiContract(apiClient);
      const gym = buildGym(runId);
      expectRequestBodyMatchesOpenApi(
        contract,
        'POST',
        API_ROUTES.gyms,
        toJsonValue({ data: gym }, 'gym request body'),
      );
    });

    test(
      'POST /api/v1/bjjevent factory body matches the published provider request schema',
      { tag: '@bjj-events' },
      async ({ apiClient }) => {
        const contract = await loadOpenApiContract(apiClient);
        const event = buildBjjEvent(runId);
        expectRequestBodyMatchesOpenApi(
          contract,
          'POST',
          API_ROUTES.bjjEvents,
          toJsonValue({ data: event }, 'BJJ event request body'),
        );
      },
    );

    test('all consumer write endpoints have documented request schemas', async ({ apiClient }) => {
      const contract = await loadOpenApiContract(apiClient);
      const defaultWriteEndpoints = consumerWriteEndpoints.filter(({ path }) => path !== API_ROUTES.bjjEvents);

      for (const { method, path, requestSchema } of defaultWriteEndpoints) {
        expectOpenApiPath(contract, method, path);
        const schema = contract.components?.schemas?.[requestSchema];
        expect(schema, `Request schema '${requestSchema}' for ${method} ${path} is missing`).toBeDefined();
        expectOpenApiRequestSchemaRef(contract, method, path, requestSchema);
      }
    });
  });

  test.describe('Zod schema runtime validation', () => {
    test('GET /api/v1/gym response parses through consumer Zod schema', { tag: ['@gyms'] }, async ({ apiClient }) => {
      const response = await rawRequest(apiClient, 'GET', API_ROUTES.gyms, { params: { page: 1, pageSize: 5 } });
      expectApiStatus(response, 200);
      await expectApiBody(response, pagedResponseSchema(gymSchema));
    });

    test(
      'GET /api/v1/bjjevent response parses through consumer Zod schema',
      { tag: ['@bjj-events'] },
      async ({ apiClient }) => {
        const response = await rawRequest(apiClient, 'GET', API_ROUTES.bjjEvents, { params: { page: 1, pageSize: 5 } });
        expectApiStatus(response, 200);
        await expectApiBody(response, pagedResponseSchema(bjjEventSchema));
      },
    );

    test(
      'GET /api/v1/competition response parses through consumer Zod schema',
      { tag: ['@competitions'] },
      async ({ apiClient }) => {
        const response = await rawRequest(apiClient, 'GET', API_ROUTES.competitions, {
          params: { page: 1, pageSize: 5 },
        });
        expectApiStatus(response, 200);
        await expectApiBody(response, pagedResponseSchema(competitionSchema));
      },
    );

    test(
      'GET /api/v1/store response parses through consumer Zod schema',
      { tag: ['@stores'] },
      async ({ apiClient }) => {
        const response = await rawRequest(apiClient, 'GET', API_ROUTES.stores, { params: { page: 1, pageSize: 5 } });
        expectApiStatus(response, 200);
        await expectApiBody(response, pagedResponseSchema(storeSchema));
      },
    );

    test(
      'GET /api/v1/featureflag response parses through consumer Zod schema',
      { tag: ['@feature-flags'] },
      async ({ apiClient }) => {
        const response = await rawRequest(apiClient, 'GET', API_ROUTES.featureFlags);
        expectApiStatus(response, 200);
        await expectApiBody(response, featureFlagMapSchema);
      },
    );
  });
});
