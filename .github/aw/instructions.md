# Repository overlay — gh-aw (bjjeire-tests)

Loaded by the agentic-workflows skill when present. Overrides upstream
defaults where they conflict.

## Engine and writes

- Engine is Claude Code (`engine: claude`). Authenticate with repository
  secret `ANTHROPIC_API_KEY` (or Anthropic WIF).
- Agent jobs stay read-only. Test patches go through
  `safe-outputs.create-pull-request` with an `allowed-files` allowlist.
- Never commit or push with `git` from the agent. Never touch `bjjeire-java`.

## Playwright CI is not this workflow

`CI` in this repo is lint + typecheck. Acceptance shards run from
`bjjeire-java` via `bjjeire-ci-templates`. Do not trigger `playwright-fix`
on `workflow_run` of local `CI` — that is not a Playwright failure.

Healing inputs, in order:

1. Explicit `workflow_dispatch` run id / artifact URL
2. Playwright JSON report (`results.json`) already uploaded by the caller
3. atest evidence under `.atest/evidence` if the extra-output mount exists

Use `@aplaytest/*` (the `atest` repo) for classify / heal / score. Do not
re-run the full suite inside the agent job.

## Specs

- Acceptance specs: `specs/features/`.
- Constitution: `.specify/memory/constitution.md`.
- Playwright rules: `.specify/rules/playwright-rules.md`.
- Product architecture and Mongo contracts: `bjjeire-java/specs/` (read via
  GitHub if needed; do not copy them into this repo).

## Compile

```sh
gh aw compile spec-review playwright-fix
```

Keep `.github/workflows-aw/<id>.md` and `.github/workflows/<id>.md` identical.
