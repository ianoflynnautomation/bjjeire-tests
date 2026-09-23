# Request mocking

Intercept a request while exploring. Repo rules and the invocation (`npx playwright cli`) are in [../SKILL.md](../SKILL.md).

Acceptance specs do not keep these CLI routes. A spec mocks only the hard-to-seed cases (empty, error, multi-page, snapshot determinism) through the feature's `mocks.ts`, and every body is parsed with `parseMockBody`. A CLI mock is for the live session.

List what the page already called with `requests`, then `request <index>`.

## Route command

Patterns are Playwright URL patterns: `**/api/users`, `**/api/*/details`, `**/*.{png,jpg}`, `**/search?q=*`.

```sh
npx playwright cli route "**/*.jpg" --status=404
npx playwright cli route "**/api/users" --body='[{"id":1,"name":"Alice"}]' --content-type=application/json
npx playwright cli route "**/api/data" --body='{"ok":true}' --header="X-Custom: value"
npx playwright cli route "**/*" --remove-header=cookie,authorization
npx playwright cli route-list
npx playwright cli unroute "**/*.jpg"
npx playwright cli unroute
```

Repeat `--header` for a second header. `--remove-header` is a comma-separated list. Add another `route` call for a second pattern.

## Conditional mocks

`route` cannot branch on the request body. Use `run-code` for that, for rewriting a real response, or for aborting.

```sh
npx playwright cli run-code "async page => {
  await page.route('**/api/login', route => {
    const body = route.request().postDataJSON();
    if (body.username === 'admin') {
      route.fulfill({ body: JSON.stringify({ token: 'mock-token' }) });
    } else {
      route.fulfill({ status: 401, body: JSON.stringify({ error: 'Invalid' }) });
    }
  });
}"
```

```sh
npx playwright cli run-code "async page => {
  await page.route('**/api/user', async route => {
    const response = await route.fetch();
    const json = await response.json();
    json.isPremium = true;
    await route.fulfill({ response, json });
  });
}"
```

```sh
npx playwright cli run-code "async page => {
  await page.route('**/api/offline', route => route.abort('internetdisconnected'));
}"
```

Abort reasons include `connectionrefused`, `timedout`, `connectionreset`, and `internetdisconnected`.

`network-state-set offline` fails every request. `network-state-set online` restores them. Do not add a delay inside a route and then copy that into a spec. Specs use web-first assertions, not sleeps.
