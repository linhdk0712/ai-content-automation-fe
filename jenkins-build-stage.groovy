// Simplified Jenkins stage for Docker build and push
stage('Docker Build and Push') {
    steps {
        script {
            echo "🚀 Building and pushing AI Content Frontend Docker image"
        }
        
        sh '''
            # Navigate to project directory
            pwd
            cd /root/ai-content-automation-fe/ai-content-automation-fe/frontend
            
            # Pull latest code
            git pull origin main
            ls -la
            
            # Create production environment file
            cat > .env << EOF
# Production Environment Configuration
FRONTEND_PORT=3000
FRONTEND_DOMAIN=${FRONTEND_DOMAIN:-yourdomain.com}

# API Configuration
VITE_API_BASE_URL=/api/v1
VITE_REALTIME_SERVER_URL=/socket.io

# Supabase Configuration (Production)
VITE_SUPABASE_URL=${VITE_SUPABASE_URL:-https://your-project.supabase.co}
VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY:-your-supabase-anon-key}

# OAuth Configuration (Production)
VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID:-your_google_client_id}
VITE_FACEBOOK_CLIENT_ID=${VITE_FACEBOOK_CLIENT_ID:-your_facebook_client_id}

# Environment
VITE_NODE_ENV=production

# Backend Services Configuration
AUTH_SERVICE_PORT=8081
REALTIME_SERVER_PORT=3001
SPRING_PROFILES_ACTIVE=prod
EOF
            
            # Cấp quyền thực thi cho script
            chmod +x docker-build.sh
            chmod +x deploy.sh
            
            # Build production image with backend proxy support
            echo "🔨 Building Docker image..."
            ./docker-build.sh production ${BUILD_NUMBER:-latest} true
            
            # Tag image for registry (if using registry)
            if [ ! -z "${DOCKER_REGISTRY}" ]; then
                echo "🏷️  Tagging image for registry..."
                docker tag ai-content-frontend:${BUILD_NUMBER:-latest} ${DOCKER_REGISTRY}/ai-content-frontend:${BUILD_NUMBER:-latest}
                docker tag ai-content-frontend:${BUILD_NUMBER:-latest} ${DOCKER_REGISTRY}/ai-content-frontend:latest
                
                # Push to registry (uncomment if needed)
                # echo "📤 Pushing to registry..."
                # docker push ${DOCKER_REGISTRY}/ai-content-frontend:${BUILD_NUMBER:-latest}
                # docker push ${DOCKER_REGISTRY}/ai-content-frontend:latest
            fi
            
            # Test the built image
            echo "🧪 Testing the built image..."
            docker run -d --name test-frontend-build -p 3005:3000 ai-content-frontend:${BUILD_NUMBER:-latest}
            
            # Wait for container to start
            sleep 10
            
            # Health check
            if curl -f http://localhost:3005/health; then
                echo "✅ Image test passed"
            else
                echo "❌ Image test failed"
                docker logs test-frontend-build
                docker stop test-frontend-build
                docker rm test-frontend-build
                exit 1
            fi
            
            # Cleanup test container
            docker stop test-frontend-build
            docker rm test-frontend-build
            
            # Deploy to production (if on main branch)
            if [ "${GIT_BRANCH}" = "origin/main" ] || [ "${BRANCH_NAME}" = "main" ]; then
                echo "🚀 Deploying to production..."
                
                # Stop existing containers
                docker-compose -f docker-compose.yml down || true
                
                # Update image in docker-compose (if using registry)
                if [ ! -z "${DOCKER_REGISTRY}" ]; then
                    # Use registry image
                    export FRONTEND_IMAGE="${DOCKER_REGISTRY}/ai-content-frontend:${BUILD_NUMBER:-latest}"
                else
                    # Use local image
                    export FRONTEND_IMAGE="ai-content-frontend:${BUILD_NUMBER:-latest}"
                fi
                
                # Start production services
                docker-compose -f docker-compose.yml up -d
                
                # Wait for services to be ready
                sleep 20
                
                # Verify production deployment
                if curl -f http://localhost:3000/health; then
                    echo "✅ Production deployment successful"
                    echo "🌐 Frontend available at: http://localhost:3000"
                else
                    echo "❌ Production deployment failed"
                    docker-compose -f docker-compose.yml logs frontend
                    exit 1
                fi
            else
                echo "ℹ️  Skipping deployment (not main branch)"
            fi
            
            # Cleanup old images (keep last 3)
            echo "🧹 Cleaning up old images..."
            docker images ai-content-frontend --format "table {{.Repository}}:{{.Tag}}" | tail -n +4 | xargs -r docker rmi || true
            
            echo "🎉 Build and deployment completed successfully!"
        '''
    }
}