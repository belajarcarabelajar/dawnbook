#!/bin/bash
set -e

echo "🚀 Starting manual build and deployment for Dawnbook..."

echo "📦 1. Installing dependencies..."
bun install

echo "🔨 2. Building the multi-book platform..."
bun run build

echo "☁️ 3. Deploying to Cloudflare Pages (dawnbook.pages.dev)..."
# Account ID and Tokens should be provided via environment variables in CI/CD or .env
bun run wrangler pages deploy output --project-name dawnbook

echo "✅ Deployment complete!"
