#!/bin/bash

# Debug script for PM2 configuration issues

echo "🔍 PM2 Debug Information"
echo "========================"

echo "Current working directory:"
pwd

echo ""
echo "Directory contents:"
ls -la

echo ""
echo "PM2 status:"
pm2 status

echo ""
echo "PM2 logs (last 10 lines):"
pm2 logs ai-content-frontend --lines 10 2>/dev/null || echo "No logs found"

echo ""
echo "Available ecosystem files:"
ls -la ecosystem*.* 2>/dev/null || echo "No ecosystem files found"

echo ""
echo "Package.json exists:"
if [[ -f "package.json" ]]; then
    echo "✅ package.json found"
    echo "Scripts available:"
    grep -A 10 '"scripts"' package.json
else
    echo "❌ package.json not found"
fi

echo ""
echo "Dist directory:"
if [[ -d "dist" ]]; then
    echo "✅ dist directory exists"
    ls -la dist/ | head -5
else
    echo "❌ dist directory not found"
fi

echo ""
echo "Environment variables:"
echo "NODE_ENV: $NODE_ENV"
echo "PWD: $PWD"
echo "USER: $USER"

echo ""
echo "PM2 process details:"
pm2 describe ai-content-frontend 2>/dev/null || echo "Process not found"