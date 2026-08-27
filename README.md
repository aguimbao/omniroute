# OmniRoute

Containerized [OmniRoute](https://github.com/diegosouzapw/omniroute) with
[fnox](https://github.com/jdx/fnox) secret handling and [pitchfork](https://github.com/jdx/pitchfork) daemon management.

## Prerequisites

- [mise](https://mise.jdx.dev)
- [podman](https://github.com/podman-container-tools/podman)

## Usage

### Setup

1. `mise up`
2. `hk install`
3. Modify `.fnox.toml` to your liking.
4. (optional) Logged in `pass-cli` if needed (`PROTON_PASS_CREDENTIALS=true`).

### Commands

```bash
mise run up --help
mise run down --help
```

### Flow

> - `PROTON_PASS_CREDENTIALS=true`
>
>   Your host needs a logged in `pass-cli` session that can fetch your `OMNIROUTE_PROTON_PASS_PAT` from `fnox.toml`. All other credentials are resolved at run-time inside the container.

> - `PROTON_PASS_CREDENTIALS=false`
>
>   `OMNIROUTE_PROTON_PASS_PAT` is ignored and no fnox login/fetch is performed both in the host and container. All values need to have a plaintext `default` in `fnox.toml`.

```text
mise run up (host)
│
├─ volumes/network created, then pitchfork start --all
│
└─ [daemons.omniroute] (host)
   │
   ├─ fnox reads PROTON_PASS_CREDENTIALS=true|false from ./fnox.toml
   │  │
   │  ├─ true → fetches OMNIROUTE_PROTON_PASS_PAT (needs logged-in host pass-cli)
   │  │         and injects -e OMNIROUTE_PROTON_PASS_PAT=<resolved>
   │  │
   │  └─ false → nothing is resolved or injected
   │
   └─ podman run (host)
      │
      └─ entrypoint (container)
         │
         ├─ fnox reads PROTON_PASS_CREDENTIALS=true|false from the mounted fnox.toml
         │  │
         │  ├─ true → pass-cli login with the injected PAT
         │  │
         │  └─ false → skipped — only literal values resolve
         │
         └─ fnox export resolves every value
            ├─ { provider = "protonpass", … } → fetched from Proton Pass
            └─ { default = "…" }              → literal, used as-is
```