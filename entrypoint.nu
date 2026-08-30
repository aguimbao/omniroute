#!/usr/bin/env nu

def main [...cmd] {
  let creds = (fnox get PROTON_PASS_CREDENTIALS | complete)
  if $creds.exit_code == 0 and ($creds.stdout | str trim) == "true" {
    let pat = $env.OMNIROUTE_PROTON_PASS_PAT? | default "" | str trim
    if ($pat | is-empty) {
      print -e "FATAL: PROTON_PASS_CREDENTIALS=true but OMNIROUTE_PROTON_PASS_PAT could not be resolved"
      exit 1
    }
    $env.PROTON_PASS_KEY_PROVIDER = "fs"
    let session = (pass-cli info | complete)
    if $session.exit_code == 0 {
      print "[secrets] reusing existing pass-cli session"
    } else {
      print "[secrets] logging in with personal access token…"
      pass-cli logout --force o+e>| null
      pass-cli login --pat $pat
    }
  }

  let exported = (fnox export --all --profile omniroute-container --format json | complete)
  if $exported.exit_code != 0 {
    print -e "FATAL: fnox export failed"
    print -e $exported.stderr
    exit 1
  }
  # Output shape: {"secrets": {KEY: VALUE, …}, "metadata": {…}}
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
