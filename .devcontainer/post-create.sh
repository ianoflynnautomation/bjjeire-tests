#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# postCreateCommand — runs once, after the container is created.
#
# Installs Linux-native dependencies into the node_modules volume, wires up git
# hooks, seeds a starter .env, and prints a quick-start cheatsheet.
# ---------------------------------------------------------------------------
set -euo pipefail

WORKSPACE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${WORKSPACE}"

# Named volumes are created root-owned; hand them to the dev user.
echo "==> Claiming cache volumes"
for dir in "${WORKSPACE}/node_modules" "${HOME}/.npm" "${HOME}/.claude"; do
  [ -d "${dir}" ] || continue
  [ -O "${dir}" ] || sudo chown "$(id -u):$(id -g)" "${dir}"
done

# The workspace is bind-mounted from the host, so its uid rarely matches the
# container user's — without this git refuses to touch the repo.
git config --global --add safe.directory "${WORKSPACE}" 2>/dev/null || true

echo "==> Installing dependencies (npm ci)"
# --ignore-scripts skips package.json's postinstall (`playwright install
# --with-deps`): the browsers and their apt dependencies are already baked into
# this image, and --with-deps would shell out to apt for nothing.
npm ci --ignore-scripts

echo "==> Verifying Playwright browsers"
# No-op when the image tag and the pinned @playwright/test agree — and a
# self-heal (downloads into /ms-playwright) when they have drifted apart.
npx playwright install chromium firefox webkit

echo "==> Installing git hooks (husky)"
npx husky >/dev/null 2>&1 || echo "    (husky skipped — not a git checkout?)"

if [ ! -f "${WORKSPACE}/.env" ]; then
  echo "==> Seeding .env (local profile via the host relay)"
  cat > "${WORKSPACE}/.env" <<'EOF'
# Created by the dev container. `localhost` here is relayed to the same port on
# the Docker host — see .devcontainer/host-relay.cjs.
APP_ENV=local
BASE_URL=http://localhost:8080
API_URL=http://localhost:8080
ACCEPT_INVALID_CERTS=true
EOF
fi

echo ""
echo "==> Toolchain"
printf '  %-14s %s\n' "node"       "$(node --version)"
printf '  %-14s %s\n' "npm"        "$(npm --version)"
printf '  %-14s %s\n' "typescript" "$(npx tsc --version | awk '{print $2}')"
printf '  %-14s %s\n' "playwright" "$(npx playwright --version | awk '{print $2}')"
printf '  %-14s %s\n' "browsers"   "$(ls /ms-playwright | tr '\n' ' ')"

cat <<'EOF'

============================================================================
 BjjEire acceptance-test dev container is ready.

 The app under test runs on your HOST. Start it there, then use localhost
 in here — the relay forwards 8080/3000/5000/5003/4318 to the host:

   host$  kubectl port-forward -n bjjeire-app service/bjj-frontend 8080:80

 Run tests:
   npm run test:smoke                 # critical subset (@smoke)
   npm run test:acceptance            # full suite
   npm run test:a11y                  # axe WCAG 2.1 A/AA sweep
   npm run test:ci                    # CI semantics (retries, no fail-fast)
   npm run lint && npm run typecheck

 Snapshots: this container IS the CI image, so `-linux.png` baselines
 regenerated here match what CI compares:
   npm run snapshots:update           # then redo the darwin set on the host

 Reports:  npm run play-report        # forwarded on port 9323
 Relay:    tail -f /var/log/host-relay.log
============================================================================
EOF
