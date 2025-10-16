#!/bin/bash

# Production deployment script for AI Content Automation Frontend
# Run this script on your VPS Ubuntu 24

set -e  # Exit on any error

echo "🚀 Starting AI Content Automation Frontend Deployment..."

# Configuration
PROJECT_DIR="/var/www/ai-content-automation"
FRONTEND_DIR="$PROJECT_DIR/frontend"
NGINX_SITE="ai-content-frontend"
PM2_APP="ai-content-frontend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
    print_warning "Running as root. Consider using a non-root user with sudo privileges."
fi

# 1. Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install required packages
print_status "Installing required packages..."
sudo apt install -y nginx nodejs npm git curl

# 3. Install PM2 globally
print_status "Installing PM2..."
sudo npm install -g pm2

# 4. Create project directory
print_status "Setting up project directory..."
sudo mkdir -p $PROJECT_DIR
sudo chown -R $USER:$USER $PROJECT_DIR

# 5. Navigate to project directory
cd $PROJECT_DIR

# 6. Clone or update repository (adjust as needed)
if [ -d ".git" ]; then
    print_status "Updating existing repository..."
    git pull origin main
else
    print_status "Repository should be cloned manually or via CI/CD"
    print_warning "Make sure your code is in $PROJECT_DIR"
fi

# 7. Install dependencies and build
print_status "Installing dependencies..."
cd $FRONTEND_DIR
npm install --production=false

print_status "Building application..."
npm run build

# 8. Setup PM2
print_status "Setting up PM2..."
# Create PM2 log directory
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# Stop existing PM2 process if running
pm2 stop $PM2_APP 2>/dev/null || true
pm2 delete $PM2_APP 2>/dev/null || true

# Start new PM2 process
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# 9. Setup Nginx
print_status "Setting up Nginx..."
# Copy nginx configuration
sudo cp nginx-production.conf /etc/nginx/sites-available/$NGINX_SITE

# Enable site
sudo ln -sf /etc/nginx/sites-available/$NGINX_SITE /etc/nginx/sites-enabled/

# Remove default nginx site
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# 10. Setup firewall (if ufw is available)
if command -v ufw &> /dev/null; then
    print_status "Configuring firewall..."
    sudo ufw allow 'Nginx Full'
    sudo ufw allow ssh
    sudo ufw --force enable
fi

# 11. Final status check
print_status "Checking services status..."
echo "Nginx status:"
sudo systemctl status nginx --no-pager -l

echo "PM2 status:"
pm2 status

print_status "✅ Deployment completed successfully!"
print_status "🌐 Your application should be available at: http://your-server-ip"
print_status "📝 Nginx logs: /var/log/nginx/ai-content-frontend.*.log"
print_status "📝 PM2 logs: pm2 logs $PM2_APP"

echo ""
echo "Next steps:"
echo "1. Update your domain in /etc/nginx/sites-available/$NGINX_SITE"
echo "2. Configure SSL certificate (Let's Encrypt recommended)"
echo "3. Update DNS records to point to your server"
echo "4. Test the application thoroughly"