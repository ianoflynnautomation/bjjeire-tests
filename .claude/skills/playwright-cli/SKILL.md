---
name: playwright-cli
description: Drive a browser with either the Playwright MCP server or the pinned CLI (`npx playwright cli`). Use when exploring the app, filling a form, reproducing a UI flow, or generating an acceptance spec from a live page. Snapshot refs, not raw HTML.
---

# Browser automation

Two drivers, one loop. Both are valid.

- **Playwright MCP** — the connected server's `browser_*` tools (`browser_snapshot`, `browser_navigate`, `browser_click`, `browser_type`, `browser_fill_form`, `browser_file_upload`, `browser_select_option`, `browser_press_key`, `browser_network_requests`, `browser_take_screenshot`, `browser_close`). The tool schema on the server wins if a name differs.
- **Pinned CLI** — `npx playwright cli` from the repo root. It ships with `@playwright/test` 1.61.0. Do not install a global `@playwright/cli`. For flags this file does not list, run `npx playwright cli --help <command>`.

Use the driver the user names. If they name neither, pick whichever is available and stay with it for the rest of the flow. MCP and the CLI are separate browsers; don't drive one task through both. The page model on either driver is the accessibility snapshot.

## Loop

1. Snapshot (`browser_snapshot`, or `npx playwright cli snapshot`). On a large page, pass `depth` / `--depth=4`.
2. Act on a ref from that snapshot.
3. Both drivers auto-wait. If the target is missing, snapshot again. Do not sleep, and do not pass `time` to `browser_wait_for`.
4. Refs die when the page changes. Snapshot again after navigation, submit, or a dialog.

While automating, report each step as:

- **Goal:** what this step is for.
- **Current observation:** what the latest snapshot shows.
- **Action:** the MCP tool call or the exact CLI command.

Close the browser when the task is done (`browser_close`, or `npx playwright cli close`).

## CLI commands

Target is a snapshot ref (`e15`) or a locator (`getByRole('button', { name: 'Submit' })`). Prefer the ref. Prefer role, accessible name, or visible text over CSS or XPath.

```sh
npx playwright cli open http://127.0.0.1:8080   # also: --headed --browser=chrome --persistent
npx playwright cli goto <url>
npx playwright cli reload
npx playwright cli go-back
npx playwright cli snapshot                      # --filename writes markdown; --depth=N; --boxes
npx playwright cli click e15                     # optional button: left | right | middle
npx playwright cli fill e3 "text"                # --submit presses Enter
npx playwright cli type "text"                   # into the focused element
npx playwright cli select e9 "value"
npx playwright cli check e7
npx playwright cli uncheck e7
npx playwright cli press Enter
npx playwright cli upload /absolute/path         # file chooser; paths must be absolute
npx playwright cli drop e4 --path=/absolute/path
npx playwright cli screenshot --filename=/tmp/page.png
npx playwright cli requests                      # then: request <index>
npx playwright cli generate-locator e5
npx playwright cli close
```

Global flags: `--raw` (result only), `--json`, `-s=<name>` / `--session=<name>`.

Named sessions, attach, and persistent profiles: [references/session-management.md](references/session-management.md). Cookies and `state-save` / `state-load`: [references/storage-state.md](references/storage-state.md). This repo's auth caches live in gitignored `playwright/.auth/`; do not write over them unless the task is auth.

## Rest of the CLI

```sh
npx playwright cli go-forward
npx playwright cli dblclick e7
npx playwright cli hover e4
npx playwright cli drag e2 e8
npx playwright cli press ArrowDown
npx playwright cli keydown Shift
npx playwright cli keyup Shift
npx playwright cli dialog-accept          # or dialog-dismiss; optional prompt text
npx playwright cli resize 1728 1117
npx playwright cli eval "document.title"
npx playwright cli eval "el => el.getAttribute('data-testid')" e5
npx playwright cli console                # optional minimum level
npx playwright cli highlight e5           # --hide clears; --style="outline: 2px dashed red"
npx playwright cli tab-list
npx playwright cli tab-new <url>
npx playwright cli tab-select 0
npx playwright cli tab-close
npx playwright cli show --annotate        # user marks the live page
npx playwright cli pause-at tests/features/gyms/gyms.ui.acceptance.spec.ts:40
npx playwright cli resume
npx playwright cli step-over
```

Mouse coordinates (`mousemove`, `mousedown`, `mouseup`, `mousewheel`) are for canvas and widgets that have no accessible node. Prefer a ref when the snapshot has one.

## CLI references

Open the note that matches the task. Commands in those files are `npx playwright cli`.

| Task                                                     | Note                                                                 |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| `id`, `class`, `data-*`, computed style                  | [references/element-attributes.md](references/element-attributes.md) |
| Run a spec, or attach with `--debug=cli`                 | [references/playwright-tests.md](references/playwright-tests.md)     |
| Screenshot or WebM on a pull request                     | [references/pr-attachments.md](references/pr-attachments.md)         |
| Mock or block a request while exploring                  | [references/request-mocking.md](references/request-mocking.md)       |
| `run-code` for permissions, frames, downloads            | [references/running-code.md](references/running-code.md)             |
| Named sessions, attach, persistent profiles              | [references/session-management.md](references/session-management.md) |
| Cookies, storage, `state-save` / `state-load`            | [references/storage-state.md](references/storage-state.md)           |
| Turn a CLI session into an acceptance spec, then heal it | [references/test-generation.md](references/test-generation.md)       |
| Trace a flow                                             | [references/tracing.md](references/tracing.md)                       |
| Record a WebM                                            | [references/video-recording.md](references/video-recording.md)       |

## This repo

- Local app: `http://127.0.0.1:8080` after the port-forward in `CLAUDE.md`. Never open production. Staging only when the user asks for it.
- The app shell is blank until MSAL and feature flags settle. Snapshot again instead of asserting on the first paint.
- A ref is for this session only. Specs and page objects use role / `data-testid` / existing page-object methods (`generate-locator` is the bridge). Layout and titles: `.specify/rules/playwright-rules.md`.
- Snapshots the CLI writes under `.playwright-cli/` are gitignored scratch. Screenshots and other artefacts go in `/tmp`, not the repo.
