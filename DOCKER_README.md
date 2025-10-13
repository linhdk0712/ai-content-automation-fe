# Docker Configuration Guide

## 🚀 Quick Start

### Production Build & Run
```bash
# Build and run frontend only (recommended for production)
docker-compose up -d

# Or build manually for standalone use
./docker-build.sh production
docker run -d -p 3000:3000 --name frontend ai-content-frontend:latest

# Run with backend services (if needed for testing)
docker-compose -f docker-compose.with-backend.yml up -d
```

### Development Mode
```bash
# Run in development mode with hot reload
docker-compose -f docker-compose.yml -f docker-compose.override.yml up
```

## 📁 File Structure

```
frontend/
├── Dockerfile                      # Multi-stage production build
├── docker-compose.yml              # Frontend-only production configuration
├── docker-compose.with-backend.yml # Full stack configuration (optional)
├── docker-compose.override.yml     # Development overrides
├── nginx.conf                      # Nginx config for standalone frontend
├── nginx-with-proxy.conf           # Nginx config with backend proxy
├── env.sh                          # Runtime environment injection
├── docker-build.sh                # Build script with security scanning
├── .dockerignore                   # Optimized build context
├── .env.example                    # Environment template
├── .env.production                 # Production environment template
└── DOCKER_README.md               # This file
```

## 🔧 Configuration

### Production Architecture

The Docker configuration is designed for production environments where:
- **Frontend runs in Docker container** (this configuration)
- **Backend services run independently** on the same server or different servers
- **No internal Docker networking** between frontend and backend

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Frontend Configuration
FRONTEND_PORT=3000
FRONTEND_DOMAIN=yourdomain.com

# API Configuration (point to your backend servers)
VITE_API_BASE_URL=http://your-backend-server:8081/api/v1
VITE_REALTIME_SERVER_URL=http://your-realtime-server:3001

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_FACEBOOK_CLIENT_ID=your_facebook_client_id
```

### Runtime Environment Injection

The `env.sh` script allows changing environment variables without rebuilding:

1. Environment variables are injected at container startup
2. Variables with `VITE_` prefix are replaced in built files
3. Supports dynamic configuration for different environments

## 🏗️ Build Process

### Multi-stage Build
1. **Builder stage**: Install dependencies and build React app
2. **Production stage**: Serve with Nginx, security hardened

### Security Features
- Non-root user execution
- Read-only filesystem
- Security headers in Nginx
- Health checks
- Resource limits

### Performance Optimizations
- Gzip compression
- Static asset caching
- Optimized Nginx configuration
- Layer caching for faster builds

## 🔍 Health Checks

The container includes health checks:
- HTTP endpoint: `http://localhost:3000/health`
- Automatic container restart on failure
- Startup grace period

## 🛡️ Security Best Practices

### Container Security
- Non-root user execution
- Read-only root filesystem
- No new privileges
- Minimal base image (Alpine)

### Nginx Security
- Security headers (CSP, XSS protection, etc.)
- Hidden server tokens
- Request size limits
- Access control for hidden files

## 📊 Monitoring & Logging

### Logging Configuration
- JSON structured logs
- Log rotation (10MB, 3 files)
- Separate access and error logs

### Monitoring
- Health check endpoint
- Nginx status monitoring
- Container resource usage

## 🚀 Deployment

### Production Deployment
```bash
# 1. Configure environment
cp .env.production .env
# Edit .env with your production values

# 2. Build and deploy
docker-compose up -d

# 3. Verify deployment
curl http://localhost:3000/health
```

### Scaling
```bash
# Scale frontend instances
docker-compose up -d --scale frontend=3
```

### Updates
```bash
# Zero-downtime updates
docker-compose pull
docker-compose up -d --no-deps frontend
```

## 🔧 Troubleshooting

### Common Issues

1. **Environment variables not working**
   - Check `env.sh` script execution
   - Verify VITE_ prefix on variables
   - Check container logs: `docker logs ai-content-frontend`

2. **Build failures**
   - Clear Docker cache: `docker system prune -a`
   - Check .dockerignore excludes
   - Verify Node.js version compatibility

3. **Nginx errors**
   - Check nginx.conf syntax
   - Verify file permissions
   - Check upstream service connectivity

### Debug Commands
```bash
# View container logs
docker logs ai-content-frontend -f

# Execute shell in container
docker exec -it ai-content-frontend /bin/bash

# Check nginx configuration
docker exec ai-content-frontend nginx -t

# View environment variables
docker exec ai-content-frontend env | grep VITE_
```

## 📈 Performance Tuning

### Build Optimization
- Use `.dockerignore` to reduce build context
- Enable BuildKit for faster builds
- Use multi-stage builds for smaller images

### Runtime Optimization
- Enable Nginx gzip compression
- Configure proper caching headers
- Use CDN for static assets
- Implement HTTP/2

### Resource Limits
```yaml
# Add to docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
- name: Build and Push Docker Image
  run: |
    ./docker-build.sh production ${{ github.sha }}
    docker tag ai-content-frontend:${{ github.sha }} registry/ai-content-frontend:latest
    docker push registry/ai-content-frontend:latest
```

### Security Scanning
```bash
# Install Trivy for security scanning
# The build script automatically runs security scans if Trivy is available
trivy image ai-content-frontend:latest
```