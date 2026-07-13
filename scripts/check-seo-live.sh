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
TEST_PUBLIC_URL="$BASE_URL/books/piaget/content/01_pengantar-jean-piaget-dan-genetika-epistemologi"
TEST_GATED_URL="$BASE_URL/books/piaget/content/02_konsep-dasar-skema-dan-struktur-kognitif"

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

# Verify noindex is present on gated (Note: under client-side gating, this check is skipped)
echo "Skipping noindex header check for gated path (client-side gating)."

echo "Verifying canonical tag on public path..."
BODY_PUBLIC=$(curl -s "$TEST_PUBLIC_URL")
if ! echo "$BODY_PUBLIC" | grep -qi '<link rel="canonical"'; then
  echo "❌ [FAIL] Public path missing canonical tag"
  exit 1
fi

echo "✅ Live SEO Verification passed!"
