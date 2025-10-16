#!/bin/bash

# Quick fix for PM2 directory issues

echo "🚀 Quick PM2 Fix"
echo "================"

# Stop and clean PM2
echo "Cleaning PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill

# Generate correct config
echo "Generating PM2 config for current directory..."
./generate-pm2-config.sh

# Verify we have required files
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: package.json not found"
    exit 1
fi

if [[ ! -d "dist" ]]; then
    echo "❌ Error: dist directory not found. Running build..."
    npm run build
fi

# Create log directory
mkdir -p /var/log/pm2
chmod 755 /var/log/pm2

# Start PM2 with new config
echo "Starting PM2..."
pm2 start ecosystem.json

# Check status
echo "PM2 Status:"
pm2 status

# Show logs if there are issues
if ! pm2 list | grep -q "online"; then
    echo "❌ PM2 not running properly. Showing logs:"
    pm2 logs ai-content-frontend --lines 10
else
    echo "✅ PM2 started successfully!"
    echo "Application should be available at: http://localhost:4173"
fi

# Save PM2 config
pm2 save

echo ""
echo "Management commands:"
echo "- Check status: pm2 status"
echo "- View logs: pm2 logs ai-content-frontend"
echo "- Restart: pm2 restart ai-content-frontend"