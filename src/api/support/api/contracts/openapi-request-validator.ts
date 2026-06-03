import type { OpenApiDocument, OpenApiSchema, JsonValue } from './openapi-contract';
import { JSON_CONTENT_TYPE, assertJsonMatchesSchema, resolveSchema } from './openapi-contract';

function getRequestBodySchema(document: OpenApiDocument, method: string, path: string): OpenApiSchema {
  const pathItem = document.paths[path];
  if (!pathItem) {
    throw new Error(`OpenAPI path '${path}' is missing.`);
  }

  const operation = pathItem[method.toLowerCase()];
  if (!operation) {
    throw new Error(`OpenAPI operation '${method.toUpperCase()} ${path}' is missing.`);
  }

  const schema = operation.requestBody?.content?.[JSON_CONTENT_TYPE]?.schema;
  if (!schema) {
    throw new Error(`OpenAPI request body schema '${method.toUpperCase()} ${path} ${JSON_CONTENT_TYPE}' is missing.`);
  }

  return schema;
}

export function expectRequestBodyMatchesOpenApi(
  document: OpenApiDocument,
  method: string,
  path: string,
  body: JsonValue,
): void {
  const requestSchema = getRequestBodySchema(document, method, path);
  const resolved = resolveSchema(requestSchema, document);
  assertJsonMatchesSchema(body, resolved, document, '$');
}

export function expectOpenApiRequestSchemaRef(
  document: OpenApiDocument,
  method: string,
  path: string,
  schemaName: string,
): void {
  const requestSchema = getRequestBodySchema(document, method, path);
  const expectedRef = `#/components/schemas/${schemaName}`;
  if (requestSchema.$ref !== expectedRef) {
    throw new Error(
      `OpenAPI request schema for ${method.toUpperCase()} ${path} changed: expected ${expectedRef}, received ${
        requestSchema.$ref ?? '<inline schema>'
      }.`,
    );
  }
}
