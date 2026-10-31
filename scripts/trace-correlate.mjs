#!/usr/bin/env node
// What did the backend do while this test ran? Joins a Playwright result to the app side.
//
//   npm run trace:correlate                                   # every failed attempt in the last run
//   npm run trace:correlate -- --test 'stores ordered' --all  # chosen tests, passing ones too
//   npm run trace:correlate -- --tempo http://127.0.0.1:3200  # plus the full trace from Tempo
//
// Input: the JSON report (default test-results/results.json, written by every local run).
// Each attempt carries a deterministic `trace-id` annotation (src/shared/otel/trace-context.ts)
// that fixtures also sent as `traceparent` on every browser and API request.
//
// Backends, each used when reachable:
//   Tempo  (--tempo or TEMPO_URL): the test's own distributed trace by id. Needs the
//          minikube observability stack, the app exporting OTel, and the run started with
//          OTEL_EXPORTER_OTLP_ENDPOINT. Port-forward: kubectl port-forward -n observability svc/tempo 3200:3200
//   Docker (--container, default `api`): API log lines inside the attempt's time window.
//          The docker API runs with OTel disabled, so lines are matched by time, not id.
//          With several workers the window holds other tests' calls too; overlaps are counted.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const { values: args } = parseArgs({
  options: {
    report: { type: 'string', default: 'test-results/results.json' },
    test: { type: 'string' },
    all: { type: 'boolean', default: false },
    tempo: { type: 'string', default: process.env.TEMPO_URL },
    container: { type: 'string', default: 'api' },
    'pad-ms': { type: 'string', default: '250' },
    'slow-ms': { type: 'string', default: '500' },
    json: { type: 'boolean', default: false },
  },
});
const PAD_MS = Number(args['pad-ms']);
const SLOW_MS = Number(args['slow-ms']);
const FAILED = new Set(['failed', 'timedOut', 'interrupted']);

function attempts(report) {
  const out = [];
  const walk = (suite, path) => {
    for (const spec of suite.specs ?? []) {
      for (const t of spec.tests ?? []) {
        for (const r of t.results ?? []) {
          const traceId = (r.annotations ?? []).find(a => a.type === 'trace-id')?.description;
          const start = Date.parse(r.startTime);
          out.push({
            title: spec.title,
            file: `${spec.file}:${spec.line}`,
            project: t.projectName,
            retry: r.retry,
            status: r.status,
            error: r.error?.message?.split('\n')[0]?.slice(0, 200),
            traceId,
            start,
            end: start + r.duration,
          });
        }
      }
    }
    for (const child of suite.suites ?? []) walk(child, [...path, child.title]);
  };
  for (const suite of report.suites ?? []) walk(suite, [suite.title]);
  return out;
}

// --- Tempo -------------------------------------------------------------------
const attr = (attrs, ...keys) => {
  for (const key of keys) {
    const v = attrs?.find(a => a.key === key)?.value;
    if (v) return v.stringValue ?? v.intValue ?? v.doubleValue ?? v.boolValue;
  }
  return undefined;
};

/** Flatten Tempo's OTLP JSON (`batches`, `resourceSpans` or `trace.resourceSpans`). */
export function flattenTrace(body) {
  const resources = body?.trace?.resourceSpans ?? body?.resourceSpans ?? body?.batches ?? [];
  return resources.flatMap(rs => {
    const service = attr(rs.resource?.attributes, 'service.name') ?? '?';
    return (rs.scopeSpans ?? rs.instrumentationLibrarySpans ?? []).flatMap(ss =>
      (ss.spans ?? []).map(s => {
        const ms = (Number(BigInt(s.endTimeUnixNano) - BigInt(s.startTimeUnixNano)) / 1e6).toFixed(1);
        const code = s.status?.code;
        return {
          service,
          name: s.name,
          ms: Number(ms),
          error: code === 2 || code === 'STATUS_CODE_ERROR',
          status: attr(s.attributes, 'http.response.status_code', 'http.status_code'),
          route: attr(s.attributes, 'http.route', 'url.path', 'http.target'),
          db: attr(s.attributes, 'db.query.text', 'db.statement', 'db.operation.name')?.toString().slice(0, 120),
          exception: (s.events ?? [])
            .filter(e => e.name === 'exception')
            .map(e => attr(e.attributes, 'exception.type', 'exception.message'))
            .join('; '),
        };
      }),
    );
  });
}

async function fromTempo(traceId) {
  if (!args.tempo || !traceId)
    return { skipped: args.tempo ? 'no trace id on this attempt' : 'no --tempo / TEMPO_URL' };
  try {
    const res = await fetch(`${args.tempo.replace(/\/+$/, '')}/api/traces/${traceId}`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 404) return { skipped: 'trace not in Tempo (OTel off for this run, or retention passed)' };
    if (!res.ok) return { skipped: `Tempo answered ${res.status}` };
    const spans = flattenTrace(await res.json());
    const services = [...new Set(spans.map(s => s.service))];
    return {
      spans: spans.length,
      services,
      errors: spans.filter(s => s.error || Number(s.status) >= 400 || s.exception),
      slowest: [...spans].sort((a, b) => b.ms - a.ms).slice(0, 5),
    };
  } catch (error) {
    return { skipped: `Tempo unreachable (${error.cause?.code ?? error.name})` };
  }
}

// --- Docker logs ---------------------------------------------------------------
function fromDocker(a, all) {
  const since = new Date(a.start - PAD_MS).toISOString();
  const until = new Date(a.end + PAD_MS).toISOString();
  const res = spawnSync('docker', ['logs', args.container, '--since', since, '--until', until], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  if (res.error || res.status !== 0) {
    return {
      skipped: `no logs from container '${args.container}' (${(res.stderr || String(res.error)).trim().slice(0, 80)})`,
    };
  }
  const lines = `${res.stdout}${res.stderr}`.split('\n').filter(Boolean);
  const notable = lines.filter(l => {
    if (/\b(WARN|ERROR|FATAL)\b|Exception/.test(l)) return true;
    if (/responded [45]\d\d/.test(l)) return true;
    const ms = Number(l.match(/responded \d{3} in ([\d.]+) ms/)?.[1]);
    return ms > SLOW_MS;
  });
  const overlapping = all.filter(o => o !== a && o.start < a.end + PAD_MS && o.end > a.start - PAD_MS).length;
  const compact = l =>
    l
      .replace(/^\S+\s+(\w+)\s+\d+\s+---\s+\[[^\]]*\]\s+\[[^\]]*\]\s+\S+\s+:\s*/, '$1 ')
      .replace(/\s+UserAgent=.*$/, '')
      .slice(0, 220);
  return { window: `${since} → ${until}`, lines: lines.length, overlapping, notable: notable.map(compact) };
}

// --- Main ------------------------------------------------------------------------
const report = JSON.parse(readFileSync(args.report, 'utf8'));
const all = attempts(report);
const pattern = args.test ? new RegExp(args.test, 'i') : undefined;
const picked = all.filter(a => (!pattern || pattern.test(a.title)) && (args.all || FAILED.has(a.status)));
if (picked.length === 0) {
  console.log(
    pattern || !args.all
      ? `no ${args.all ? '' : 'failed '}attempts${pattern ? ` matching /${args.test}/` : ''} in ${args.report} (${all.length} attempts; --all includes passing ones)`
      : `no attempts in ${args.report}`,
  );
  process.exit(0);
}

const results = [];
for (const a of picked) {
  results.push({ ...a, tempo: await fromTempo(a.traceId), docker: fromDocker(a, all) });
}

if (args.json) {
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}
for (const r of results) {
  console.log(`\n## ${r.title}  [${r.project} · retry ${r.retry} · ${r.status}]`);
  console.log(`   ${r.file} · trace ${r.traceId ?? '(none)'}${r.error ? `\n   error: ${r.error}` : ''}`);
  if (r.tempo.skipped) console.log(`   tempo: ${r.tempo.skipped}`);
  else {
    console.log(`   tempo: ${r.tempo.spans} spans across ${r.tempo.services.join(', ')}`);
    for (const s of r.tempo.errors)
      console.log(`     ✗ ${s.service} ${s.name} ${s.status ?? ''} ${s.exception ?? ''} ${s.db ?? ''}`.trimEnd());
    for (const s of r.tempo.slowest)
      console.log(`     ${s.ms}ms ${s.service} ${s.name}${s.route ? ` ${s.route}` : ''}`);
  }
  if (r.docker.skipped) console.log(`   docker: ${r.docker.skipped}`);
  else {
    console.log(
      `   docker '${args.container}': ${r.docker.lines} lines in window` +
        (r.docker.overlapping ? `, shared with ${r.docker.overlapping} other attempts` : ''),
    );
    for (const l of r.docker.notable.slice(0, 20)) console.log(`     ${l}`);
    if (r.docker.notable.length > 20) console.log(`     … ${r.docker.notable.length - 20} more`);
  }
}
