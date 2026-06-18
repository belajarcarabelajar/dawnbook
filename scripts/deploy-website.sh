#!/bin/bash
set -e

echo "🚀 Starting manual build and deployment for Dawnbook..."

echo "📦 1. Installing dependencies..."
bun install

echo "🔨 2. Building the multi-book platform..."
if [ -f "apps/admin/.env.local" ]; then
  export $(grep -v '^#' apps/admin/.env.local | xargs)
fi
bun run build

echo "🗄️  3. Applying D1 schema migrations..."
# Bypass ~/.local/bin to use native Node.js npx instead of bun, as bun breaks wrangler uploads
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo "❌ Error: CLOUDFLARE_ACCOUNT_ID environment variable is not set."
  exit 1
fi
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin npx wrangler d1 migrations apply dawnbook-db --remote
echo "☁️  4. Deploying to Cloudflare Pages (dawnbook.pages.dev)..."
# wrangler.toml contains pages_build_output_dir and [[d1_databases]] binding;
# `wrangler pages deploy` reads both and deploys assets + functions + D1 binding together.
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin npx wrangler pages deploy output --project-name dawnbook --branch main --commit-dirty=true

echo "✅ Deployment complete! D1 binding 'DB' is active."
