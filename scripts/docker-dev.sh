#!/bin/bash

# Script để chạy frontend trong Docker development mode

echo "🚀 Starting AI Content Automation Frontend in Docker Development Mode..."

# Tạo network nếu chưa tồn tại
docker network create ai-content-net 2>/dev/null || true

# Dừng container cũ nếu đang chạy
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.dev.yml down

# Build và start container mới
echo "🔨 Building and starting containers..."
docker-compose -f docker-compose.dev.yml up --build

echo "✅ Frontend is running at http://localhost:3000"
echo "📝 Logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "🛑 Stop: docker-compose -f docker-compose.dev.yml down"