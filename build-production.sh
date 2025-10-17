#!/bin/bash

# Production build script with memory optimization
set -e

echo "🚀 Starting production build with memory optimization..."

# Set memory limit and production environment
export NODE_OPTIONS="--max-old-space-size=4096"
export NODE_ENV="production"

# Clean previous build
if [ -d "dist" ]; then
    echo "🧹 Cleaning previous build..."
    rm -rf dist
fi

# Run production build
echo "🔨 Building application..."
npx vite build --config vite.config.production.ts

# Verify build
if [ -f "dist/index.html" ]; then
    echo "✅ Build completed successfully!"
    echo "📊 Build size:"
    du -sh dist/
else
    echo "❌ Build failed - no index.html found"
    exit 1
fi