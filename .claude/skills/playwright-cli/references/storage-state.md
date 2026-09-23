# Storage state

Cookies, localStorage, sessionStorage, and a full storage-state file. Repo rules and the invocation (`npx playwright cli`) are in [../SKILL.md](../SKILL.md).

This repo already has auth caches in gitignored `playwright/.auth/`:

- `ui-user.json` is the UI `storageState` written by the setup project.
- `api-token.json` is the Entra token cache. It is not a Playwright storage state.

Do not overwrite either file unless the task is auth. Save an exploration state under `/tmp`. Never commit a file that contains a token. The default CLI session is in memory, which is the right place for a login you do not need to keep.

## Save and load

```sh
npx playwright cli state-save /tmp/ui-state.json
npx playwright cli state-load /tmp/ui-state.json
npx playwright cli goto http://127.0.0.1:8080
```

Load before the navigation that should see the cookies. The file is Playwright storage state: a `cookies` array plus `origins[].localStorage`. sessionStorage is not in that file; use the sessionStorage commands below.

A fresh process keeps cookies only when the browser was opened with `--persistent` or you `state-load` again. See [session-management.md](session-management.md).

## Cookies

```sh
npx playwright cli cookie-list
npx playwright cli cookie-list --domain=localhost --path=/
npx playwright cli cookie-get session_id
npx playwright cli cookie-set session abc123 --domain=localhost --path=/ --httpOnly --secure --sameSite=Lax --expires=1893456000
npx playwright cli cookie-delete session_id
npx playwright cli cookie-clear
```

Several cookies at once:

```sh
npx playwright cli run-code "async page => {
  await page.context().addCookies([
    { name: 'session_id', value: 'sess_abc123', domain: 'localhost', path: '/', httpOnly: true },
    { name: 'preferences', value: '{\"theme\":\"dark\"}', domain: 'localhost', path: '/' }
  ]);
}"
```

## localStorage and sessionStorage

```sh
npx playwright cli localstorage-list
npx playwright cli localstorage-get theme
npx playwright cli localstorage-set theme dark
npx playwright cli localstorage-delete theme
npx playwright cli localstorage-clear
npx playwright cli sessionstorage-list
npx playwright cli sessionstorage-get step
npx playwright cli sessionstorage-set step 3
npx playwright cli sessionstorage-delete step
npx playwright cli sessionstorage-clear
```

`localstorage-set` takes one string value. Pass JSON as that string when the app stores an object.

IndexedDB is not a CLI command. List or delete it with `run-code` and `page.evaluate` calling `indexedDB.databases()` or `indexedDB.deleteDatabase(name)`.
