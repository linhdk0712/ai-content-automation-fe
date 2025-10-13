stage('Docker Build and Push') {
    steps {
        sh '''
            echo "🚀 Starting AI Content Frontend build..."
            
            # Navigate to frontend directory
            cd /root/ai-content-automation-fe/ai-content-automation-fe/frontend
            
            # Make script executable and run
            chmod +x build-and-deploy.sh
            ./build-and-deploy.sh
            
            echo "✅ Build and deployment completed!"
        '''
    }
}