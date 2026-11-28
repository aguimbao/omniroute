FROM cgr.dev/chainguard/wolfi-base:latest@sha256:5172a213d2bba8b1c9ca11957db65562b52b0f9844583a0347318ea5fd8e3aa5 AS tools

USER 0:0

SHELL ["/bin/ash", "-eo", "pipefail", "-c"]

RUN apk add --no-cache \
    curl=8.23.0-r4 \
    ca-certificates-bundle=20261020-r0 \
    shadow=4.20.3-r4

RUN mkdir -p /usr/local/bin /home/node \
    && groupadd -g 1000 node \
    && useradd -u 1000 -g 1000 -d /home/node node \
    && chown -R 1000:1000 /home/node

ENV MISE_VERSION=2026.11.14

RUN curl -fsSL https://mise.run | MISE_VERSION="v${MISE_VERSION}" MISE_INSTALL_PATH=/usr/local/bin/mise sh \
    && test -x /usr/local/bin/mise

COPY --chown=1000:1000 .miserc.toml /app/.miserc.toml
COPY --chown=1000:1000 .mise/config.toml .mise/config.proton-pass.toml .mise/config.fnox.toml .mise/config.app.toml .mise/mise*.lock /app/.mise/

ENV HOME=/home/node
ENV MISE_TRUSTED_CONFIG_PATHS=/app
ENV MISE_ENV=app
ENV PATH=/home/node/.local/share/mise/shims:${PATH}

USER 1000:1000
WORKDIR /app
RUN --mount=type=secret,id=GITHUB_TOKEN,uid=1000,gid=1000,mode=0444 \
    --mount=type=cache,target=/home/node/.cache/mise,uid=1000,gid=1000 \
    if [ -f /run/secrets/GITHUB_TOKEN ]; then GITHUB_TOKEN="$(cat /run/secrets/GITHUB_TOKEN)" && export GITHUB_TOKEN; fi \
    && mise install && mise reshim

FROM docker.io/cheaperinference/omniroute:3.8.54@sha256:2c4c755a54f8ce5341bc1856580b71f47a0f16a9afab4a55f84d540810631f68

# Remove with the OmniRoute upgrade that includes #21144 and the Gemini part of #20857.
RUN --network=none --mount=type=bind,source=scripts/backport-antigravity.mjs,target=/tmp/backport-antigravity.mjs \
    node /tmp/backport-antigravity.mjs

LABEL org.opencontainers.image.title="omniroute" \
    org.opencontainers.image.description="Omniroute service" \
    org.opencontainers.image.source=https://github.com/aguimbao/omniroute \
    org.opencontainers.image.licenses=MIT

COPY --from=tools /usr/local/bin/mise /usr/local/bin/mise
COPY --from=tools --chown=1000:1000 /home/node/.local/share/mise /home/node/.local/share/mise

COPY --chown=1000:1000 .miserc.toml /app/.miserc.toml
COPY --chown=1000:1000 .mise/config.toml .mise/config.proton-pass.toml .mise/config.fnox.toml .mise/config.app.toml .mise/mise*.lock /app/.mise/
COPY --chmod=755 entrypoint.nu /app/entrypoint.nu

ENV MISE_TRUSTED_CONFIG_PATHS=/app
ENV MISE_ENV=app
ENV PATH=/home/node/.local/share/mise/shims:${PATH}

USER 1000:1000
WORKDIR /app

ENTRYPOINT ["/app/entrypoint.nu"]
CMD ["node", "dev/run-standalone.mjs"]
