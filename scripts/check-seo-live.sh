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

# JSON API responses stay out of the index (GEMINI.md section 31). A book 404.html cannot be
# checked here: anonymous requests to it get the gating middleware's 401.
TEST_API_URL="$BASE_URL/api/stats"
echo "Verifying X-Robots-Tag on API: $TEST_API_URL"
HEADERS_API=$(curl -s -o /dev/null -D - "$TEST_API_URL")
if ! echo "$HEADERS_API" | grep -qi "X-Robots-Tag: noindex"; then
  echo "❌ [FAIL] API response lacks X-Robots-Tag: noindex"
  exit 1
fi

# Gated chapters are closed at the edge (functions/_middleware.ts): a signed-out fetch gets a
# 401 JSON answer, a signed-out page request (Accept: text/html) a 302 to /sign-in.
echo "Verifying gated path: $TEST_GATED_URL"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$TEST_GATED_URL")
if [ "$HTTP_STATUS" -ne 401 ]; then
  echo "❌ [FAIL] Gated path returned HTTP $HTTP_STATUS to a signed-out fetch, expected 401"
  exit 1
fi
GATED_HTML=$(curl -s -o /dev/null -w "%{http_code} %{redirect_url}" -H "Accept: text/html" "$TEST_GATED_URL")
case "$GATED_HTML" in
  "302 $BASE_URL/sign-in?"*) ;;
  *)
    echo "❌ [FAIL] Gated path answered a signed-out page request with \"$GATED_HTML\", expected a 302 to /sign-in"
    exit 1
    ;;
esac

echo "Verifying canonical tag on public path..."
BODY_PUBLIC=$(curl -s "$TEST_PUBLIC_URL")
if ! echo "$BODY_PUBLIC" | grep -qi '<link rel="canonical"'; then
  echo "❌ [FAIL] Public path missing canonical tag"
  exit 1
fi

echo "✅ Live SEO Verification passed!"
