#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# postStartCommand — runs on every container start.
#
# The host relay itself is started by the host-relay feature's entrypoint (a
# lifecycle hook cannot keep a daemon alive — see features/host-relay/install.sh).
# All this does is report where it got to, so a failed bind is visible without
# hunting for the log.
# ---------------------------------------------------------------------------
set -euo pipefail

RELAY_LOG="/var/log/host-relay.log"

if pgrep -f '[h]ost-relay.cjs' >/dev/null 2>&1; then
  echo "==> host-relay:"
  sed 's/^/    /' "${RELAY_LOG}" 2>/dev/null || echo "    (no log yet)"
else
  echo "==> host-relay is NOT running — localhost URLs will not reach the host."
  echo "    Check ${RELAY_LOG}, or rebuild the container."
fi
