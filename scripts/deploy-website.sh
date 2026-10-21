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

echo "☁️  4. Deploying to Cloudflare Pages (dawnbook.pages.dev)..."
bunx wrangler pages deploy output --project-name dawnbook --branch main --commit-dirty=true

echo "📣 5. Announcing new books on Telegram..."
bun run scripts/announce-new-books.ts --before "$live_manifest" --after output/manifest.json \
  || echo "⚠️  Telegram announcement failed; announce by hand with: bun run scripts/announce-new-books.ts --slug <slug>"

echo "✅ Deployment complete! D1 binding 'DB' is active."
