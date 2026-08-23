#!/usr/bin/env bash
#
# Local reproduction of .github/workflows/env-deploy.yml — stand up, tear down,
# or just render an ephemeral BJJ Éire environment on an AKS cluster. Use it to
# manually test a full ephemeral env (browsable app) end-to-end, the same way
# the PR/acceptance pipelines do.
#
# It deploys in two layers, exactly like the workflow:
#   1. bootstrap chart (.github/k8s/env/bootstrap)  -> Namespace + ExternalSecrets + HTTPRoutes
#   2. umbrella OCI chart (oci://.../bjj-eire)       -> MongoDB + API + frontend + seeder
#
# Usage:
#   scripts/deploy-ephemeral.sh render  --env-id cli-smoke
#   scripts/deploy-ephemeral.sh deploy  --env-id cli-smoke --image-tag <tag>
#   scripts/deploy-ephemeral.sh destroy --env-id cli-smoke
#
# Common options (with defaults matching env-deploy.yml's dev profile):
#   --env-id            Namespace / env id (DNS-1123 label).            (required)
#   --image-tag         Container tag for api/frontend/seeder.          (required for deploy)
#   --root-domain       Public DNS zone.                                (bjjeire.com)
#   --resource-group    AKS resource group.                            (rg-bjjeire-dev-sdc-01)
#   --cluster-name      AKS cluster name.                              (aks-bjjeire-dev-sdc-01)
#   --chart-ref         Umbrella OCI chart ref.                        (oci://ghcr.io/ianoflynnautomation/bjj-eire)
#   --chart-version     Chart version constraint.                      (>=0.1.0)
#   --ttl               Janitor TTL annotation.                        (2h)
#   --skip-credentials  Don't run az aks get-credentials (reuse current kubectl context).
#
# Auth notes:
#   - Pulling the umbrella OCI *chart* needs a GHCR login. Either run
#     `helm registry login ghcr.io -u <user> -p <PAT>` first, or export
#     GHCR_USER + GHCR_TOKEN and this script will log in for you.
#   - The cluster pulls *images* via the ghcr-pull-secret ExternalSecret
#     (sourced from Key Vault by the bootstrap layer) — nothing to do locally.
#   - Assumes you've run `az login`; cluster auth uses kubelogin azurecli mode.
#
set -euo pipefail

# --- locations -------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BOOTSTRAP_CHART="${REPO_ROOT}/.github/k8s/env/bootstrap"
VALUES_EPHEMERAL="${REPO_ROOT}/.github/k8s/env/values-ephemeral.yaml"

# --- defaults (mirror env-deploy.yml workflow_dispatch) --------------------
ENV_ID=""
IMAGE_TAG=""
ROOT_DOMAIN="bjjeire.com"
RESOURCE_GROUP="rg-bjjeire-dev-sdc-01"
CLUSTER_NAME="aks-bjjeire-dev-sdc-01"
CHART_REF="oci://ghcr.io/ianoflynnautomation/bjj-eire"
CHART_VERSION=">=0.1.0"
TTL="2h"
SKIP_CREDENTIALS="false"
GHCR_USER="${GHCR_USER:-}"
GHCR_TOKEN="${GHCR_TOKEN:-}"

# Secrets the umbrella chart references; the bootstrap layer creates the
# matching ExternalSecrets and these must materialise before the app installs.
readonly REQUIRED_SECRETS=(
  bjj-mongodb-root-password
  bjj-azure-ad-secret
  ghcr-pull-secret
  bjj-donation-secret
)

# --- helpers ---------------------------------------------------------------
# All progress/diagnostics go to stderr so `render` stdout stays clean YAML
# (pipeable to kubectl).
log()  { printf '\033[1;34m==>\033[0m %s\n' "$*" >&2; }
ok()   { printf '\033[1;32m  ✓\033[0m %s\n' "$*" >&2; }
warn() { printf '\033[1;33m  ! \033[0m%s\n' "$*" >&2; }
die()  { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

usage() {
  sed -n '2,40p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

require_tools() {
  for t in "$@"; do
    command -v "$t" >/dev/null 2>&1 || die "required tool not found on PATH: $t"
  done
}

validate_env_id() {
  [ -n "${ENV_ID}" ] || die "--env-id is required"
  # Kubernetes namespace / DNS-1123 label.
  if ! printf '%s' "${ENV_ID}" | grep -Eq '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'; then
    die "invalid --env-id '${ENV_ID}': must match ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$"
  fi
}

get_credentials() {
  if [ "${SKIP_CREDENTIALS}" = "true" ]; then
    log "Using current kubectl context: $(kubectl config current-context 2>/dev/null || echo '<none>')"
    return
  fi
  require_tools az kubelogin
  log "Fetching AKS credentials (${CLUSTER_NAME} / ${RESOURCE_GROUP})"
  az aks get-credentials \
    --resource-group "${RESOURCE_GROUP}" \
    --name "${CLUSTER_NAME}" \
    --overwrite-existing
  kubelogin convert-kubeconfig -l azurecli
}

# --- subcommands -----------------------------------------------------------
render_bootstrap() {
  # Renders the bootstrap layer to stdout (or $1). No cluster needed.
  helm template bjj-eire-env "${BOOTSTRAP_CHART}" \
    --set-string envId="${ENV_ID}" \
    --set-string rootDomain="${ROOT_DOMAIN}" \
    --set-string ttl="${TTL}" \
    ${1:+> "$1"}
}

write_values_overlay() {
  # Per-env values for the umbrella chart (the bits that vary by env).
  local out="$1"
  cat > "${out}" <<EOF
bjj-mongodb:
  namespace: ${ENV_ID}
bjj-api:
  namespace: ${ENV_ID}
  api:
    image:
      tag: "${IMAGE_TAG}"
    env:
      CorsOptions__AllowedOrigins: "https://${ENV_ID}.${ROOT_DOMAIN}"
      OTEL_RESOURCE_ATTRIBUTES__deployment.environment: "${ENV_ID}"
bjj-frontend:
  namespace: ${ENV_ID}
  frontend:
    image:
      tag: "${IMAGE_TAG}"
    env:
      SERVICES_API_HTTP_0: "http://bjj-api.${ENV_ID}.svc.cluster.local:80"
    waitForApi:
      apiUrl: "http://bjj-api.${ENV_ID}.svc.cluster.local:80/health"
seeder:
  image:
    tag: "${IMAGE_TAG}"
EOF
}

cmd_render() {
  require_tools helm
  validate_env_id
  log "Rendering bootstrap layer for '${ENV_ID}'"
  render_bootstrap
}

cmd_deploy() {
  require_tools helm kubectl
  validate_env_id
  [ -n "${IMAGE_TAG}" ] || die "--image-tag is required for deploy (single tag shared by api/frontend/seeder)"
  get_credentials

  local workdir
  workdir="$(mktemp -d)"
  trap 'rm -rf "${workdir}"' EXIT

  log "Rendering + validating bootstrap (Namespace + ExternalSecrets + HTTPRoutes)"
  render_bootstrap "${workdir}/manifests.yaml"
  kubectl apply --dry-run=client -f "${workdir}/manifests.yaml" >/dev/null
  ok "bootstrap manifests valid"

  log "Applying bootstrap layer"
  kubectl apply -f "${workdir}/manifests.yaml"

  log "Waiting for ExternalSecrets to materialise"
  for secret in "${REQUIRED_SECRETS[@]}"; do
    local i
    for i in $(seq 1 60); do
      if kubectl -n "${ENV_ID}" get secret "${secret}" >/dev/null 2>&1; then
        ok "${secret}"
        break
      fi
      if [ "${i}" -eq 60 ]; then
        kubectl -n "${ENV_ID}" describe externalsecret "${secret}" || true
        die "secret ${secret} never appeared in ${ENV_ID} after 120s"
      fi
      sleep 2
    done
  done

  if [ -n "${GHCR_TOKEN}" ] && [ -n "${GHCR_USER}" ]; then
    log "Logging in to GHCR for the umbrella chart pull"
    helm registry login ghcr.io --username "${GHCR_USER}" --password "${GHCR_TOKEN}"
  else
    warn "GHCR_USER/GHCR_TOKEN not set — assuming 'helm registry login ghcr.io' was already done"
  fi

  write_values_overlay "${workdir}/values-dynamic.yaml"
  log "helm upgrade --install bjj-eire (${CHART_REF} ${CHART_VERSION})"
  helm upgrade --install bjj-eire \
    "${CHART_REF}" \
    --version "${CHART_VERSION}" \
    --namespace "${ENV_ID}" \
    --values "${VALUES_EPHEMERAL}" \
    --values "${workdir}/values-dynamic.yaml" \
    --wait \
    --timeout 10m

  log "Waiting for rollout"
  local dep
  for dep in bjj-api bjj-frontend; do
    kubectl -n "${ENV_ID}" rollout status "deployment/${dep}" --timeout=5m
  done

  local base="https://${ENV_ID}.${ROOT_DOMAIN}"
  local api="https://api-${ENV_ID}.${ROOT_DOMAIN}"
  log "Smoke ping (DNS + cert propagation can take 30-90s)"
  local url code
  for url in "${base}" "${api}/health"; do
    local got=0 i
    for i in $(seq 1 60); do
      code="$(curl -sko /dev/null -w '%{http_code}' --max-time 3 "${url}" || echo 000)"
      case "${code}" in
        2*|3*) ok "${url} -> ${code}"; got=1; break ;;
        *) sleep 2 ;;
      esac
    done
    [ "${got}" -eq 1 ] || warn "${url} did not return 2xx/3xx within 120s (may still be warming up)"
  done

  printf '\n'
  ok "Environment '${ENV_ID}' is up"
  printf '    frontend : %s\n' "${base}"
  printf '    api      : %s\n' "${api}"
  printf '    internal : http://bjj-api.%s.svc.cluster.local\n' "${ENV_ID}"
  printf '    teardown : %s destroy --env-id %s\n' "${BASH_SOURCE[0]}" "${ENV_ID}"
}

cmd_destroy() {
  require_tools helm kubectl
  validate_env_id
  get_credentials

  if ! kubectl get namespace "${ENV_ID}" >/dev/null 2>&1; then
    log "Namespace ${ENV_ID} not present — nothing to destroy"
    return
  fi

  # Same guard as env-deploy.yml: refuse to delete anything that isn't marked
  # ephemeral, so a mistyped env-id can't take out a long-lived namespace.
  local label
  label="$(kubectl get namespace "${ENV_ID}" -o jsonpath='{.metadata.labels.bjjeire\.io/ephemeral}' 2>/dev/null || true)"
  [ "${label}" = "true" ] || die "namespace ${ENV_ID} is missing bjjeire.io/ephemeral=true — refusing to delete"

  log "Uninstalling release + deleting namespace ${ENV_ID}"
  helm uninstall bjj-eire --namespace "${ENV_ID}" --ignore-not-found || true
  kubectl delete namespace "${ENV_ID}" --wait=false
  ok "namespace ${ENV_ID} marked for deletion"
}

# --- arg parsing -----------------------------------------------------------
[ $# -ge 1 ] || usage 1
COMMAND="$1"; shift

while [ $# -gt 0 ]; do
  case "$1" in
    --env-id)         ENV_ID="$2"; shift 2 ;;
    --image-tag)      IMAGE_TAG="$2"; shift 2 ;;
    --root-domain)    ROOT_DOMAIN="$2"; shift 2 ;;
    --resource-group) RESOURCE_GROUP="$2"; shift 2 ;;
    --cluster-name)   CLUSTER_NAME="$2"; shift 2 ;;
    --chart-ref)      CHART_REF="$2"; shift 2 ;;
    --chart-version)  CHART_VERSION="$2"; shift 2 ;;
    --ttl)            TTL="$2"; shift 2 ;;
    --skip-credentials) SKIP_CREDENTIALS="true"; shift ;;
    -h|--help)        usage 0 ;;
    *)                die "unknown option: $1 (try --help)" ;;
  esac
done

case "${COMMAND}" in
  render)  cmd_render ;;
  deploy)  cmd_deploy ;;
  destroy) cmd_destroy ;;
  -h|--help|help) usage 0 ;;
  *) die "unknown command: ${COMMAND} (expected: render | deploy | destroy)" ;;
esac
