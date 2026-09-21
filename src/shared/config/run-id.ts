import { readEnv } from './process-env';

/**
 * One id correlates everything a suite run produces (reports, telemetry,
 * artifacts) across processes: the main process, every worker, and — in CI —
 * every shard.
 *
 * In CI the id is derived from GitHub's run coordinates, so each shard computes
 * the same value independently. Locally there is nothing to derive from, so the
 * first caller stamps `TEST_RUN_ID` into the environment. That stamping only
 * reaches workers if it happens BEFORE they spawn, which is why
 * `createBaseConfig` calls this at config-load time in the main process:
 * workers inherit the environment at spawn and re-read it here.
 *
 * Without that early call each worker mints its own `local-<timestamp>`, the
 * `traceparent` a worker injects no longer matches the ids the reporter mints
 * for the same test, and app spans stop nesting under their test span.
 */
export function resolveRunId(): string {
  const existing = readEnv('TEST_RUN_ID');
  if (existing) return existing;

  const ghRun = readEnv('GITHUB_RUN_ID');
  const id = ghRun ? `${ghRun}-${readEnv('GITHUB_RUN_ATTEMPT') ?? '1'}` : `local-${Date.now()}`;
  process.env['TEST_RUN_ID'] = id;
  return id;
}
