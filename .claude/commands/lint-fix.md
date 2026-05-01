Run lint and typecheck, auto-fix what's possible, and report remaining issues.

Steps:
1. Run `npx eslint . --fix` to auto-fix lint errors
2. Run `npx tsc --noEmit` to typecheck
3. Run `npx prettier --check .` to verify formatting
4. If any step has remaining errors, list them with file paths and line numbers
5. If all clean, confirm the codebase passes lint + typecheck + format checks
