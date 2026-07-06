---
description: Regenerate snapshot baselines for BOTH platforms (darwin locally, linux via the CI container).
---

Regenerate screenshot baselines after an intentional visual change. Baselines are
per-platform: local runs compare `-darwin.png`, CI compares `-linux.png` — **always
regenerate both together** or CI diverges from local.

Precondition: the app under test must be running the build you want to bless
(local minikube on `http://127.0.0.1:8080`; use `/redeploy-frontend` first if the
frontend changed).

Steps:

1. Darwin baselines (local):
   `APP_ENV=local BASE_URL=http://127.0.0.1:8080 API_URL=http://127.0.0.1:8080 npm run snapshots:update`
2. Linux baselines (same container image CI uses). The app must be reached via a
   `localhost` origin inside the container — MSAL requires a secure context and the
   app does not mount on `host.docker.internal` — so run a TCP relay:

   ```sh
   cat > /tmp/relay.cjs << 'EOF'
   const net = require('net');
   net.createServer(c => {
     const u = net.connect(8080, 'host.docker.internal');
     c.pipe(u).pipe(c);
     c.on('error', () => u.destroy());
     u.on('error', () => c.destroy());
   }).listen(8080, '127.0.0.1');
   EOF
   docker run --rm --add-host=host.docker.internal:host-gateway \
     -v "$PWD":/work -v /tmp/relay.cjs:/relay.cjs -w /work \
     -e CI=true -e APP_ENV=local \
     -e BASE_URL=http://localhost:8080 -e API_URL=http://localhost:8080 \
     mcr.microsoft.com/playwright:v1.61.0-noble \
     bash -c "node /relay.cjs & sleep 1 && npx playwright test -c playwright.ui.config.ts --project=snapshots --update-snapshots"
   ```

   (Keep the image tag in sync with the pinned `@playwright/test` version.)

3. Verify: re-run `npm run test:snapshots` locally AND the container command from
   step 2 without `--update-snapshots` — both must pass 8/8.
4. Review the changed `.png`/`.aria.yml` files and confirm the visual diff is the
   intended change, not an accident.

Success criteria: both platform runs green against the new baselines; only expected
baseline files changed. Remind the user that app-repo changes and baselines must be
committed together, or CI renders the old UI against new baselines.
