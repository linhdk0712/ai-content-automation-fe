#!/bin/bash

# Simple deployment script for memory-constrained environments
set -e

echo "🚀 AI Content Automation - Simple Deployment"
echo "=============================================="

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: package.json not found. Run from frontend directory."
    exit 1
fi

# Stop existing PM2 process
echo "🛑 Stopping existing services..."
pm2 stop ai-content-frontend 2>/dev/null || true
pm2 delete ai-content-frontend 2>/dev/null || true

# Clean build
echo "🧹 Cleaning previous build..."
rm -rf dist node_modules package-lock.json

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build with memory optimization
echo "🔨 Building application (this may take a few minutes)..."
export NODE_OPTIONS="--max-old-space-size=4096"
export NODE_ENV="production"
npx vite build --config vite.config.production.ts

# Verify build
if [[ ! -f "dist/index.html" ]]; then
    echo "❌ Build failed - no index.html found"
    exit 1
fi

echo "✅ Build completed successfully!"

# Start PM2 process
echo "🚀 Starting PM2 process..."
pm2 start npm --name "ai-content-frontend" -- run preview

# Save PM2 configuration
pm2 save

echo "✅ Deployment completed!"
echo ""
echo "🌐 Application should be available at:"
echo "   - http://localhost:4173"
echo ""
echo "📊 Management commands:"
echo "   - Check status: pm2 status"
echo "   - View logs: pm2 logs ai-content-frontend"
echo "   - Restart: pm2 restart ai-content-frontend"