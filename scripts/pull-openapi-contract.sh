#!/usr/bin/env bash
# pull-openapi-contract.sh — fetch the published OpenAPI contract into contracts/openapi-v1.json.
#
# Usage:
#   scripts/pull-openapi-contract.sh [tag]   # defaults to latest; pass a commit SHA to pin
#
# The contract is the OCI artifact bjjeire-java CI pushes on main
# (ghcr.io/ianoflynnautomation/bjjeire-openapi-contract, one openapi-v1.json layer).
# Anonymous pull works while the package is public; otherwise the gh CLI token is used.
set -euo pipefail

TAG="${1:-latest}"
REPO="ianoflynnautomation/bjjeire-openapi-contract"
OUT="contracts/openapi-v1.json"

# ghcr.io answers 403 to anonymous token requests for a private package; fall through to gh.
token=$(curl -fsS "https://ghcr.io/token?scope=repository:${REPO}:pull" 2>/dev/null \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).token ?? ""' 2>/dev/null || true)
if [[ -z "$token" ]]; then
  token=$(gh auth token | base64)
fi

manifest=$(curl -fsS -H "Authorization: Bearer ${token}" \
  -H "Accept: application/vnd.oci.image.manifest.v1+json" \
  "https://ghcr.io/v2/${REPO}/manifests/${TAG}")
digest=$(node -pe 'JSON.parse(process.argv[1]).layers[0].digest' "$manifest")

mkdir -p "$(dirname "$OUT")"
curl -fsSL -H "Authorization: Bearer ${token}" "https://ghcr.io/v2/${REPO}/blobs/${digest}" -o "$OUT"
echo "Pulled ${REPO}:${TAG} (${digest}) → ${OUT}. Next: npm run gen:api-schemas"
