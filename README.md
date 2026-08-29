# OmniRoute

[OmniRoute](https://github.com/diegosouzapw/omniroute) service with [fnox](https://github.com/jdx/fnox) secret handling and [podman](https://github.com/podman-container-tools/podman) + [pitchfork](https://github.com/jdx/pitchfork) container / daemon management.

## Docs

[DeepWiki](https://deepwiki.com/aguimbao/omniroute)

## Prerequisites

- [mise](https://mise.jdx.dev)
- [podman](https://github.com/podman-container-tools/podman)

## Usage

### Setup

1. `mise up`
2. `hk install`
3. Modify `.fnox.toml` to your needs.

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
