FROM cgr.dev/chainguard/wolfi-base:latest@sha256:9c2092b053779e14c82fb50f77b37bcc38b7d2c83972352d5813280f9d035b03 AS tools

USER 0:0

SHELL ["/bin/ash", "-eo", "pipefail", "-c"]

RUN apk add --no-cache \
    curl=8.22.0-r4 \
    ca-certificates-bundle=20260909-r2 \
    shadow=4.20.2-r1

RUN mkdir -p /usr/local/bin /home/node \
    && groupadd -g 1000 node \
    && useradd -u 1000 -g 1000 -d /home/node node \
    && chown -R 1000:1000 /home/node

ENV MISE_VERSION=2026.9.16

RUN curl -fsSL https://mise.run | MISE_VERSION="v${MISE_VERSION}" MISE_INSTALL_PATH=/usr/local/bin/mise sh \
    && test -x /usr/local/bin/mise

COPY --chown=1000:1000 .miserc.toml /app/.miserc.toml
COPY --chown=1000:1000 .mise/config.toml .mise/config.proton-pass.toml .mise/config.fnox.toml .mise/config.app.toml .mise/mise*.lock /app/.mise/

ENV HOME=/home/node
ENV MISE_TRUSTED_CONFIG_PATHS=/app
ENV MISE_SCOPE=app
ENV PATH=/home/node/.local/share/mise/shims:${PATH}

USER 1000:1000
WORKDIR /app
RUN --mount=type=secret,id=GITHUB_TOKEN,uid=1000,gid=1000,mode=0444 \
    --mount=type=cache,target=/home/node/.cache/mise,uid=1000,gid=1000 \
    if [ -f /run/secrets/GITHUB_TOKEN ]; then GITHUB_TOKEN="$(cat /run/secrets/GITHUB_TOKEN)" && export GITHUB_TOKEN; fi \
    && mise install && mise reshim

FROM docker.io/diegosouzapw/omniroute:3.8.51@sha256:8bd462c9f60d8eda79329cfbb6ea7ea723505fe7721beb944f3d43835409e218

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
ENV MISE_SCOPE=app
ENV PATH=/home/node/.local/share/mise/shims:${PATH}

USER 1000:1000
WORKDIR /app

ENTRYPOINT ["/app/entrypoint.nu"]
CMD ["node", "dev/run-standalone.mjs"]
