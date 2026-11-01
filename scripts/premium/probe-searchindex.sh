#!/usr/bin/env bash
# Checks that a book's mdBook search index is not served to anonymous visitors.
# Usage: scripts/premium/probe-searchindex.sh <slug>
# Exit 0: the index answers 302 or 401 without a session.
# Exit 1: any other status (printed). Exit 2: no slug, or no index name found.
set -euo pipefail

BASE_URL="https://dawnbook.belajarcarabelajar.com"

if [ "$#" -lt 1 ] || [ -z "${1:-}" ]; then
  echo "usage: $0 <slug>" >&2
  exit 2
fi
slug="$1"

# A failed page fetch must reach the exit-2 branch, not abort under set -e.
page="$(curl -s --max-time 30 "${BASE_URL}/books/${slug}/" || true)"
index_name="$(printf '%s' "$page" | grep -oE 'searchindex-[a-z0-9]+\.js' | head -n 1 || true)"

if [ -z "$index_name" ]; then
  echo "no searchindex-<hash>.js name found on ${BASE_URL}/books/${slug}/" >&2
  exit 2
fi

status="$(curl -s --max-time 30 -o /dev/null -w '%{http_code}' "${BASE_URL}/books/${slug}/${index_name}" || true)"

if [ "$status" = "302" ] || [ "$status" = "401" ]; then
  echo "ok: /books/${slug}/${index_name} answered ${status} without a session"
  exit 0
fi

echo "leak: /books/${slug}/${index_name} answered ${status} without a session" >&2
exit 1
