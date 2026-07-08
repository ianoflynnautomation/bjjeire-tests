import { createHash } from 'crypto';
import { resolveRunId } from '@shared/config/run-id';

/**
 * Deterministic W3C trace context per test attempt.
 *
 * Fixtures (worker processes) inject `traceparent` into browser contexts and
 * API request contexts; the OTel reporter (main process) mints the test span
 * with the SAME ids via a custom IdGenerator. Both sides derive the ids from
 * (run id, test id, retry) — no cross-process coordination — so every app
 * span a test causes lands in the test span's own trace.
 */
export type W3CTraceContext = Readonly<{
  traceId: string;
  spanId: string;
  traceparent: string;
}>;

const TRACE_ID_HEX_LENGTH = 32;
const SPAN_ID_HEX_LENGTH = 16;
const SAMPLED_FLAG = '01';

export function testTraceContext(testId: string, retry: number): W3CTraceContext {
  const hash = createHash('sha256').update(`${resolveRunId()}|${testId}|${retry}`).digest('hex');
  const traceId = nonZeroHex(hash.slice(0, TRACE_ID_HEX_LENGTH));
  const spanId = nonZeroHex(hash.slice(TRACE_ID_HEX_LENGTH, TRACE_ID_HEX_LENGTH + SPAN_ID_HEX_LENGTH));
  return { traceId, spanId, traceparent: `00-${traceId}-${spanId}-${SAMPLED_FLAG}` };
}

export function buildTraceHeaders(trace: W3CTraceContext): Record<string, string> {
  return {
    traceparent: trace.traceparent,
    'x-test-run-id': resolveRunId(),
  };
}

/**
 * Annotations surfaced in the Playwright HTML report: the trace id always,
 * plus a clickable Grafana Explore→Tempo link when GRAFANA_URL is set
 * (e.g. http://localhost:3000 with `npm run otel:grafana`).
 */
export function traceAnnotations(trace: W3CTraceContext): { type: string; description: string }[] {
  const annotations = [{ type: 'trace-id', description: trace.traceId }];
  const grafanaUrl = process.env['GRAFANA_URL'];
  if (grafanaUrl) {
    const explore = encodeURIComponent(
      JSON.stringify({
        datasource: 'tempo',
        queries: [{ query: trace.traceId, queryType: 'traceql' }],
        range: { from: 'now-24h', to: 'now' },
      }),
    );
    annotations.push({ type: 'trace', description: `${grafanaUrl.replace(/\/+$/, '')}/explore?left=${explore}` });
  }
  return annotations;
}

function nonZeroHex(hex: string): string {
  return /^0+$/.test(hex) ? `1${hex.slice(1)}` : hex;
}
