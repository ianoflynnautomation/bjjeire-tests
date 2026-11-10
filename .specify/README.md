# Spec Kit configuration

Official home for [GitHub Spec Kit](https://github.com/github/spec-kit) in this
repository. The CLI reads **this directory** (`.specify/`), not `.spec-kit/`.

`specify init` is deliberately not run here. Spec Kit is a code-delivery loop
(`specify → plan → tasks → implement`). In this suite the Playwright agents do
that job: the planner writes scenarios, the generator rehearses each one in a
browser, and the reviewer checks them (see `docs/agents.md`). `/speckit-implement`
would skip the rehearsal and the `--repeat-each` gate. `/speckit-specify` would
also add numbered `specs/###-*/` directories beside `specs/features/`.

Only the constitution is kept, adopted in place:

| Path                     | Role                                                       |
| ------------------------ | ---------------------------------------------------------- |
| `memory/constitution.md` | Acceptance-suite principles                                |
| `../specs/templates/`    | Templates to copy (feature spec, exploration and mutation) |
| `../specs/`              | Living acceptance specs                                    |

Spec Kit runs in `bjjeire-java` (Claude integration). Its feature specs carry
AC-IDs and an `Acceptance Coverage` section. `playwright-test-planner` reads them
and records `Covers: AC-…` against each planned scenario; `npm run spec:check`
keeps the scenario titles and the tests in step. Product architecture
and database contracts are **not** duplicated here — they live in
`bjjeire-java/specs/`.
