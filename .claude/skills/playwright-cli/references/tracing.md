# Tracing

A trace records actions, DOM snapshots, screenshots, network, and console for the CLI session. Repo rules and the invocation (`npx playwright cli`) are in [../SKILL.md](../SKILL.md).

Start before the steps you need to explain, including the navigation. `tracing-start` and `tracing-stop` both print the action log (`.trace`), the network log, and the resources directory. Those files sit under `.playwright-cli/`, which is gitignored. Delete a large trace when you are done with it. Open the `.trace` path with `npx playwright show-trace <file>` (`npm run trace` is the same viewer).

```sh
npx playwright cli tracing-start
npx playwright cli open http://127.0.0.1:8080/gyms
npx playwright cli snapshot
npx playwright cli click e5
npx playwright cli tracing-stop
```

|                 | Trace                               | Video         | Screenshot |
| --------------- | ----------------------------------- | ------------- | ---------- |
| File            | `.trace` plus network and resources | `.webm`       | `.png`     |
| DOM and network | yes                                 | no            | no         |
| Use             | why a step failed                   | a walkthrough | one frame  |

A test run's trace is separate. Force it with `npx playwright test --trace=on` (or `retain-on-failure`). That is the test runner, not `tracing-start`. Video is [video-recording.md](video-recording.md).
