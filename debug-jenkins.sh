#!/bin/bash

# Debug script for Jenkins environment
echo "🔍 Jenkins Environment Debug"
echo "============================"

echo "📍 Current working directory:"
pwd

echo ""
echo "📁 Directory contents:"
ls -la

echo ""
echo "🐳 Docker version:"
docker --version

echo ""
echo "🐳 Docker Compose version:"
docker-compose --version

echo ""
echo "📋 Environment variables:"
env | grep -E "(BUILD_|JENKINS_|WORKSPACE)" | sort

echo ""
echo "🔍 Checking frontend directory:"
if [ -d "/root/ai-content-automation-fe/ai-content-automation-fe/frontend" ]; then
    echo "✅ Frontend directory exists"
    cd /root/ai-content-automation-fe/ai-content-automation-fe/frontend
    echo "📁 Frontend directory contents:"
    ls -la
    
    echo ""
    echo "📋 Package.json exists:"
    if [ -f "package.json" ]; then
        echo "✅ package.json found"
        head -10 package.json
    else
        echo "❌ package.json not found"
    fi
    
    echo ""
    echo "📋 Dockerfile exists:"
    if [ -f "Dockerfile" ]; then
        echo "✅ Dockerfile found"
        head -5 Dockerfile
    else
        echo "❌ Dockerfile not found"
    fi
    
    echo ""
    echo "📋 Docker-compose.yml exists:"
    if [ -f "docker-compose.yml" ]; then
        echo "✅ docker-compose.yml found"
        head -10 docker-compose.yml
    else
        echo "❌ docker-compose.yml not found"
    fi
else
    echo "❌ Frontend directory not found"
    echo "🔍 Checking parent directories:"
    find /root -name "frontend" -type d 2>/dev/null | head -5
fi

echo ""
echo "🐳 Docker status:"
docker ps

echo ""
echo "🐳 Docker images:"
docker images | head -10

echo ""
echo "🌐 Network connectivity:"
curl -s --connect-timeout 5 http://localhost:3000/health || echo "❌ Cannot connect to localhost:3000"

echo ""
echo "🔍 Debug completed!"