# GitHub Agentic Workflows (sources)

[gh-aw](https://github.com/github/gh-aw) compiles Markdown with YAML frontmatter into GitHub Actions. The compiler and GitHub Actions both load **`.github/workflows/`**, not this folder.

This folder is the named SDD entrypoint. Each `.md` file here is the same source as its twin under `../workflows/`. Edit one, copy to the other, then:

```sh
gh aw compile spec-review playwright-fix
```

Compiled output is `../workflows/<name>.lock.yml` (linguist-generated). Do not hand-edit lock files.

Engine is Claude Code (`engine: claude`). Set repository secret `ANTHROPIC_API_KEY` (Claude OAuth tokens are not supported).

| Workflow                                 | Trigger                                                      | Effect                                              |
| ---------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| [spec-review.md](./spec-review.md)       | Pull request (specs, tests, page objects, API clients)       | Comment: do the tests still match the feature spec? |
| [playwright-fix.md](./playwright-fix.md) | `workflow_dispatch` (and later, failed acceptance artifacts) | Reproduce on a Docker stack, propose a test-only PR |

Acceptance Playwright does **not** run in this repository's `CI` workflow (lint + typecheck only). The suite runs from **bjjeire-java** via `bjjeire-ci-templates`. Healing therefore starts from a dispatched run id or downloaded `results.json` / evidence bundle, not from `workflow_run` of local `CI`.

`playwright-fix` can reproduce, not only read evidence. With `reproduce: true` (the
default) its deterministic `steps:` check out the public app repo
(`ianoflynnautomation/bjjeire`, ref `app_ref`), start and seed the same Docker
Compose stack the app's PR smoke job uses, and install the pinned Chromium. The
agent then reaches it over loopback (`network.allowed: local`) and hands each
failing UI test to `.claude/agents/playwright-test-healer.md`, which debugs with
`npx playwright cli`. The Docker profile does not enforce auth, so no secrets enter
the agent job (strict mode forbids them in `steps:` anyway). Bash is a fixed
allowlist: `npx playwright test|cli`, lint/format/typecheck, and read-only shell tools.

Agent overlay: [../aw/instructions.md](../aw/instructions.md).
