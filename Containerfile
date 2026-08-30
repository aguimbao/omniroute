FROM docker.io/diegosouzapw/omniroute:3.8.50@sha256:085c57adf499a8aaa9f35ccde95c0df9c11bd9ecd18d6c9edbf3b68b8079ba9d AS tools

USER 0:0

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# hadolint ignore=DL3008
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://mise.run | sh -s -- -y \
    && test -x /root/.local/bin/mise \
    && install -m 0755 /root/.local/bin/mise /usr/local/bin/mise \
    && rm -rf /root/.local

COPY --chown=1000:1000 .mise.toml .mise.container.toml /app/

ENV MISE_TRUSTED_CONFIG_PATHS=/app
ENV MISE_ENV=container
ENV PATH=/home/node/.local/share/mise/shims:${PATH}

USER 1000:1000
WORKDIR /app
RUN mise install && mise reshim

FROM docker.io/diegosouzapw/omniroute:3.8.50@sha256:085c57adf499a8aaa9f35ccde95c0df9c11bd9ecd18d6c9edbf3b68b8079ba9d

LABEL org.opencontainers.image.title="omniroute" \
      org.opencontainers.image.description="Omniroute service" \
      org.opencontainers.image.source=https://github.com/aguimbao/omniroute \
      org.opencontainers.image.licenses=MIT

COPY --from=tools /usr/local/bin/mise /usr/local/bin/mise
COPY --from=tools --chown=1000:1000 /home/node/.local/share/mise /home/node/.local/share/mise

COPY --chown=1000:1000 .mise.toml .mise.container.toml /app/
COPY --chmod=755 entrypoint.nu /app/entrypoint.nu

ENV MISE_TRUSTED_CONFIG_PATHS=/app
ENV MISE_ENV=container
ENV PATH=/home/node/.local/share/mise/shims:${PATH}

USER 1000:1000
WORKDIR /app

ENTRYPOINT ["/app/entrypoint.nu"]
CMD ["node", "dev/run-standalone.mjs"]
