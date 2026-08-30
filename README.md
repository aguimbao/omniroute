# OmniRoute

[OmniRoute](https://github.com/diegosouzapw/omniroute) service, uses [mise](https://mise.jdx.dev) for dependencies, [fnox](https://github.com/jdx/fnox) for secret handling and [podman](https://github.com/podman-container-tools/podman) + [pitchfork](https://github.com/jdx/pitchfork) container / daemon management.

## Docs

[DeepWiki](https://deepwiki.com/aguimbao/omniroute)

## Prerequisites

- [mise](https://mise.jdx.dev) / [devcontainers](https://containers.dev/)
- [podman](https://github.com/containers/podman) (+ podman socket active)

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
# test ci locally
mise run ci
# bump versions
mise run renovate

# run
mise run up
# stop
mise run down
# clean
mise run down --prune --volumes
```
