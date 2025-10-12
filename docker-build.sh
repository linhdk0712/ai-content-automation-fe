#!/bin/bash

# Frontend Docker Build Script
# This script builds and optionally runs the frontend container

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="ai-content-frontend"
CONTAINER_NAME="frontend"
PORT="3000"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f ".env" ]; then
    log_warn ".env file not found. Copying from .env.example"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        log_info "Please update .env file with your configuration"
    else
        log_error ".env.example not found. Please create .env file manually"
        exit 1
    fi
fi

# Build the Docker image
log_info "Building Docker image: $IMAGE_NAME"
docker build -t $IMAGE_NAME .

if [ $? -eq 0 ]; then
    log_info "Docker image built successfully"
else
    log_error "Failed to build Docker image"
    exit 1
fi

# Check if we should run the container
if [ "$1" = "--run" ] || [ "$1" = "-r" ]; then
    log_info "Stopping existing container if running..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
    
    log_info "Starting container: $CONTAINER_NAME"
    docker run -d \
        --name $CONTAINER_NAME \
        -p $PORT:3000 \
        --network ai-content-net \
        $IMAGE_NAME
    
    if [ $? -eq 0 ]; then
        log_info "Container started successfully"
        log_info "Frontend available at: http://localhost:$PORT/app/"
        log_info "To view logs: docker logs -f $CONTAINER_NAME"
    else
        log_error "Failed to start container"
        exit 1
    fi
fi

# Check if we should use docker-compose
if [ "$1" = "--compose" ] || [ "$1" = "-c" ]; then
    log_info "Using docker-compose to start services..."
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        log_info "Services started with docker-compose"
        log_info "Frontend available at: http://localhost:$PORT/app/"
    else
        log_error "Failed to start services with docker-compose"
        exit 1
    fi
fi

log_info "Build completed successfully!"