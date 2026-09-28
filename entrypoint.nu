#!/usr/bin/env nu

def --wrapped main [...cmd] {
  let creds = (fnox get PROTON_PASS_CREDENTIALS | complete)
  if $creds.exit_code == 0 and ($creds.stdout | str trim) == "true" {
    $env.PROTON_PASS_KEY_PROVIDER = "fs"
    mise run setup-pass-cli
  }

  let exported = (fnox export --all --format json | complete)
  if $exported.exit_code != 0 {
    print -e "FATAL: fnox export failed"
    print -e $exported.stderr
    exit 1
  }
  $exported.stdout | from json | get -o secrets | default {} | load-env

  for v in [JWT_SECRET STORAGE_ENCRYPTION_KEY API_KEY_SECRET OMNIROUTE_API_KEY] {
    let val = $env | get -o $v | default ""
    if ($val | is-empty) {
      print -e $"FATAL: ($v) is not set after env resolution"
      exit 1
    }
    if ($val =~ '(?i)(pass://|\{\{|replace_with|change_me)') {
      print -e $"FATAL: ($v) looks unresolved (placeholder/reference left) — check fnox.toml / vault grants"
      exit 1
    }
  }

  ^sh -c 'mise run provision &'

  exec ...$cmd
}
