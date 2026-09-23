# Browser sessions

Each `-s` name is its own browser: cookies, storage, cache, history, and tabs. Repo rules and the invocation (`npx playwright cli`) are in [../SKILL.md](../SKILL.md). MCP is a different browser. Do not drive one flow in both.

```sh
npx playwright cli -s=auth open http://127.0.0.1:8080
npx playwright cli -s=public open http://127.0.0.1:8080
npx playwright cli -s=auth snapshot
npx playwright cli list
npx playwright cli -s=auth close
npx playwright cli close-all
npx playwright cli kill-all
```

`close` stops a session opened with `open`. `kill-all` is for a zombie process. `delete-data` removes that session's profile directory (`-s=<name> delete-data` for a named one).

`PLAYWRIGHT_CLI_SESSION` sets the default name when `-s` is omitted. Commands with no `-s` share the `default` session.

## How the browser is launched

```sh
npx playwright cli open http://127.0.0.1:8080 --headed
npx playwright cli open http://127.0.0.1:8080 --browser=firefox
npx playwright cli open http://127.0.0.1:8080 --persistent
npx playwright cli open http://127.0.0.1:8080 --profile=/tmp/bjjeire-profile
npx playwright cli open http://127.0.0.1:8080 --config=.playwright/cli.config.json
```

The default profile is in memory. `--persistent` writes a profile on disk. `--profile` chooses the directory. Do not point `--profile` at `playwright/.auth/`.

`--browser` accepts `chrome`, `firefox`, `webkit`, or `msedge`.

## Attach

`attach` connects to a browser that is already running. Pass only one of the name, `--cdp`, `--endpoint`, or `--extension`.

```sh
npx playwright cli attach tw-abcdef
npx playwright cli attach --cdp=chrome
npx playwright cli attach --cdp=http://localhost:9222
npx playwright cli attach --extension=chrome
npx playwright cli attach --endpoint=ws://127.0.0.1:9222/devtools/browser/<id>
npx playwright cli -s=msedge detach
```

`--cdp` is either a channel name or an HTTP endpoint. Channels: `chrome`, `chrome-beta`, `chrome-dev`, `chrome-canary`, `msedge`, `msedge-beta`, `msedge-dev`, `msedge-canary`. A channel attach needs remote debugging enabled in that browser (`chrome://inspect/#remote-debugging`). When `--session` is omitted, the session is named after the channel, so Chrome and Edge do not share `default`.

`detach` drops the CLI's connection and leaves the external browser open. It applies to `attach`. A session you `open`ed is stopped with `close`.

Attaching a paused test is [playwright-tests.md](playwright-tests.md).
