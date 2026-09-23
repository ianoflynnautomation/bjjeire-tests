---
name: playwright-explore-website
description: Explore a website for acceptance testing with Playwright MCP or the pinned CLI. Use when asked to explore a page, map user flows, or find what to cover.
---

# Website exploration for testing

Follow `.claude/skills/playwright-cli/SKILL.md`.

1. Open the URL the user gave. If they mean the app under test and give no URL, use `http://127.0.0.1:8080`. If neither is clear, ask for a URL.
2. Walk 3–5 core flows. Snapshot before each interaction. Record the accessible name and role, plus the outcome you observed.
3. Close the browser.
4. Summarize the flows. Propose acceptance cases whose titles match `specs/features/` and whose files follow `.specify/rules/playwright-rules.md`. Do not write those specs until asked.
