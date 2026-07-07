/**
 * One id correlates everything a suite run produces (reports, telemetry,
 * artifacts) across shards: every shard of a CI run computes the same value
 * from GitHub's run coordinates, so cross-process stamping is not required.
 */
export function resolveRunId(): string {
  const existing = process.env['TEST_RUN_ID'];
  if (existing) return existing;

  const ghRun = process.env['GITHUB_RUN_ID'];
  const ghAttempt = process.env['GITHUB_RUN_ATTEMPT'] ?? '1';
  const id = ghRun ? `${ghRun}-${ghAttempt}` : `local-${Date.now()}`;
  process.env['TEST_RUN_ID'] = id;
  return id;
}
