#!/bin/bash

echo "=== Testing Vite Build Locally ==="
echo ""

# Clean previous build
echo "1. Cleaning previous build..."
rm -rf dist
rm -rf node_modules/.vite
echo "✓ Clean completed"
echo ""

# Set environment variables
export NODE_ENV=production
export VITE_API_BASE_URL=/api/v1
export DOCKER=1
export NODE_OPTIONS="--max-old-space-size=4096"

# Build
echo "2. Running build..."
npm run build

# Check build status
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi
echo "✓ Build completed"
echo ""

# Verify output
echo "3. Verifying build output..."
echo ""

echo "Directory structure:"
ls -lh dist/
echo ""

echo "Assets directory:"
ls -lh dist/assets/
echo ""

echo "JavaScript files:"
ls -lh dist/assets/js/
echo ""

echo "CSS files:"
ls -lh dist/assets/css/
echo ""

# Check file sizes
echo "4. Checking file sizes..."
find dist/assets/js -name "*.js" -exec bash -c 'size=$(wc -c < "$1"); if [ $size -lt 100 ]; then echo "⚠️  WARNING: $1 is only $size bytes"; else echo "✓ $1 is $size bytes"; fi' _ {} \;
echo ""

# Check main index.html
echo "5. Checking index.html..."
if [ -f dist/index.html ]; then
    echo "✓ index.html exists"
    echo "Script tags:"
    grep -o '<script[^>]*src="[^"]*"' dist/index.html
    echo ""
    echo "Link tags:"
    grep -o '<link[^>]*href="[^"]*"' dist/index.html
else
    echo "❌ index.html not found!"
fi
echo ""

echo "6. Total build size:"
du -sh dist/
echo ""

echo "=== Build Test Complete ==="
echo ""
echo "If all files look good, proceed with Docker build."
echo "Run: docker-compose build --no-cache && docker-compose up"