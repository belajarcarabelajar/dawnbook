#!/usr/bin/env bash
# Question: does an inline Mermaid SVG inside a real mdBook chapter follow the light and dark themes at 375 px and 1280 px?
# Usage: build-and-shoot.sh <svg-file> <tag> [themes...]   (default themes: light rust coal navy ayu)
set -u
WT=/home/belajarcarabelajar/Proyek/dawnbook-wt/dawnbook-mermaid-diagrams
SVG="$1"; TAG="$2"; shift 2
THEMES="${*:-light rust coal navy ayu}"
P1=/tmp/mermaid-spike/p1
SRC=$P1/src-$TAG
OUT=$P1/out-$TAG
SHOTS=$P1/shots
BOOK=kenapa-kebiasaan-susah-diubah
CH=content/02_anatomi-loop-kebiasaan
rm -rf "$SRC" "$OUT"
mkdir -p "$SRC/books" "$SRC/apps/hub/src/styles" "$SHOTS"
cp -r "$WT/books/$BOOK" "$SRC/books/"
cp "$WT/books/shared-header.css" "$WT/books/shared-script.js" "$SRC/books/"
cp "$WT/apps/hub/src/styles/typography.css" "$SRC/apps/hub/src/styles/"

# Insert after line 30 (the blank line after the blockquote that closes "Tiga mata rantai loop").
MD="$SRC/books/$BOOK/src/$CH.md"
{ head -n 30 "$MD"; printf '<div class="dawnbook-diagram">%s</div>\n\n' "$(tr -d '\n' < "$SVG")"; tail -n +31 "$MD"; } > "$MD.new" && mv "$MD.new" "$MD"

(cd /tmp && PATH=$HOME/.cargo/bin:$PATH timeout 120s mdbook build "$SRC/books/$BOOK" -d "$OUT" >/dev/null 2>&1)
echo "mdbook build exit=$?"

HTML="$OUT/$CH.html"
for t in $THEMES; do
  # Force the theme: seed localStorage before mdBook's own theme script runs, and set the class on <html>.
  # Seeding free_chapter_viewed marks the page public so shared-script.js does not redirect file:// to /sign-in.
  F="$OUT/$CH.$t.html"
  sed -e "s|<head>|<head><script>try{localStorage.setItem('mdbook-theme','$t');sessionStorage.setItem('free_chapter_viewed',location.pathname)}catch(e){}</script>|" \
      -e "s|<html lang=\"id\" class=\"light |<html lang=\"id\" class=\"$t |" \
      -e "s|<div class=\"dawnbook-diagram\">|<div class=\"dawnbook-diagram\" id=\"p1-diagram\">|" "$HTML" > "$F"
  for w in 1280 375; do
    png="$SHOTS/$TAG-$t-$w.png"
    timeout 60s /usr/bin/chromium --headless --no-sandbox --disable-gpu --hide-scrollbars \
      --user-data-dir="$P1/profile-$TAG-$t-$w" --force-device-scale-factor=1 \
      --virtual-time-budget=4000 --window-size=$w,1100 --screenshot="$png" "file://$F#p1-diagram" >/dev/null 2>&1
    echo "shot $t $w exit=$? $png"
  done
done
