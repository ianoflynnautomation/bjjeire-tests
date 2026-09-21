# Spec Kit lives in `.specify/`

This directory name (`.spec-kit/`) is a pointer, not the working tree.

[GitHub Spec Kit](https://github.com/github/spec-kit) initializes and reads **`.specify/`**. Putting constitution, rules, or templates here would make `specify` and coding-agent slash commands miss them.

| Requested path         | Canonical path                                                          |
| ---------------------- | ----------------------------------------------------------------------- |
| `.spec-kit/rules/`     | [`.specify/rules/`](../.specify/rules/)                                 |
| `.spec-kit/templates/` | [`.specify/templates/`](../.specify/templates/)                         |
| constitution           | [`.specify/memory/constitution.md`](../.specify/memory/constitution.md) |

Acceptance specs that bind this suite to the app are in [`specs/`](../specs/).
Product architecture and database contracts live in the app repo (`bjjeire-java/specs/`).
