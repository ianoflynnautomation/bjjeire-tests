import { test, expect } from '@shared/fixtures';
import { loadOpenApiContract } from '@api/support/api/contracts/openapi-contract';
import type { OpenApiSchema } from '@api/support/api/contracts/openapi-contract';
import { consumerSchemaFields } from './support/consumer-contract-cases';

test.describe('BjjEire API consumer contract — edge cases', { tag: ['@api', '@contract'] }, () => {
  test.describe('nullable field coverage', () => {
    test('every field marked nullable in consumer expectations is nullable in the OpenAPI schema', async ({
      apiClient,
    }) => {
      const contract = await loadOpenApiContract(apiClient);
      const nullableFields = consumerSchemaFields.filter(f => f.expected.nullable);
      const failures: string[] = [];

      for (const { schemaName, fieldName } of nullableFields) {
        const fieldSchema = contract.components?.schemas?.[schemaName]?.properties?.[fieldName];
        if (!fieldSchema) {
          failures.push(`${schemaName}.${fieldName} missing from OpenAPI`);
          continue;
        }

        const isFieldNullable =
          fieldSchema.nullable === true || fieldSchema.oneOf?.some(c => c.nullable === true) === true;
        if (!isFieldNullable) {
          failures.push(`${schemaName}.${fieldName} should be nullable`);
        }
      }

      expect(failures, `Nullable field mismatches: ${failures.join(', ')}`).toHaveLength(0);
    });

    test('no non-nullable consumer fields are marked nullable in the OpenAPI schema', async ({ apiClient }) => {
      const contract = await loadOpenApiContract(apiClient);
      const nonNullableFields = consumerSchemaFields.filter(f => !f.expected.nullable);
      const failures: string[] = [];

      for (const { schemaName, fieldName } of nonNullableFields) {
        const fieldSchema = contract.components?.schemas?.[schemaName]?.properties?.[fieldName];
        if (!fieldSchema) continue;

        const isFieldNullable =
          fieldSchema.nullable === true || fieldSchema.oneOf?.some(c => c.nullable === true) === true;
        if (isFieldNullable) {
          failures.push(`${schemaName}.${fieldName} should NOT be nullable`);
        }
      }

      expect(failures, `Non-nullable field mismatches: ${failures.join(', ')}`).toHaveLength(0);
    });
  });

  test.describe('enum coverage', () => {
    test('string enum fields in the OpenAPI schema declare enum value arrays', async ({ apiClient }) => {
      const contract = await loadOpenApiContract(apiClient);
      const enumFields = consumerSchemaFields.filter(f => ['status', 'county', 'type'].includes(f.fieldName));
      const failures: string[] = [];

      for (const { schemaName, fieldName } of enumFields) {
        const fieldSchema = contract.components?.schemas?.[schemaName]?.properties?.[fieldName];
        if (!fieldSchema) continue;

        const resolved = resolveFieldSchema(fieldSchema, contract.components?.schemas ?? {});
        if (!resolved.enum) continue;

        if (!Array.isArray(resolved.enum) || resolved.enum.length === 0) {
          failures.push(`${schemaName}.${fieldName} enum is empty or not an array`);
          continue;
        }

        for (const value of resolved.enum) {
          if (typeof value !== 'string') {
            failures.push(`${schemaName}.${fieldName} enum value ${String(value)} is not a string`);
          }
        }
      }

      expect(failures, `Enum validation failures: ${failures.join(', ')}`).toHaveLength(0);
    });
  });

  test.describe('field drift detection', () => {
    test('no consumer-expected fields are missing from the provider OpenAPI schema', async ({ apiClient }) => {
      const contract = await loadOpenApiContract(apiClient);
      const missing: string[] = [];

      for (const { schemaName, fieldName } of consumerSchemaFields) {
        const schema = contract.components?.schemas?.[schemaName];
        if (!schema?.properties?.[fieldName]) {
          missing.push(`${schemaName}.${fieldName}`);
        }
      }

      expect(missing, `Consumer-expected fields missing from OpenAPI: ${missing.join(', ')}`).toHaveLength(0);
    });

    test('provider schema has no undocumented DTO fields outside consumer expectations', async ({ apiClient }) => {
      const contract = await loadOpenApiContract(apiClient);
      const dtoNames = [...new Set(consumerSchemaFields.map(f => f.schemaName))];
      const consumerFieldsBySchema = new Map<string, Set<string>>();

      for (const { schemaName, fieldName } of consumerSchemaFields) {
        const existing = consumerFieldsBySchema.get(schemaName);
        if (existing) {
          existing.add(fieldName);
        } else {
          consumerFieldsBySchema.set(schemaName, new Set([fieldName]));
        }
      }

      const undocumented: string[] = [];
      for (const dtoName of dtoNames) {
        const schema = contract.components?.schemas?.[dtoName];
        if (!schema?.properties) continue;

        const knownFields = consumerFieldsBySchema.get(dtoName) ?? new Set<string>();
        for (const propertyName of Object.keys(schema.properties)) {
          if (!knownFields.has(propertyName)) {
            undocumented.push(`${dtoName}.${propertyName}`);
          }
        }
      }

      expect(undocumented, `Undocumented fields: ${undocumented.join(', ')}`).toHaveLength(0);
    });
  });
});

function resolveFieldSchema(
  schema: OpenApiSchema,
  schemas: Record<string, OpenApiSchema>,
): { type?: string; enum?: unknown[] } {
  if (schema.$ref) {
    const refName = schema.$ref.replace('#/components/schemas/', '');
    const resolved = schemas[refName];
    return resolved ? resolveFieldSchema(resolved, schemas) : {};
  }
  if (schema.oneOf) {
    const nonNull = schema.oneOf.find(c => !c.nullable);
    return nonNull ? resolveFieldSchema(nonNull, schemas) : {};
  }
  return schema;
}
