# Spec Kit configuration

Official home for [GitHub Spec Kit](https://github.com/github/spec-kit) in this
repository. The CLI reads **this directory** (`.specify/`), not `.spec-kit/`.

`specify init` was not run: it would clobber `CLAUDE.md` / `AGENTS.md`. The
constitution, Playwright rules, and templates were adopted in place.

| Path                        | Role                        |
| --------------------------- | --------------------------- |
| `memory/constitution.md`    | Acceptance-suite principles |
| `rules/playwright-rules.md` | Agent digest of `CLAUDE.md` |
| `templates/`                | Feature spec templates      |
| `../specs/`                 | Living acceptance specs     |

Product architecture and database contracts are **not** duplicated here — they
live in `bjjeire-java/specs/`.
