import type { FullConfig } from '@playwright/test';

export default function globalTeardown(_config: FullConfig): void {
  const event = {
    event: 'test-run.end',
    run_id: process.env['TEST_RUN_ID'] ?? 'unknown',
    env_id: process.env['ENV_ID'] ?? process.env['APP_ENV'] ?? 'unknown',
    finished_at_ms: Date.now(),
  };
  process.stdout.write(`[otel-event] ${JSON.stringify(event)}\n`);
}
