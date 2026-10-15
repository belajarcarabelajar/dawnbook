#!/usr/bin/env bash
# Question: does mmdc render one themeable inline SVG (htmlLabels false, base theme, dagre) and how long and how big is it?
# Usage: render.sh <mermaid-config.json> <theme.css> <out.svg> <svgId> [puppeteer.json]
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
CFG="$1"; CSS="$2"; OUT="$3"; ID="$4"; PCFG="${5:-$HERE/puppeteer-headless-shell.json}"
start=$(date +%s%N)
timeout 120s "$HOME/.bun/bin/mmdc" -i "$HERE/diagram.mmd" -o "$OUT" -c "$CFG" -C "$CSS" -p "$PCFG" -I "$ID" -b transparent --no-font-embed -q
code=$?
ms=$(( ($(date +%s%N) - start) / 1000000 ))
bytes=$(wc -c < "$OUT" 2>/dev/null || echo 0)
echo "render exit=$code ms=$ms bytes=$bytes out=$OUT"
exit $code
