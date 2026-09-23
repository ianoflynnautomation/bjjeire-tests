---
name: playwright-automation-fill-in-form
description: Fill a web form with Playwright MCP or the pinned CLI and stop before submit. Use when asked to complete a form, enter field values, or upload a file into a form.
---

# Fill a form

Follow `.claude/skills/playwright-cli/SKILL.md`.

1. Open the URL the user gave and snapshot the form. If they give no URL or no field values, ask for them.
2. Fill each field from the latest snapshot ref. On the CLI, file inputs use `upload` with an absolute path, or `drop <ref> --path=<absolute path>`. On MCP, use `browser_file_upload` or `browser_drop`.
3. Snapshot again and read the values back.
4. Do not submit. Ask the user to review the filled form first. Submit only after they say to.
