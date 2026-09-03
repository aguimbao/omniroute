FROM cgr.dev/chainguard/wolfi-base:latest@sha256:e624c5d5e42382ce7165ddafcbbf8e6769a24cbd02ea6114b880b05ae5ba2a8d AS tools

USER 0:0

SHELL ["/bin/ash", "-eo", "pipefail", "-c"]

RUN apk add --no-cache \
        ca-certificates-bundle=20260611-r0 \
        curl=8.21.0-r2 \
        shadow=4.20.2-r1

RUN mkdir -p /usr/local/bin /home/node \
    && groupadd -g 1000 node \
    && useradd -u 1000 -g 1000 -d /home/node node \
    && chown -R 1000:1000 /home/node

ENV MISE_VERSION=2026.8.15

RUN curl -fsSL https://mise.run | MISE_VERSION="v${MISE_VERSION}" MISE_INSTALL_PATH=/usr/local/bin/mise sh \
    && test -x /usr/local/bin/mise

COPY --chown=1000:1000 .mise/ /app/.mise/

ENV HOME=/home/node
ENV MISE_TRUSTED_CONFIG_PATHS=/app
ENV MISE_ENV=nushell,proton-pass,fnox,app
ENV PATH=/home/node/.local/share/mise/shims:${PATH}

USER 1000:1000
WORKDIR /app
RUN --mount=type=secret,id=GITHUB_TOKEN,uid=1000,gid=1000,mode=0444 \
    if [ -f /run/secrets/GITHUB_TOKEN ]; then GITHUB_TOKEN="$(cat /run/secrets/GITHUB_TOKEN)" && export GITHUB_TOKEN; fi \
    && mise install && mise reshim

FROM docker.io/diegosouzapw/omniroute:3.8.50@sha256:085c57adf499a8aaa9f35ccde95c0df9c11bd9ecd18d6c9edbf3b68b8079ba9d

LABEL org.opencontainers.image.title="omniroute" \
      org.opencontainers.image.description="Omniroute service" \
      org.opencontainers.image.source=https://github.com/aguimbao/omniroute \
      org.opencontainers.image.licenses=MIT

COPY --from=tools /usr/local/bin/mise /usr/local/bin/mise
COPY --from=tools --chown=1000:1000 /home/node/.local/share/mise /home/node/.local/share/mise

COPY --chown=1000:1000 .mise/ /app/.mise/
COPY --chmod=755 entrypoint.nu /app/entrypoint.nu

ENV MISE_TRUSTED_CONFIG_PATHS=/app
ENV MISE_ENV=nushell,proton-pass,fnox,app
ENV PATH=/home/node/.local/share/mise/shims:${PATH}

USER 1000:1000
WORKDIR /app

ENTRYPOINT ["/app/entrypoint.nu"]
CMD ["node", "dev/run-standalone.mjs"]
