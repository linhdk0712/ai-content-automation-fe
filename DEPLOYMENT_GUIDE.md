# AI Content Automation - Deployment Guide

## 🚀 Deployment Options

### Option 1: Root Deployment (Quick but not recommended)

```bash
# Direct root deployment
./deploy-as-root.sh

# Or with manual flag
./deploy-production.sh --force-root
```

### Option 2: Dedicated User Deployment (Recommended)

```bash
# 1. Create deployment user (as root)
sudo ./create-deploy-user.sh

# 2. Switch to deployment user
su - deploy

# 3. Clone repository
cd /var/www/ai-content-automation
git clone <your-repo-url> .

# 4. Run deployment
cd frontend
./deploy-production.sh
```

### Option 3: Current User Deployment

```bash
# Run as current user with sudo privileges
./deploy-production.sh
```

## 📋 Prerequisites

- Ubuntu 24.04 LTS
- Root access or sudo privileges
- Git installed
- Internet connection

## 🔧 What the deployment script does:

1. **System Updates** - Updates packages and installs dependencies
2. **Node.js & PM2** - Installs Node.js and PM2 process manager
3. **Project Setup** - Creates directories and sets permissions
4. **Build Process** - Installs dependencies and builds the application
5. **PM2 Configuration** - Sets up process management
6. **Nginx Setup** - Configures reverse proxy and static file serving
7. **Firewall** - Configures UFW firewall rules
8. **Health Checks** - Verifies all services are running

## 🛠️ Management Commands

```bash
# Check status
./manage.sh status

# View logs
./manage.sh logs

# Restart application
./manage.sh restart

# Update application
./manage.sh update

# Build only
./manage.sh build
```

## 🔍 Troubleshooting

### PM2 Issues
```bash
# Check PM2 status
pm2 status

# View PM2 logs
pm2 logs ai-content-frontend

# Restart PM2 process
pm2 restart ai-content-frontend
```

### Nginx Issues
```bash
# Check Nginx status
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t

# View Nginx logs
sudo tail -f /var/log/nginx/ai-content-frontend.*.log
```

### Build Issues
```bash
# Check Node.js version
node --version

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 🔐 Security Recommendations

1. **Use dedicated deployment user** instead of root
2. **Configure SSH keys** instead of password authentication
3. **Enable firewall** (UFW) with minimal required ports
4. **Regular updates** of system packages and dependencies
5. **SSL/TLS certificate** for HTTPS (use Let's Encrypt)

## 📊 Monitoring

- **Application logs**: `/var/log/pm2/ai-content-frontend.log`
- **Nginx logs**: `/var/log/nginx/ai-content-frontend.*.log`
- **System logs**: `journalctl -u nginx -f`

## 🌐 Post-Deployment

1. Update domain in `/etc/nginx/sites-available/ai-content-frontend`
2. Configure SSL certificate
3. Update DNS records
4. Test application functionality
5. Setup monitoring and backups