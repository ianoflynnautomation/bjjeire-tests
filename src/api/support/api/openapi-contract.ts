import { existsSync, readFileSync } from 'node:fs';
import type { APIRequestContext, APIResponse } from '@playwright/test';
import { readEnv } from '@shared/config';
import { API_ROUTES } from './routing/routes';

export const JSON_CONTENT_TYPE = 'application/json';
const SCHEMA_REF_PREFIX = '#/components/schemas/';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = Record<string, JsonValue>;

export type OpenApiDocument = {
  openapi: string;
  paths: Record<string, Record<string, OpenApiOperation>>;
  components?: {
    schemas?: Record<string, OpenApiSchema>;
  };
};

type OpenApiOperation = {
  responses?: Record<string, OpenApiResponse>;
};

type OpenApiResponse = {
  content?: Record<string, { schema?: OpenApiSchema }>;
};

export type OpenApiSchema = {
  $ref?: string;
  type?: string;
  nullable?: boolean;
  properties?: Record<string, OpenApiSchema>;
  required?: string[];
  items?: OpenApiSchema;
  additionalProperties?: boolean | OpenApiSchema;
  oneOf?: OpenApiSchema[];
  anyOf?: OpenApiSchema[];
  allOf?: OpenApiSchema[];
  enum?: JsonValue[];
};

export type OpenApiFieldExpectation = {
  readonly type: string;
  readonly nullable: boolean;
  readonly required?: boolean;
};

let openApiContractPromise: Promise<OpenApiDocument> | undefined;

export async function loadOpenApiContract(apiClient: APIRequestContext): Promise<OpenApiDocument> {
  openApiContractPromise ??= readOpenApiContract(apiClient);
  return openApiContractPromise;
}

async function readOpenApiContract(apiClient: APIRequestContext): Promise<OpenApiDocument> {
  const artifactPath = readEnv('OPENAPI_CONTRACT_PATH');
  if (artifactPath && existsSync(artifactPath)) {
    return parseOpenApiDocument(JSON.parse(readFileSync(artifactPath, 'utf8')), artifactPath);
  }

  const response = await apiClient.get(API_ROUTES.openApiV1, { failOnStatusCode: false });
  if (!response.ok()) {
    throw new Error(
      `OpenAPI contract not found. Set OPENAPI_CONTRACT_PATH to a downloaded provider artifact. ` +
        `Fallback GET /openapi/v1.json returned ${response.status()}.`,
    );
  }

  return parseOpenApiDocument(await response.json(), API_ROUTES.openApiV1);
}

export function expectOpenApiPath(document: OpenApiDocument, method: string, path: string): void {
  const pathItem = document.paths[path];
  if (!pathItem) {
    throw new Error(`OpenAPI path '${path}' is missing.`);
  }

  if (!pathItem[method.toLowerCase()]) {
    throw new Error(`OpenAPI operation '${method.toUpperCase()} ${path}' is missing.`);
  }
}

export function expectOpenApiField(
  document: OpenApiDocument,
  schemaName: string,
  fieldName: string,
  expected: OpenApiFieldExpectation,
): void {
  const schema = document.components?.schemas?.[schemaName];
  if (!schema?.properties?.[fieldName]) {
    throw new Error(`OpenAPI field '${schemaName}.${fieldName}' is missing.`);
  }

  const fieldSchema = schema.properties[fieldName];
  const effectiveSchema = resolveEffectiveSchema(fieldSchema, document);
  const actualType = effectiveSchema.type ?? (effectiveSchema.properties ? 'object' : undefined);
  if (actualType !== expected.type) {
    throw new Error(
      `OpenAPI field '${schemaName}.${fieldName}' type changed: expected ${expected.type}, received ${actualType}.`,
    );
  }

  const actualNullable = isNullable(fieldSchema, document);
  if (actualNullable !== expected.nullable) {
    throw new Error(
      `OpenAPI field '${schemaName}.${fieldName}' nullability changed: expected ${expected.nullable}, received ${actualNullable}.`,
    );
  }

  if (expected.required !== undefined) {
    const actualRequired = schema.required?.includes(fieldName) === true;
    if (actualRequired !== expected.required) {
      throw new Error(
        `OpenAPI field '${schemaName}.${fieldName}' requiredness changed: expected ${expected.required}, received ${actualRequired}.`,
      );
    }
  }
}

export async function expectResponseMatchesOpenApi(
  response: APIResponse,
  document: OpenApiDocument,
  method: string,
  path: string,
): Promise<JsonValue> {
  const operation = document.paths[path]?.[method.toLowerCase()];
  const statusCode = response.status().toString();
  const schema = operation?.responses?.[statusCode]?.content?.[JSON_CONTENT_TYPE]?.schema;
  if (!schema) {
    throw new Error(
      `OpenAPI response schema '${method.toUpperCase()} ${path} ${statusCode} ${JSON_CONTENT_TYPE}' is missing.`,
    );
  }

  const body = parseJsonValue(await response.json(), `${method.toUpperCase()} ${path} response body`);
  assertJsonMatchesSchema(body, schema, document, '$');
  return body;
}

/**
 * Returns true if `resolved` was a polymorphic composition (nullable/oneOf/
 * anyOf/allOf) and the value has been fully asserted against it. Returning
 * true tells the caller to skip the type-class dispatch below.
 */
function assertPolymorphicSchema(
  value: JsonValue,
  resolved: OpenApiSchema,
  document: OpenApiDocument,
  path: string,
): boolean {
  if (resolved.nullable && value === null) return true;
  if (resolved.oneOf?.some(candidate => matchesSchema(value, candidate, document))) return true;
  if (resolved.anyOf?.some(candidate => matchesSchema(value, candidate, document))) return true;
  if (!resolved.allOf) return false;
  for (const candidate of resolved.allOf) {
    assertJsonMatchesSchema(value, candidate, document, path);
  }
  return true;
}

/**
 * Dispatches a non-polymorphic schema to the matching type-class assertion.
 * Pre-condition: caller has already handled nullable/oneOf/anyOf/allOf.
 *
 * Complexity is high (one branch per JSON-schema type-class) but each branch
 * is a single assertion call — cognitively flat. Splitting into a strategy
 * map would over-engineer for the savings.
 */
function assertScalarOrCollectionSchema(
  value: JsonValue,
  resolved: OpenApiSchema,
  document: OpenApiDocument,
  path: string,
): void {
  const type = resolved.type ?? (resolved.properties ? 'object' : undefined);
  switch (type) {
    case 'object':
      assertObjectMatchesSchema(value, resolved, document, path);
      return;
    case 'array':
      assertArrayMatchesSchema(value, resolved, document, path);
      return;
    case 'string':
      if (typeof value !== 'string') throw new Error(`${path} should be a string.`);
      assertEnumValue(value, resolved, path);
      return;
    case 'integer':
      if (!Number.isInteger(value)) throw new Error(`${path} should be an integer.`);
      assertEnumValue(value, resolved, path);
      return;
    case 'number':
      if (typeof value !== 'number') throw new Error(`${path} should be a number.`);
      return;
    case 'boolean':
      if (typeof value !== 'boolean') throw new Error(`${path} should be a boolean.`);
      return;
    case undefined:
      return;
  }
}

function assertArrayMatchesSchema(
  value: JsonValue,
  schema: OpenApiSchema,
  document: OpenApiDocument,
  path: string,
): void {
  if (!Array.isArray(value)) throw new Error(`${path} should be an array.`);
  const itemsSchema = schema.items;
  if (!itemsSchema) return;
  value.forEach((item, index) => {
    assertJsonMatchesSchema(item, itemsSchema, document, `${path}[${index}]`);
  });
}

export function assertJsonMatchesSchema(
  value: JsonValue,
  schema: OpenApiSchema,
  document: OpenApiDocument,
  path: string,
): void {
  const resolved = resolveSchema(schema, document);
  if (assertPolymorphicSchema(value, resolved, document, path)) return;
  assertScalarOrCollectionSchema(value, resolved, document, path);
}

export function toJsonValue(value: unknown, source = 'value'): JsonValue {
  return parseJsonValue(value, source);
}

function assertObjectMatchesSchema(
  value: JsonValue,
  schema: OpenApiSchema,
  document: OpenApiDocument,
  path: string,
): void {
  if (!isJsonObject(value)) {
    throw new Error(`${path} should be an object.`);
  }

  for (const propertyName of schema.required ?? []) {
    if (!(propertyName in value)) {
      throw new Error(`${path}.${propertyName} is required by OpenAPI.`);
    }
  }

  for (const [propertyName, propertySchema] of Object.entries(schema.properties ?? {})) {
    if (value[propertyName] !== undefined) {
      assertJsonMatchesSchema(value[propertyName], propertySchema, document, `${path}.${propertyName}`);
    }
  }

  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    for (const [propertyName, propertyValue] of Object.entries(value)) {
      if (!schema.properties?.[propertyName]) {
        assertJsonMatchesSchema(propertyValue, schema.additionalProperties, document, `${path}.${propertyName}`);
      }
    }
  }
}

function matchesSchema(value: JsonValue, schema: OpenApiSchema, document: OpenApiDocument): boolean {
  try {
    assertJsonMatchesSchema(value, schema, document, '$');
    return true;
  } catch {
    return false;
  }
}

export function resolveSchema(schema: OpenApiSchema, document: OpenApiDocument): OpenApiSchema {
  if (!schema.$ref) {
    return schema;
  }

  const schemaName = schema.$ref.replace(SCHEMA_REF_PREFIX, '');
  const resolved = document.components?.schemas?.[schemaName];
  if (!resolved) {
    throw new Error(`OpenAPI schema reference '${schema.$ref}' could not be resolved.`);
  }

  return resolved;
}

function resolveEffectiveSchema(schema: OpenApiSchema, document: OpenApiDocument): OpenApiSchema {
  const resolved = resolveSchema(schema, document);
  const nonNullableOneOf = resolved.oneOf?.find(candidate => !candidate.nullable);
  return nonNullableOneOf ? resolveEffectiveSchema(nonNullableOneOf, document) : resolved;
}

function isNullable(schema: OpenApiSchema, document: OpenApiDocument): boolean {
  return schema.nullable === true || schema.oneOf?.some(candidate => isNullable(candidate, document)) === true;
}

function assertEnumValue(value: JsonValue, schema: OpenApiSchema, path: string): void {
  if (!schema.enum) {
    return;
  }

  if (!schema.enum.some(enumValue => enumValue === value)) {
    throw new Error(`${path} should match the documented enum.`);
  }
}

function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseOpenApiDocument(value: unknown, source: string): OpenApiDocument {
  if (!isJsonObjectLike(value) || typeof value['openapi'] !== 'string' || !isJsonObjectLike(value['paths'])) {
    throw new Error(`OpenAPI contract from ${source} is not a valid document.`);
  }

  return value as OpenApiDocument;
}

function parseJsonValue(value: unknown, source: string): JsonValue {
  if (!isJsonValue(value)) {
    throw new Error(`${source} is not JSON-serializable.`);
  }

  return value;
}

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null) return true;
  const valueType = typeof value;
  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') return true;
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (!isJsonObjectLike(value)) return false;
  return Object.values(value).every(isJsonValue);
}

function isJsonObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
