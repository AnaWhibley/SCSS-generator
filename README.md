#!/usr/bin/env bash
#
# macos-ify.sh — make Ubuntu/GNOME look like macOS, entirely in userspace.
#
# No sudo. Nothing is written outside your home directory.
# Re-runnable: safe to run again after a failure or a shell upgrade.
#
#   ./macos-ify.sh              # do everything
#   ./macos-ify.sh --revert     # put settings back
#   ./macos-ify.sh --help       # flags
#
set -uo pipefail

# ----------------------------------------------------------------------------
# Config
# ----------------------------------------------------------------------------
XDG_DATA="${XDG_DATA_HOME:-$HOME/.local/share}"
WORK="$XDG_DATA/macos-ify"
SRC="$WORK/src"
LOG="$WORK/run.log"
REVERT="$WORK/revert.sh"

THEMES_DIR="$HOME/.themes"
ICONS_DIR="$XDG_DATA/icons"
FONTS_DIR="$XDG_DATA/fonts"
EXT_DIR="$XDG_DATA/gnome-shell/extensions"

DO_DEPS=1 DO_THEME=1 DO_ICONS=1 DO_FONTS=1 DO_EXT=1 DO_SETTINGS=1
MODE=install

# Extensions: each entry is "label|uuid[,fallback-uuid,...]"
EXTENSIONS=(
  "User Themes|user-theme@gnome-shell-extensions.gcampax.github.com"
  "Blur my Shell|blur-my-shell@aunetx"
  "Just Perfection|just-perfection-desktop@just-perfection"
  "Rounded corners|rounded-window-corners-reloaded@fxgn,rounded-window-corners@yilozt"
  "Magic Lamp minimise|compiz-alike-magic-lamp-effect@hermes83.github.com"
)

# ----------------------------------------------------------------------------
# Plumbing
# ----------------------------------------------------------------------------
c_reset=$'\033[0m'; c_dim=$'\033[2m'; c_red=$'\033[31m'
c_grn=$'\033[32m'; c_yel=$'\033[33m'; c_bld=$'\033[1m'

log()  { printf '%s\n' "$*" >>"$LOG"; }
say()  { printf '%s\n' "$*"; log "$*"; }
step() { printf '\n%s==>%s %s%s\n' "$c_bld" "$c_reset" "$c_bld" "$*$c_reset"; log "== $*"; }
ok()   { printf '  %s✓%s %s\n' "$c_grn" "$c_reset" "$*"; log "ok: $*"; }
warn() { printf '  %s!%s %s\n' "$c_yel" "$c_reset" "$*"; log "warn: $*"; }
bad()  { printf '  %s✗%s %s\n' "$c_red" "$c_reset" "$*"; log "fail: $*"; }
dim()  { printf '    %s%s%s\n' "$c_dim" "$*" "$c_reset"; }
die()  { printf '\n%s✗ %s%s\n' "$c_red" "$*" "$c_reset" >&2; exit 1; }

have() { command -v "$1" >/dev/null 2>&1; }

usage() {
  cat <<'EOF'
macos-ify.sh — userspace macOS look for Ubuntu/GNOME

  --revert         restore the settings this script changed
  --local FILE     install a theme archive you downloaded by hand
                   (gnome-look / Pling .tar.xz, .tar.gz or .zip). Detects
                   whether it is a GTK theme, shell theme, icon theme or
                   cursor theme, puts it in the right place and applies it.
                   Repeatable: --local a.tar.xz --local b.zip
  --no-deps        skip Homebrew dependency install
  --no-theme       skip WhiteSur GTK/shell theme
  --no-icons       skip icons and cursors
  --no-fonts       skip Inter font
  --no-extensions  skip GNOME Shell extensions
  --no-settings    skip gsettings tweaks (dock, window buttons, etc.)
  --help           this

Nothing here needs sudo. Files land in ~/.themes, ~/.local/share/{icons,fonts},
and ~/.local/share/gnome-shell/extensions. Logs and a revert script go to
~/.local/share/macos-ify/.
EOF
}

LOCAL_ARCHIVES=()
while [ $# -gt 0 ]; do
  case "$1" in
    --revert)        MODE=revert; shift ;;
    --no-deps)       DO_DEPS=0; shift ;;
    --no-theme)      DO_THEME=0; shift ;;
    --no-icons)      DO_ICONS=0; shift ;;
    --no-fonts)      DO_FONTS=0; shift ;;
    --no-extensions) DO_EXT=0; shift ;;
    --no-settings)   DO_SETTINGS=0; shift ;;
    --local)
      [ $# -ge 2 ] || { echo "--local needs a file path" >&2; exit 2; }
      LOCAL_ARCHIVES+=("$2"); MODE=local; shift 2 ;;
    --help|-h)       usage; exit 0 ;;
    *) echo "unknown flag: $1" >&2; usage; exit 2 ;;
  esac
done

SHIM="$WORK/shim"
PRISTINE="$WORK/revert-pristine.sh"

mkdir -p "$WORK" "$SRC" "$SHIM" "$THEMES_DIR" "$ICONS_DIR" "$FONTS_DIR" "$EXT_DIR"
: >"$LOG"

# ----------------------------------------------------------------------------
# Privilege shim — upstream installers (WhiteSur's lib-install.sh in
# particular) call `sudo apt install` for missing build deps, and one path
# even calls `sudo date -s` to reset the system clock. You have no sudo, so
# every escalation route is replaced with a stub that fails immediately.
# Nothing can prompt you for a password, and nothing can hang waiting for one.
# ----------------------------------------------------------------------------
for blocked in sudo pkexec su doas apt apt-get dnf yum pacman zypper eopkg xbps-install swupd; do
  cat >"$SHIM/$blocked" <<EOS
#!/usr/bin/env bash
echo "macos-ify: BLOCKED privileged call -> $blocked \$*" >&2
exit 1
EOS
  chmod +x "$SHIM/$blocked"
done
export PATH="$SHIM:$PATH"
export SUDO_ASKPASS=/bin/false
export DEBIAN_FRONTEND=noninteractive

# ----------------------------------------------------------------------------
# gsettings helpers (guarded — a missing schema is skipped, not fatal)
# ----------------------------------------------------------------------------
SCHEMA_CACHE=""
schema_exists() {
  [ -z "$SCHEMA_CACHE" ] && SCHEMA_CACHE="$(gsettings list-schemas 2>/dev/null)"
  printf '%s\n' "$SCHEMA_CACHE" | grep -qx -- "$1"
}

# Record the current value so --revert can restore it.
record() {
  local schema="$1" key="$2" cur
  cur="$(gsettings get "$schema" "$key" 2>/dev/null)" || return 0
  printf 'gsettings set %s %s %q\n' "$schema" "$key" "$cur" >>"$REVERT"
}

gset() {
  local schema="$1" key="$2" val="$3"
  if ! schema_exists "$schema"; then
    dim "skip $schema $key (schema not present)"; return 0
  fi
  if ! gsettings range "$schema" "$key" >/dev/null 2>&1; then
    dim "skip $schema $key (key not present)"; return 0
  fi
  record "$schema" "$key"
  if gsettings set "$schema" "$key" "$val" 2>>"$LOG"; then
    dim "$key = $val"
  else
    warn "could not set $schema $key"
  fi
}

# ----------------------------------------------------------------------------
# Revert
# ----------------------------------------------------------------------------
if [ "$MODE" = revert ]; then
  # Prefer the first-run snapshot: later runs record already-themed values.
  use="$PRISTINE"; [ -f "$use" ] || use="$REVERT"
  [ -f "$use" ] || die "no revert script found in $WORK"
  step "Reverting settings"
  dim "using $(basename "$use")"
  bash "$use" && ok "settings restored"

  # The GTK4/libadwaita override is a file, not a setting — gsettings cannot
  # undo it, so modern GNOME apps stay themed until it is removed.
  removed=0
  for f in gtk.css gtk-dark.css assets windows-assets; do
    [ -e "$HOME/.config/gtk-4.0/$f" ] && rm -rf "$HOME/.config/gtk-4.0/$f" && removed=1
  done
  [ "$removed" = 1 ] && ok "removed GTK4/libadwaita override" || dim "no GTK4 override present"

  say ""
  say "Themes, icons, fonts and extensions were left in place. To remove them:"
  say "  rm -rf $THEMES_DIR/WhiteSur* $ICONS_DIR/WhiteSur* $ICONS_DIR/McMojave-cursors"
  say "  rm -rf $EXT_DIR/{blur-my-shell@aunetx,just-perfection-desktop@just-perfection}"
  say "Log out and back in to finish."
  exit 0
fi

# Keep the FIRST run's snapshot forever — that is the only one holding your
# genuine pre-theme values. Later runs would otherwise record WhiteSur's own
# settings as the "originals".
if [ -f "$REVERT" ] && [ ! -f "$PRISTINE" ]; then
  cp "$REVERT" "$PRISTINE"
fi

cat >"$REVERT" <<'EOF'
#!/usr/bin/env bash
# Auto-generated by macos-ify.sh — restores the gsettings values that existed
# before the script ran. Run via: ./macos-ify.sh --revert
set -uo pipefail
EOF
chmod +x "$REVERT"

# ----------------------------------------------------------------------------
# Preflight
# ----------------------------------------------------------------------------
step "Preflight"

[ "$(id -u)" -ne 0 ] || die "do not run this as root — it is a userspace script"
have gnome-shell || die "gnome-shell not found; this script is GNOME-only"
have python3     || die "python3 required (it ships with Ubuntu)"
have gsettings   || die "gsettings not found"

SHELL_VER_FULL="$(gnome-shell --version 2>/dev/null | awk '{print $NF}')"
SHELL_VER="${SHELL_VER_FULL%%.*}"
[ -n "$SHELL_VER" ] || die "could not determine GNOME Shell version"
ok "GNOME Shell $SHELL_VER_FULL"

SESSION="${XDG_SESSION_TYPE:-unknown}"
ok "session: $SESSION"

# Pick up Homebrew if it is installed but not on PATH yet.
if ! have brew; then
  for b in /home/linuxbrew/.linuxbrew/bin/brew "$HOME/.linuxbrew/bin/brew"; do
    [ -x "$b" ] && eval "$("$b" shellenv)" && break
  done
fi
if have brew; then
  ok "homebrew: $(command -v brew)"
  HAS_BREW=1
else
  warn "homebrew not found — theme will fall back to the prebuilt release"
  HAS_BREW=0
fi

# System glib must win for extension schemas, even with brew on PATH.
SYS_GLIB_COMPILE=/usr/bin/glib-compile-schemas
[ -x "$SYS_GLIB_COMPILE" ] || SYS_GLIB_COMPILE="$(command -v glib-compile-schemas || true)"

# ----------------------------------------------------------------------------
# --local: install a hand-downloaded archive (gnome-look / Pling)
#
# Their download URLs are tokenised and expire, so there is nothing stable to
# fetch. You download, this installs it in the right place for your user.
# ----------------------------------------------------------------------------
classify_and_install() {   # $1 = extracted root
  local root="$1" d base kind dest found=0
  while IFS= read -r d; do
    base="$(basename "$d")"
    kind=""
    if [ -d "$d/cursors" ]; then
      kind=cursor; dest="$ICONS_DIR"
    elif [ -d "$d/gtk-3.0" ] || [ -d "$d/gtk-4.0" ] || [ -d "$d/gnome-shell" ]; then
      kind=gtk; dest="$THEMES_DIR"
    elif [ -f "$d/index.theme" ] && grep -q '^Directories=' "$d/index.theme" 2>/dev/null; then
      kind=icon; dest="$ICONS_DIR"
    fi
    [ -z "$kind" ] && continue

    rm -rf "$dest/$base"
    cp -r "$d" "$dest/$base" || { bad "copy failed: $base"; continue; }
    ok "$kind theme: $base -> $dest"
    found=1

    case "$kind" in
      gtk)
        gset org.gnome.desktop.interface gtk-theme "$base"
        [ -d "$dest/$base/gnome-shell" ] && \
          gset org.gnome.shell.extensions.user-theme name "$base"
        ;;
      icon)   gset org.gnome.desktop.interface icon-theme   "$base" ;;
      cursor) gset org.gnome.desktop.interface cursor-theme "$base" ;;
    esac
  done < <(find "$root" -mindepth 1 -maxdepth 3 -type d 2>/dev/null)

  [ "$found" = 1 ] || warn "nothing recognisable in this archive"
  return 0
}

if [ "$MODE" = local ]; then
  step "Installing downloaded archives"
  for a in "${LOCAL_ARCHIVES[@]}"; do
    a="${a/#\~/$HOME}"
    if [ ! -f "$a" ]; then bad "not found: $a"; continue; fi
    say "  $(basename "$a")"
    tmp="$(mktemp -d)"
    extracted=1
    case "$a" in
      *.tar.xz|*.txz)   tar -xJf "$a" -C "$tmp" >>"$LOG" 2>&1 || extracted=0 ;;
      *.tar.gz|*.tgz)   tar -xzf "$a" -C "$tmp" >>"$LOG" 2>&1 || extracted=0 ;;
      *.tar.bz2|*.tbz2) tar -xjf "$a" -C "$tmp" >>"$LOG" 2>&1 || extracted=0 ;;
      *.tar)            tar -xf  "$a" -C "$tmp" >>"$LOG" 2>&1 || extracted=0 ;;
      *.zip)            python3 -m zipfile -e "$a" "$tmp" >>"$LOG" 2>&1 || extracted=0 ;;
      *) bad "unsupported archive type (want .tar.xz/.tar.gz/.zip)"; rm -rf "$tmp"; continue ;;
    esac
    if [ "$extracted" = 0 ]; then bad "could not extract (see $LOG)"; rm -rf "$tmp"; continue; fi
    classify_and_install "$tmp"
    rm -rf "$tmp"
  done
  say ""
  say "Log out and back in if a shell theme was installed."
  say "Revert: $0 --revert"
  exit 0
fi

# ----------------------------------------------------------------------------
# Dependencies
# ----------------------------------------------------------------------------
if [ "$DO_DEPS" = 1 ] && [ "$HAS_BREW" = 1 ]; then
  step "Dependencies via Homebrew"
  for pkg in sassc glib; do
    if brew list --formula "$pkg" >/dev/null 2>&1; then
      ok "$pkg already installed"
    else
      say "  installing $pkg…"
      if brew install "$pkg" >>"$LOG" 2>&1; then ok "$pkg"; else warn "brew install $pkg failed (see $LOG)"; fi
    fi
  done
fi

# The theme build needs these two on PATH. If they are missing, WhiteSur's
# installer tries to sudo-apt them in — which is exactly what we are avoiding,
# so we check first and skip the source build rather than let it ask.
DEPS_OK=1 MISSING_DEPS=""
for bin in sassc glib-compile-resources; do
  if have "$bin"; then
    dim "$bin -> $(command -v "$bin")"
  else
    DEPS_OK=0; MISSING_DEPS="$MISSING_DEPS $bin"
  fi
done
if [ "$DEPS_OK" = 1 ]; then
  ok "build dependencies present"
else
  warn "missing:$MISSING_DEPS"
  dim "source build will be skipped (it would try to sudo apt-install these)"
  [ "$HAS_BREW" = 1 ] && dim "fix with: brew install sassc glib"
fi

# ----------------------------------------------------------------------------
# Repo helper
# ----------------------------------------------------------------------------
# Prints the repo path on stdout. All progress goes to stderr/log so the
# path can be captured with $( ).
clone_or_update() {
  local url="$1" dir="$SRC/$2"
  if [ -d "$dir/.git" ]; then
    git -C "$dir" fetch --depth=1 origin >>"$LOG" 2>&1 \
      && git -C "$dir" reset --hard FETCH_HEAD >>"$LOG" 2>&1
    dim "updated $2" >&2
  else
    git clone --depth=1 "$url" "$dir" >>"$LOG" 2>&1 || { bad "clone failed: $2" >&2; return 1; }
    dim "cloned $2" >&2
  fi
  printf '%s' "$dir"
}

# ----------------------------------------------------------------------------
# GTK + shell theme
# ----------------------------------------------------------------------------
GTK_THEME_NAME=""
if [ "$DO_THEME" = 1 ]; then
  step "WhiteSur GTK + shell theme"
  if ! have git; then
    bad "git not found — cannot fetch the theme"
  elif dir="$(clone_or_update https://github.com/vinceliuice/WhiteSur-gtk-theme.git WhiteSur-gtk-theme)"; then
    pushd "$dir" >/dev/null || true

    # Upstream has changed flag spellings over time; try the likely forms.
    # stdin is closed so no installer can block on a prompt, and the shim
    # above guarantees any sudo attempt fails instead of asking you.
    built=0
    if [ "$DEPS_OK" = 1 ]; then
      for args in "-c Light --round" "-c light --round" "-c Light" ""; do
        # shellcheck disable=SC2086
        if ./install.sh $args >>"$LOG" 2>&1 </dev/null; then
          built=1; dim "install.sh $args"; break
        fi
        grep -q "BLOCKED privileged call" "$LOG" && { dim "installer wanted root; stopping retries"; break; }
      done
    fi
    if [ "$built" = 1 ]; then
      ok "theme built and installed to $THEMES_DIR"
    else
      warn "source build unavailable — falling back to a prebuilt theme"
      # Fallback 1: a prebuilt zip shipped inside the repo.
      found=0
      while IFS= read -r z; do
        python3 -m zipfile -e "$z" "$THEMES_DIR/" >>"$LOG" 2>&1 && found=1
      done < <(find . -maxdepth 2 -iname 'WhiteSur*.zip' 2>/dev/null)

      # Fallback 2: the latest GitHub release asset. No build step, no deps.
      if [ "$found" = 0 ]; then
        tmpz="$(mktemp -d)"
        if python3 -I - "$tmpz" <<'PY' >>"$LOG" 2>&1
import json, re, sys, urllib.request
from pathlib import Path
out = Path(sys.argv[1])
api = "https://api.github.com/repos/vinceliuice/WhiteSur-gtk-theme/releases/latest"
req = urllib.request.Request(api, headers={"User-Agent": "macos-ify"})
rel = json.load(urllib.request.urlopen(req, timeout=30))
assets = [a for a in rel.get("assets", []) if re.search(r"\.zip$", a["name"], re.I)]
pref = [a for a in assets if re.search(r"light", a["name"], re.I)] or assets
if not pref:
    sys.exit("no zip asset in latest release")
a = pref[0]
urllib.request.urlretrieve(a["browser_download_url"], out / a["name"])
print("downloaded", a["name"])
PY
        then
          z="$(find "$tmpz" -maxdepth 1 -name '*.zip' | head -1)"
          [ -n "$z" ] && python3 -m zipfile -e "$z" "$THEMES_DIR/" >>"$LOG" 2>&1 && found=1
        fi
        rm -rf "$tmpz"
      fi

      [ "$found" = 1 ] && ok "unpacked prebuilt theme into $THEMES_DIR" \
                       || bad "no prebuilt theme available either"
    fi

    # libadwaita / GTK4 override so modern GNOME apps follow the theme.
    # Only meaningful if the theme assets exist; harmless otherwise.
    if [ "$built" = 1 ]; then
      ./install.sh -l -c Light >>"$LOG" 2>&1 </dev/null \
        && ok "libadwaita override written to ~/.config/gtk-4.0" \
        || warn "libadwaita override failed (GTK4 apps will stay stock)"
    else
      dim "skipping libadwaita override (needs the source build)"
    fi

    popd >/dev/null || true
  fi

  # Whatever actually landed, use it.
  for cand in WhiteSur-Light WhiteSur-light WhiteSur; do
    [ -d "$THEMES_DIR/$cand" ] && { GTK_THEME_NAME="$cand"; break; }
  done
  if [ -z "$GTK_THEME_NAME" ]; then
    GTK_THEME_NAME="$(find "$THEMES_DIR" -maxdepth 1 -iname 'WhiteSur*' -printf '%f\n' 2>/dev/null | sort | head -1)"
  fi
  [ -n "$GTK_THEME_NAME" ] && ok "using theme: $GTK_THEME_NAME" || warn "no WhiteSur theme found in $THEMES_DIR"
fi

# ----------------------------------------------------------------------------
# Icons + cursors
# ----------------------------------------------------------------------------
ICON_THEME_NAME="" CURSOR_THEME_NAME=""
if [ "$DO_ICONS" = 1 ] && have git; then
  step "Icons and cursors"

  if dir="$(clone_or_update https://github.com/vinceliuice/WhiteSur-icon-theme.git WhiteSur-icon-theme)"; then
    # Always pass -d: the bare installer can target a system directory.
    ( cd "$dir" && ./install.sh -d "$ICONS_DIR" >>"$LOG" 2>&1 </dev/null ) \
      || warn "icon installer failed (see $LOG)"
    for cand in WhiteSur-light WhiteSur WhiteSur-dark; do
      [ -d "$ICONS_DIR/$cand" ] && { ICON_THEME_NAME="$cand"; break; }
    done
    [ -n "$ICON_THEME_NAME" ] && ok "icons: $ICON_THEME_NAME" || warn "no WhiteSur icon theme found"
  fi

  # Cursors: copy the prebuilt dist directly — the upstream installer wants root.
  if dir="$(clone_or_update https://github.com/vinceliuice/McMojave-cursors.git McMojave-cursors)"; then
    if [ -d "$dir/dist" ]; then
      rm -rf "$ICONS_DIR/McMojave-cursors"
      cp -r "$dir/dist" "$ICONS_DIR/McMojave-cursors"
      if [ ! -f "$ICONS_DIR/McMojave-cursors/index.theme" ]; then
        printf '[Icon Theme]\nName=McMojave-cursors\nComment=macOS-like cursors\nInherits=Adwaita\n' \
          >"$ICONS_DIR/McMojave-cursors/index.theme"
      fi
      CURSOR_THEME_NAME="McMojave-cursors"
      ok "cursors: McMojave-cursors"
    else
      warn "cursor dist/ not found in repo — skipping cursors"
    fi
  fi

  have gtk-update-icon-cache && gtk-update-icon-cache -f -t "$ICONS_DIR/$ICON_THEME_NAME" >>"$LOG" 2>&1
fi

# ----------------------------------------------------------------------------
# Font (Inter — SF Pro is not redistributable)
# ----------------------------------------------------------------------------
FONT_FAMILY=""
if [ "$DO_FONTS" = 1 ]; then
  step "Inter font"
  tmp="$(mktemp -d)"
  if python3 -I - "$tmp" <<'PY' >>"$LOG" 2>&1
import json, re, sys, urllib.request
from pathlib import Path
out = Path(sys.argv[1])
api = "https://api.github.com/repos/rsms/inter/releases/latest"
req = urllib.request.Request(api, headers={"User-Agent": "macos-ify"})
rel = json.load(urllib.request.urlopen(req, timeout=30))
asset = next((a for a in rel.get("assets", [])
              if re.fullmatch(r"Inter-.*\.zip", a["name"])), None)
if not asset:
    sys.exit("no Inter zip asset in latest release")
dest = out / asset["name"]
urllib.request.urlretrieve(asset["browser_download_url"], dest)
print("downloaded", dest)
PY
  then
    zipf="$(find "$tmp" -maxdepth 1 -name '*.zip' | head -1)"
    if [ -n "$zipf" ]; then
      python3 -m zipfile -e "$zipf" "$tmp/x" >>"$LOG" 2>&1
      n=0
      while IFS= read -r f; do
        cp -f "$f" "$FONTS_DIR/" && n=$((n+1))
      done < <(find "$tmp/x" -type f \( -name 'Inter*.ttf' -o -name 'Inter*.otf' \) | head -60)
      [ "$n" -gt 0 ] && ok "installed $n font files to $FONTS_DIR" || warn "no Inter font files found in the zip"
      have fc-cache && fc-cache -f "$FONTS_DIR" >>"$LOG" 2>&1 && dim "font cache rebuilt"
    fi
  else
    warn "could not download Inter (see $LOG) — keeping your current font"
  fi
  rm -rf "$tmp"

  # Resolve the real family name — Inter ships variable and static builds
  # whose family strings differ between releases.
  if have fc-list; then
    for cand in "Inter Display" "Inter" "Inter Variable"; do
      if fc-list : family 2>/dev/null | tr ',' '\n' | grep -qix -- "$cand"; then
        FONT_FAMILY="$cand"; break
      fi
    done
  fi
  [ -n "$FONT_FAMILY" ] && ok "font family: $FONT_FAMILY" || dim "Inter not registered; font unchanged"
fi

# ----------------------------------------------------------------------------
# Extensions
# ----------------------------------------------------------------------------
ego_download_url() {   # uuid shell_major -> prints https URL or nothing
  python3 -I - "$1" "$2" <<'PY' 2>>"$LOG"
import json, sys, urllib.parse, urllib.request
uuid, ver = sys.argv[1], sys.argv[2]
q = urllib.parse.urlencode({"uuid": uuid, "shell_version": ver})
url = f"https://extensions.gnome.org/extension-info/?{q}"
try:
    req = urllib.request.Request(url, headers={"User-Agent": "macos-ify"})
    info = json.load(urllib.request.urlopen(req, timeout=30))
except Exception:
    sys.exit(1)
dl = info.get("download_url")
if not dl:
    sys.exit(1)
print(urllib.parse.urljoin("https://extensions.gnome.org", dl))
PY
}

enable_extension() {   # append to org.gnome.shell enabled-extensions
  local uuid="$1" cur new
  cur="$(gsettings get org.gnome.shell enabled-extensions 2>/dev/null)" || return 1
  new="$(python3 -I - "$cur" "$uuid" <<'PY'
import ast, sys
cur, uuid = sys.argv[1], sys.argv[2]
try:
    items = list(ast.literal_eval(cur))
except Exception:
    items = []
if uuid not in items:
    items.append(uuid)
print("[" + ", ".join("'" + i.replace("'", "\\'") + "'" for i in items) + "]")
PY
)" || return 1
  gsettings set org.gnome.shell enabled-extensions "$new" 2>>"$LOG"
}

if [ "$DO_EXT" = 1 ]; then
  step "GNOME Shell extensions"
  if ! have gnome-extensions; then
    bad "gnome-extensions tool not found — skipping extensions"
  else
    record org.gnome.shell enabled-extensions
    gsettings set org.gnome.shell disable-user-extensions false 2>>"$LOG"

    for entry in "${EXTENSIONS[@]}"; do
      label="${entry%%|*}"; uuids="${entry##*|}"
      installed=0
      IFS=',' read -r -a candidates <<<"$uuids"
      for uuid in "${candidates[@]}"; do
        # Already present from a previous run?
        if [ -d "$EXT_DIR/$uuid" ] || gnome-extensions info "$uuid" >/dev/null 2>&1; then
          enable_extension "$uuid" >/dev/null 2>&1
          ok "$label (already installed)"
          installed=1; break
        fi
        url="$(ego_download_url "$uuid" "$SHELL_VER")"
        [ -z "$url" ] && continue
        zf="$WORK/${uuid}.zip"
        if ! curl -fsSL -o "$zf" "$url" 2>>"$LOG"; then
          python3 -I -c "import sys,urllib.request;urllib.request.urlretrieve(sys.argv[1],sys.argv[2])" \
            "$url" "$zf" >>"$LOG" 2>&1 || { warn "$label: download failed"; continue; }
        fi
        if gnome-extensions install -f "$zf" >>"$LOG" 2>&1; then
          # Compile schemas with the SYSTEM glib, not brew's.
          if [ -d "$EXT_DIR/$uuid/schemas" ] && [ -n "$SYS_GLIB_COMPILE" ]; then
            "$SYS_GLIB_COMPILE" "$EXT_DIR/$uuid/schemas" >>"$LOG" 2>&1 \
              && dim "schemas compiled"
          fi
          enable_extension "$uuid" >/dev/null 2>&1
          ok "$label"
          installed=1; rm -f "$zf"; break
        fi
        rm -f "$zf"
      done
      [ "$installed" = 0 ] && warn "$label: no build available for GNOME $SHELL_VER"
    done
  fi
fi

# ----------------------------------------------------------------------------
# Settings
# ----------------------------------------------------------------------------
if [ "$DO_SETTINGS" = 1 ]; then
  step "Appearance settings"

  gset org.gnome.desktop.interface color-scheme 'prefer-light'
  [ -n "$GTK_THEME_NAME" ]    && gset org.gnome.desktop.interface gtk-theme    "$GTK_THEME_NAME"
  [ -n "$ICON_THEME_NAME" ]   && gset org.gnome.desktop.interface icon-theme   "$ICON_THEME_NAME"
  [ -n "$CURSOR_THEME_NAME" ] && gset org.gnome.desktop.interface cursor-theme "$CURSOR_THEME_NAME"
  [ -n "$FONT_FAMILY" ]       && gset org.gnome.desktop.interface font-name    "$FONT_FAMILY 11"
  [ -n "$FONT_FAMILY" ]       && gset org.gnome.desktop.wm.preferences titlebar-font "$FONT_FAMILY Semi-Bold 11"

  # Shell theme (needs User Themes extension; harmless if it is missing)
  [ -n "$GTK_THEME_NAME" ] && gset org.gnome.shell.extensions.user-theme name "$GTK_THEME_NAME"

  # Traffic lights on the left
  gset org.gnome.desktop.wm.preferences button-layout 'close,minimize,maximize:'

  step "Dock"
  D=org.gnome.shell.extensions.dash-to-dock
  gset "$D" dock-position 'BOTTOM'
  gset "$D" extend-height false
  gset "$D" dash-max-icon-size 48
  gset "$D" click-action 'minimize-or-previews'
  gset "$D" show-trash false
  gset "$D" show-mounts false
  gset "$D" transparency-mode 'FIXED'
  gset "$D" background-opacity 0.3
  gset "$D" custom-theme-shrink true
  gset "$D" animate-show-apps false
  gset "$D" show-apps-at-top false
  gset "$D" running-indicator-style 'DOTS'

  step "Shell polish"
  JP=org.gnome.shell.extensions.just-perfection
  gset "$JP" activities-button false
  gset "$JP" app-menu false
  gset "$JP" panel-size 32
  gset "$JP" workspace-switcher-should-show true

  BMS=org.gnome.shell.extensions.blur-my-shell
  gset "$BMS" sigma 30
  gset "$BMS" brightness 0.9

  gset org.gnome.mutter center-new-windows true
  gset org.gnome.desktop.interface enable-hot-corners true
  gset org.gnome.desktop.interface font-antialiasing 'rgba'
fi

# ----------------------------------------------------------------------------
# Done
# ----------------------------------------------------------------------------
step "Done"
if grep -q "BLOCKED privileged call" "$LOG" 2>/dev/null; then
  warn "an upstream installer tried to use root; it was blocked, not prompted:"
  grep -o "BLOCKED privileged call -> .*" "$LOG" | sort -u | head -5 | while read -r l; do dim "$l"; done
  dim "this is expected without sudo and does not need fixing"
fi
say ""
say "${c_bld}Log out and back in${c_reset} — extensions and the shell theme only load"
say "on a fresh session (Wayland cannot restart the shell in place)."
say ""
say "After logging back in, if the top bar is still stock:"
say "  gsettings set org.gnome.shell.extensions.user-theme name '$GTK_THEME_NAME'"
say ""
say "Known gaps, none of them fixable without root:"
say "  • the GDM login screen stays stock Ubuntu"
say "  • snap apps (Firefox, Snap Store) ignore ~/.themes and will look wrong"
say "  • no global menu bar — that needs a system-wide GTK module"
say ""
say "Revert settings:  $0 --revert"
say "Full log:         $LOG"
