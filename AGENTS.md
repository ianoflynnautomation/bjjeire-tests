# AGENTS.md

Playwright + TypeScript acceptance test suite for the BjjEire web application (read-only
BJJ directory: gyms, events, competitions, stores). Tests run against local (minikube),
Docker, and remote (dev / staging) environments. Acceptance-level tests only — unit/integration tests
live in the app repository (`~/Sources/bjjeire-java`, `/workspaces/bjjeire-java` in the dev container). Against live AKS **dev**: [docs/dev-env.md](docs/dev-env.md). Auth for `.env.dev.local`: [docs/authentication.md](docs/authentication.md).

## Stack

- **Runtime**: Node 22, TypeScript 6.0, CommonJS (`"type": "commonjs"`)
- **Test framework**: `@playwright/test` 1.64.1 (pinned; must match the CI runner image)
- **Validation**: Zod v4 generated from the published OpenAPI contract (`npm run contract:pull` → `npm run gen:api-schemas` → `src/api/generated/zod.gen.ts`). Feature `*.schemas.ts` files re-export the page schema.
- **A11y**: `@axe-core/playwright`
- **Lint**: ESLint v9 flat config + Prettier 3, Husky pre-commit runs lint-staged

## Quick commands

```sh
npm run test:smoke        # Critical subset (@smoke)
npm run test:acceptance   # Full suite (@acceptance = every test)
npm run test:snapshots    # Snapshot project (screenshots + aria)
npm run test:a11y         # Axe WCAG 2.1 A/AA sweep per route
npm run test:mobile       # @mobile tests (mobile-iphone + mobile-galaxy projects)
npm run test:perf         # Opt-in boot budgets per route, desktop + slow 4G (PW_PERF, 1 worker)
npm run test:dev          # Live AKS dev UI (see docs/dev-env.md, docs/authentication.md)
npm run test:dev:api      # Live AKS dev API
npm run lint              # ESLint (+ Prettier via plugin)
npm run typecheck         # tsc --noEmit
npm run spec:check        # Titles, // spec:, Covers, Oracle and step wording (lint-staged + CI)
npm run mutation:audit -- --feature <f>   # Do the feature's UI specs catch wrong data? (local/docker)
npm run trace:correlate   # Backend view of failed attempts: Tempo by trace id, or Docker API logs by window
npm run squash:sync       # Sync test cases to Squash TM (needs SQUASH_TM_MODE; see docs/squash-tm.md)
npm run squash:run        # Publish with --squash-* flags (a release is SQUASH_TM_RELEASE or --squash-release; see docs/squash-tm.md)
npm run squash:prune      # Preview (or --yes: delete) sync-created Squash cases in a folder, e.g. after renames
```

## Running the suite

- Work in the dev container (`.devcontainer/`). Do not install tools on the Mac. The app under test runs outside it and is reached through a relay.
- **Check the API rate limit before a full run.** A 429 on `/featureflag` silently redirects every feature route to `/about`.
- Chromium desktop is the system of record. Other browsers, the light theme and mobile run `@smoke` only. The suite defaults to dark mode.
- Projects, environments, CI, auth artefacts, Squash TM and tracing are in the `suite-environments` skill.

## Tags

Two-tier taxonomy:

- **Every test** carries `@acceptance` — `--grep @acceptance` selects the full suite.
- `@smoke` marks the basic critical subset **in addition**: `{ tag: ['@smoke', '@acceptance'] }`.
- Suite-level tags on `describe`: feature tag, `@ui`/`@api`/`@snapshot`/`@a11y`, and
  `@desktop` or `@mobile`. `@mobile` suites run only on the mobile projects.
  `@layout` / `@wide` select the `chromium-wide` project.
- `@squash` opts a test (or a whole `describe`) into the Squash TM sync and result
  publishing. It is independent of `@smoke`/`@acceptance`: an untagged test never
  reaches Squash.
- `@quarantine` marks known-flaky tests: excluded from every run via config
  `grepInvert` (`QUARANTINE_TAG` in `src/shared/config/playwright.ts`) but kept in
  the repo so they stay greppable. Fix or delete promptly — never let the list grow.

## Spec-driven development

Acceptance behaviour is specified in [`specs/`](specs/) before (or with) the
Playwright files. Product architecture and Mongo/OpenAPI contracts live in
`bjjeire-java/specs/`. Agent steering: [`.specify/memory/constitution.md`](.specify/memory/constitution.md); the
Playwright rules are this file (no separate digest, so there is nothing to drift).

- The numbered titles in `specs/features/<feature>.md` **are** the test titles.
  `npm run spec:check` (lint-staged and CI) fails when they differ, when a spec file
  is unclaimed, when `// spec:` is wrong, and when a `####` block lacks `Covers:` or
  `Oracle:`, puts an action in Expected results, or disagrees with the test's steps.
  Scenarios that predate a block are grandfathered. The contract is
  [`specs/templates/README.md`](specs/templates/README.md).
- Each planned scenario carries `Covers: AC-…` (from `bjjeire-java/specs/stc/`), an
  `Oracle:` line, numbered `Steps:` and bulleted `Expected results:` (one `test.step`
  and one assertion per line). Every spec file starts with `// spec:` and `// seed:`
  comments. New specs start from [`specs/templates/`](specs/templates/README.md).
- New to this? Read [`docs/spec-guide.md`](docs/spec-guide.md).

The `spec-review` and `playwright-fix` agentic workflows are described in the `suite-environments` skill.

## Agent layout

One instruction file, one skill tree. Harness folders are links, not copies.

- **Instructions.** This file is the single source of agent instructions, same pattern as `bjjeire-java`. `CLAUDE.md` is an `@AGENTS.md` import so Claude Code loads this file. Edit this file only.
- **Skills.** Each skill is `.agents/skills/<name>/SKILL.md` (Agent Skills layout: optional `scripts/`, `references/`, `assets/` beside that file). That directory is the copy you edit. `.claude/skills` and `.grok/skills` are symlinks to it, because Claude Code reads `.claude/skills` and Grok also reads `.grok/skills`. Codex, Cursor, and Copilot read `.agents/skills`. Grok keeps one skill per name. Do not add a root `skills/` directory, and do not replace the symlinks with copies or with a Markdown pointer.
- **Copilot / gh-aw.** `.github/skills/<name>` is a per-skill symlink to `../../.agents/skills/<name>` when that tool must see the skill at its own path. Today that is `agentic-workflows`.
- **Commands.** Slash commands live once in `.claude/commands/`. Claude Code and Grok both read that directory. Do not add `.grok/commands`.
- **Subagents.** Claude subagents stay in `.claude/agents/` (see [Test agents](#test-agents)). A Grok agent definition, if added, goes in `.grok/agents/` because the file format differs.
- **Hooks.** `.claude/settings.json` runs two hooks on every `Edit`/`MultiEdit`/`Write`, including inside subagents and the `playwright-fix` job. `.claude/hooks/guard-edit.mjs` (PreToolUse) denies edits to generated or recorded files (`src/api/generated/`, `__screenshots__/`, `__aria__/`, `*.lock.yml`, `.env` files, `playwright/.auth/`, run output). It also denies adding `@quarantine`, `.fixme(`, `.skip(`, `.only(`, `waitForTimeout(`, `networkidle` or `force: true` to `tests/` or `src/` code. `.claude/hooks/lint-edited.mjs` (PostToolUse) runs `eslint --fix` on the edited `.ts` file and returns the remaining errors to the agent. The settings also deny `git commit`, `git push`, and reads of `.env.*.local` and `playwright/.auth/`. `.claude/hooks/agent-scope.mjs` (PreToolUse) enforces what each agent may touch: it limits edits by the planner, explorer and mutation auditor to their `specs/` folder, and limits the reviewer to read-only Bash commands. Keep these hooks in project settings, because hooks in agent frontmatter did not fire in headless runs. Hooks bind Claude Code only. Bash writes and humans are not blocked; lint and review still apply to them. Other skills are deliberately limited to this suite: generic engineering packs belong in user-level skills, not here.
- **Symlinks.** Relative links, committed. macOS and Linux checkouts follow them. A Windows checkout needs `core.symlinks=true`.

## Browser exploration

Use `npx playwright cli`, never a global `playwright-cli`. Its skill is [`.agents/skills/playwright-cli/SKILL.md`](.agents/skills/playwright-cli/SKILL.md). The planner and generator use the `playwright-test` MCP server instead. Refresh and tooling details are in the `suite-environments` skill.

## Test agents

Eight Claude subagents in `.claude/agents/`; how to run them: [docs/agents.md](docs/agents.md). The first three are Playwright's official
planner, generator and healer (`npx playwright init-agents --loop=claude`), rewritten
for this suite's conventions. The other five cover exploratory bug hunting, mutation audits, API tests, flaky tests and review.

| Agent                           | Use it to                                                                  | Browser |
| ------------------------------- | -------------------------------------------------------------------------- | ------- |
| `playwright-test-planner`       | Explore a feature and write scenarios into `specs/features/<feature>.md`   | MCP     |
| `playwright-test-generator`     | Rehearse a planned UI scenario live, then write it into the feature slice  | MCP     |
| `playwright-test-healer`        | Reproduce and fix a failing UI test, or report an app bug                  | CLI     |
| `playwright-exploratory-tester` | Chartered bug hunt with automatic oracles; report in `specs/exploration/`  | CLI     |
| `playwright-mutation-auditor`   | Corrupt real responses per mutant; triage survivors into `specs/mutation/` | none    |
| `playwright-api-tester`         | Write or heal `*.api.acceptance.spec.ts`                                   | none    |
| `playwright-flake-hunter`       | Measure a flaky test under `--repeat-each`, find the cause, fix it         | none    |
| `playwright-test-reviewer`      | Review test changes before commit (read-only, ranked findings)             | none    |

To cover a feature end to end, run `/cover-feature <feature>`.

Pipeline: planner → generator (UI) or api-tester (API) → reviewer. Healer and
flake-hunter run on failures. The exploratory tester feeds the planner: its report's
candidate scenarios enter `specs/features/` only once the planner (or you) accepts them.
The mutation auditor measures the suite: survivors it classifies as gaps become
assertions or scenarios for the generator. No agent adds `test.fixme`, `test.skip` or
`@quarantine`; quarantine is a human decision.

## Test conventions

The detailed rules, with their reasons, are in the `suite-conventions` skill. Read it before writing or healing a test. The rules that matter most:

- **Files:** `<feature>.ui.acceptance.spec.ts`, `.api.`, `.snapshot.`, `.a11y.`. Titles are `<actor> should <outcome> [when <context>]`, with Given/When/Then in top-level `test.step` titles.
- **Slices:** a feature is exactly `tests/features/<f>/`, `src/ui/pages/<f>/` and `src/api/features/<f>/`. Scaffold with `/add-feature`. A feature never imports another feature.
- **Data:** assert real seeded data from `seeded.ts`. Environments hold full datasets, so never assert a fixture is on page 1 of an unfiltered list. Mock with `route.fulfill()` only for empty, error, multi-page and snapshot states, parsed with `parseMockBody`.
- **Assertions:** web-first only, with no `waitForTimeout()` or polling loops. After `searchFor`, assert `expectResultCount(1)`.
- **Navigation:** never a bare `page.goto` for an app route. Use `gotoRoute` or `gotoAppShell` from `@ui/support`. Snapshot specs are the exception.
- **API specs:** call the feature client with the generated schema, then assert business values. Error paths use `expectProblem`. Negative inputs are data-driven.
- **Page objects:** only they hold locators, and specs never construct them. Specs import `test` and `expect` from `./fixtures`, `@ui/fixtures` or `@api/fixtures`. UI and API chains stay separate.
- **Feature flags:** pinned on by a fixture, never asserted.
- **Snapshots:** baselines are per platform. Regenerate both with `/update-snapshots`.

## TypeScript rules

- Strict mode: `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`,
  `noImplicitReturns`. No `any`; no floating promises (both lint errors).
- `import type { Foo }` / `import { type Foo }` (enforced by `consistent-type-imports`).
- Path aliases: `@shared/*`, `@api/*`, `@ui/*`. `@squash/annotations` resolves through `src/squash-package/annotations.ts` to `@playwright-squash/playwright-squash`.
- With `exactOptionalPropertyTypes`, use conditional objects
  (`input.x ? { x: input.x } : {}`) instead of spreading `undefined`.
- DTO types mirror the app repo; deviate only when the wire truth differs.

## Guardrails

- **Never commit or push** — leave changes in the working tree; Ian commits manually.
- Never run tests against production targets; staging runs only as an explicit task.
- Keep generated reports/test output (`playwright-report/`, `test-results/`,
  `allure-results/`) out of source changes.

---

Maintenance: this file is the single source of truth for agent instructions
(`CLAUDE.md` imports it). Keep it under 200 lines: detail belongs in the `suite-conventions`
and `suite-environments` skills. Update it in the same change that alters a convention,
script, project, or workflow it documents. Last reviewed: 2026-11-10.
