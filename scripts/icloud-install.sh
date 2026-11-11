#!/bin/bash
# iCloud on Omarchy in one go: Mail, Calendar, Contacts, Reminders, Notes,
# Photos, Find My and iCloud Drive, then one iCloud sign in for all of them.
#
#   curl -fsSL https://ferdousbhai.com/icloud/install.sh | sudo bash
#   curl -fsSL .../icloud/install.sh | sudo bash -s -- icloud cloudmail   # just these
#   curl -fsSL .../icloud/install.sh | sudo bash -s -- --all             # with the optional extras
#   curl -fsSL .../icloud/install.sh | sudo bash -s -- --yes             # no questions
#
# Each app is installed by its own installer (the one its page gives), which
# adds that app's signed package repository, so `omarchy update` keeps
# everything current. Last, as you and not root: one iCloud sign in, on
# Apple's own page, which every app shares, and each app is linked to it.
# Every step is safe to run again. At a terminal it asks one thing: whether
# to add each optional extra. Without a terminal (an agent, a script) nothing
# is asked: the apps install and the sign in commands are printed instead.
set -euo pipefail

# The catalog, written here by the site's build from content/products.json:
#   product <id> <name> <what it's for> <command it provides> <installer URL>
#           <links iCloud> <said once it is installed> <the question, if optional>
IDS=()
declare -A NAME NEED CLI FROM LINK HINT OFFER
product() {
  IDS+=("$1")
  NAME[$1]=$2 NEED[$1]=$3 CLI[$1]=$4 FROM[$1]=$5 LINK[$1]=$6 HINT[$1]=$7 OFFER[$1]=$8
}
# {products}

DESKTOP_USER="${SUDO_USER:-${USER:-$(id -un)}}"

# Someone is at a terminal to answer. `curl … | sudo bash` reads this script
# from the pipe, so answers come from the terminal itself.
at_terminal() {
  [[ -t 1 ]] && { : </dev/tty; } 2>/dev/null
}

# Run a command as the desktop user in their session, so sign-ins open on
# their screen and tokens land in their keyring. Fails when there is no such
# session (root's own login, or nobody logged in).
as_user() {
  if (( EUID != 0 )); then
    "$@"
    return
  fi
  local uid runtime wayland
  uid="$(id -u "$DESKTOP_USER" 2>/dev/null)" || return 1
  runtime="/run/user/$uid"
  (( uid != 0 )) && [[ -S $runtime/bus ]] || return 1
  wayland="${WAYLAND_DISPLAY:-}"
  [[ -n $wayland ]] || wayland="$(cd "$runtime" 2>/dev/null && ls -d wayland-[0-9] 2>/dev/null | head -n1)"
  # A login shell, for the PATH where the user's own tools live.
  sudo -u "$DESKTOP_USER" -i env XDG_RUNTIME_DIR="$runtime" DBUS_SESSION_BUS_ADDRESS="unix:path=$runtime/bus" \
    ${wayland:+WAYLAND_DISPLAY="$wayland"} ${DISPLAY:+DISPLAY="$DISPLAY"} "$@"
}

# An optional extra: asked at a terminal, left out otherwise.
offered() {
  local id=$1 answer
  if command -v gum >/dev/null; then
    gum confirm --default=false "${OFFER[$id]}" </dev/tty
    return
  fi
  printf '%s [y/N] ' "${OFFER[$id]}" >/dev/tty
  read -r answer </dev/tty || answer=''
  [[ $answer == [yY]* ]]
}

# One app, by its own installer. That installer's first-setup questions are
# held back (Cloudmail's; the iCloud sign in comes last here), and its stdin
# is closed so it cannot read the rest of this script from the pipe.
install_one() {
  local id=$1 script
  script="$(mktemp)"
  if ! curl -fsSL "${FROM[$id]}" -o "$script"; then
    rm -f "$script"
    echo "Could not download ${FROM[$id]}" >&2
    return 1
  fi
  CLOUDMAIL_NO_INIT=1 bash "$script" </dev/null || { rm -f "$script"; return 1; }
  rm -f "$script"
  # Omarchy's package helper skips a package it cannot find without failing.
  PATH="$PATH:/usr/bin" command -v "${CLI[$id]}" >/dev/null
}

signed_in() {
  as_user icloud-session status --quiet 2>/dev/null </dev/null | grep -q '"signed_in": *true'
}

# The sign in and each app's link to it, for the apps that installed. Done at
# a terminal; printed as commands otherwise.
set_up() {
  local id words later=() interactive=0 apple=0
  at_terminal && as_user true </dev/null 2>/dev/null && interactive=1

  for id in "$@"; do [[ -n ${LINK[$id]} || $id == icloud ]] && apple=1; done
  if (( apple )) && ! PATH="$PATH:/usr/bin" command -v icloud-session >/dev/null; then
    echo
    echo "To see your iCloud account in these apps, run this again with iCloud for Omarchy: it brings the iCloud sign in."
  elif (( apple )); then
    if (( interactive )) && ! signed_in; then
      echo
      echo "Sign in to iCloud: a window opens with Apple's own sign in page. Every app shares this one sign in."
      as_user icloud-session sign-in </dev/tty >/dev/null || true
    fi
    if (( interactive )) && signed_in; then
      echo "Signed in to iCloud."
      for id in "$@"; do
        [[ -n ${LINK[$id]} ]] || continue
        read -ra words <<<"${LINK[$id]}"
        # Fails when it is linked already, which is fine.
        if as_user "${words[@]}" </dev/null >/dev/null 2>&1; then
          echo "${NAME[$id]} now shows your iCloud account."
        fi
      done
    else
      later+=("icloud-session sign-in")
      for id in "$@"; do [[ -z ${LINK[$id]} ]] || later+=("${LINK[$id]}"); done
    fi
  fi

  if (( ${#later[@]} )); then
    echo
    echo "Left to do, as yourself (not root):"
    printf '  %s\n' "${later[@]}"
  fi
}

# Everything runs from main, called on the last line, so a download cut short
# while piped into bash runs nothing at all.
main() {
  local arg id all=0 yes=0 wanted=() installed=() failed=()
  for arg in "$@"; do
    case $arg in
      --all) all=1 ;;
      -y|--yes) yes=1 ;;
      -*) echo "Unknown option: $arg" >&2; exit 64 ;;
      *)
        if [[ -z ${NAME[$arg]:-} ]]; then
          echo "Unknown app '$arg'. Choose from: ${IDS[*]}" >&2
          exit 64
        fi
        wanted+=("$arg")
        ;;
    esac
  done
  if ! command -v pacman >/dev/null; then
    echo "pacman not found: this installer is for Omarchy and other Arch Linux systems." >&2
    exit 1
  fi

  if (( all )); then
    wanted=("${IDS[@]}")
  elif (( ! ${#wanted[@]} )); then
    for id in "${IDS[@]}"; do
      if [[ -z ${OFFER[$id]} ]]; then
        wanted+=("$id")
      elif (( ! yes )) && at_terminal && ! PATH="$PATH:/usr/bin" command -v "${CLI[$id]}" >/dev/null && offered "$id"; then
        wanted+=("$id")
      fi
    done
  fi

  echo "Installing:"
  for id in "${wanted[@]}"; do echo "  ${NAME[$id]}: ${NEED[$id]}"; done
  echo "iCloud needs an Apple ID with Advanced Data Protection off and Access iCloud Data on the Web on."

  for id in "${wanted[@]}"; do
    echo
    echo "== ${NAME[$id]}"
    if install_one "$id"; then
      installed+=("$id")
    else
      failed+=("$id")
      echo "${NAME[$id]} did not install." >&2
    fi
  done

  (( ! ${#installed[@]} )) || set_up "${installed[@]}"

  echo
  if (( ${#installed[@]} )); then
    echo "Installed: $(for id in "${installed[@]}"; do printf '%s, ' "${NAME[$id]}"; done | sed 's/, $//')"
    for id in "${installed[@]}"; do [[ -z ${HINT[$id]} ]] || echo "  ${HINT[$id]}"; done
    echo "The apps are in the launcher (Super + Space). Updates arrive with the rest of the system: omarchy update"
  fi
  if (( ${#failed[@]} )); then
    echo "Did not install: $(for id in "${failed[@]}"; do printf '%s, ' "${NAME[$id]}"; done | sed 's/, $//')" >&2
    echo "Run this again to retry; what is installed stays as it is." >&2
    exit 1
  fi
}

main "$@"
