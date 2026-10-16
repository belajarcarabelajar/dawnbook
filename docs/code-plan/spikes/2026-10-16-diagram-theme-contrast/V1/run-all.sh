#!/usr/bin/env bash
# V1 runner: every paint probe x {index, chapter} x {CONTROL, FIXED}, then the error probe per variant.
# Needs serve.ts on $PORT serving the site built by make-variants.ts. Logs go to $LOGS; prints a summary table.
# Usage: [MODE_FILTER="bg-navy class-navy-cl"] bash run-all.sh [port=8831] [logs=/tmp/dtc-V1/logs]
set -u
PORT=${1:-8831}
LOGS=${2:-/tmp/dtc-V1/logs}
S=$(cd "$(dirname "$0")/.." && pwd)
W=$(cd "$S/../../../.." && pwd)
B="http://localhost:$PORT/books/state-of-flow"
NAVY_BG=$(sed -n '/^\.navy {/,/}/p' /tmp/dtc-V1/site/books/state-of-flow/css/variables-*.css | grep -m1 -- '--bg:' | sed 's/.*--bg: *//; s/;.*//')
[ -n "$NAVY_BG" ] || { echo "navy --bg not found in variables css" >&2; exit 2; }
mkdir -p "$LOGS"
cd "$W"
declare -A URL=([index-control]="$B/?v=index-control" [index-fixed]="$B/?v=index-fixed" [ch-control]="$B/content/?v=ch-control" [ch-fixed]="$B/content/?v=ch-fixed")
MODES=(
  "bg-navy|$S/C10/probe-paint-bg.ts|--theme navy --runs 5"
  "bg-dark-light|$S/C10/probe-paint-bg.ts|--dark --theme light --runs 5"
  "bg-dark-none|$S/C10/probe-paint-bg.ts|--dark --theme none --runs 5"
  "class-navy|$S/probe-theme-paint.ts|--theme navy --runs 5"
  "class-navy-cl|$S/V1/probe-theme-paint-childlist.ts|--theme navy --runs 5"
  "C1-bg-navy|$S/C1/probe-paint-bg.ts|--theme navy --expect-bg __NAVY__ --runs 5"
)
MODE_FILTER=${MODE_FILTER:-}
printf '%-14s %-14s %-9s %s\n' variant mode exit summary
for m in "${MODES[@]}"; do
  IFS='|' read -r name probe flags <<<"$m"
  [ -z "$MODE_FILTER" ] || [[ " $MODE_FILTER " == *" $name "* ]] || continue
  read -r -a fl <<<"$flags"
  for i in "${!fl[@]}"; do [ "${fl[$i]}" = __NAVY__ ] && fl[$i]=$NAVY_BG; done # one argv entry despite the spaces
  for v in index-control index-fixed ch-control ch-fixed; do
    log="$LOGS/$v.$name.log"
    bun "$probe" "${URL[$v]}" "${fl[@]}" >"$log" 2>&1
    code=$?
    printf '%-14s %-14s %-9s %s\n' "$v" "$name" "$code" "$(tail -n 1 "$log")"
  done
done
for v in index-control index-fixed ch-control ch-fixed; do
  bun "$S/V1/probe-errors.ts" "${URL[$v]}" --theme navy --loads 2 >"$LOGS/$v.errors.log" 2>&1
  echo "errors $v exit $?: $(tail -n 1 "$LOGS/$v.errors.log")"
done
echo "navy --bg used for C1 --expect-bg: $NAVY_BG"
