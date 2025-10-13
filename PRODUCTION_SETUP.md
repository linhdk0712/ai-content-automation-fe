# Production Setup Guide

## 🎯 Overview

Cấu hình Docker này được thiết kế cho môi trường production thực tế, nơi:
- **Frontend chạy trong Docker container** (cấu hình này)
- **Backend services chạy độc lập** trên cùng server hoặc server khác
- **Không có Docker networking nội bộ** giữa frontend và backend

## 📁 File Structure

```
frontend/
├── docker-compose.yml              # Frontend-only (PRODUCTION)
├── docker-compose.with-backend.yml # Full stack (TESTING)
├── docker-compose.override.yml     # Development overrides
├── nginx.conf                      # Standalone frontend config
├── nginx-with-proxy.conf           # With backend proxy config
└── ...
```

## 🚀 Production Deployment

### 1. Cấu hình Environment

```bash
# Copy và chỉnh sửa file environment
cp .env.production .env

# Cập nhật với thông tin backend servers thực tế
vim .env
```

**Ví dụ .env cho production:**
```bash
# Frontend Configuration
FRONTEND_PORT=3000
FRONTEND_DOMAIN=yourdomain.com

# Backend Services (running independently)
VITE_API_BASE_URL=http://your-backend-server:8081/api/v1
VITE_REALTIME_SERVER_URL=http://your-realtime-server:3001

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-key

# OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_production_google_client_id
VITE_FACEBOOK_CLIENT_ID=your_production_facebook_client_id

VITE_NODE_ENV=production
```

### 2. Build và Deploy

```bash
# Build production image
./docker-build.sh production

# Deploy frontend only
docker-compose -f docker-compose.yml up -d

# Hoặc sử dụng deploy script
./deploy.sh production
```

### 3. Verify Deployment

```bash
# Health check
curl http://localhost:3000/health

# Check logs
docker-compose logs frontend

# Check container status
docker ps
```

## 🔧 Jenkins Integration

### Simple Jenkins Stage

```groovy
stage('Docker Build and Deploy') {
    steps {
        sh '''
            cd /root/ai-content-automation-fe/ai-content-automation-fe/frontend
            git pull origin main
            
            # Create production environment
            cat > .env << 'EOF'
VITE_API_BASE_URL=http://localhost:8081/api/v1
VITE_REALTIME_SERVER_URL=http://localhost:3001
VITE_NODE_ENV=production
# Add other production variables here
EOF
            
            # Build and deploy
            chmod +x docker-build.sh
            ./docker-build.sh production ${BUILD_NUMBER:-latest}
            
            # Deploy
            docker-compose -f docker-compose.yml down || true
            docker-compose -f docker-compose.yml up -d
            
            # Health check
            sleep 15
            curl -f http://localhost:3000/health
        '''
    }
}
```

## 🔄 Different Deployment Scenarios

### Scenario 1: Frontend Only (Recommended)
```bash
# Backend services running independently
docker-compose -f docker-compose.yml up -d
```

### Scenario 2: Full Stack Testing
```bash
# All services in Docker (for testing)
docker-compose -f docker-compose.with-backend.yml up -d
```

### Scenario 3: Development
```bash
# Development with hot reload
docker-compose up  # Uses override file automatically
```

## 🛡️ Security Considerations

### Container Security
- ✅ Non-root user execution
- ✅ Read-only filesystem
- ✅ No new privileges
- ✅ Minimal base image (Alpine)

### Network Security
- ✅ No internal Docker networking dependencies
- ✅ External backend communication via HTTP/HTTPS
- ✅ Security headers in Nginx
- ✅ CSP (Content Security Policy)

## 📊 Monitoring

### Health Checks
```bash
# Container health
docker ps
docker-compose ps

# Application health
curl http://localhost:3000/health

# Logs
docker-compose logs -f frontend
```

### Metrics
- Container resource usage
- Nginx access/error logs
- Application performance metrics

## 🔧 Troubleshooting

### Common Issues

1. **Backend Connection Failed**
   ```bash
   # Check backend services are running
   curl http://your-backend-server:8081/health
   
   # Check environment variables
   docker exec ai-content-frontend env | grep VITE_
   ```

2. **Container Won't Start**
   ```bash
   # Check logs
   docker logs ai-content-frontend
   
   # Check nginx config
   docker exec ai-content-frontend nginx -t
   ```

3. **Environment Variables Not Applied**
   ```bash
   # Check env.sh execution
   docker exec ai-content-frontend cat /usr/share/nginx/html/env.sh
   
   # Manual environment injection
   docker exec ai-content-frontend /usr/share/nginx/html/env.sh
   ```

## 🚀 Scaling

### Horizontal Scaling
```bash
# Scale frontend instances
docker-compose -f docker-compose.yml up -d --scale frontend=3

# Use load balancer (nginx, traefik, etc.)
```

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

## 📝 Maintenance

### Updates
```bash
# Zero-downtime updates
docker-compose pull
docker-compose up -d --no-deps frontend
```

### Cleanup
```bash
# Remove old images
docker image prune -a

# Remove unused volumes
docker volume prune
```

### Backup
```bash
# Backup configuration
tar -czf frontend-config-$(date +%Y%m%d).tar.gz \
  docker-compose.yml .env nginx.conf
```