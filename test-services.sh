#!/bin/bash

# Quick test script for PM2 and Nginx services

echo "🔍 Service Status Check"
echo "======================"

echo "Current directory: $(pwd)"
echo ""

echo "=== PM2 Status ==="
if command -v pm2 &> /dev/null; then
    pm2 status
    echo ""
    echo "PM2 Logs (last 5 lines):"
    pm2 logs ai-content-frontend --lines 5 2>/dev/null || echo "No PM2 logs found"
else
    echo "❌ PM2 not installed"
fi

echo ""
echo "=== Nginx Status ==="
if command -v nginx &> /dev/null; then
    if systemctl is-active --quiet nginx 2>/dev/null || sudo systemctl is-active --quiet nginx 2>/dev/null; then
        echo "✅ Nginx is running"
    else
        echo "❌ Nginx is not running"
    fi
    
    echo "Nginx configuration test:"
    nginx -t 2>/dev/null || sudo nginx -t 2>/dev/null || echo "❌ Nginx config test failed"
else
    echo "❌ Nginx not installed"
fi

echo ""
echo "=== Port Check ==="
echo "Checking if port 4173 is in use:"
if netstat -tlnp 2>/dev/null | grep :4173; then
    echo "✅ Port 4173 is in use"
else
    echo "❌ Port 4173 is not in use"
fi

echo "Checking if port 80 is in use:"
if netstat -tlnp 2>/dev/null | grep :80; then
    echo "✅ Port 80 is in use"
else
    echo "❌ Port 80 is not in use"
fi

echo ""
echo "=== File Check ==="
echo "Required files:"
[[ -f "package.json" ]] && echo "✅ package.json" || echo "❌ package.json"
[[ -d "dist" ]] && echo "✅ dist directory" || echo "❌ dist directory"
[[ -f "ecosystem.json" ]] && echo "✅ ecosystem.json" || echo "❌ ecosystem.json"
[[ -f "nginx-production.conf" ]] && echo "✅ nginx-production.conf" || echo "❌ nginx-production.conf"

echo ""
echo "=== Quick Test ==="
echo "Testing local connection:"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:4173 | grep -q "200\|301\|302"; then
    echo "✅ Application responding on port 4173"
else
    echo "❌ Application not responding on port 4173"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
    echo "✅ Nginx responding on port 80"
else
    echo "❌ Nginx not responding on port 80"
fi