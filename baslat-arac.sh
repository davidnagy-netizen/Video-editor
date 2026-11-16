#!/bin/bash
# Mac: a Videó vágása fül Indítás gombja ezt futtatja egy új Terminál-ablakban.
# Használat: bash baslat-arac.sh <claude|codex|gemini> <videó-mappa> <gyenge-modell:0|1>
cd "$(dirname "$0")" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$HOME/.claude/local:$PATH"
arac="$1"; slug="$2"; zayif="$3"
hedef="materyaller/$slug/brief.md"
if [ "$zayif" = "1" ]; then
  istek="Először olvasd el a talimat/adim-adim.md fájlt, és kövesd betű szerint. A brief fájl: $hedef"
else
  istek="Olvasd el a $hedef fájlt, és vágd meg a videót a talimat/video-edit.md fájlban leírt folyamat szerint."
fi
if ! command -v "$arac" >/dev/null 2>&1; then
  echo "Nem található: $arac. Előbb telepítsd (lásd HASZNALAT.md), aztán nyomd meg újra az Indítás gombot."
  exit 1
fi
case "$arac" in
  claude) claude "$istek" ;;
  codex) codex "$istek" ;;
  gemini) gemini -i "$istek" ;;
esac
echo
echo "Ezt az ablakot most már bezárhatod."
