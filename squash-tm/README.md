# Squash TM (PostgreSQL)

Self-contained Docker Compose stack for Squash TM backed by PostgreSQL 15.
Independent of the Playwright suite in this repo.

## Start

```sh
cd squash-tm
./init-squash.sh                 # once: writes .env (gitignored, mode 600) with random secrets
docker compose up -d
docker compose logs -f squash-tm # first boot creates the schema; takes 1–3 minutes
```

UI: <http://localhost:8080/squash> (the bare root returns 404).
Default login: `admin` / `admin` — change it on first login.

## Before production

- Change the `admin` password and use named admin accounts.
- Give the Playwright sync its own service account and a personal API token
  (My account › Personal API tokens). It authenticates with that token only
  (`SQUASH_TM_TOKEN`). The JWT secret must be at least 86 characters, or token
  creation fails with a 500. `init-squash.sh` generates 128.
- Keep `SQUASH_RESTAPI_JWT_SECRET` and `SQUASH_CRYPTO_SECRET` unique per environment.
  Back up the crypto secret: losing it makes stored bugtracker/SCM credentials unreadable.
- Put a TLS reverse proxy in front and bind the app to `127.0.0.1:8080:8080`.
- Pin `SQUASH_TM_TAG` and the Postgres image to exact versions.
- Back up the database (attachments are stored in it):
  `docker compose exec squash-db pg_dump -U squashuser squash > backup.sql`
