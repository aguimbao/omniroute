# OmniRoute

[OmniRoute](https://github.com/diegosouzapw/omniroute) service with [fnox](https://github.com/jdx/fnox) secret handling and [podman](https://github.com/podman-container-tools/podman) + [pitchfork](https://github.com/jdx/pitchfork) container / daemon management.

## Docs

[DeepWiki](https://deepwiki.com/aguimbao/omniroute)

## Prerequisites

- [mise](https://mise.jdx.dev) (only if you don't use `devcontainer`)
- [podman](https://github.com/podman-container-tools/podman)

## Usage

### Setup

Use your own `.fnox.local.toml` if needed

```bash
# devcontainer
devcontainer up

# no devcontainer
mise trust
mise run setup
```

### Commands

```bash
# All accept --help

# lint
mise run lint
# fmt
mise run fmt
# test
mise run test
# bump versions
mise run renovate

# run
mise run up
# stop
mise run down
# clean
mise run down --prune --volumes
```
