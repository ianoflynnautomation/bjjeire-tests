# syntax=docker/dockerfile:1.7

FROM mcr.microsoft.com/playwright:v1.59.1-noble

LABEL org.opencontainers.image.title="bjjeire/playwright" \
      org.opencontainers.image.description="Playwright system test runner (Node + Playwright browsers)" \
      org.opencontainers.image.source="https://github.com/bjjeire/bjjeire-tests" \
      org.opencontainers.image.base.name="mcr.microsoft.com/playwright:v1.59.1-noble"

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    NODE_ENV=test \
    HUSKY=0 \
    CI=true

USER pwuser
WORKDIR /home/pwuser/app

COPY --chown=pwuser:pwuser package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY --chown=pwuser:pwuser . .

RUN mkdir -p playwright-report test-results blob-report allure-results

ENTRYPOINT ["npx", "playwright"]
CMD ["test"]
