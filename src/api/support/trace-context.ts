import { randomBytes } from 'crypto';

export type W3CTraceContext = Readonly<{
  traceId: string;
  spanId: string;
  traceparent: string;
}>;

const TRACE_ID_BYTES = 16;
const SPAN_ID_BYTES = 8;
const SAMPLED_FLAG = '01';

export function generateTraceContext(): W3CTraceContext {
  const traceId = randomBytes(TRACE_ID_BYTES).toString('hex');
  const spanId = randomBytes(SPAN_ID_BYTES).toString('hex');
  return {
    traceId,
    spanId,
    traceparent: `00-${traceId}-${spanId}-${SAMPLED_FLAG}`,
  };
}

export function buildTraceHeaders(trace: W3CTraceContext): Record<string, string> {
  const runId = process.env['TEST_RUN_ID'];
  return {
    traceparent: trace.traceparent,
    ...(runId ? { 'x-test-run-id': runId } : {}),
  };
}
