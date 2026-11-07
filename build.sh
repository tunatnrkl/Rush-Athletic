#!/usr/bin/env bash
# Kaynak parçalarını tek dosyalık index.html'e birleştirir (GitHub Pages / PWA için).
set -euo pipefail
cd "$(dirname "$0")"
{ cat src/head.html; for f in data core api store engine charts vision ui-base ui-common ui-auth ui-coach ui-athlete ui-parent app; do printf '\n/* ===== %s.js ===== */\n' "$f"; cat "src/$f.js"; done; cat src/tail.html; } > index.html
H=$(cat index.html config.js 2>/dev/null | sha256sum | cut -c1-10)
sed -i -E "s/const CACHE = \"rush-[^\"]*\";/const CACHE = \"rush-$H\";/" sw.js
echo "index.html oluşturuldu ($(wc -c < index.html) bayt), önbellek: rush-$H"
