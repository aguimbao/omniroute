# OmniRoute

[OmniRoute](https://github.com/diegosouzapw/omniroute) service, uses [mise](https://mise.jdx.dev) for dependencies, [fnox](https://github.com/jdx/fnox) for secret handling and [podman](https://github.com/podman-container-tools/podman) + [pitchfork](https://github.com/jdx/pitchfork) for container / daemon management.

## Docs

[DeepWiki](https://deepwiki.com/aguimbao/omniroute)

## Prerequisites

- [mise](https://mise.jdx.dev) / [devcontainers](https://containers.dev/)
- [podman](https://github.com/containers/podman) (+ podman socket active)

## Usage

### Setup

Use your own `.fnox*local.toml` if needed

> If using Proton Pass pass-cli, you need an authenticated pass-cli session with access to the project vault items. Run `mise run setup-pass-cli` to authenticate.

```bash
# devcontainer
devcontainer up

# no devcontainer
mise trust
mise install

# both
mise run setup-pass-cli  # optional, for Proton Pass authentication
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

# up
mise run up
# down
mise run down
```

### Provider allowlist

`provision` only keeps the providers listed in `MAPPING` (`.mise/config.app.toml`): connections of any other provider are deactivated and every other provider, free ones included, is added to OmniRoute's `blockedProviders`. Set `BLOCK_FREE_PROVIDERS = { default = 'false' }` in `fnox.omniroute.toml` and run `mise run up --force-restart` to turn this off: nothing is deactivated or blocked any more and `blockedProviders` is cleared, so every free provider becomes available. Set it back to `'true'` to enforce the allowlist again.
