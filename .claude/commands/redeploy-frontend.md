---
description: Rebuild the bjj-frontend image from the app repo working tree and roll it into local minikube.
---

Redeploy the frontend to the local minikube cluster so tests run against current app
code. Follows §7 of `~/Sources/bjjeire-deploy/bjj-eire/artifact/LOCAL_DEVELOPMENT.md` —
read it if anything below fails; do not improvise around the image-loading pitfalls.

Steps:

1. Preconditions: `kubectl config current-context` must be `minikube`; app repo is at
   `~/Sources/BjjEire`.
2. Build single-arch (plain `docker build` output can silently leave a stale tag in
   minikube's containerd — the flags matter):

   ```sh
   docker build --provenance=false --output type=docker \
     --file ~/Sources/BjjEire/src/bjjeire-app/Dockerfile \
     --tag bjj-frontend:local \
     --build-arg VITE_APP_APP_URL=http://localhost:8080 \
     --build-arg VITE_APP_MSAL_CLIENT_ID= \
     --build-arg VITE_APP_MSAL_API_SCOPE= \
     ~/Sources/BjjEire
   ```

3. Evict the stale image and load the new one via tar (NOT `minikube image load --overwrite`):

   ```sh
   minikube ssh -- "sudo crictl rmi docker.io/library/bjj-frontend:local" || true
   docker save -o /tmp/bjj-frontend-local.tar bjj-frontend:local
   minikube image load /tmp/bjj-frontend-local.tar
   ```

4. Roll and wait:

   ```sh
   kubectl rollout restart deployment/bjj-frontend -n bjjeire-app
   kubectl rollout status deployment/bjj-frontend -n bjjeire-app --timeout=5m
   ```

5. The rollout kills the pod behind any existing port-forward. Check
   `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8080/` — if not 200,
   restart it in the background:
   `kubectl port-forward -n bjjeire-app service/bjj-frontend 8080:80` (tell the user
   their own port-forward terminal is now dead).
6. Verify by **behavior**, not image ID (kubelet may report the old ID): run a quick
   spec that exercises the change, e.g.
   `APP_ENV=local BASE_URL=http://127.0.0.1:8080 API_URL=http://127.0.0.1:8080 npm run test:smoke`.

Success criteria: rollout complete, port 8080 serving 200, and a test that depends on
the new app code passes. If visual changes shipped, follow up with `/update-snapshots`.
