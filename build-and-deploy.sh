#!/bin/bash

# Simple build and deploy script for Jenkins
# Usage: cd frontend && ./build-and-deploy.sh

set -e

echo "🚀 AI Content Frontend - Build and Deploy Script"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the frontend directory."
    exit 1
fi

# Set build number
BUILD_NUMBER=${BUILD_NUMBER:-$(date +%Y%m%d-%H%M%S)}
echo "📋 Build Number: $BUILD_NUMBER"

# Create production environment
echo "📋 Creating production environment..."
cat > .env << 'EOF'
# Production Environment Configuration
FRONTEND_PORT=3000
VITE_API_BASE_URL=http://localhost:8081/api/v1
VITE_REALTIME_SERVER_URL=http://localhost:3001
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_FACEBOOK_CLIENT_ID=your_facebook_client_id
VITE_NODE_ENV=production
EOF

echo "✅ Environment file created"

# Build Docker image
echo "🔨 Building Docker image..."
docker build -t ai-content-frontend:$BUILD_NUMBER -t ai-content-frontend:latest .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
else
    echo "❌ Docker build failed!"
    exit 1
fi

# Test the image
echo "🧪 Testing the built image..."
docker run -d --name test-$BUILD_NUMBER -p 3030:3000 ai-content-frontend:$BUILD_NUMBER

# Wait for container to start
sleep 15

# Health check
if curl -f http://localhost:3030/health > /dev/null 2>&1; then
    echo "✅ Health check passed!"
    TEST_PASSED=true
else
    echo "❌ Health check failed!"
    echo "📋 Container logs:"
    docker logs test-$BUILD_NUMBER
    TEST_PASSED=false
fi

# Cleanup test container
docker stop test-$BUILD_NUMBER > /dev/null 2>&1 || true
docker rm test-$BUILD_NUMBER > /dev/null 2>&1 || true

if [ "$TEST_PASSED" = false ]; then
    echo "❌ Tests failed, aborting deployment"
    exit 1
fi

# Deploy to production
echo "🚀 Deploying to production..."

# Stop existing containers
docker-compose -f docker-compose.yml down > /dev/null 2>&1 || echo "No existing containers to stop"

# Start new containers
docker-compose -f docker-compose.yml up -d

if [ $? -eq 0 ]; then
    echo "✅ Deployment started successfully!"
else
    echo "❌ Deployment failed!"
    exit 1
fi

# Wait for deployment
echo "⏳ Waiting for services to be ready..."
sleep 20

# Verify deployment
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Production deployment verified!"
    echo "🌐 Frontend is available at: http://localhost:3000"
else
    echo "❌ Production deployment verification failed!"
    echo "📋 Checking logs..."
    docker-compose -f docker-compose.yml logs frontend
    exit 1
fi

# Cleanup old images (keep last 5)
echo "🧹 Cleaning up old images..."
OLD_IMAGES=$(docker images ai-content-frontend --format "table {{.Repository}}:{{.Tag}}" | grep -v "latest" | tail -n +6 | awk '{print $1":"$2}')
if [ ! -z "$OLD_IMAGES" ]; then
    echo "$OLD_IMAGES" | xargs docker rmi > /dev/null 2>&1 || true
    echo "✅ Old images cleaned up"
else
    echo "ℹ️  No old images to clean up"
fi

echo ""
echo "🎉 Build and deployment completed successfully!"
echo "📦 Image: ai-content-frontend:$BUILD_NUMBER"
echo "🌐 URL: http://localhost:3000"
echo "📊 Status: docker-compose ps"