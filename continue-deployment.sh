#!/bin/bash

# Continue deployment from where it stopped

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🔄 Continuing AI Content Automation Deployment"
echo "=============================================="

# Configuration
NGINX_SITE="ai-content-frontend"

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    print_error "package.json not found. Please run from frontend directory"
    exit 1
fi

# Fix PM2 first
print_status "Fixing PM2 configuration..."
if [[ -f "quick-fix-pm2.sh" ]]; then
    ./quick-fix-pm2.sh
else
    print_warning "quick-fix-pm2.sh not found, fixing manually..."
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    
    # Generate config
    CURRENT_DIR=$(pwd)
    cat > ecosystem.json << EOF
{
  "apps": [
    {
      "name": "ai-content-frontend",
      "script": "npm",
      "args": "run preview",
      "cwd": "$CURRENT_DIR",
      "instances": 1,
      "autorestart": true,
      "watch": false,
      "max_memory_restart": "1G",
      "env": {
        "NODE_ENV": "production",
        "PORT": 4173,
        "HOST": "0.0.0.0"
      }
    }
  ]
}
EOF
    
    pm2 start ecosystem.json
    pm2 save
fi

# Setup Nginx
print_status "Setting up Nginx..."

# Check if nginx config exists
if [[ ! -f "nginx-production.conf" ]]; then
    print_error "nginx-production.conf not found"
    exit 1
fi

# Copy nginx configuration
if [[ $EUID -eq 0 ]]; then
    cp nginx-production.conf "/etc/nginx/sites-available/$NGINX_SITE"
    chmod 644 "/etc/nginx/sites-available/$NGINX_SITE"
    ln -sf "/etc/nginx/sites-available/$NGINX_SITE" "/etc/nginx/sites-enabled/"
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl restart nginx && systemctl enable nginx
else
    sudo cp nginx-production.conf "/etc/nginx/sites-available/$NGINX_SITE"
    sudo chmod 644 "/etc/nginx/sites-available/$NGINX_SITE"
    sudo ln -sf "/etc/nginx/sites-available/$NGINX_SITE" "/etc/nginx/sites-enabled/"
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl restart nginx && sudo systemctl enable nginx
fi

# Setup firewall
if command -v ufw &> /dev/null; then
    print_status "Configuring firewall..."
    if [[ $EUID -eq 0 ]]; then
        ufw allow 'Nginx Full'
        ufw allow ssh
        ufw --force enable
    else
        sudo ufw allow 'Nginx Full'
        sudo ufw allow ssh
        sudo ufw --force enable
    fi
fi

# Final status check
print_status "Final status check..."
./test-services.sh

print_status "✅ Deployment completed!"
echo ""
echo "🌐 Your application should be available at:"
echo "   - Frontend: http://your-server-ip"
echo "   - Direct PM2: http://your-server-ip:4173"
echo ""
echo "📝 Management commands:"
echo "   - Check status: ./test-services.sh"
echo "   - PM2 logs: pm2 logs ai-content-frontend"
echo "   - Restart PM2: pm2 restart ai-content-frontend"
echo "   - Nginx logs: sudo tail -f /var/log/nginx/ai-content-frontend.*.log"