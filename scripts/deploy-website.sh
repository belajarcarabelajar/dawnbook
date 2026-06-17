#!/bin/bash
set -e

echo "🚀 Starting manual build and deployment for Dawnbook..."

echo "📦 1. Installing dependencies..."
bun install

echo "🔨 2. Building the multi-book platform..."
bun run build

echo "☁️ 3. Deploying to Cloudflare Pages (dawnbook.pages.dev)..."
# Bypass ~/.local/bin to use native Node.js npx instead of bun, as bun breaks wrangler uploads
export CLOUDFLARE_ACCOUNT_ID=1ec5420a78a852fd25bc2dd915740a71
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin npx wrangler pages deploy output --project-name dawnbook --branch main --commit-dirty=true

echo "✅ Deployment complete!"
