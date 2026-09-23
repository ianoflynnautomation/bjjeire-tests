# Inspecting element attributes

The snapshot shows role and accessible name. It does not show `id`, `class`, `data-*`, or computed style. Read those with `eval` on the ref.

Repo rules and the invocation (`npx playwright cli`) are in [../SKILL.md](../SKILL.md).

```sh
npx playwright cli snapshot
npx playwright cli eval "el => el.id" e7
npx playwright cli eval "el => el.className" e7
npx playwright cli eval "el => el.getAttribute('data-testid')" e7
npx playwright cli eval "el => el.getAttribute('aria-label')" e7
npx playwright cli eval "el => getComputedStyle(el).display" e7
```

`data-testid` is the attribute this suite's locators use. A ref stays in the CLI session. The value you copy into a page object is the attribute or the role, via `generate-locator`.
