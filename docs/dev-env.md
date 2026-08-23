# Running against the live dev environment

Point Playwright at the long-lived AKS **dev** cluster (`aks-bjjeire-dev-sdc-01`), not Docker Compose or a SHA/PR ephemeral namespace.

This does **not** deploy anything. Flux already owns the app in `bjjeire-app`. You only hit the public URLs.

## URLs

| Role                         | Value                                                           |
| ---------------------------- | --------------------------------------------------------------- |
| Frontend origin (`BASE_URL`) | `https://dev.bjjeire.com`                                       |
| Events page (browser)        | `https://dev.bjjeire.com/events`                                |
| API (`API_URL`)              | `https://api-dev.bjjeire.com`                                   |
| PR preview (Flux)            | `https://pr-<n>.bjjeire.com` / `https://api-pr-<n>.bjjeire.com` |

Set **origins** in env, not paths. Specs navigate to `/events` themselves. `BASE_URL=https://dev.bjjeire.com/events` becomes `/events/events`.

Both hosts sit behind **Cloudflare Access**. A browser with no session gets a 302 to `bjjeire.cloudflareaccess.com`. Tests bypass that with the CF Access service-token headers from `.env.dev.local`.

## One-time setup

Prerequisites: Node 22, npm, Playwright browsers, and a `terraform` that can read state for `bjjeire-terraform-azurerm-aks` (dev backend).

```sh
npm ci
npx playwright install

# Writes .env.dev.local (mode 0600) from Terraform outputs.
# Default TF_DIR is ~/Sources/bjjeire-terraform-azurerm-aks
scripts/refresh-env.sh dev
```

`refresh-env.sh` fills `APP_ENV=dev`, the URLs above, Entra client-credentials, Cloudflare Access service token, and the Playwright test user. Do not commit `.env.dev.local`.

Manual copy is the fallback: `cp .env.dev.example .env.dev.local` and fill the blanks (Key Vault names are in the example comments).

`npm run test:dev` / `test:dev:api` set `APP_ENV=dev`, which loads, in order:

1. `.env.dev.local` (your secrets)
2. `.env.dev`
3. `.env.local`
4. `.env`

First file that defines a variable wins.

## Commands

```sh
# API listing suite (Chromium request context, no browser)
npm run test:dev:api

# UI suite against https://dev.bjjeire.com
npm run test:dev

# One feature / smoke
npm run test:dev -- tests/features/events/
npm run test:dev -- -g @smoke
APP_ENV=dev npx playwright test -c playwright.acceptance.config.ts -g @smoke
```

Leave `PW_UI_ENTRA_AUTH` unset/`false`. Public listing pages do not use in-app MSAL; Cloudflare Access is the edge, and the service token already gets the browser through.

## Auth: what is sent

| Layer             | Local `APP_ENV=dev`                                                | Why                                                                                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cloudflare Access | `CF-Access-Client-Id` / `CF-Access-Client-Secret` on every request | Required or the edge returns 302/401                                                                                                                                                                                               |
| Entra Bearer      | **Not** attached                                                   | Listing GETs are `permitAll`. Spring still validates a Bearer if present. Entra v2 client-credentials tokens use the API **app client ID** as `aud`, which does not match `api://bjjeire-api-dev` until that audience is deployed. |
| UI Entra login    | Off (`PW_UI_ENTRA_AUTH=false`)                                     | No in-app MSAL redirect on this cluster                                                                                                                                                                                            |

`AZURE_*` in `.env.dev.local` is still useful: CI and in-cluster runs set `API_AUTH_REQUIRED` implicitly (`(CI or in-cluster) && remote profile`) and then attach Bearer. To force that locally (write tests, after the API accepts the v2 `aud`):

```sh
API_AUTH_REQUIRED=true npm run test:dev:api
```

## 401 empty body

That is almost always Cloudflare Access or a rejected JWT, not a missing row in Mongo.

1. **No CF headers** — curl without the service token gets **302** to Access login. Confirm `.env.dev.local` has `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET` and you ran `scripts/refresh-env.sh dev` after the last `terraform apply`.
2. **CF headers + Entra Bearer** — curl with both gets **401** and `WWW-Authenticate: Bearer … aud claim is not valid`. Local listing tests must **not** send Bearer (the default after the `shouldUseEntraAuthorization` change). Unset is not required if you are on that code; if an old checkout still attaches the token:

   ```sh
   unset AZURE_TENANT_ID AZURE_API_SCOPE
   npm run test:dev:api
   ```

3. **Sanity check the edge** (uses values from `.env.dev.local`, does not print secrets):

   ```sh
   set -a && source .env.dev.local && set +a
   curl -sS -o /dev/null -w '%{http_code}\n' \
     -H "CF-Access-Client-Id: ${CF_ACCESS_CLIENT_ID}" \
     -H "CF-Access-Client-Secret: ${CF_ACCESS_CLIENT_SECRET}" \
     'https://api-dev.bjjeire.com/api/v1/bjjevent?page=1&pageSize=2'
   # expect 200
   curl -sS -o /dev/null -w '%{http_code}\n' \
     -H "CF-Access-Client-Id: ${CF_ACCESS_CLIENT_ID}" \
     -H "CF-Access-Client-Secret: ${CF_ACCESS_CLIENT_SECRET}" \
     'https://dev.bjjeire.com/events'
   # expect 200
   ```

## What this is not

| Target                                         | How                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------ |
| Docker Compose                                 | `npm run test:docker` / PR `compose_smoke` — `localhost`, no Access            |
| SHA ephemeral (`sha-<run_id>.dev.bjjeire.com`) | `bjjeire` `ci-main.yml` `acceptance_ephemeral` (`ACCEPTANCE_AKS_ENABLED=true`) |
| PR preview (`pr-<n>.dev.bjjeire.com`)          | `pr-env-validation.yml` + label `deploy-preview` (`PR_ENV_ENABLED=true`)       |

Those AKS jobs live in the app repo and `bjjeire-ci-templates`. This repo only supplies the Playwright suite they check out.
