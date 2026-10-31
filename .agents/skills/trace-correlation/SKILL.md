---
name: trace-correlation
description: Join a Playwright test attempt to what the BjjEire backend did while it ran. Every attempt has a deterministic trace id (run id + test id + retry) sent as traceparent on all its browser and API requests. npm run trace:correlate reads test-results/results.json and pulls that trace from Tempo (minikube observability stack) or the API container's log lines in the attempt's time window (Docker). Use when healing or de-flaking a test and the question is whether the backend was slow, erroring or returned something unexpected, or when separating an app bug from a test bug. Do not use for front-end timing (devtools skill).
metadata:
  author: Ian O Flynn
---

# Trace correlation

A UI failure says what the visitor saw. The backend says why. Each test attempt is the
root of its own distributed trace (`src/shared/otel/trace-context.ts`). The fixtures
send `traceparent` with that id on every browser and API request, and the attempt's
`trace-id` annotation records it in `test-results/results.json`, with or without OTel.

## Run it

```sh
npm run trace:correlate                                   # every failed attempt of the last run
npm run trace:correlate -- --test '<title regex>' --all   # chosen attempts, passing ones too
npm run trace:correlate -- --tempo http://127.0.0.1:3200  # add Tempo
npm run trace:correlate -- --json                         # machine-readable
```

Per attempt it prints the title, project, retry, status, error and trace id, and then:

- **Tempo** (exact): span count per service, failing spans (error status, HTTP ≥ 400,
  exception events, Mongo query) and the five slowest spans.
- **Docker** (approximate): API log lines inside the attempt's window (±250 ms) with
  WARN/ERROR, 4xx/5xx and slow (> 500 ms) responses, plus how many other attempts share
  that window.

## Which backend you have

| Target                      | What works                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------- |
| Docker (`APP_ENV=docker`)   | Log window only. The API runs with `OTEL_SDK_DISABLED`, and its `TraceId` is local |
| Minikube with observability | Tempo by id. Start the stack, then run the test with OTel on (below)               |
| Neither reachable           | The trace id and timings only; say that the backend could not be checked           |

Tempo on minikube (`bjjeire-deploy/.../observability/install.sh full`):

```sh
npm run otel:forward                                              # collector 4318, keep running
kubectl port-forward -n observability svc/tempo 3200:3200         # Tempo query API, keep running
OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318 PLAYWRIGHT_HTML_OPEN=never \
  npx playwright test -c playwright.ui.config.ts <spec>:<line> --project=chromium-desktop
npm run trace:correlate -- --tempo http://127.0.0.1:3200
```

## Make the window clean

The Docker window catches every request in that interval. With parallel workers
(`shared with N other attempts`), lines may belong to another test. Reproduce the
failing test alone first (`<spec>:<line>`, `--workers=1`; the healer does this anyway),
then correlate that run. Tempo has no such problem.

## Reading the result

| Backend shows                                        | Means                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| 5xx, exception, Mongo timeout in the window or trace | App or environment defect. Report it; do not touch the test   |
| 429 on `/featureflag` or the list API                | Rate limit (AGENTS.md). Environment, not code                 |
| Slow spans close to the test's timeout               | Environment or perf. Use the devtools skill for the front end |
| 200s with correct timing, test still failed          | The front end or the test. Back to the trace and DOM          |
| No requests at all for the route                     | The page never fetched (boot or flag problem, wrong route)    |
| Passing and failing attempts differ only server-side | Flake caused by the backend; compare their two traces         |

Cite the trace id and the decisive line or span in the report. A heal that ignores a
backend 5xx is not a heal.
