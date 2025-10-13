stage('Docker Build and Push') {
    steps {
        script {
            echo "🚀 Starting Docker build process..."
        }
        
        sh '''
            set -e
            
            echo "📍 Current directory: $(pwd)"
            
            # Navigate to frontend directory
            cd /root/ai-content-automation-fe/ai-content-automation-fe/frontend
            echo "📍 Frontend directory: $(pwd)"
            
            # Pull latest code (already done at root level)
            echo "📥 Code already pulled, listing files..."
            ls -la
            
            # Create production environment file
            echo "📋 Creating production environment file..."
            cat > .env << 'ENVEOF'
# Production Environment Configuration
FRONTEND_PORT=3000
FRONTEND_DOMAIN=localhost

# API Configuration (Backend services running independently)
VITE_API_BASE_URL=http://localhost:8081/api/v1
VITE_REALTIME_SERVER_URL=http://localhost:3001

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
ENVEOF
            
            echo "✅ Environment file created"
            cat .env
            
            # Set executable permissions
            echo "🔧 Setting permissions..."
            chmod +x docker-build.sh || echo "docker-build.sh not found, will use docker commands directly"
            chmod +x deploy.sh || echo "deploy.sh not found"
            
            # Build production image
            echo "🔨 Building Docker image..."
            BUILD_TAG=${BUILD_NUMBER:-latest}
            
            if [ -f "docker-build.sh" ]; then
                echo "Using docker-build.sh script..."
                ./docker-build.sh production $BUILD_TAG
            else
                echo "Building directly with docker..."
                docker build -t ai-content-frontend:$BUILD_TAG .
                docker tag ai-content-frontend:$BUILD_TAG ai-content-frontend:latest
            fi
            
            echo "✅ Docker image built: ai-content-frontend:$BUILD_TAG"
            
            # Test the built image
            echo "🧪 Testing the built image..."
            TEST_PORT=3020
            docker run -d --name test-build-$BUILD_TAG -p $TEST_PORT:3000 ai-content-frontend:$BUILD_TAG
            
            # Wait for container to start
            echo "⏳ Waiting for container to start..."
            sleep 15
            
            # Health check
            echo "🔍 Performing health check..."
            if curl -f http://localhost:$TEST_PORT/health; then
                echo "✅ Health check passed"
            else
                echo "❌ Health check failed, checking logs..."
                docker logs test-build-$BUILD_TAG
                docker stop test-build-$BUILD_TAG || true
                docker rm test-build-$BUILD_TAG || true
                exit 1
            fi
            
            # Test main page
            echo "🔍 Testing main page..."
            if curl -s http://localhost:$TEST_PORT/ | grep -q "<!DOCTYPE html>"; then
                echo "✅ Main page test passed"
            else
                echo "❌ Main page test failed"
                docker stop test-build-$BUILD_TAG || true
                docker rm test-build-$BUILD_TAG || true
                exit 1
            fi
            
            # Cleanup test container
            echo "🧹 Cleaning up test container..."
            docker stop test-build-$BUILD_TAG
            docker rm test-build-$BUILD_TAG
            
            # Deploy to production (stop existing and start new)
            echo "🚀 Deploying to production..."
            
            # Stop existing containers
            docker-compose -f docker-compose.yml down || echo "No existing containers to stop"
            
            # Start new container
            docker-compose -f docker-compose.yml up -d
            
            # Wait for deployment
            echo "⏳ Waiting for deployment..."
            sleep 20
            
            # Verify production deployment
            echo "🔍 Verifying production deployment..."
            if curl -f http://localhost:3000/health; then
                echo "✅ Production deployment successful"
                echo "🌐 Frontend available at: http://localhost:3000"
            else
                echo "❌ Production deployment failed, checking logs..."
                docker-compose -f docker-compose.yml logs frontend
                exit 1
            fi
            
            # Cleanup old images (keep last 3)
            echo "🧹 Cleaning up old images..."
            docker images ai-content-frontend --format "table {{.Repository}}:{{.Tag}}" | grep -v "latest" | tail -n +4 | awk '{print $1":"$2}' | xargs -r docker rmi || echo "No old images to remove"
            
            echo "🎉 Build and deployment completed successfully!"
            echo "📦 Image: ai-content-frontend:$BUILD_TAG"
            echo "🌐 URL: http://localhost:3000"
        '''
    }
}