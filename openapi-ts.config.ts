import { defineConfig } from '@hey-api/openapi-ts';

// Schemas only. The Playwright client stays in src/api/features; this file is
// the runtime parse of the served OpenAPI document, not a second HTTP client.
export default defineConfig({
  input: './contracts/openapi-v1.json',
  output: 'src/api/generated',
  plugins: [
    {
      name: 'zod',
      requests: false,
      responses: false,
      webhooks: false,
      definitions: {
        name: 'z{{name}}',
      },
      // Jackson Instant is emitted as ...Z. offset also accepts +00:00.
      dates: { offset: true },
      // int64 is a JSON number here (page totals). Zod's default bigint
      // output breaks the numeric assertions in the acceptance specs.
      $resolvers: {
        number(ctx) {
          if (ctx.schema.format !== 'int64') return undefined;
          const { $ } = ctx;
          ctx.nodes.base = () => $(ctx.plugin.imports.z).attr('number').call();
          ctx.nodes.min = () => undefined;
          ctx.nodes.max = () => undefined;
          return undefined;
        },
      },
    },
  ],
});
