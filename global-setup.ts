import type { FullConfig } from '@playwright/test';

const SECONDS_PER_MINUTE = 60;
const STALE_DEPLOY_THRESHOLD_MIN = Number(process.env['STALE_DEPLOY_THRESHOLD_MIN'] ?? '30');
// Only staging: it's redeployed by CI immediately before the suite runs, so
// a stale pod indicates a cached-image rollout. dev is a long-lived shared
// environment, so the check produces false positives on every local run.
const FRESHNESS_CHECK_PROFILES = new Set(['staging']);
const METRICS_TIMEOUT_MS = 10_000;
const PROCESS_START_REGEX = /^process_start_time_seconds\s+(\d+(?:\.\d+)?)/m;

export default async function globalSetup(_config: FullConfig): Promise<void> {
  const runId = stampRunId();
  await assertFreshDeployIfEphemeral();
  emitRunStartEvent(runId);
}

function stampRunId(): string {
  const existing = process.env['TEST_RUN_ID'];
  if (existing) return existing;

  const ghRun = process.env['GITHUB_RUN_ID'];
  const ghAttempt = process.env['GITHUB_RUN_ATTEMPT'] ?? '1';
  const id = ghRun ? `${ghRun}-${ghAttempt}` : `local-${Date.now()}`;
  process.env['TEST_RUN_ID'] = id;
  return id;
}

async function assertFreshDeployIfEphemeral(): Promise<void> {
  const profile = process.env['APP_ENV'] ?? '';
  if (!FRESHNESS_CHECK_PROFILES.has(profile)) return;

  const apiUrl = process.env['API_URL'];
  if (!apiUrl) {
    log(`[global-setup] API_URL unset on profile '${profile}' — skipping freshness check`, 'warn');
    return;
  }

  const url = `${apiUrl.replace(/\/+$/, '')}/metrics`;
  const headers: Record<string, string> = {};
  const cfId = process.env['CF_ACCESS_CLIENT_ID'];
  const cfSecret = process.env['CF_ACCESS_CLIENT_SECRET'];
  if (cfId && cfSecret) {
    headers['CF-Access-Client-Id'] = cfId;
    headers['CF-Access-Client-Secret'] = cfSecret;
  }

  let body: string;
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(METRICS_TIMEOUT_MS) });
    if (!res.ok) {
      log(`[global-setup] /metrics returned ${res.status} — skipping freshness check`, 'warn');
      return;
    }
    body = await res.text();
  } catch (err) {
    log(`[global-setup] /metrics unreachable (${(err as Error).message}) — skipping freshness check`, 'warn');
    return;
  }

  const match = PROCESS_START_REGEX.exec(body);
  if (!match?.[1]) {
    log('[global-setup] process_start_time_seconds missing from /metrics — skipping freshness check', 'warn');
    return;
  }

  const startSec = Number(match[1]);
  const ageMin = (Date.now() / 1000 - startSec) / SECONDS_PER_MINUTE;
  if (ageMin > STALE_DEPLOY_THRESHOLD_MIN) {
    throw new Error(
      `API pod start time is ${ageMin.toFixed(1)}min old (threshold ${STALE_DEPLOY_THRESHOLD_MIN}min). Helm may have rolled out a cached image — verify IMAGE_TAG and redeploy.`,
    );
  }
  log(`[global-setup] API pod fresh (${ageMin.toFixed(1)}min since start)`);
}

function emitRunStartEvent(runId: string): void {
  const event = {
    event: 'test-run.start',
    run_id: runId,
    env_id: process.env['ENV_ID'] ?? process.env['APP_ENV'] ?? 'unknown',
    image_tag: process.env['IMAGE_TAG'] ?? null,
    branch: process.env['GITHUB_REF_NAME'] ?? null,
    commit_sha: process.env['GITHUB_SHA'] ?? null,
    started_at_ms: Date.now(),
  };
  log(`[otel-event] ${JSON.stringify(event)}`);
}

function log(message: string, level: 'info' | 'warn' = 'info'): void {
  process[level === 'warn' ? 'stderr' : 'stdout'].write(`${message}\n`);
}
