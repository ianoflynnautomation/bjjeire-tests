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
| [playwright-fix.md](./playwright-fix.md) | `workflow_dispatch` (and later, failed acceptance artifacts) | Propose a test-only PR using atest evidence         |

Acceptance Playwright does **not** run in this repository's `CI` workflow (lint + typecheck only). The suite runs from **bjjeire-java** via `bjjeire-ci-templates`. Healing therefore starts from a dispatched run id or downloaded `results.json` / evidence bundle, not from `workflow_run` of local `CI`.

Agent overlay: [../aw/instructions.md](../aw/instructions.md).
