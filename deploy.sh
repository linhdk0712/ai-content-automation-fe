#!/bin/bash

# Simple deployment script
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}

echo "🚀 Deploying AI Content Frontend - $ENVIRONMENT environment"

# Load environment variables
if [ -f ".env.${ENVIRONMENT}" ]; then
    echo "📋 Loading environment from .env.${ENVIRONMENT}"
    cp .env.${ENVIRONMENT} .env
elif [ ! -f ".env" ]; then
    echo "⚠️  No .env file found, copying from .env.example"
    cp .env.example .env
    echo "❗ Please edit .env with your configuration before running again"
    exit 1
fi

# Build and deploy based on environment
if [ "$ENVIRONMENT" = "development" ]; then
    echo "🔧 Starting development environment..."
    docker-compose up --build
elif [ "$ENVIRONMENT" = "production" ]; then
    echo "🏭 Deploying production environment..."
    
    # Build production image
    echo "🔨 Building production image..."
    docker-compose -f docker-compose.yml build
    
    # Deploy with production config only
    echo "🚀 Starting production services..."
    docker-compose -f docker-compose.yml up -d
    
    # Wait for services to be ready
    echo "⏳ Waiting for services to be ready..."
    sleep 10
    
    # Health check
    echo "🔍 Performing health check..."
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ Frontend is healthy!"
    else
        echo "❌ Frontend health check failed!"
        echo "📋 Checking logs..."
        docker-compose -f docker-compose.yml logs frontend
        exit 1
    fi
    
    echo "🎉 Deployment completed successfully!"
    echo "🌐 Frontend available at: http://localhost:3000"
    
else
    echo "❌ Unknown environment: $ENVIRONMENT"
    echo "Usage: ./deploy.sh [development|production]"
    exit 1
fi