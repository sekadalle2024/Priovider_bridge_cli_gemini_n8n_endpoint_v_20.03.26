#!/bin/bash

# Provider Bridge — Netlify Deployment Script
# ═══════════════════════════════════════════

echo "🚀 Starting Netlify Deployment..."

# 1. Verification of environment
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this from the root of provider-bridge."
    exit 1
fi

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 3. Build the project
echo "🛠️ Building project (TypeScript)..."
npm run build

# 4. Deploy to Netlify
echo "☁️ Deploying to Netlify (Production)..."
# Note: You must be logged in to netlify (npx netlify login)
# AND have linked the project (npx netlify link)
npx netlify deploy --prod --dir=public

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
else
    echo "❌ Deployment failed."
    exit 1
fi
