#!/bin/bash
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <PRODUCTION_URL>"
  exit 1
fi

BASE_URL="$1"
# Remove trailing slash
BASE_URL="${BASE_URL%/}"

echo "Starting Live SEO Verification for $BASE_URL..."

# Assume piaget is a known book for testing
TEST_PUBLIC_URL="$BASE_URL/books/piaget/01%20-%20Pengantar.html"
TEST_GATED_URL="$BASE_URL/books/piaget/02%20-%20Konsep.html"

echo "Verifying public path: $TEST_PUBLIC_URL"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$TEST_PUBLIC_URL")
if [ "$HTTP_STATUS" -ne 200 ]; then
  echo "❌ [FAIL] Public path returned HTTP $HTTP_STATUS"
  exit 1
fi

# Verify noindex is absent on public
HEADERS_PUBLIC=$(curl -s -I "$TEST_PUBLIC_URL")
if echo "$HEADERS_PUBLIC" | grep -qi "X-Robots-Tag: noindex"; then
  echo "❌ [FAIL] Public path has X-Robots-Tag: noindex"
  exit 1
fi

echo "Verifying gated path: $TEST_GATED_URL"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$TEST_GATED_URL")
if [ "$HTTP_STATUS" -ne 200 ]; then
  echo "❌ [FAIL] Gated path returned HTTP $HTTP_STATUS"
  exit 1
fi

# Verify noindex is present on gated
HEADERS_GATED=$(curl -s -I "$TEST_GATED_URL")
if ! echo "$HEADERS_GATED" | grep -qi "X-Robots-Tag: noindex"; then
  echo "❌ [FAIL] Gated path is missing X-Robots-Tag: noindex"
  exit 1
fi

echo "Verifying canonical tag on public path..."
BODY_PUBLIC=$(curl -s "$TEST_PUBLIC_URL")
if ! echo "$BODY_PUBLIC" | grep -qi '<link rel="canonical"'; then
  echo "❌ [FAIL] Public path missing canonical tag"
  exit 1
fi

echo "✅ Live SEO Verification passed!"
