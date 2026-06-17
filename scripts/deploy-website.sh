#!/bin/bash
set -e

echo "🚀 Starting manual build and deployment for Dawnbook..."

echo "📦 1. Installing dependencies..."
bun install

echo "🔨 2. Building the multi-book platform..."
bun run build

echo "☁️ 3. Deploying to Cloudflare Pages (piaget-book.pages.dev)..."
export CLOUDFLARE_ACCOUNT_ID=1ec5420a78a852fd25bc2dd915740a71
bunx wrangler pages deploy output --project-name dawnbook --commit-dirty=true

echo "✅ Deployment complete!"
