#!/bin/bash
set -e

echo "🚀 Starting manual build and deployment for Dawnbook..."

echo "📦 1. Installing dependencies..."
bun install

echo "🔨 2. Building the multi-book platform..."
bun run build

echo "🗄️  3. Applying D1 schema migrations..."
# Bypass ~/.local/bin to use native Node.js npx instead of bun, as bun breaks wrangler uploads
export CLOUDFLARE_ACCOUNT_ID=1ec5420a78a852fd25bc2dd915740a71
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin npx wrangler d1 execute dawnbook-db --remote --file=db/migrations/0001_init.sql --yes

echo "☁️  4. Deploying to Cloudflare Pages (dawnbook.pages.dev)..."
# wrangler.toml contains pages_build_output_dir and [[d1_databases]] binding;
# `wrangler pages deploy` reads both and deploys assets + functions + D1 binding together.
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin npx wrangler pages deploy output --project-name dawnbook --branch main --commit-dirty=true

echo "✅ Deployment complete! D1 binding 'DB' is active."
