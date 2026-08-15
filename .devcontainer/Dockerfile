

# syntax=docker/dockerfile:1.7

# ---------------------------------------------------------------------------
# Dev container base = the exact image CI runs the suite in.
#
# Why not devcontainers/typescript-node? Two reasons specific to this repo:
#   1. Screenshot baselines are per-platform and CI compares the `-linux.png`
#      set. A Linux container that renders text differently from the CI image
#      produces false diffs on every `--project=snapshots` run. Same image in,
#      same pixels out.
#   2. Browsers + their system dependencies are already baked into
#      /ms-playwright, so container start does not download ~500 MB.
#
# The tag must stay in lockstep with @playwright/test in package.json — Renovate
# does that automatically (the "playwright" group in renovate.json also matches
# this Dockerfile).
# ---------------------------------------------------------------------------
FROM mcr.microsoft.com/playwright:v1.61.0-noble

LABEL org.opencontainers.image.title="bjjeire/playwright-devcontainer" \
      org.opencontainers.image.description="Dev container for the BjjEire Playwright acceptance suite" \
      org.opencontainers.image.source="https://github.com/ianoflynnautomation/bjjeire-tests" \
      org.opencontainers.image.base.name="mcr.microsoft.com/playwright:v1.61.0-noble"

ARG USERNAME=vscode

# Ubuntu 24.04 ships a default `ubuntu` account at uid 1000. Rename it to
# `vscode` (exactly what mcr.microsoft.com/devcontainers/base:ubuntu-24.04 does)
# so the non-root dev user owns bind-mounted files at the uid the devcontainer
# tooling expects, and add passwordless sudo — the Dev Container Features and
# the post-create hook both need it.
RUN set -eux; \
    if ! id -u "${USERNAME}" >/dev/null 2>&1; then \
      if id -u ubuntu >/dev/null 2>&1; then \
        usermod --login "${USERNAME}" --home "/home/${USERNAME}" --move-home ubuntu; \
        groupmod --new-name "${USERNAME}" ubuntu; \
      else \
        groupadd --gid 1000 "${USERNAME}"; \
        useradd --uid 1000 --gid 1000 --shell /bin/bash --create-home "${USERNAME}"; \
      fi; \
    fi; \
    apt-get update; \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends sudo; \
    echo "${USERNAME} ALL=(root) NOPASSWD:ALL" > "/etc/sudoers.d/${USERNAME}"; \
    chmod 0440 "/etc/sudoers.d/${USERNAME}"; \
    rm -rf /var/lib/apt/lists/*

# Global npm installs (the Claude Code feature, `npm i -g` in a terminal) need a
# prefix the non-root user can write to.
ENV NPM_CONFIG_PREFIX=/usr/local/share/npm-global
ENV PATH=${NPM_CONFIG_PREFIX}/bin:${PATH}
RUN mkdir -p "${NPM_CONFIG_PREFIX}" && chown -R "${USERNAME}:${USERNAME}" "${NPM_CONFIG_PREFIX}"

# Inherited from the base image; restated so it is greppable and survives a
# base-image change. /ms-playwright is world-writable at the top level, so a
# Playwright version bump can drop new browser builds beside the baked-in ones
# without a recursive chmod (which would duplicate ~700 MB into a new layer).
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Image stays root (Features install as root, docker-in-docker starts dockerd as
# root); `remoteUser` in devcontainer.json drops the editor and every terminal
# down to the non-root vscode account.
