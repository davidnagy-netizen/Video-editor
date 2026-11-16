#!/bin/bash
# Mac indító. Dupla kattintás (vagy Terminálban: bash baslat.command).
# Első alkalommal a hiányzó eszközöket (Node.js, ffmpeg) Homebrew-val telepíti, utána megnyitja a Videó Stúdiót.
cd "$(dirname "$0")" || exit 1
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
# nvm-mel telepített Node (ha van)
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1 && nvm use default >/dev/null 2>&1
clear
echo "Aetherpontis Videó Stúdió indul..."
echo

# Node.js 18 vagy újabb kell
node_tamam() { command -v node >/dev/null 2>&1 && [ "$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)" -ge 18 ]; }

eksik=""
node_tamam || eksik="$eksik node"
command -v ffmpeg >/dev/null 2>&1 || eksik="$eksik ffmpeg"

if [ -n "$eksik" ]; then
  echo "Hiányzó eszközök:$eksik"
  if ! command -v brew >/dev/null 2>&1; then
    echo
    echo "A telepítésükhöz Homebrew kell (a Mac ingyenes csomagkezelője)."
    echo "A telepítés kérheti a Mac jelszavadat. Gépelés közben nem látszik semmi, ez normális."
    printf "Telepítsem most a Homebrew-t? (i/n) "
    read -r cevap
    if [ "$cevap" != "i" ] && [ "$cevap" != "I" ]; then
      echo "Telepítés megszakítva. Ha készen állsz, futtasd újra ezt a fájlt."
      exit 1
    fi
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || { echo "A Homebrew telepítése nem sikerült."; exit 1; }
    [ -x /opt/homebrew/bin/brew ] && eval "$(/opt/homebrew/bin/brew shellenv)"
    [ -x /usr/local/bin/brew ] && eval "$(/usr/local/bin/brew shellenv)"
  fi
  echo
  echo "Telepítés:$eksik (csak egyszer kell, pár percig tart)"
  # shellcheck disable=SC2086
  brew install $eksik || { echo "A telepítés nem fejeződött be. Nézd meg a fenti hibát."; exit 1; }
  hash -r
  if ! node_tamam || ! command -v ffmpeg >/dev/null 2>&1; then
    echo "Telepítés után sem található a node vagy az ffmpeg. Zárd be a Terminált, és futtasd újra ezt a fájlt."
    exit 1
  fi
fi

if [ ! -d node_modules ]; then
  echo
  echo "Projektcsomagok telepítése (első alkalommal)..."
  npm install || { echo "Az npm install nem sikerült."; exit 1; }
fi

# első alkalommal: ha nincs MI-eszköz, felajánlja a Claude Code telepítését
if [ ! -f araclar/mac-kurulum-tamam.txt ]; then
  if ! command -v claude >/dev/null 2>&1 && ! command -v codex >/dev/null 2>&1 && ! command -v gemini >/dev/null 2>&1; then
    echo
    printf "Telepítsem a Claude Code-ot? (i/n; ha más eszközt használsz, n) "
    read -r cevap
    if [ "$cevap" = "i" ] || [ "$cevap" = "I" ]; then
      npm install -g @anthropic-ai/claude-code || echo "A Claude Code telepítése nem sikerült. Később kézzel is telepítheted."
    fi
  fi
  mkdir -p araclar && date > araclar/mac-kurulum-tamam.txt
fi

echo
echo "A Videó Stúdió megnyílik a böngészőben. Amíg dolgozol, hagyd nyitva ezt az ablakot."
node server.mjs
