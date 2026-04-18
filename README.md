# bjjeire-tests

End-to-end web test automation framework using [Playwright](https://playwright.dev/) and TypeScript. Includes page-object utilities, soft assertions, an API helper, Allure + HTML reporting, Docker support, and a 4-shard GitHub Actions CI pipeline.

## Setup

```bash
npm install
cp .env.example .env  # add BASE_URL and any test credentials
```

## Running Tests

```bash
npm test                       # all tests, headless
npm run test:chromium          # Chromium only
npm run test:chromium-headed   # headed, single worker (debugging)
npm run test:smoke             # @smoke tagged tests
npm run test:reg               # @reg tagged tests
npm run ui                     # Playwright UI mode
```

## Reporting

```bash
npm run play-report   # open Playwright HTML report
npm run open-report   # generate + open Allure report
npm run trace         # inspect a trace file
```

## Docker

```bash
docker compose build                                                          # build image
docker compose run --rm playwright                                            # run all tests
docker compose run --rm playwright npx playwright test -g @smoke             # smoke only
docker compose run --rm playwright npx playwright test --project=chromium    # Chromium only
```

Reports are written to `./playwright-report`, `./test-results`, and `./allure-results` on the host.
