import { existsSync, readFileSync } from 'node:fs';
import type { APIRequestContext, APIResponse } from '@playwright/test';
import { API_ROUTES } from './routes';

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
  const artifactPath = process.env.OPENAPI_CONTRACT_PATH?.trim();
  if (artifactPath && existsSync(artifactPath)) {
    return JSON.parse(readFileSync(artifactPath, 'utf8')) as OpenApiDocument;
  }

  const response = await apiClient.get(API_ROUTES.openApiV1, { failOnStatusCode: false });
  if (!response.ok()) {
    throw new Error(
      `OpenAPI contract not found. Set OPENAPI_CONTRACT_PATH to a downloaded provider artifact. ` +
        `Fallback GET /openapi/v1.json returned ${response.status()}.`,
    );
  }

  return (await response.json()) as OpenApiDocument;
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

  const body = (await response.json()) as JsonValue;
  assertJsonMatchesSchema(body, schema, document, '$');
  return body;
}

export function assertJsonMatchesSchema(
  value: JsonValue,
  schema: OpenApiSchema,
  document: OpenApiDocument,
  path: string,
): void {
  const resolved = resolveSchema(schema, document);

  if (resolved.nullable && value === null) {
    return;
  }

  if (resolved.oneOf?.some(candidate => matchesSchema(value, candidate, document))) {
    return;
  }

  if (resolved.anyOf?.some(candidate => matchesSchema(value, candidate, document))) {
    return;
  }

  if (resolved.allOf) {
    for (const candidate of resolved.allOf) {
      assertJsonMatchesSchema(value, candidate, document, path);
    }
    return;
  }

  const type = resolved.type ?? (resolved.properties ? 'object' : undefined);
  switch (type) {
    case 'object':
      assertObjectMatchesSchema(value, resolved, document, path);
      return;
    case 'array': {
      if (!Array.isArray(value)) throw new Error(`${path} should be an array.`);
      const itemsSchema = resolved.items;
      if (itemsSchema) {
        value.forEach((item, index) => {
          assertJsonMatchesSchema(item, itemsSchema, document, `${path}[${index}]`);
        });
      }
      return;
    }
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
