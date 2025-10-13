pipeline {
    agent any
    
    environment {
        // Docker registry configuration
        DOCKER_REGISTRY = "${env.DOCKER_REGISTRY ?: 'your-registry.com'}"
        IMAGE_NAME = "ai-content-frontend"
        IMAGE_TAG = "${env.BUILD_NUMBER ?: 'latest'}"
        
        // Application configuration
        NODE_ENV = "production"
        FRONTEND_PORT = "3000"
        
        // Credentials
        DOCKER_CREDENTIALS = credentials('docker-registry-credentials')
        SUPABASE_CREDENTIALS = credentials('supabase-prod-credentials')
        OAUTH_CREDENTIALS = credentials('oauth-prod-credentials')
    }
    
    stages {
        stage('Checkout and Prepare') {
            steps {
                script {
                    echo "🚀 Starting AI Content Frontend deployment pipeline"
                    echo "📋 Build Number: ${BUILD_NUMBER}"
                    echo "🏷️  Image Tag: ${IMAGE_TAG}"
                }
                
                // Checkout code
                sh '''
                    pwd
                    cd /root/ai-content-automation-fe/ai-content-automation-fe
                    git pull origin main
                    ls -la
                '''
                
                // Prepare environment file for production
                sh '''
                    cd /root/ai-content-automation-fe/ai-content-automation-fe/frontend
                    
                    # Create production environment file
                    cat > .env << EOF
# Production Environment Configuration
FRONTEND_PORT=${FRONTEND_PORT}
FRONTEND_DOMAIN=${FRONTEND_DOMAIN:-yourdomain.com}

# API Configuration
VITE_API_BASE_URL=/api/v1
VITE_REALTIME_SERVER_URL=/socket.io

# Supabase Configuration (Production)
VITE_SUPABASE_URL=${SUPABASE_CREDENTIALS_USR}
VITE_SUPABASE_ANON_KEY=${SUPABASE_CREDENTIALS_PSW}

# OAuth Configuration (Production)
VITE_GOOGLE_CLIENT_ID=${OAUTH_CREDENTIALS_USR}
VITE_FACEBOOK_CLIENT_ID=${OAUTH_CREDENTIALS_PSW}

# Environment
VITE_NODE_ENV=production

# Backend Services Configuration
AUTH_SERVICE_PORT=8081
REALTIME_SERVER_PORT=3001
SPRING_PROFILES_ACTIVE=prod
EOF
                    
                    echo "✅ Environment file created"
                '''
            }
        }
        
        stage('Security Scan') {
            steps {
                script {
                    echo "🔍 Running security scans..."
                }
                
                sh '''
                    cd /root/ai-content-automation-fe/ai-content-automation-fe/frontend
                    
                    # Audit npm dependencies
                    npm audit --audit-level moderate || echo "⚠️ npm audit found issues"
                    
                    # Check for secrets in code (if you have tools like truffleHog)
                    # truffleHog --regex --entropy=False . || echo "⚠️ Secret scan completed"
                '''
            }
        }
        
        stage('Docker Build and Test') {
            steps {
                script {
                    echo "🔨 Building Docker image..."
                }
                
                sh '''
                    cd /root/ai-content-automation-fe/ai-content-automation-fe/frontend
                    
                    # Cấp quyền thực thi cho script
                    chmod +x docker-build.sh
                    chmod +x deploy.sh
                    
                    # Build production image with proxy support
                    ./docker-build.sh production ${IMAGE_TAG} true
                    
                    # Tag image for registry
                    docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
                    docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
                    
                    echo "✅ Docker image built successfully"
                '''
            }
        }
        
        stage('Image Security Scan') {
            steps {
                script {
                    echo "🛡️ Scanning Docker image for vulnerabilities..."
                }
                
                sh '''
                    cd /root/ai-content-automation-fe/ai-content-automation-fe/frontend
                    
                    # Run Trivy security scan if available
                    if command -v trivy &> /dev/null; then
                        echo "🔍 Running Trivy security scan..."
                        trivy image --exit-code 0 --severity HIGH,CRITICAL ${IMAGE_NAME}:${IMAGE_TAG}
                    else
                        echo "⚠️ Trivy not found, skipping security scan"
                    fi
                    
                    # Run Docker Scout if available
                    if command -v docker &> /dev/null && docker scout version &> /dev/null; then
                        echo "🔍 Running Docker Scout scan..."
                        docker scout cves ${IMAGE_NAME}:${IMAGE_TAG} || echo "⚠️ Docker Scout scan completed with warnings"
                    fi
                '''
            }
        }
        
        stage('Integration Test') {
            steps {
                script {
                    echo "🧪 Running integration tests..."
                }
                
                sh '''
                    cd /root/ai-content-automation-fe/ai-content-automation-fe/frontend
                    
                    # Start container for testing
                    docker run -d --name test-frontend-${BUILD_NUMBER} -p 3010:3000 ${IMAGE_NAME}:${IMAGE_TAG}
                    
                    # Wait for container to be ready
                    sleep 15
                    
                    # Health check
                    if curl -f http://localhost:3010/health; then
                        echo "✅ Health check passed"
                    else
                        echo "❌ Health check failed"
                        docker logs test-frontend-${BUILD_NUMBER}
                        exit 1
                    fi
                    
                    # Basic functionality test
                    if curl -f http://localhost:3010/ | grep -q "<!DOCTYPE html>"; then
                        echo "✅ Frontend serving HTML correctly"
                    else
                        echo "❌ Frontend not serving HTML"
                        exit 1
                    fi
                    
                    # Cleanup test container
                    docker stop test-frontend-${BUILD_NUMBER}
                    docker rm test-frontend-${BUILD_NUMBER}
                    
                    echo "✅ Integration tests passed"
                '''
            }
        }
        
        stage('Push to Registry') {
            steps {
                script {
                    echo "📤 Pushing image to registry..."
                }
                
                sh '''
                    # Login to Docker registry
                    echo "${DOCKER_CREDENTIALS_PSW}" | docker login ${DOCKER_REGISTRY} -u "${DOCKER_CREDENTIALS_USR}" --password-stdin
                    
                    # Push images
                    docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
                    docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
                    
                    echo "✅ Images pushed successfully"
                    echo "📦 Image: ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
                '''
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo "🚀 Deploying to production environment..."
                }
                
                sh '''
                    cd /root/ai-content-automation-fe/ai-content-automation-fe/frontend
                    
                    # Update docker-compose to use registry image
                    sed -i "s|build:|# build:|g" docker-compose.yml
                    sed -i "s|context: .|# context: .|g" docker-compose.yml
                    sed -i "s|dockerfile: Dockerfile|# dockerfile: Dockerfile|g" docker-compose.yml
                    sed -i "s|target: production|# target: production|g" docker-compose.yml
                    sed -i "s|args:|# args:|g" docker-compose.yml
                    sed -i "s|- NODE_ENV=production|# - NODE_ENV=production|g" docker-compose.yml
                    
                    # Add image reference
                    sed -i "/container_name: ai-content-frontend/i\\    image: ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}" docker-compose.yml
                    
                    # Deploy with production configuration
                    docker-compose -f docker-compose.yml down || true
                    docker-compose -f docker-compose.yml pull
                    docker-compose -f docker-compose.yml up -d
                    
                    # Wait for deployment
                    sleep 30
                    
                    # Verify deployment
                    if curl -f http://localhost:${FRONTEND_PORT}/health; then
                        echo "✅ Production deployment successful"
                        echo "🌐 Frontend available at: http://localhost:${FRONTEND_PORT}"
                    else
                        echo "❌ Production deployment failed"
                        docker-compose -f docker-compose.yml logs frontend
                        exit 1
                    fi
                '''
            }
        }
        
        stage('Cleanup') {
            steps {
                script {
                    echo "🧹 Cleaning up..."
                }
                
                sh '''
                    # Remove old images (keep last 3 builds)
                    docker images ${IMAGE_NAME} --format "table {{.Repository}}:{{.Tag}}" | tail -n +4 | xargs -r docker rmi || true
                    
                    # Clean up dangling images
                    docker image prune -f
                    
                    # Logout from registry
                    docker logout ${DOCKER_REGISTRY}
                    
                    echo "✅ Cleanup completed"
                '''
            }
        }
    }
    
    post {
        always {
            script {
                echo "📊 Pipeline execution completed"
            }
            
            // Clean up test containers if they exist
            sh '''
                docker stop test-frontend-${BUILD_NUMBER} 2>/dev/null || true
                docker rm test-frontend-${BUILD_NUMBER} 2>/dev/null || true
            '''
        }
        
        success {
            script {
                echo "🎉 Pipeline completed successfully!"
                echo "📦 Image: ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
                echo "🌐 Frontend URL: http://localhost:${FRONTEND_PORT}"
            }
            
            // Send success notification (if you have notification setup)
            // slackSend(color: 'good', message: "✅ Frontend deployment successful: ${IMAGE_TAG}")
        }
        
        failure {
            script {
                echo "❌ Pipeline failed!"
            }
            
            // Send failure notification
            // slackSend(color: 'danger', message: "❌ Frontend deployment failed: ${BUILD_URL}")
            
            // Collect logs for debugging
            sh '''
                echo "📋 Collecting logs for debugging..."
                docker-compose -f /root/ai-content-automation-fe/ai-content-automation-fe/frontend/docker-compose.yml logs > deployment-logs.txt || true
            '''
            
            // Archive logs
            archiveArtifacts artifacts: 'deployment-logs.txt', allowEmptyArchive: true
        }
    }
}