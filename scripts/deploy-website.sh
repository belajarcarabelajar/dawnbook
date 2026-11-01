#!/bin/bash
set -e

echo "🚀 Starting manual build and deployment for Dawnbook..."

# Load Cloudflare credentials from /root/.env or local .env if present
if [ -f "/root/.env" ]; then
  set -a; source /root/.env 2>/dev/null || true; set +a
fi
if [ -f ".env" ]; then
  set -a; source .env 2>/dev/null || true; set +a
fi
if [ -f ".dev.vars" ]; then
  set -a; source .dev.vars 2>/dev/null || true; set +a
fi

export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-$CF_ACCOUNT_ID}"
export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-$CF_API_TOKEN}"

echo "📦 1. Installing dependencies..."
bun install

echo "🔨 2. Building the multi-book platform..."
bun run build

echo "🗄️  3. Applying D1 schema migrations..."
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo "❌ Error: CLOUDFLARE_ACCOUNT_ID environment variable is not set."
  exit 1
fi
CI=true bunx wrangler d1 migrations apply dawnbook-db --remote

# Baseline for the Telegram announcement (GEMINI.md section 28): a slug missing
# from the live manifest before this deploy is a new book.
live_manifest="$(mktemp)"
trap 'rm -f "$live_manifest"' EXIT
curl -fsS --max-time 20 https://dawnbook.belajarcarabelajar.com/manifest.json -o "$live_manifest" \
  || echo "⚠️  Could not snapshot the live manifest; the Telegram announcement will report it and send nothing."

# A build without the private premium books would delete them from production,
# because Pages replaces the whole site with this output.
if ! bun run scripts/check-premium-output.ts; then
  echo "❌ Error: premium books are missing from output/. Check out the private premium repo beside this one (or set DAWNBOOK_PREMIUM_DIR) and rebuild. Deploy aborted."
  exit 1
fi

# Premium images are served from R2, not Pages (GEMINI.md section 30). Upload them before
# the Pages deploy so no new page points at a missing image; prune only after it (step 7).
echo "🖼️  3b. Uploading premium images to R2..."
if ! bun run scripts/premium/sync-media.ts upload; then
  echo "❌ Error: uploading the premium images to R2 failed. Deploy aborted, because the new pages would point at missing images."
  exit 1
fi

echo "☁️  4. Deploying to Cloudflare Pages (dawnbook.pages.dev)..."
bunx wrangler pages deploy output --project-name dawnbook --branch main --commit-dirty=true

echo "📣 5. Announcing new books on Telegram..."
bun run scripts/announce-new-books.ts --before "$live_manifest" --after output/manifest.json \
  || echo "⚠️  Telegram announcement failed; announce by hand with: bun run scripts/announce-new-books.ts --slug <slug>"

# The site is live from here on, so a failed step is reported at the end instead of
# stopping the steps after it.
failed=()

echo "📄 6. Releasing the premium store PDFs..."
bun run scripts/premium/release-pdfs.ts \
  || failed+=("bun run scripts/premium/release-pdfs.ts (store PDFs are stale)")

echo "🧹 7. Deleting premium images no longer used from R2..."
bun run scripts/premium/sync-media.ts prune \
  || failed+=("bun run scripts/premium/sync-media.ts prune (unused images stay in R2)")

if [ ${#failed[@]} -gt 0 ]; then
  echo "❌ The site is live, but these steps failed. Fix the cause and re-run them:"
  printf '   - %s\n' "${failed[@]}"
  exit 1
fi

echo "✅ Deployment complete! D1 binding 'DB' is active."
