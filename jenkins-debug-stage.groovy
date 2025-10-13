stage('Debug Environment') {
    steps {
        sh '''
            echo "🔍 Debugging Jenkins environment..."
            
            # Basic environment info
            echo "📍 Current directory: $(pwd)"
            echo "👤 Current user: $(whoami)"
            echo "🐳 Docker version: $(docker --version)"
            
            # Check if frontend directory exists
            if [ -d "/root/ai-content-automation-fe/ai-content-automation-fe/frontend" ]; then
                echo "✅ Frontend directory found"
                cd /root/ai-content-automation-fe/ai-content-automation-fe/frontend
                
                echo "📁 Frontend directory contents:"
                ls -la
                
                # Check key files
                [ -f "package.json" ] && echo "✅ package.json exists" || echo "❌ package.json missing"
                [ -f "Dockerfile" ] && echo "✅ Dockerfile exists" || echo "❌ Dockerfile missing"
                [ -f "docker-compose.yml" ] && echo "✅ docker-compose.yml exists" || echo "❌ docker-compose.yml missing"
                
            else
                echo "❌ Frontend directory not found at expected path"
                echo "🔍 Searching for frontend directory..."
                find /root -name "frontend" -type d 2>/dev/null | head -3
            fi
        '''
    }
}

stage('Docker Build and Push') {
    steps {
        sh '''
            set -e
            
            echo "🚀 Starting Docker build process..."
            
            # Navigate to frontend directory
            cd /root/ai-content-automation-fe/ai-content-automation-fe/frontend
            
            # Create production environment
            echo "📋 Creating .env file..."
            cat > .env << 'EOF'
VITE_API_BASE_URL=http://localhost:8081/api/v1
VITE_REALTIME_SERVER_URL=http://localhost:3001
VITE_NODE_ENV=production
FRONTEND_PORT=3000
EOF
            
            echo "✅ Environment file created"
            
            # Build Docker image
            echo "🔨 Building Docker image..."
            docker build -t ai-content-frontend:${BUILD_NUMBER:-latest} .
            
            echo "✅ Build completed successfully!"
            echo "📦 Image: ai-content-frontend:${BUILD_NUMBER:-latest}"
            
            # List built images
            docker images | grep ai-content-frontend
        '''
    }
}