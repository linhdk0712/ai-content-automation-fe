#!/bin/bash

# Docker build script with best practices
# Usage: ./docker-build.sh [environment] [tag] [with-proxy]

set -e

# Default values
ENVIRONMENT=${1:-production}
TAG=${2:-latest}
WITH_PROXY=${3:-false}
IMAGE_NAME="ai-content-frontend"

echo "🚀 Building Docker image for $ENVIRONMENT environment..."

# Choose nginx config based on proxy requirement
if [ "$WITH_PROXY" = "true" ]; then
    echo "📋 Using nginx config with backend proxy"
    cp nginx-with-proxy.conf nginx.conf.tmp
    mv nginx.conf nginx.conf.backup
    mv nginx.conf.tmp nginx.conf
fi

# Load environment variables
if [ -f ".env.${ENVIRONMENT}" ]; then
    echo "📋 Loading environment from .env.${ENVIRONMENT}"
    export $(cat .env.${ENVIRONMENT} | grep -v '^#' | xargs)
elif [ -f ".env" ]; then
    echo "📋 Loading environment from .env"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  No environment file found, using defaults"
fi

# Build arguments
BUILD_ARGS=""
if [ "$ENVIRONMENT" = "production" ]; then
    BUILD_ARGS="--target production"
fi

# Build the image
echo "🔨 Building Docker image: ${IMAGE_NAME}:${TAG}"
docker build \
    ${BUILD_ARGS} \
    --build-arg NODE_ENV=${ENVIRONMENT} \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    --cache-from ${IMAGE_NAME}:latest \
    -t ${IMAGE_NAME}:${TAG} \
    -t ${IMAGE_NAME}:latest \
    .

echo "✅ Docker image built successfully!"

# Optional: Run security scan
if command -v docker &> /dev/null && command -v trivy &> /dev/null; then
    echo "🔍 Running security scan..."
    trivy image ${IMAGE_NAME}:${TAG}
fi

# Optional: Test the image
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🧪 Testing the built image..."
    docker run --rm -d --name test-frontend -p 3001:3000 ${IMAGE_NAME}:${TAG}
    sleep 5
    
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Health check passed!"
    else
        echo "❌ Health check failed!"
        exit 1
    fi
    
    docker stop test-frontend
fi

# Restore original nginx config if modified
if [ "$WITH_PROXY" = "true" ] && [ -f "nginx.conf.backup" ]; then
    echo "🔄 Restoring original nginx config"
    mv nginx.conf.backup nginx.conf
fi

echo "🎉 Build completed successfully!"
echo "📦 Image: ${IMAGE_NAME}:${TAG}"
echo "🚀 To run standalone: docker run -p 3000:3000 ${IMAGE_NAME}:${TAG}"
echo "🚀 To run with compose: docker-compose up -d"