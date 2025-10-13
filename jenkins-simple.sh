#!/bin/bash

# Simple Jenkins build script for AI Content Frontend
# Usage in Jenkins: sh './jenkins-simple.sh'

set -e

echo "🚀 Starting AI Content Frontend build process..."

# Navigate to project directory
pwd
cd /root/ai-content-automation-fe/ai-content-automation-fe/frontend

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main
ls -la

# Create production environment file with default values
echo "📋 Creating production environment configuration..."
cat > .env << 'EOF'
# Production Environment Configuration
FRONTEND_PORT=3000
FRONTEND_DOMAIN=localhost

# API Configuration
VITE_API_BASE_URL=/api/v1
VITE_REALTIME_SERVER_URL=/socket.io

# Supabase Configuration (Production)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# OAuth Configuration (Production)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_FACEBOOK_CLIENT_ID=your_facebook_client_id

# Environment
VITE_NODE_ENV=production

# Backend Services Configuration
AUTH_SERVICE_PORT=8081
REALTIME_SERVER_PORT=3001
SPRING_PROFILES_ACTIVE=prod
EOF

# Set executable permissions
echo "🔧 Setting permissions..."
chmod +x docker-build.sh
chmod +x deploy.sh

# Build production Docker image
echo "🔨 Building Docker image..."
BUILD_TAG=${BUILD_NUMBER:-$(date +%Y%m%d-%H%M%S)}
./docker-build.sh production $BUILD_TAG

# Test the built image
echo "🧪 Testing the built image..."
TEST_PORT=3010
docker run -d --name test-frontend-$BUILD_TAG -p $TEST_PORT:3000 ai-content-frontend:$BUILD_TAG

# Wait for container to start
echo "⏳ Waiting for container to start..."
sleep 15

# Health check
echo "🔍 Performing health check..."
if curl -f http://localhost:$TEST_PORT/health; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    echo "📋 Container logs:"
    docker logs test-frontend-$BUILD_TAG
    docker stop test-frontend-$BUILD_TAG
    docker rm test-frontend-$BUILD_TAG
    exit 1
fi

# Test main page
echo "🔍 Testing main page..."
if curl -f http://localhost:$TEST_PORT/ | grep -q "<!DOCTYPE html>"; then
    echo "✅ Main page test passed"
else
    echo "❌ Main page test failed"
    docker stop test-frontend-$BUILD_TAG
    docker rm test-frontend-$BUILD_TAG
    exit 1
fi

# Cleanup test container
echo "🧹 Cleaning up test container..."
docker stop test-frontend-$BUILD_TAG
docker rm test-frontend-$BUILD_TAG

# Tag as latest
echo "🏷️  Tagging as latest..."
docker tag ai-content-frontend:$BUILD_TAG ai-content-frontend:latest

# Optional: Push to registry (uncomment if needed)
# if [ ! -z "$DOCKER_REGISTRY" ]; then
#     echo "📤 Pushing to registry..."
#     docker tag ai-content-frontend:$BUILD_TAG $DOCKER_REGISTRY/ai-content-frontend:$BUILD_TAG
#     docker tag ai-content-frontend:$BUILD_TAG $DOCKER_REGISTRY/ai-content-frontend:latest
#     docker push $DOCKER_REGISTRY/ai-content-frontend:$BUILD_TAG
#     docker push $DOCKER_REGISTRY/ai-content-frontend:latest
# fi

# Deploy to production (optional)
if [ "$DEPLOY_TO_PROD" = "true" ]; then
    echo "🚀 Deploying to production..."
    
    # Stop existing services
    docker-compose -f docker-compose.yml down || true
    
    # Start new services
    docker-compose -f docker-compose.yml up -d
    
    # Wait for services
    sleep 20
    
    # Verify deployment
    if curl -f http://localhost:3000/health; then
        echo "✅ Production deployment successful"
        echo "🌐 Frontend available at: http://localhost:3000"
    else
        echo "❌ Production deployment failed"
        docker-compose -f docker-compose.yml logs frontend
        exit 1
    fi
fi

# Cleanup old images (keep last 5)
echo "🧹 Cleaning up old images..."
docker images ai-content-frontend --format "table {{.Repository}}:{{.Tag}}" | grep -v "latest" | tail -n +6 | awk '{print $1":"$2}' | xargs -r docker rmi || true

echo "🎉 Build process completed successfully!"
echo "📦 Built image: ai-content-frontend:$BUILD_TAG"
echo "📦 Latest image: ai-content-frontend:latest"