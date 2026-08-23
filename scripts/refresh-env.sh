#!/usr/bin/env bash
# refresh-env.sh — populate .env.<profile>.local from Terraform outputs.
#
# Usage:
#   scripts/refresh-env.sh [dev|staging|prod]   # defaults to dev
#
# Env var overrides:
#   TF_DIR     path to bjjeire-terraform-azurerm-aks (default: ~/Sources/bjjeire-terraform-azurerm-aks)
#   TESTS_DIR  path to bjjeire-tests                  (default: this repo root)
#
# Behavior:
#   1. Re-init terraform against environments/<profile>/backend.hcl (so this
#      works regardless of which env you last applied).
#   2. Read sensitive + non-sensitive outputs.
#   3. Atomically write .env.<profile>.local with mode 0600.
#
# Does NOT need TF_VAR_* secrets (read-only — outputs only).

set -euo pipefail

PROFILE="${1:-dev}"
case "$PROFILE" in
  dev|staging|prod) ;;
  *) echo "error: unknown profile '$PROFILE' (expected dev|staging|prod)" >&2; exit 2 ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="${TESTS_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
TF_DIR="${TF_DIR:-$HOME/Sources/bjjeire-terraform-azurerm-aks}"

[[ -d "$TF_DIR" ]] || { echo "error: TF_DIR '$TF_DIR' does not exist" >&2; exit 1; }
[[ -d "$TESTS_DIR" ]] || { echo "error: TESTS_DIR '$TESTS_DIR' does not exist" >&2; exit 1; }

BACKEND="environments/$PROFILE/backend.hcl"
[[ -f "$TF_DIR/$BACKEND" ]] || { echo "error: backend file '$TF_DIR/$BACKEND' not found" >&2; exit 1; }

# Per-profile public hostnames. Match the Cloudflare tunnel public hostnames
# created by main.cloudflare-tunnel.tf — flat single-label pattern for the API.
case "$PROFILE" in
  dev)
    BASE_URL="https://dev.bjjeire.com"
    API_URL="https://api-dev.bjjeire.com"
    ;;
  staging)
    BASE_URL="https://staging.bjjeire.com"
    API_URL="https://api-staging.bjjeire.com"
    ;;
  prod)
    BASE_URL="https://bjjeire.com"
    API_URL="https://api.bjjeire.com"
    ;;
esac

echo ">> refresh-env: profile=$PROFILE tf_dir=$TF_DIR tests_dir=$TESTS_DIR"

echo ">> terraform init (backend=$BACKEND)…"
(
  cd "$TF_DIR"
  terraform init -reconfigure -input=false -backend-config="$BACKEND" >/dev/null
)

# Read one output. Stays inside the TF_DIR subshell so we never carry the cd.
tf_out() {
  ( cd "$TF_DIR" && terraform output -raw "$1" )
}

echo ">> reading outputs…"
TENANT_ID=$(tf_out bjjeire_spa_msal_tenant_id)
TESTS_CLIENT_ID=$(tf_out bjjeire_tests_client_id)
TESTS_CLIENT_SECRET=$(tf_out bjjeire_tests_client_secret)
API_AUDIENCE=$(tf_out bjjeire_api_audience)
CF_CLIENT_ID=$(tf_out bjjeire_cloudflare_tests_service_token_client_id)
CF_CLIENT_SECRET=$(tf_out bjjeire_cloudflare_tests_service_token_client_secret)
PW_USER=$(tf_out bjjeire_pw_test_user_upn)
PW_PASS=$(tf_out bjjeire_pw_test_user_password)

OUT="$TESTS_DIR/.env.$PROFILE.local"
TMP="$(mktemp "${TMPDIR:-/tmp}/refresh-env.XXXXXX")"
trap 'rm -f "$TMP"' EXIT

# Write to a temp file with restrictive perms first, then move into place —
# avoids any window where a half-written file exists at the destination.
chmod 600 "$TMP"
cat > "$TMP" <<EOF
APP_ENV=$PROFILE
BASE_URL=$BASE_URL
API_URL=$API_URL
ACCEPT_INVALID_CERTS=false

AZURE_TENANT_ID=$TENANT_ID
AZURE_TESTS_CLIENT_ID=$TESTS_CLIENT_ID
AZURE_TESTS_CLIENT_SECRET=$TESTS_CLIENT_SECRET
AZURE_API_SCOPE=$API_AUDIENCE/.default
AZURE_AUTHORITY=https://login.microsoftonline.com/$TENANT_ID

CF_ACCESS_CLIENT_ID=$CF_CLIENT_ID
CF_ACCESS_CLIENT_SECRET=$CF_CLIENT_SECRET

PW_TEST_USER=$PW_USER
PW_TEST_PASSWORD=$PW_PASS
EOF

mv "$TMP" "$OUT"
trap - EXIT

echo ">> wrote $OUT (mode 0600)"

