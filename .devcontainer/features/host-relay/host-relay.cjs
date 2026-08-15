#!/usr/bin/env node
// ---------------------------------------------------------------------------
// host-relay — re-publish Docker-host ports on the container's loopback.
//
// The app under test runs on the *host* (minikube ingress via
// `kubectl port-forward`, or the app repo's compose stack). From inside a
// container that host is `host.docker.internal`, not `localhost` — but the
// tests cannot simply be pointed there: the app's MSAL sign-in requires a
// secure context, and only `localhost` (or HTTPS) qualifies. So we listen on
// 127.0.0.1:<port> in here and forward to host.docker.internal:<port>, which
// makes BASE_URL=http://localhost:8080 behave exactly as it does on the host.
//
// Ports come from HOST_RELAY_PORTS (comma-separated); the target host can be
// overridden with HOST_RELAY_TARGET. Ports already in use are skipped, so this
// never blocks a service you started yourself.
//
// Inside the dev container this is installed to /usr/local/share/host-relay.cjs
// and started by the feature's entrypoint. It is also run directly, from this
// path, by .claude/commands/update-snapshots.md when regenerating Linux
// baselines in a throwaway CI container.
// ---------------------------------------------------------------------------
const net = require('node:net');

const TARGET_HOST = process.env.HOST_RELAY_TARGET || 'host.docker.internal';
const DEFAULT_PORTS = '8080,3000,5000,5003,4318';

const ports = (process.env.HOST_RELAY_PORTS || DEFAULT_PORTS)
  .split(',')
  .map(value => Number(value.trim()))
  .filter(port => Number.isInteger(port) && port > 0 && port < 65536);

function log(message) {
  process.stdout.write(`[host-relay] ${message}\n`);
}

function relay(port) {
  const server = net.createServer(downstream => {
    const upstream = net.connect(port, TARGET_HOST);
    downstream.on('error', () => upstream.destroy());
    upstream.on('error', () => downstream.destroy());
    downstream.pipe(upstream).pipe(downstream);
  });

  server.on('error', error => {
    log(error.code === 'EADDRINUSE' ? `skipped :${port} (already in use)` : `skipped :${port} (${error.message})`);
  });

  server.listen(port, '127.0.0.1', () => log(`127.0.0.1:${port} -> ${TARGET_HOST}:${port}`));
}

if (ports.length === 0) {
  log('no valid ports in HOST_RELAY_PORTS — nothing to do');
} else {
  ports.forEach(relay);
}
