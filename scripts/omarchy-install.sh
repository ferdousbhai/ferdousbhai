#!/bin/bash
# Install the Omarchy apps from ferdousbhai.com in one go, then set them up:
#
#   curl -fsSL https://ferdousbhai.com/omarchy/install.sh | sudo bash
#   curl -fsSL .../omarchy/install.sh | sudo bash -s -- icloud cloudmail   # just these
#   curl -fsSL .../omarchy/install.sh | sudo bash -s -- --all             # everything
#   curl -fsSL .../omarchy/install.sh | sudo bash -s -- --yes             # the marked ones, no questions
#
# At a terminal it shows a checklist, with the apps that keep iCloud working
# already marked. Each app is then installed by its own installer (the one its
# page gives), which adds that app's signed package repository, so
# `omarchy update` keeps everything current. Last, as you and not root: one
# iCloud sign in, on Apple's own page, which every app shares, and each app's
# own first setup. Every step is safe to run again, so this is also how to add
# an app later. Without a terminal (an agent, a script) nothing is asked: the
# marked apps install and the setup commands are printed instead.
set -euo pipefail

# The catalog, written here by the site's build from content/products.json:
#   product <id> <name> <what it's for> <marked: 1|0> <command it provides>
#           <installer URL, or a command> <links iCloud> <first setup>
IDS=()
declare -A NAME NEED MARKED CLI FROM LINK SETUP
product() {
  IDS+=("$1")
  NAME[$1]=$2 NEED[$1]=$3 MARKED[$1]=$4 CLI[$1]=$5 FROM[$1]=$6 LINK[$1]=$7 SETUP[$1]=$8
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

# The checklist, marked apps first. Prints the chosen ids, one per line.
choose() {
  local id ordered=() options=() marked=() picked
  for id in "${IDS[@]}"; do [[ ${MARKED[$id]} == 1 ]] && ordered+=("$id"); done
  for id in "${IDS[@]}"; do [[ ${MARKED[$id]} == 1 ]] || ordered+=("$id"); done

  if command -v gum >/dev/null; then
    local label
    for id in "${ordered[@]}"; do
      # gum takes the marked ones as a comma-separated list of labels, so a
      # label cannot hold a comma: it shows the low quote that looks like one.
      label="${NAME[$id]}: ${NEED[$id]//,/‚}"
      options+=("$label"$'\t'"$id")
      [[ ${MARKED[$id]} == 1 ]] && marked+=("$label")
    done
    gum choose --no-limit --height="${#ordered[@]}" --label-delimiter=$'\t' \
      --header="What to install (x or space marks, enter installs):" \
      --selected="$(IFS=,; echo "${marked[*]}")" "${options[@]}" </dev/tty
    return
  fi

  local number=0 answer word
  {
    echo "What to install:"
    for id in "${ordered[@]}"; do
      number=$((number + 1))
      printf ' %s %2d  %s: %s\n' "$([[ ${MARKED[$id]} == 1 ]] && echo '[x]' || echo '[ ]')" "$number" "${NAME[$id]}" "${NEED[$id]}"
    done
    printf 'Enter installs the marked ones. Or type the numbers you want (e.g. 1 3 8), or "all": '
  } >/dev/tty
  read -r answer </dev/tty || answer=''
  if [[ -z ${answer// /} ]]; then
    for id in "${ordered[@]}"; do [[ ${MARKED[$id]} == 1 ]] && echo "$id"; done
  elif [[ $answer == all ]]; then
    printf '%s\n' "${ordered[@]}"
  else
    for word in ${answer//,/ }; do
      if [[ ! $word =~ ^[0-9]+$ ]] || (( word < 1 || word > ${#ordered[@]} )); then
        echo "Not a number on the list: $word" >&2
        return 1
      fi
      echo "${ordered[word - 1]}"
    done
  fi
}

# One app, by its own installer. That installer's first-setup questions are
# held back (they come last here, after the iCloud sign in), and its stdin is
# closed so it cannot read the rest of this script from the pipe.
install_one() {
  local id=$1 script
  if [[ ${FROM[$id]} == https://* ]]; then
    script="$(mktemp)"
    if ! curl -fsSL "${FROM[$id]}" -o "$script"; then
      rm -f "$script"
      echo "Could not download ${FROM[$id]}" >&2
      return 1
    fi
    CLOUDMAIL_NO_INIT=1 bash "$script" </dev/null || { rm -f "$script"; return 1; }
    rm -f "$script"
  else
    # sudo's PATH leaves out Omarchy's own commands.
    PATH="$PATH:/usr/share/omarchy/bin" bash -c "${FROM[$id]}" </dev/null || return 1
  fi
  # Omarchy's package helper skips a package it cannot find without failing.
  [[ -z ${CLI[$id]} ]] || PATH="$PATH:/usr/bin" command -v "${CLI[$id]}" >/dev/null
}

signed_in() {
  as_user icloud-session status --quiet 2>/dev/null </dev/null | grep -q '"signed_in": *true'
}

# The sign in, each app's link to it, and each app's own first setup, for the
# apps that installed. Asked at a terminal; printed as commands otherwise.
set_up() {
  local id words later=() interactive=0 apple=0
  at_terminal && as_user true </dev/null 2>/dev/null && interactive=1

  for id in "$@"; do [[ -n ${LINK[$id]} || $id == icloud ]] && apple=1; done
  if (( apple )) && ! PATH="$PATH:/usr/bin" command -v icloud-session >/dev/null; then
    echo
    echo "To see your iCloud account in these apps, run this again and mark iCloud for Omarchy: it brings the iCloud sign in."
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

  for id in "$@"; do
    [[ -n ${SETUP[$id]} ]] || continue
    if (( interactive )); then
      echo
      echo "Setting up ${NAME[$id]}"
      read -ra words <<<"${SETUP[$id]}"
      as_user "${words[@]}" </dev/tty || later+=("${SETUP[$id]}")
    else
      later+=("${SETUP[$id]}")
    fi
  done

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
    if (( ! yes )) && at_terminal; then
      mapfile -t wanted < <(choose | grep .)
    else
      for id in "${IDS[@]}"; do [[ ${MARKED[$id]} == 1 ]] && wanted+=("$id"); done
    fi
  fi
  if (( ! ${#wanted[@]} )); then
    echo "Nothing chosen; nothing was changed."
    exit 0
  fi

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
    echo "Installed:"
    for id in "${installed[@]}"; do echo "  ${NAME[$id]}: ${NEED[$id]}"; done
    echo "The apps are in the launcher (Super + Space). Updates arrive with the rest of the system: omarchy update"
    echo "To add more later, run this again."
  fi
  if (( ${#failed[@]} )); then
    echo "Did not install:" >&2
    for id in "${failed[@]}"; do echo "  ${NAME[$id]}" >&2; done
    echo "Run this again to retry; what is installed stays as it is." >&2
    exit 1
  fi
}

main "$@"
