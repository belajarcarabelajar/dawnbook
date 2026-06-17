#!/usr/bin/env bash
# scripts/test-gating.sh
#
# Verification test script for Dawnbook's edge auth gating.
# Uses curl to assert that:
#   (a) Gated URLs without a valid Clerk session return 302 (HTML) or 401 (fetch)
#   (b) Public preview (chapter 1 / book index) returns 200 without auth
#   (c) Gated responses carry Cache-Control: private, no-store
#
# Usage:
#   ./scripts/test-gating.sh [BASE_URL]
#
# BASE_URL defaults to http://localhost:8788 (wrangler pages dev).
# For production testing, pass the deployed URL:
#   ./scripts/test-gating.sh https://dawnbook.pages.dev

set -euo pipefail

BASE_URL="${1:-http://localhost:8788}"
PASS=0
FAIL=0
TOTAL=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_pass() {
  PASS=$((PASS + 1))
  TOTAL=$((TOTAL + 1))
  echo -e "  ${GREEN}✅ PASS${NC}: $1"
}

log_fail() {
  FAIL=$((FAIL + 1))
  TOTAL=$((TOTAL + 1))
  echo -e "  ${RED}❌ FAIL${NC}: $1"
}

log_section() {
  echo ""
  echo -e "${YELLOW}── $1 ──${NC}"
}

# ─── Test (a): Gated URL without auth returns 302 (HTML) or 401 (fetch) ───

log_section "Test (a): Gated content requires authentication"

# Test a gated chapter (chapter 2+) with HTML Accept header → expect 302
GATED_URL="${BASE_URL}/books/piaget/02%20-%20Konsep%20Dasar%20Skema%20dan%20Struktur%20Kognitif.html"

STATUS_HTML=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Accept: text/html,application/xhtml+xml" \
  --max-redirs 0 \
  "$GATED_URL" 2>/dev/null || true)

if [ "$STATUS_HTML" = "302" ]; then
  log_pass "Gated HTML request (chapter 2) returns 302 (status=$STATUS_HTML)"
else
  log_fail "Gated HTML request (chapter 2) expected 302, got $STATUS_HTML"
fi

# Verify redirect points to /sign-in
REDIRECT_LOCATION=$(curl -s -D - -o /dev/null \
  -H "Accept: text/html,application/xhtml+xml" \
  --max-redirs 0 \
  "$GATED_URL" 2>/dev/null | grep -i "^location:" | tr -d '\r' || true)

if echo "$REDIRECT_LOCATION" | grep -qi "/sign-in"; then
  log_pass "302 redirect location includes /sign-in"
else
  log_fail "302 redirect location should include /sign-in, got: $REDIRECT_LOCATION"
fi

# Test same URL with JSON Accept header → expect 401
STATUS_JSON=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Accept: application/json" \
  "$GATED_URL" 2>/dev/null || true)

if [ "$STATUS_JSON" = "401" ]; then
  log_pass "Gated fetch request (chapter 2) returns 401 (status=$STATUS_JSON)"
else
  log_fail "Gated fetch request (chapter 2) expected 401, got $STATUS_JSON"
fi

# ─── Test (b): Public preview returns 200 without auth ───

log_section "Test (b): Public preview is accessible without auth"

# Test book root/index
BOOK_ROOT_URL="${BASE_URL}/books/piaget/"
STATUS_ROOT=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Accept: text/html" \
  "$BOOK_ROOT_URL" 2>/dev/null || true)

if [ "$STATUS_ROOT" = "200" ]; then
  log_pass "Book root (/books/piaget/) returns 200 (status=$STATUS_ROOT)"
else
  log_fail "Book root (/books/piaget/) expected 200, got $STATUS_ROOT"
fi

# Test chapter 1 (first chapter)
CHAPTER1_URL="${BASE_URL}/books/piaget/01%20-%20Pengantar%20Jean%20Piaget%20dan%20Genetika%20Epistemologi.html"
STATUS_CH1=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Accept: text/html" \
  "$CHAPTER1_URL" 2>/dev/null || true)

if [ "$STATUS_CH1" = "200" ]; then
  log_pass "Chapter 1 returns 200 without auth (status=$STATUS_CH1)"
else
  log_fail "Chapter 1 expected 200, got $STATUS_CH1"
fi

# Test hub pages
for path in "/" "/about.html" "/contribute.html"; do
  HUB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Accept: text/html" \
    "${BASE_URL}${path}" 2>/dev/null || true)
  if [ "$HUB_STATUS" = "200" ]; then
    log_pass "Hub page ${path} returns 200 (status=$HUB_STATUS)"
  else
    log_fail "Hub page ${path} expected 200, got $HUB_STATUS"
  fi
done

# ─── Test (c): Gated responses carry Cache-Control: private, no-store ───

log_section "Test (c): Gated responses have safe cache headers"

# Check Cache-Control on a gated 302 redirect
CACHE_HEADERS=$(curl -s -D - -o /dev/null \
  -H "Accept: text/html,application/xhtml+xml" \
  --max-redirs 0 \
  "$GATED_URL" 2>/dev/null || true)

if echo "$CACHE_HEADERS" | grep -qi "Cache-Control:.*private.*no-store"; then
  log_pass "Gated 302 response includes Cache-Control: private, no-store"
else
  log_fail "Gated 302 response missing Cache-Control: private, no-store"
fi

if echo "$CACHE_HEADERS" | grep -qi "Vary:.*Cookie"; then
  log_pass "Gated 302 response includes Vary: Cookie"
else
  log_fail "Gated 302 response missing Vary: Cookie"
fi

# Check Cache-Control on a gated 401 JSON response
CACHE_HEADERS_JSON=$(curl -s -D - -o /dev/null \
  -H "Accept: application/json" \
  "$GATED_URL" 2>/dev/null || true)

if echo "$CACHE_HEADERS_JSON" | grep -qi "Cache-Control:.*private.*no-store"; then
  log_pass "Gated 401 response includes Cache-Control: private, no-store"
else
  log_fail "Gated 401 response missing Cache-Control: private, no-store"
fi

# ─── Summary ───

log_section "Summary"
echo ""
echo -e "  Total: $TOTAL  |  ${GREEN}Passed: $PASS${NC}  |  ${RED}Failed: $FAIL${NC}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}Some tests failed. See details above.${NC}"
  exit 1
else
  echo -e "${GREEN}All tests passed! ✨${NC}"
  exit 0
fi
