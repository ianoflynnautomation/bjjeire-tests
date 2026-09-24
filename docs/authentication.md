# Authentication strategy

How Playwright authenticates when `APP_ENV=dev` loads [`.env.dev.local`](../.env.dev.local). Commands, URLs, and the Cloudflare sanity check live in [dev-env.md](dev-env.md). This page is the strategy: which gate each header clears, when a token is minted, and what a laptop run actually sends.

`.env.dev.local` is gitignored (`0600` when `scripts/refresh-env.sh` writes it). Never commit it, and never paste its values into a doc, log, or PR.

## Two gates

Dev (`https://dev.bjjeire.com` and `https://api-dev.bjjeire.com`) has two independent checks. A request can pass one and fail the other.

| Gate              | Header                                              | What it clears                                                                                                                                          | When this suite sends it                                                   |
| ----------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Cloudflare Access | `CF-Access-Client-Id` and `CF-Access-Client-Secret` | The edge. Without them a browser is redirected to `bjjeire.cloudflareaccess.com`.                                                                       | Whenever both `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` are set. |
| Entra ID          | `Authorization: Bearer …`                           | The API's own authorization. Listing GETs on dev are `permitAll`, and Spring still rejects a Bearer whose `aud` does not match `api://bjjeire-api-dev`. | Only when API auth is required. On a laptop that flag defaults to off.     |

Cloudflare headers are attached in `src/shared/config/cf-access.ts` and placed on the Playwright `extraHTTPHeaders` of both the UI base config and the API project. The API project replaces `extraHTTPHeaders`, so it spreads the Cloudflare headers again. Per-test headers (Bearer, `traceparent`) are added later in `src/api/fixtures/index.ts` and do not remove the Cloudflare pair.

`requestAuth: 'none'` (only `tests/api/authorization.api.acceptance.spec.ts`) withholds the Bearer. It leaves the Cloudflare headers in place. That spec skips itself unless `env.apiAuth.required` is true, because local and docker targets do not enforce API auth.

## Loading `.env.dev.local`

`APP_ENV` selects the file. `npm run test:dev` and `npm run test:dev:api` set `APP_ENV=dev` before Playwright starts. A bare `npx playwright test` defaults to `local` and does not read `.env.dev.local`.

For `APP_ENV=dev`, `src/shared/config/profile.ts` loads the first existing file of each of these, and the first definition of a variable wins (`dotenv` does not override):

1. `.env.dev.local` — secrets for this machine
2. `.env.dev` — shared defaults; none are committed today
3. `.env.local`
4. `.env`

Create the file with `scripts/refresh-env.sh dev` (Terraform outputs, mode `0600`) or by copying `.env.dev.example` and filling the blanks. The script writes:

| Variable                                                                                                      | Role                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `APP_ENV`, `BASE_URL`, `API_URL`                                                                              | Profile and public origins. Origins only — specs add `/events` themselves.                                                                                            |
| `AZURE_TENANT_ID`, `AZURE_TESTS_CLIENT_ID`, `AZURE_TESTS_CLIENT_SECRET`, `AZURE_API_SCOPE`, `AZURE_AUTHORITY` | Entra client-credentials material for the tests app registration. `AZURE_API_SCOPE` is `api://bjjeire-api-dev/.default` (the `/.default` suffix is added if missing). |
| `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET`                                                              | Cloudflare Access service token.                                                                                                                                      |
| `PW_TEST_USER`, `PW_TEST_PASSWORD`                                                                            | Dedicated Entra user from `main.entra-test-user.tf`. Stored for the browser sign-in. Unused while `PW_UI_ENTRA_AUTH` is off.                                          |
| `ACCEPT_INVALID_CERTS=false`                                                                                  | Dev is served with a public Cloudflare certificate.                                                                                                                   |

`PW_UI_ENTRA_AUTH` is absent from the generated file. The code default is `false`.

## What a laptop run sends

A developer machine is `executionContext: local` (`CI` unset, no `AZURE_FEDERATED_TOKEN_FILE`, no `KUBERNETES_SERVICE_HOST`). For that context against a remote profile, `API_AUTH_REQUIRED` and `CF_ACCESS_REQUIRED` both default to **false**. Set either variable to `true` or `false` to override the default.

With a `refresh-env.sh` file and no overrides:

| Surface                      | Cloudflare service token      | Entra Bearer | Browser sign-in                             |
| ---------------------------- | ----------------------------- | ------------ | ------------------------------------------- |
| UI (`npm run test:dev`)      | Sent on every browser request | Not sent     | Off. No `setup` project, no `storageState`. |
| API (`npm run test:dev:api`) | Sent on every request         | Not sent     | No browser.                                 |

The `api-setup` project still runs, because the file contains a tenant id, an API scope, and Cloudflare credentials. `tests/auth.api.setup.ts` checks that the Cloudflare header pair is non-empty. It mints an Entra token only when API auth is required, so the default laptop run does not mint one.

That default is deliberate. Listing routes do not require a caller identity, and an Entra v2 client-credentials token uses the API app's client id as `aud`. Spring on dev expects `api://bjjeire-api-dev`, so attaching the token today produces **401** with `WWW-Authenticate: Bearer … aud claim is not valid`. Leave the Bearer off until that audience is deployed.

To force the Bearer on a laptop after the API accepts it:

```sh
API_AUTH_REQUIRED=true npm run test:dev:api
```

## When the Bearer is minted

`shouldUseEntraAuthorization()` is `env.apiAuth.required`. That flag defaults to true only when **both** of these hold:

- the process is CI (`CI` set) or in a cluster (`AZURE_FEDERATED_TOKEN_FILE` or `KUBERNETES_SERVICE_HOST`)
- `APP_ENV` is a remote profile (`dev` or `staging`)

Docker Compose in CI stays unauthenticated: `APP_ENV=docker` is not remote, so the setup project does not demand `AZURE_API_SCOPE`.

When the flag is on, `src/api/support/auth.ts` picks one strategy:

| Strategy               | Chosen when                                                  | Credential                                                                                                                  |
| ---------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Client credentials     | No workload identity, and `AZURE_TESTS_CLIENT_SECRET` is set | MSAL confidential client. Needs `AZURE_TENANT_ID`, `AZURE_TESTS_CLIENT_ID`, `AZURE_TESTS_CLIENT_SECRET`, `AZURE_API_SCOPE`. |
| Azure credential chain | Workload identity is present, or no client secret is set     | `DefaultAzureCredential`. On an ARC runner pod that is the federated token. On a laptop with no secret it is `az login`.    |

A laptop file from `refresh-env.sh` has a client secret and no workload identity, so `API_AUTH_REQUIRED=true` uses client credentials, not `az login`.

The access token is cached in `playwright/.auth/api-token.json` (mode `0600`, write-then-rename). The cache entry stores the scope. A different scope, or a token inside 60 seconds of expiry, is minted again. `api-setup` warms the file once per run so workers do not each mint. Delete the file to force a new token. It is gitignored.

## UI sign-in

Public listing pages on this cluster do not run in-app MSAL. Cloudflare Access is the edge (`bjjeire-terraform-azurerm-aks` ADR-0004), and the service token already gets the browser through. Leave `PW_UI_ENTRA_AUTH` unset. The user and password are still written into `.env.dev.local` so the browser flow can be turned on without minting a new identity.

That user is not a human account and not the `bjjeire-tests-<env>` app registration. `bjjeire-terraform-azurerm-aks` `main.entra-test-user.tf` creates `azuread_user.playwright_test` when `playwright_test_user_enabled` is true. Dev sets that flag. The variable defaults to false, and a validation blocks it in prod: a passworded user excluded from MFA is a test identity.

| Property                      | Value                                                                                                                                                |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| UPN (`PW_TEST_USER`)          | `<prefix>-<environment>@<tenant default domain>`. The prefix defaults to `playwright-test`, so dev is `playwright-test-dev@…`.                       |
| Display name                  | `Playwright Test User (<environment>)`                                                                                                               |
| Password (`PW_TEST_PASSWORD`) | `random_password.playwright_test_user`, 32 characters. `force_password_change` is false, because Playwright cannot drive the change-password screen. |
| Key Vault                     | `bjj-tests-pw-user` and `bjj-tests-pw-password`. Both are empty strings when the user is not provisioned.                                            |
| Terraform outputs             | `bjjeire_pw_test_user_upn`, `bjjeire_pw_test_user_password`. `scripts/refresh-env.sh` copies those into `.env.dev.local`.                            |

Terraform does not edit Conditional Access. The user has to be excluded from MFA by hand, usually by membership of a `test-users-no-mfa` group listed on each policy's exclusions. A real account is the wrong principal here: it has MFA, session timeouts, mailbox mail on every CI sign-in, and it adds noise to the audit log.

On dev, `github_manage_actions_oidc` defaults to on. When that flag and `playwright_test_user_enabled` are both true, `main.github-actions.tf` writes `PW_TEST_USER` and `PW_TEST_PASSWORD` as GitHub Actions secrets on the app repo and on `bjjeire-tests`.

`src/ui/config/playwright.ts` turns the `setup` project on only when `PW_UI_ENTRA_AUTH=true` **and** both `PW_TEST_USER` and `PW_TEST_PASSWORD` are set. That project runs `tests/auth.setup.ts`, which signs in through Entra and writes `playwright/.auth/ui-user.json`. Later projects reuse it as `storageState`. `PW_UI_STORAGE_STATE` points at an existing file and skips the setup project entirely, so CI shards do not each drive the login form. With the flag left at its default, populating the user and password does nothing at runtime.

## Other profiles

| Profile            | Credential file                                         | Cloudflare                        | Entra Bearer                             |
| ------------------ | ------------------------------------------------------- | --------------------------------- | ---------------------------------------- |
| `local` (minikube) | `.env` / `.env.local`                                   | Off, unless you set the CF pair   | Off, unless `API_AUTH_REQUIRED=true`     |
| `docker`           | `.env.docker.local`                                     | Off                               | Off, including in CI                     |
| `dev`              | `.env.dev.local`                                        | On, when the service token is set | On in CI and in-cluster; off on a laptop |
| `staging`          | `.env.staging.local` (`scripts/refresh-env.sh staging`) | Same rules as dev                 | Same rules as dev                        |

Do not point this suite at production. Staging runs only as an explicit task.
