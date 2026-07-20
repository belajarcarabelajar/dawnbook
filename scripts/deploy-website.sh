#!/bin/bash
set -e

echo "🚀 Starting manual build and deployment for Dawnbook..."

# Load Cloudflare credentials from /root/.env or local .env if present
if [ -f "/root/.env" ]; then
  export $(grep -v '^#' /root/.env | xargs)
fi
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi
if [ -f "apps/admin/.env.local" ]; then
  export $(grep -v '^#' apps/admin/.env.local | xargs)
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
CI=true PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin npx wrangler d1 migrations apply dawnbook-db --remote

echo "☁️  4. Deploying to Cloudflare Pages (dawnbook.pages.dev)..."
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin npx wrangler pages deploy output --project-name dawnbook --branch main --commit-dirty=true

echo "✅ Deployment complete! D1 binding 'DB' is active."
