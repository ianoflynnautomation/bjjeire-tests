import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';
import { SpanStatusCode, type Attributes, type Span, type Tracer } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  BasicTracerProvider,
  BatchSpanProcessor,
  RandomIdGenerator,
  type IdGenerator,
} from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { resolveRunId } from '@shared/config/run-id';
import { testTraceContext } from './trace-context';

const TRACER_NAME = 'bjjeire-tests';
const DEFAULT_SERVICE_NAME = 'bjjeire-acceptance-tests';
const ERROR_MESSAGE_MAX_LENGTH = 500;

/**
 * Lets the reporter mint test spans with the SAME trace/span ids the worker
 * fixtures injected into app requests (see trace-context.ts). Set before each
 * startSpan, cleared after — the tracer is only used from synchronous
 * reporter callbacks, so there is no concurrent-use hazard.
 */
class DeterministicIdGenerator implements IdGenerator {
  private readonly fallback = new RandomIdGenerator();
  private next: { traceId: string; spanId: string } | undefined;

  setNext(ids: { traceId: string; spanId: string }): void {
    this.next = ids;
  }

  clear(): void {
    this.next = undefined;
  }

  generateTraceId(): string {
    return this.next?.traceId ?? this.fallback.generateTraceId();
  }

  generateSpanId(): string {
    return this.next?.spanId ?? this.fallback.generateSpanId();
  }
}

/**
 * Opt-in OpenTelemetry reporter. Every test attempt becomes the ROOT span of
 * its own trace, using ids derived deterministically from (run id, test id,
 * retry) — the same ids the worker fixtures inject into browser/API requests
 * as `traceparent` — so the app spans a test caused appear as its children in
 * one distributed trace. A per-shard "test run" span (own trace) aggregates
 * the run; test spans carry a span link to it.
 *
 * Activation is by configuration, not code: `createBaseConfig` appends this
 * reporter only when `OTEL_EXPORTER_OTLP_ENDPOINT` is set (the standard OTLP
 * env var, also read by the exporter itself alongside
 * `OTEL_EXPORTER_OTLP_HEADERS` for auth). Unset endpoint → the module is
 * never loaded and runs carry zero telemetry overhead.
 *
 * Shards are correlated by the `test.run.id` resource attribute (same value
 * on every shard of a CI run — see resolveRunId), not by a shared trace id:
 * each shard is its own process and exports its own trace.
 */
export default class OtelReporter implements Reporter {
  private provider: BasicTracerProvider | undefined;
  private tracer: Tracer | undefined;
  private rootSpan: Span | undefined;
  private readonly idGenerator = new DeterministicIdGenerator();

  onBegin(config: FullConfig, suite: Suite): void {
    const runId = resolveRunId();
    const shard = config.shard;
    const resource = resourceFromAttributes({
      [ATTR_SERVICE_NAME]: process.env['OTEL_SERVICE_NAME'] ?? DEFAULT_SERVICE_NAME,
      'test.run.id': runId,
      ...optionalAttributes({
        'test.env_id': process.env['ENV_ID'] ?? process.env['APP_ENV'],
        'test.image_tag': process.env['IMAGE_TAG'],
        'vcs.ref.head.name': process.env['GITHUB_REF_NAME'],
        'vcs.ref.head.revision': process.env['GITHUB_SHA'],
        'cicd.pipeline.run.url.full': ciRunUrl(),
      }),
    });
    this.provider = new BasicTracerProvider({
      resource,
      idGenerator: this.idGenerator,
      spanProcessors: [new BatchSpanProcessor(new OTLPTraceExporter())],
    });
    this.tracer = this.provider.getTracer(TRACER_NAME);
    this.rootSpan = this.tracer.startSpan(shard ? `test run (shard ${shard.current}/${shard.total})` : 'test run', {
      attributes: {
        'test.total_count': suite.allTests().length,
        ...optionalAttributes({
          'test.shard.current': shard?.current,
          'test.shard.total': shard?.total,
        }),
      },
    });
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    if (!this.tracer || !this.rootSpan) return;
    // Each test is the ROOT of its own trace, with the ids the worker fixture
    // already injected into app requests — the app spans this test caused are
    // its children. Cross-trace parenting is impossible, so the run root span
    // is attached as a span link instead.
    this.idGenerator.setNext(testTraceContext(test.id, result.retry));
    const span = this.tracer.startSpan(test.title, {
      startTime: result.startTime,
      links: [{ context: this.rootSpan.spanContext() }],
      attributes: {
        'test.title_path': test.titlePath().join(' › '),
        'test.file': test.location.file,
        'test.status': result.status,
        'test.expected_status': test.expectedStatus,
        'test.outcome': test.outcome(),
        'test.retry': result.retry,
        'test.duration_ms': result.duration,
        ...optionalAttributes({
          'test.project': test.parent.project()?.name,
          'test.tags': test.tags.length > 0 ? test.tags.join(',') : undefined,
        }),
      },
    });
    this.idGenerator.clear();
    if (result.status !== test.expectedStatus && result.status !== 'skipped') {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: result.error?.message?.slice(0, ERROR_MESSAGE_MAX_LENGTH) ?? result.status,
      });
    }
    span.end(new Date(result.startTime.getTime() + result.duration));
  }

  async onEnd(result: FullResult): Promise<void> {
    if (this.rootSpan) {
      if (result.status !== 'passed') {
        this.rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: result.status });
      }
      this.rootSpan.setAttribute('test.run.status', result.status);
      this.rootSpan.end();
    }
    if (this.provider) {
      await this.provider.forceFlush();
      await this.provider.shutdown();
    }
  }

  printsToStdio(): boolean {
    return false;
  }
}

function optionalAttributes(candidate: Record<string, string | number | undefined>): Attributes {
  return Object.fromEntries(Object.entries(candidate).filter(([, value]) => value !== undefined));
}

/** Deep link from spans back to the CI run (report artifact + PR comment live there). */
function ciRunUrl(): string | undefined {
  const server = process.env['GITHUB_SERVER_URL'];
  const repo = process.env['GITHUB_REPOSITORY'];
  const runId = process.env['GITHUB_RUN_ID'];
  return server && repo && runId ? `${server}/${repo}/actions/runs/${runId}` : undefined;
}
