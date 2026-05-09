import { test, expect } from '@shared/fixtures';
import { loadOpenApiContract } from '@api/support/api/openapi-contract';
import type { OpenApiDocument } from '@api/support/api/openapi-contract';

test.describe('BjjEire API OpenAPI spec quality', { tag: ['@api', '@contract'] }, () => {
  test('OpenAPI document is version 3.0+', async ({ apiClient }) => {
    const contract = await loadOpenApiContract(apiClient);
    expect(contract.openapi).toMatch(/^3\./);
  });

  test('all operations have operationId', async ({ apiClient }) => {
    const contract = await loadOpenApiContract(apiClient);
    const missing: string[] = [];

    for (const [path, pathItem] of Object.entries(contract.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        const op = operation as { operationId?: string };
        if (!op.operationId) {
          missing.push(`${method.toUpperCase()} ${path}`);
        }
      }
    }

    expect(missing, `Operations missing operationId: ${missing.join(', ')}`).toHaveLength(0);
  });

  test('all response schemas resolve without broken $ref', async ({ apiClient }) => {
    const contract = await loadOpenApiContract(apiClient);
    const broken: string[] = [];

    for (const [path, pathItem] of Object.entries(contract.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        const op = operation as {
          responses?: Record<string, { content?: Record<string, { schema?: { $ref?: string } }> }>;
        };
        if (!op.responses) continue;

        for (const [status, response] of Object.entries(op.responses)) {
          const schemaRef = response.content?.['application/json']?.schema?.$ref;
          if (schemaRef) {
            const refName = schemaRef.replace('#/components/schemas/', '');
            if (!contract.components?.schemas?.[refName]) {
              broken.push(`${method.toUpperCase()} ${path} ${status} -> ${schemaRef}`);
            }
          }
        }
      }
    }

    expect(broken, `Broken $ref references: ${broken.join(', ')}`).toHaveLength(0);
  });

  test('component schemas have no circular $ref at the top level', async ({ apiClient }) => {
    const contract = await loadOpenApiContract(apiClient);
    const schemas = contract.components?.schemas ?? {};
    const selfRefs: string[] = [];

    for (const [name, schema] of Object.entries(schemas)) {
      if (schema.$ref) {
        const refName = schema.$ref.replace('#/components/schemas/', '');
        if (refName === name) selfRefs.push(name);
      }
    }

    expect(selfRefs, `Self-referencing schemas: ${selfRefs.join(', ')}`).toHaveLength(0);
  });

  test('all paged responses include data and pagination properties', async ({ apiClient }) => {
    const contract = await loadOpenApiContract(apiClient);
    const pagedSchemas = findPagedSchemas(contract);

    expect(pagedSchemas.length, 'Should have at least one paged response schema').toBeGreaterThan(0);

    for (const name of pagedSchemas) {
      const schema = contract.components?.schemas?.[name];
      expect(schema?.properties?.['data'], `${name} should have 'data' property`).toBeDefined();
      expect(schema?.properties?.['pagination'], `${name} should have 'pagination' property`).toBeDefined();
    }
  });
});

function findPagedSchemas(contract: OpenApiDocument): string[] {
  const schemas = contract.components?.schemas ?? {};
  return Object.keys(schemas).filter(
    name =>
      name.startsWith('PagedResponse') ||
      name.startsWith('GetGym') ||
      name.startsWith('GetBjjEvent') ||
      name.startsWith('GetCompetition') ||
      name.startsWith('GetStore'),
  );
}
