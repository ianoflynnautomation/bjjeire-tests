---
description: Run lint and typecheck, auto-fix what's possible, and report remaining issues.
---

Steps:

1. Run `npx eslint . --fix` to auto-fix lint errors (Prettier runs via the plugin).
2. Run `npx tsc --noEmit` to typecheck.
3. If either step has remaining errors, list them with file paths and line numbers,
   then fix what has an unambiguous fix and re-run.

Success criteria: both commands exit clean. Report what was auto-fixed, what you fixed
manually, and anything left that needs a human decision (never suppress a rule to get
to green).
