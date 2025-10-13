# Docker Deployment Guide

This guide explains how to deploy the AI Content Automation Frontend using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

## Quick Start

1. **Clone and navigate to the project:**
   ```bash
   cd /Users/linhdk1/Documents/ai-content-automation/frontend
   ```

2. **Copy environment configuration:**
   ```bash
   cp env.example .env
   ```

3. **Update environment variables in `.env`:**
   - Set your Supabase credentials
   - Configure database passwords
   - Update API URLs as needed

4. **Build and start the application:**
   ```bash
   docker-compose up -d
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Traefik Dashboard: http://localhost:8080
   - Backend API: http://localhost:8081

## Docker Configuration

### Dockerfile Features

- **Multi-stage build**: Optimized for production with minimal image size
- **Security**: Runs as non-root user (nginx:nginx)
- **Health checks**: Built-in health monitoring
- **Caching**: Optimized layer caching for faster builds
- **Environment variables**: Configurable build-time variables

### Docker Compose Services

- **frontend**: React/Vite application with Nginx
- **backend**: Node.js API service (placeholder)
- **database**: PostgreSQL database
- **redis**: Redis cache and session store
- **traefik**: Reverse proxy with automatic service discovery

## Environment Variables

### Required Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Database
POSTGRES_PASSWORD=secure-password

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
```

### Optional Variables

```bash
# API Configuration
VITE_API_URL=http://backend:8081

# Database
POSTGRES_USER=ai_content_user
POSTGRES_DB=ai_content_automation

# Docker
COMPOSE_PROJECT_NAME=ai-content-automation
```

## Commands

### Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f frontend

# Rebuild frontend
docker-compose build frontend

# Restart services
docker-compose restart
```

### Production

```bash
# Build production images
docker-compose build --no-cache

# Start with production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale services
docker-compose up -d --scale frontend=3
```

### Maintenance

```bash
# Stop all services
docker-compose down

# Remove volumes (⚠️ Data loss)
docker-compose down -v

# Clean up unused images
docker system prune -a

# Update services
docker-compose pull
docker-compose up -d
```

## Health Checks

All services include health checks:

- **Frontend**: `curl -f http://localhost:3000/health`
- **Backend**: `curl -f http://localhost:8081/health`
- **Database**: `pg_isready`
- **Redis**: `redis-cli ping`

## Monitoring

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 frontend
```

### Metrics

Access Traefik dashboard at http://localhost:8080 for:
- Service discovery
- Load balancing
- Health monitoring
- Request metrics

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check port usage
   lsof -i :3000
   
   # Change ports in docker-compose.yml
   ports:
     - "3001:3000"  # Use port 3001 instead
   ```

2. **Permission issues:**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

3. **Build failures:**
   ```bash
   # Clean build
   docker-compose build --no-cache frontend
   
   # Check build logs
   docker-compose build frontend
   ```

4. **Database connection issues:**
   ```bash
   # Check database status
   docker-compose exec database pg_isready
   
   # View database logs
   docker-compose logs database
   ```

### Performance Optimization

1. **Enable build cache:**
   ```bash
   # Use BuildKit for faster builds
   export DOCKER_BUILDKIT=1
   ```

2. **Optimize images:**
   ```bash
   # Multi-stage builds are already configured
   # Use .dockerignore to exclude unnecessary files
   ```

3. **Resource limits:**
   ```yaml
   # Add to docker-compose.yml
   deploy:
     resources:
       limits:
         memory: 512M
         cpus: '0.5'
   ```

## Security Considerations

1. **Environment variables**: Never commit `.env` files
2. **Non-root user**: Services run as non-root
3. **Security headers**: Nginx includes security headers
4. **Network isolation**: Services use isolated network
5. **Resource limits**: Configure memory and CPU limits

## Backup and Recovery

### Database Backup

```bash
# Create backup
docker-compose exec database pg_dump -U ai_content_user ai_content_automation > backup.sql

# Restore backup
docker-compose exec -T database psql -U ai_content_user ai_content_automation < backup.sql
```

### Volume Backup

```bash
# Backup volumes
docker run --rm -v ai-content-automation_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .

# Restore volumes
docker run --rm -v ai-content-automation_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /data
```

## Scaling

### Horizontal Scaling

```bash
# Scale frontend instances
docker-compose up -d --scale frontend=3

# Load balancer automatically distributes traffic
```

### Vertical Scaling

```yaml
# Update docker-compose.yml
services:
  frontend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
```

## Production Deployment

For production deployment:

1. **Use external database**: Replace containerized database with managed service
2. **Enable HTTPS**: Configure SSL certificates with Traefik
3. **Set up monitoring**: Add Prometheus, Grafana, or similar
4. **Configure backups**: Set up automated database backups
5. **Security scanning**: Regular vulnerability scans
6. **Resource monitoring**: Monitor CPU, memory, and disk usage

## Support

For issues and questions:
- Check logs: `docker-compose logs -f`
- Review configuration files
- Consult Docker documentation
- Check service health: `docker-compose ps`
