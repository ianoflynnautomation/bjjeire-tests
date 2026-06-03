import type { OpenApiFieldExpectation } from '@api/support/api/contracts/openapi-contract';
import { API_ROUTES } from '@api/support/api';
import contractCases from './contract-cases.json';

export type ConsumerSchemaField = {
  readonly schemaName: string;
  readonly fieldName: string;
  readonly expected: OpenApiFieldExpectation;
};

export const consumerReadEndpoints = [
  ['GET', API_ROUTES.gyms],
  ['GET', API_ROUTES.bjjEvents],
  ['GET', API_ROUTES.competitions],
  ['GET', API_ROUTES.stores],
  ['GET', API_ROUTES.featureFlags],
] as const;

export const consumerWriteEndpoints = [
  { method: 'POST', path: API_ROUTES.gyms, requestSchema: 'CreateGymCommand' },
  { method: 'POST', path: API_ROUTES.bjjEvents, requestSchema: 'CreateBjjEventCommand' },
] as const;

export const consumerPagedEndpoints = [
  { path: API_ROUTES.gyms, responseSchema: 'PagedResponseOfGymDto' },
  { path: API_ROUTES.bjjEvents, responseSchema: 'PagedResponseOfBjjEventDto' },
  { path: API_ROUTES.competitions, responseSchema: 'PagedResponseOfCompetitionDto' },
  { path: API_ROUTES.stores, responseSchema: 'PagedResponseOfStoreDto' },
] as const;

export const consumerSchemaFields: readonly ConsumerSchemaField[] = contractCases.schemaFields.map(f => ({
  schemaName: f.schemaName,
  fieldName: f.fieldName,
  expected: {
    type: f.type,
    nullable: f.nullable,
    required: f.required,
  },
}));
