stage('Docker Build and Push') {
    steps {
        sh '''
            set -e
            echo "🚀 Starting Docker build for AI Content Frontend..."
            
            # Navigate to frontend directory
            cd /root/ai-content-automation-fe/ai-content-automation-fe/frontend
            pwd
            ls -la
            
            # Create production environment
            echo "📋 Creating production environment..."
            cat > .env << 'EOF'
VITE_API_BASE_URL=http://localhost:8081/api/v1
VITE_REALTIME_SERVER_URL=http://localhost:3001
VITE_NODE_ENV=production
FRONTEND_PORT=3000
EOF
            
            echo "✅ Environment file created:"
            cat .env
            
            # Build Docker image
            echo "🔨 Building Docker image..."
            docker build -t ai-content-frontend:${BUILD_NUMBER} -t ai-content-frontend:latest .
            
            echo "✅ Docker image built successfully!"
            docker images | grep ai-content-frontend
            
            # Quick test
            echo "🧪 Quick test of the image..."
            docker run -d --name quick-test-${BUILD_NUMBER} -p 3025:3000 ai-content-frontend:${BUILD_NUMBER}
            sleep 10
            
            if curl -f http://localhost:3025/health; then
                echo "✅ Quick test passed!"
            else
                echo "❌ Quick test failed!"
                docker logs quick-test-${BUILD_NUMBER}
            fi
            
            # Cleanup
            docker stop quick-test-${BUILD_NUMBER} || true
            docker rm quick-test-${BUILD_NUMBER} || true
            
            echo "🎉 Build completed!"
            echo "📦 Built image: ai-content-frontend:${BUILD_NUMBER}"
        '''
    }
}