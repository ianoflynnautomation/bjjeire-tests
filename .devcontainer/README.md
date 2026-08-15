# Dev container

A ready-to-run environment for the BjjEire acceptance suite: Node, TypeScript,
Playwright and all three browsers, ESLint/Prettier, and the VS Code Playwright
test explorer. Open the repo in VS Code and pick **Reopen in Container**, or from
a terminal:

```sh
devcontainer up --workspace-folder .
devcontainer exec --workspace-folder . npm run test:smoke
```

## What it is built on

| Piece          | Choice                                                              |
| -------------- | ------------------------------------------------------------------- |
| Base image     | `mcr.microsoft.com/playwright:v1.61.0-noble` — the image CI runs in |
| User           | `vscode` (uid 1000, passwordless sudo), never root                  |
| Browsers       | Pre-baked at `/ms-playwright`; nothing to download on first start   |
| Features       | common-utils (zsh), github-cli, docker-in-docker, claude-code       |
| `node_modules` | Named volume — the host tree holds darwin-arm64 binaries            |

Using the CI image as the dev base is deliberate. Screenshot baselines are
per-platform and CI compares the `-linux.png` set, so a Linux container that
renders text even slightly differently would fail `--project=snapshots` on every
run. Same image in, same pixels out — and `npm run snapshots:update` in here
produces baselines CI agrees with.

The pinned tag must match `@playwright/test` in `package.json`. Renovate's
`playwright` group covers this Dockerfile alongside the root one and the
workflow default image, so all four move in one PR.

## Reaching the app under test

The app runs on your **host** — minikube, the app repo's compose stack, or a
remote environment. Start it there as usual:

```sh
host$ kubectl port-forward -n bjjeire-app service/bjj-frontend 8080:80
```

Inside the container, `localhost` still works: `host-relay.cjs` listens on the
container loopback and forwards to `host.docker.internal`. Ports come from
`HOST_RELAY_PORTS` in `devcontainer.json` — `8080,3000,5000,5003,4318` by
default; ports already bound are skipped.

It ships as a local feature (`features/host-relay/`) so it can run from the
container's entrypoint. A `postStartCommand` cannot hold a daemon: the CLI runs
lifecycle hooks in a `docker exec` and kills whatever that exec leaves behind,
even a `setsid`-detached process. `postStartCommand` only reports status.

Why a relay instead of pointing `BASE_URL` at `host.docker.internal:8080`? The
app's MSAL sign-in needs a secure context, and only `localhost` (or HTTPS)
qualifies. Relaying keeps `.env` identical to the host's.

```sh
tail -f /var/log/host-relay.log        # what got bound, what got skipped
```

Remote environments (`APP_ENV=dev|staging`) need no relay — set `BASE_URL` /
`API_URL` in `.env` and go.

## Environment

`postCreateCommand` seeds a `.env` pointing at `http://localhost:8080` only if
one does not already exist, so a bind-mounted host `.env` is left untouched. The
repo's own loader (`src/shared/config/profile.ts`) reads
`.env.<profile>.local` → `.env.<profile>` → `.env.local` → `.env`, so nothing
container-specific is needed. Secrets (Azure, Cloudflare Access) go in the same
files — all gitignored.

## Ports

| Port                | What                                                       |
| ------------------- | ---------------------------------------------------------- |
| 9323                | `npm run play-report` — forwarded to the host, opens a tab |
| 8080/3000/5000/5003 | App under test, relayed **from** the host                  |
| 4318                | OTLP collector, relayed from the host                      |

The relayed ports are marked `onAutoForward: ignore`: they are inbound from the
host, and forwarding them back out would collide with the process they point at.

## Docker inside the container

`docker-in-docker` is enabled, so `docker compose up` and the CI runner image
work in here — relative bind mounts in `docker-compose.yml` resolve against the
container filesystem, which is what you want. It is the main reason the container
needs `privileged`; drop the feature if you never use it and start-up gets a
little faster.

## Rebuilding

`npm ci` runs once, at create time, into the `bjjeire-tests-node-modules` volume.
After a `package-lock.json` change, run `npm ci` yourself or rebuild the
container. To start completely clean:

```sh
docker volume rm bjjeire-tests-node-modules bjjeire-tests-npm-cache
```
