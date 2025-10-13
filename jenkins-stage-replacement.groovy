stage('Docker Build and Push') {
    steps {
        sh '''
            # Navigate to project directory
            pwd
            cd /root/ai-content-automation-fe/ai-content-automation-fe/frontend
            
            # Pull latest code
            git pull origin main
            ls -la
            
            # Create production environment file
            echo "📋 Creating production environment..."
            cat > .env << 'EOF'
FRONTEND_PORT=3000
VITE_API_BASE_URL=http://localhost:8081/api/v1
VITE_REALTIME_SERVER_URL=http://localhost:3001
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_FACEBOOK_CLIENT_ID=your_facebook_client_id
VITE_NODE_ENV=production
AUTH_SERVICE_PORT=8081
REALTIME_SERVER_PORT=3001
SPRING_PROFILES_ACTIVE=prod
EOF
            
            # Set permissions and build
            chmod +x docker-build.sh
            
            # Build production image
            echo "🔨 Building Docker image..."
            ./docker-build.sh production ${BUILD_NUMBER:-latest}
            
            # Quick test
            echo "🧪 Testing image..."
            docker run -d --name test-build-${BUILD_NUMBER:-latest} -p 3020:3000 ai-content-frontend:${BUILD_NUMBER:-latest}
            sleep 10
            
            # Health check
            if curl -f http://localhost:3020/health; then
                echo "✅ Build test passed"
            else
                echo "❌ Build test failed"
                docker logs test-build-${BUILD_NUMBER:-latest}
                exit 1
            fi
            
            # Cleanup test
            docker stop test-build-${BUILD_NUMBER:-latest}
            docker rm test-build-${BUILD_NUMBER:-latest}
            
            # Tag as latest
            docker tag ai-content-frontend:${BUILD_NUMBER:-latest} ai-content-frontend:latest
            
            echo "🎉 Build completed successfully!"
            echo "📦 Image: ai-content-frontend:${BUILD_NUMBER:-latest}"
        '''
    }
}