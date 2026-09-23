# Running Playwright code

`run-code` runs one function against the open page. Use it when no CLI command covers the step. Repo rules and the invocation (`npx playwright cli`) are in [../SKILL.md](../SKILL.md).

The argument is a single function expression. It is wrapped in `(...)` and evaluated. `import`, `export`, and `require` do not work. Load a longer function from a file with `--filename`. Put that file under `/tmp`, not the repo.

```sh
npx playwright cli run-code "async page => {
  return page.url();
}"
npx playwright cli run-code --filename=/tmp/explore.js
```

Code you later paste into a spec follows `.specify/rules/playwright-rules.md`: web-first assertions, `gotoRoute` / `gotoAppShell` through the page object, no `waitForTimeout`, no `networkidle`. A one-off exploration snippet can wait on a locator state. It does not become the spec verbatim.

## Permissions and geolocation

```sh
npx playwright cli run-code "async page => {
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 53.3498, longitude: -6.2603 });
}"
```

```sh
npx playwright cli run-code "async page => {
  await page.context().grantPermissions(['clipboard-read'], { origin: 'http://127.0.0.1:8080' });
  return await page.evaluate(() => navigator.clipboard.readText());
}"
```

`page.context().clearPermissions()` drops the grants.

## Media

The suite defaults to dark. Force a scheme only for the session you are looking at.

```sh
npx playwright cli run-code "async page => {
  await page.emulateMedia({ colorScheme: 'light' });
}"
```

`reducedMotion: 'reduce'` and `media: 'print'` use the same call.

## Frames, downloads, page facts

```sh
npx playwright cli run-code "async page => {
  const frame = page.locator('iframe#my-iframe').contentFrame();
  await frame.getByRole('button', { name: 'Save' }).click();
}"
```

```sh
npx playwright cli run-code "async page => {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download' }).click();
  const download = await downloadPromise;
  await download.saveAs('/tmp/' + download.suggestedFilename());
  return download.suggestedFilename();
}"
```

```sh
npx playwright cli run-code "async page => {
  return { title: await page.title(), url: page.url(), viewport: page.viewportSize() };
}"
```

Return values print in the CLI result. For one DOM property on one ref, prefer `eval` ([element-attributes.md](element-attributes.md)).
