import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';
import { context, trace, SpanStatusCode, type Attributes, type Span, type Tracer } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BasicTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { resolveRunId } from '@shared/config/run-id';

const TRACER_NAME = 'bjjeire-tests';
const DEFAULT_SERVICE_NAME = 'bjjeire-acceptance-tests';
const ERROR_MESSAGE_MAX_LENGTH = 500;

/**
 * Opt-in OpenTelemetry reporter: one trace per shard process, a root span for
 * the run and a child span per test (status, retries, project, tags), so a
 * Grafana/Tempo stack can chart duration and flake trends per project/shard.
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
      }),
    });
    this.provider = new BasicTracerProvider({
      resource,
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
    const parentContext = trace.setSpan(context.active(), this.rootSpan);
    const span = this.tracer.startSpan(
      test.title,
      {
        startTime: result.startTime,
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
      },
      parentContext,
    );
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
