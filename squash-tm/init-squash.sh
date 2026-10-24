#!/usr/bin/env bash
# init-squash.sh — one-time bootstrap for the Squash TM + PostgreSQL stack.
# Generates a .env file with random credentials and application secrets.
# Re-running it will NOT overwrite an existing .env (it would lock you out
# of the existing database volume and invalidate stored encrypted data).
set -euo pipefail

ENV_FILE="$(dirname "$0")/.env"

if [[ -f "$ENV_FILE" ]]; then
  echo ".env already exists — leaving it untouched."
  exit 0
fi

command -v openssl >/dev/null || { echo "openssl is required"; exit 1; }

# Alphanumeric only, so the values are safe in .env, shells and JDBC URLs.
gen_secret() { openssl rand -base64 192 | tr -dc 'A-Za-z0-9' | head -c "${1:-40}"; }

umask 077   # .env readable by the owner only
cat > "$ENV_FILE" <<EOF
# ---- PostgreSQL ----
POSTGRES_DB=squash
POSTGRES_USER=squashuser
POSTGRES_PASSWORD=$(gen_secret 40)

# ---- Squash TM application secrets ----
# Signs personal API tokens (squash.rest-api.jwt.secret) with HS512. Squash
# base64-decodes it and HS512 needs >= 64 bytes, so it must be >= 86 characters.
SQUASH_RESTAPI_JWT_SECRET=$(gen_secret 128)
# Encrypts stored third-party credentials, e.g. bugtracker/SCM passwords (squash.crypto.secret)
SQUASH_CRYPTO_SECRET=$(gen_secret 64)

# ---- Image versions (pin these for reproducible deployments) ----
SQUASH_TM_TAG=latest
EOF

echo "Created $ENV_FILE (mode 600). Back it up somewhere safe — losing"
echo "SQUASH_CRYPTO_SECRET makes stored third-party credentials unreadable."
