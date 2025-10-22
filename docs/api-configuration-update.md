# API Configuration Update - Port Change

## Overview

The backend authentication service port has been updated from **8081** to **8082** across the entire application stack. This change affects all proxy configurations, environment files, and deployment scripts.

## Changes Made

### Core Configuration Files

#### 1. Vite Configuration (`vite.config.ts`)
- Updated API proxy configuration:
  - Docker target: `http://auth-service:8082`
  - Local target: `http://localhost:8082`
- Added realtime server configuration:
  - Remote target: `http://180.93.138.113:3001`
  - Local target: `http://localhost:3001`

#### 2. Environment Configuration
- **`.env`**: Updated `AUTH_SERVICE_PORT=8082` and added `REALTIME_SERVER_PORT=3001`
- **`env.example`**: Updated all port references and added realtime server configuration
- **`VITE_REALTIME_SERVER_URL`**: Added environment variable for realtime server connection

#### 3. Nginx Configuration
- **`nginx.conf`**: Updated proxy_pass to `http://localhost:8082`
- **`nginx-production.conf`**: Updated proxy_pass to `http://localhost:8082`

#### 4. Docker Configuration
- **`docker-compose.yml`**: Updated `BACKEND_ORIGIN=http://auth-service:8082`
- **`Dockerfile`**: Updated default backend origin to port 8082

#### 5. Deployment Scripts
- **`deploy.sh`**: Updated nginx proxy configuration
- **`rebuild-and-restart.sh`**: Updated proxy configuration
- **`scripts/start-nginx-dev.sh`**: Updated port documentation

#### 6. Package Configuration
- **`package.json`**: Updated production nginx script to use port 8082

## Impact Assessment

### Development Environment
- Local development now expects backend on port 8082
- Realtime server runs on port 3001 (local) or remote server 180.93.138.113:3001
- Docker development uses auth-service:8082 for API calls
- All API calls are proxied through the authentication service
- WebSocket connections for real-time features use the realtime server

### Production Environment
- Production deployments now proxy to localhost:8082
- Docker containers communicate via auth-service:8082
- No breaking changes to frontend API calls (still use `/api` prefix)

### Testing Environment
- All test configurations automatically use the new port
- No changes needed to test files (they use relative API paths)

## Migration Steps

### For Existing Deployments

1. **Update Backend Service**
   ```bash
   # Ensure your backend auth service is running on port 8082
   # Update your backend configuration accordingly
   ```

2. **Redeploy Frontend**
   ```bash
   # Use the deployment script which handles all configurations
   ./deploy.sh
   ```

3. **Verify Configuration**
   ```bash
   # Check that API calls are working
   curl http://your-server/api/health
   
   # Check nginx proxy configuration
   sudo nginx -t
   ```

### For New Deployments

1. **Environment Setup**
   ```bash
   # Copy and update environment file
   cp env.example .env
   # Ensure AUTH_SERVICE_PORT=8082
   ```

2. **Backend Configuration**
   ```bash
   # Ensure your backend auth service starts on port 8082
   # Update your backend's application.properties or equivalent
   ```

3. **Deploy**
   ```bash
   ./deploy.sh
   ```

## Verification Checklist

- [ ] Backend auth service running on port 8082
- [ ] Realtime server running on port 3001 (local) or accessible at 180.93.138.113:3001
- [ ] Frontend development server proxies to localhost:8082 for API calls
- [ ] Frontend connects to realtime server for WebSocket features
- [ ] Docker containers communicate via auth-service:8082
- [ ] Production nginx proxies to localhost:8082
- [ ] API calls return successful responses
- [ ] Authentication flows work correctly
- [ ] Real-time features (WebSocket) connect successfully
- [ ] Live collaboration features work properly
- [ ] Real-time notifications are delivered

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Verify backend is running on port 8082
   - Check firewall rules allow port 8082
   - Ensure no other service is using port 8082

2. **Proxy Errors**
   - Restart nginx: `sudo systemctl restart nginx`
   - Check nginx configuration: `sudo nginx -t`
   - Review nginx error logs: `sudo tail -f /var/log/nginx/error.log`

3. **Docker Issues**
   - Rebuild containers: `docker-compose down && docker-compose up --build`
   - Check container networking: `docker network ls`
   - Verify service discovery: `docker-compose exec frontend ping auth-service`

### Rollback Procedure

If issues occur, you can temporarily rollback by:

1. **Update vite.config.ts**
   ```typescript
   api: {
     dockerTarget: 'http://auth-service:8081',
     localTarget: 'http://localhost:8081'
   }
   ```

2. **Update environment**
   ```bash
   # In .env file
   AUTH_SERVICE_PORT=8081
   ```

3. **Restart services**
   ```bash
   npm run dev  # For development
   ./deploy.sh  # For production
   ```

## Related Documentation

- [Deployment Guide](../DEPLOYMENT_README.md)
- [Environment Configuration](../env.example)
- [Docker Configuration](../docker-compose.yml)
- [Nginx Configuration](../nginx.conf)

## Notes

- This change is backward compatible with existing API endpoints
- Frontend code requires no changes (uses relative `/api` paths)
- All proxy configurations have been updated consistently
- The change affects only the backend service port, not the frontend port (3000)

---

**Last Updated**: October 19, 2025  
**Change Type**: Configuration Update  
**Impact Level**: Medium (requires deployment)