#!/usr/bin/env bash
# Kaynak parçalarını tek dosyalık index.html'e birleştirir (GitHub Pages / PWA için).
set -euo pipefail
cd "$(dirname "$0")"
{ cat src/head.html; for f in data core engine charts ui1 ui2 ui3 ui4 ui5; do printf '\n/* ===== %s.js ===== */\n' "$f"; cat "src/$f.js"; done; cat src/tail.html; } > index.html
# Servis çalışanı önbellek sürümünü içerik özetine bağla (güncellemeler telefona ulaşsın)
H=$(sha256sum index.html | cut -c1-10)
sed -i -E "s/const CACHE = \"rush-[^\"]*\";/const CACHE = \"rush-$H\";/" sw.js
echo "index.html oluşturuldu ($(wc -c < index.html) bayt), önbellek: rush-$H"
