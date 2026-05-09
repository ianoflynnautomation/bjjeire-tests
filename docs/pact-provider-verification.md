# Pact Provider Verification

`bjjeire-tests` can verify future external consumer pacts against the running BjjEire API in the Docker/staging acceptance layer.

## Current State

- BjjEire Web owns its consumer Pact tests in `src/bjjeire-app`.
- `bjjeire-tests` owns provider verification against a real container or staging API.
- Provider verification is disabled by default until another consumer app publishes pacts.

## Future Consumer App Setup

1. Add Pact consumer tests in the new app.
2. Publish generated pacts to a Pact Broker, or expose pact JSON files by URL.
3. Use provider name `BjjEireApi`.
4. Use stable provider states such as:
   - `gyms exist`
   - `bjj events exist`
   - `competitions exist`
   - `stores exist`
   - `feature flags are configured`

## Enable In Docker Acceptance

In the workflow that calls `.github/workflows/playwright-docker.yml`, set:

```yaml
with:
  verify_provider_pacts: true
  pact_broker_url: ${{ vars.PACT_BROKER_URL }}
secrets:
  PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
```

Or use direct pact URLs:

```yaml
with:
  verify_provider_pacts: true
  pact_urls: |
    https://example.com/pacts/OtherApp-BjjEireApi.json
```

When enabled, the workflow verifies those pacts against `API_URL` after the Docker Compose stack is healthy and seeded.
