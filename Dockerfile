FROM mcr.microsoft.com/playwright:v1.51.0-noble

LABEL org.opencontainers.image.title="bjjeire-tests" \
      org.opencontainers.image.description="Playwright system test runner" \
      org.opencontainers.image.base.name="mcr.microsoft.com/playwright:v1.51.0-noble"

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    NODE_ENV=test

USER pwuser
WORKDIR /home/pwuser/app

COPY --chown=pwuser:pwuser package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY --chown=pwuser:pwuser . .

RUN mkdir -p playwright-report test-results blob-report allure-results

CMD ["npx", "playwright", "test"]
