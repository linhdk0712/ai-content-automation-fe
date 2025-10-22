#!/bin/bash

# Script to start nginx for development with API proxy

echo "🚀 Starting nginx for development..."

# Backend host/port with defaults: dev=8080, prod=8082
export BACKEND_HOST=${BACKEND_HOST:-localhost}
export BACKEND_PORT=${BACKEND_PORT:-8080}
echo "🔧 Using backend ${BACKEND_HOST}:${BACKEND_PORT}"

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "❌ nginx is not installed. Please install nginx first."
    echo "On macOS: brew install nginx"
    echo "On Ubuntu: sudo apt-get install nginx"
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs/nginx

# Stop any existing nginx processes
echo "🛑 Stopping existing nginx processes..."
sudo pkill nginx 2>/dev/null || true

# Render nginx configuration from template
if [ -f "nginx.conf.template" ]; then
  echo "🧩 Rendering nginx.conf from template..."
  envsubst '\n$BACKEND_HOST\n$BACKEND_PORT\n' < nginx.conf.template > nginx.conf
fi

# Test nginx configuration
echo "🔍 Testing nginx configuration..."
sudo nginx -t -c "$(pwd)/nginx.conf"

if [ $? -ne 0 ]; then
    echo "❌ nginx configuration test failed!"
    exit 1
fi

# Start nginx with our configuration
echo "✅ Starting nginx on port 3000..."
sudo nginx -c "$(pwd)/nginx.conf"

if [ $? -eq 0 ]; then
    echo "✅ nginx started successfully!"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔗 API Proxy: http://localhost:3000/api/* -> http://${BACKEND_HOST}:${BACKEND_PORT}/*"
    echo ""
    echo "To stop nginx: sudo nginx -s stop"
else
    echo "❌ Failed to start nginx!"
    exit 1
fi
