# AI Content Automation - Deployment Guide

## 🚀 Quick Start

```bash
# Clean deployment (recommended)
./deploy.sh

# Clean deployment as root (if necessary)
./deploy.sh --force-root
```

## 🧹 Clean Deployment Process

**By default, the script performs a CLEAN DEPLOYMENT:**

1. **🛑 Stop Services** - Stops existing PM2 and cleans processes
2. **🗑️ Remove Artifacts** - Deletes old build files and node_modules
3. **🔄 Reset Git** - Stashes changes and resets to clean state
4. **📦 Fresh Install** - Clean npm install of dependencies
5. **🔨 Fresh Build** - New build with latest code
6. **🚀 Restart Services** - Start PM2 and Nginx with new deployment

## 📋 Features

✅ **Clean Deployment** - Ensures no conflicts with old code  
✅ **Idempotent** - Can be run multiple times safely  
✅ **Auto-recovery** - Fixes common issues automatically  
✅ **Comprehensive** - Handles all deployment aspects  
✅ **Flexible** - Supports various deployment scenarios  

## 🛠️ Usage Options

```bash
./deploy.sh                    # Full clean deployment
./deploy.sh --force-root       # Clean deployment as root (not recommended)
./deploy.sh --skip-cleanup     # Deploy without cleaning existing
./deploy.sh --skip-git         # Skip Git repository update
./deploy.sh --skip-build       # Skip npm build process
./deploy.sh --skip-pm2         # Skip PM2 setup
./deploy.sh --skip-nginx       # Skip Nginx setup
./deploy.sh --help             # Show detailed help
```

## 🔧 What It Does

**Phase 1: Cleanup**
1. **Stop Services** - Gracefully stops existing PM2 processes
2. **Clean Artifacts** - Removes old dist/, node_modules/, package-lock.json
3. **Reset Git** - Stashes changes and resets to clean state
4. **Clear Cache** - Cleans npm cache and PM2 logs

**Phase 2: System Setup**
5. **Install Packages** - Ensures nginx, nodejs, npm, pm2 are installed
6. **Setup Directories** - Creates log directories with proper permissions

**Phase 3: Application Setup**
7. **Git Update** - Pulls latest code, fixes SSH/HTTPS issues
8. **Fresh Install** - Clean npm install of all dependencies
9. **Fresh Build** - New build with latest code and dependencies

**Phase 4: Service Setup**
10. **PM2 Configuration** - Generates and starts new PM2 process
11. **Nginx Setup** - Configures reverse proxy and static file serving
12. **Firewall Rules** - Sets up basic security rules

**Phase 5: Verification**
13. **Service Testing** - Tests all services and provides status report

## 🌐 Access Points

After successful deployment:
- **Main Application**: `http://your-server-ip`
- **Direct PM2**: `http://your-server-ip:4173`

## 📝 Management Commands

```bash
# Check status
pm2 status
sudo systemctl status nginx

# View logs
pm2 logs ai-content-frontend
sudo tail -f /var/log/nginx/ai-content-frontend.*.log

# Restart services
pm2 restart ai-content-frontend
sudo systemctl restart nginx

# Re-deploy (safe to run multiple times)
./deploy.sh
```

## 🔒 Security Notes

- **Avoid root deployment** - Create a dedicated user instead
- **Use SSH keys** - More secure than passwords
- **Keep dependencies updated** - Run `npm audit` regularly
- **Monitor logs** - Check for suspicious activity

## 🆘 Troubleshooting

### PM2 Issues
```bash
pm2 logs ai-content-frontend  # Check logs
pm2 restart ai-content-frontend  # Restart process
```

### Nginx Issues
```bash
sudo nginx -t  # Test configuration
sudo systemctl status nginx  # Check status
```

### Build Issues
```bash
npm cache clean --force  # Clear cache
rm -rf node_modules package-lock.json  # Clean install
npm install
```

### Git Issues
```bash
# Fix SSH permissions
chmod 600 ~/.ssh/id_rsa
chmod 700 ~/.ssh

# Switch to HTTPS
git remote set-url origin https://github.com/username/repo.git
```

## 🧹 Cleanup Old Scripts

If you have old deployment scripts, clean them up:

```bash
./cleanup-old-scripts.sh
```

This removes all old deployment scripts and keeps only the unified `deploy.sh`.

---

**Note**: This script replaces all previous deployment scripts and provides a single, reliable deployment solution.