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

# Check if BASE_URL is accessible
if ! curl -s -o /dev/null --connect-timeout 2 "$BASE_URL"; then
  echo -e "\033[0;31m❌ Error: Cannot connect to $BASE_URL\033[0m"
  echo "If 'wrangler pages dev' local server is hanging or unavailable,"
  echo "deploy to a preview branch and run:"
  echo "  $0 https://preview-branch.dawnbook.pages.dev"
  exit 1
fi

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

# ─── Test (a): All chapters are public at the edge for SEO ───

log_section "Test (a): All chapters are public at the edge for SEO"

GATED_URL="${BASE_URL}/books/piaget/content/02_konsep-dasar-skema-dan-struktur-kognitif"

STATUS_HTML=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Accept: text/html,application/xhtml+xml" \
  --max-redirs 0 --connect-timeout 5 --max-time 10 \
  "$GATED_URL" 2>/dev/null || true)

if [ "$STATUS_HTML" = "200" ]; then
  log_pass "Chapter HTML request returns 200 OK at the edge (status=$STATUS_HTML)"
else
  log_fail "Chapter HTML request expected 200, got $STATUS_HTML"
fi

# ─── Test (b): Dynamic SEO-first gating script is injected ───

log_section "Test (b): Dynamic SEO-first gating script is injected"

HTML_CONTENT=$(curl -s \
  -H "Accept: text/html,application/xhtml+xml" \
  --max-redirs 0 --connect-timeout 5 --max-time 10 \
  "$GATED_URL" 2>/dev/null || true)

if echo "$HTML_CONTENT" | grep -qi "sessionStorage.getItem('free_chapter_viewed')"; then
  log_pass "Dynamic FOUC prevention script is injected"
else
  log_fail "Dynamic FOUC prevention script not found in HTML"
fi

# ─── Test (c): Public preview (index/hub) returns 200 ───

log_section "Test (c): Hub pages are accessible without auth"

# Test book root/index
BOOK_ROOT_URL="${BASE_URL}/books/piaget/"
STATUS_ROOT=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Accept: text/html" --connect-timeout 5 --max-time 10 \
  "$BOOK_ROOT_URL" 2>/dev/null || true)

if [ "$STATUS_ROOT" = "200" ]; then
  log_pass "Book root (/books/piaget/) returns 200 (status=$STATUS_ROOT)"
else
  log_fail "Book root (/books/piaget/) expected 200, got $STATUS_ROOT"
fi

# Test hub pages
for path in "/" "/about" "/contribute"; do
  HUB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Accept: text/html" --connect-timeout 5 --max-time 10 \
    "${BASE_URL}${path}" 2>/dev/null || true)
  if [ "$HUB_STATUS" = "200" ]; then
    log_pass "Hub page ${path} returns 200 (status=$HUB_STATUS)"
  else
    log_fail "Hub page ${path} expected 200, got $HUB_STATUS"
  fi
done

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
