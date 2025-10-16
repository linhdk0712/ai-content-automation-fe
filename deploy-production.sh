#!/bin/bash

# Production deployment script for AI Content Automation Frontend
# Run this script on your VPS Ubuntu 24

set -e  # Exit on any error

echo "🚀 Starting AI Content Automation Frontend Deployment..."

# Configuration
PROJECT_DIR="/root"
FRONTEND_DIR="$PROJECT_DIR/ai-content-automation-fe"
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

# Security checks
if [[ $EUID -eq 0 ]]; then
    print_error "Running as root is not recommended for security reasons."
    print_error "Please run this script as a non-root user with sudo privileges."
    exit 1
fi

# Verify required environment variables
if [[ -z "$USER" ]]; then
    print_error "USER environment variable is not set"
    exit 1
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

# 4. Create project directory with proper permissions
print_status "Setting up project directory..."
if [[ ! -d "$PROJECT_DIR" ]]; then
    sudo mkdir -p "$PROJECT_DIR" || {
        print_error "Failed to create project directory: $PROJECT_DIR"
        exit 1
    }
fi

# Set secure permissions
sudo chown -R "$USER:$USER" "$PROJECT_DIR" || {
    print_error "Failed to set ownership for: $PROJECT_DIR"
    exit 1
}

# Verify directory is writable
if [[ ! -w "$PROJECT_DIR" ]]; then
    print_error "Project directory is not writable: $PROJECT_DIR"
    exit 1
fi

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

# 7. Install dependencies and build with validation
print_status "Navigating to frontend directory..."
if [[ ! -d "$FRONTEND_DIR" ]]; then
    print_error "Frontend directory not found: $FRONTEND_DIR"
    print_error "Please ensure the repository is properly cloned"
    exit 1
fi

cd "$FRONTEND_DIR" || {
    print_error "Failed to navigate to frontend directory"
    exit 1
}

# Verify package.json exists
if [[ ! -f "package.json" ]]; then
    print_error "package.json not found in $FRONTEND_DIR"
    exit 1
fi

print_status "Installing dependencies..."
npm ci --only=production=false || {
    print_error "Failed to install dependencies"
    exit 1
}

print_status "Running security audit..."
npm audit --audit-level moderate || {
    print_warning "Security vulnerabilities detected. Consider updating dependencies."
}

print_status "Building application..."
npm run build || {
    print_error "Build failed"
    exit 1
}

# Verify build output
if [[ ! -d "dist" ]]; then
    print_error "Build output directory 'dist' not found"
    exit 1
fi

print_status "Build completed successfully"

# 8. Setup PM2 with enhanced error handling
print_status "Setting up PM2..."

# Create PM2 log directory with proper permissions
sudo mkdir -p /var/log/pm2 || {
    print_error "Failed to create PM2 log directory"
    exit 1
}
sudo chown -R "$USER:$USER" /var/log/pm2

# Gracefully stop existing PM2 process
if pm2 list | grep -q "$PM2_APP"; then
    print_status "Stopping existing PM2 process: $PM2_APP"
    pm2 stop "$PM2_APP" || print_warning "Failed to stop existing process"
    pm2 delete "$PM2_APP" || print_warning "Failed to delete existing process"
fi

# Start new PM2 process with validation
print_status "Starting PM2 process..."
if [[ -f "ecosystem.json" ]]; then
    print_status "Using ecosystem.json configuration"
    pm2 start ecosystem.json --env production || {
        print_error "Failed to start PM2 with ecosystem.json"
        exit 1
    }
elif [[ -f "ecosystem.config.cjs" ]]; then
    print_status "Using ecosystem.config.cjs configuration"
    pm2 start ecosystem.config.cjs --env production || {
        print_error "Failed to start PM2 with ecosystem.config.cjs"
        exit 1
    }
else
    print_error "No PM2 configuration file found (ecosystem.json or ecosystem.config.cjs)"
    exit 1
fi

# Save PM2 configuration and setup startup
pm2 save || {
    print_error "Failed to save PM2 configuration"
    exit 1
}

# Setup PM2 startup (only if not already configured)
if ! pm2 startup | grep -q "already"; then
    pm2 startup || print_warning "Failed to setup PM2 startup script"
fi

# Verify PM2 process is running
sleep 3
if ! pm2 list | grep -q "$PM2_APP.*online"; then
    print_error "PM2 process failed to start properly"
    pm2 logs "$PM2_APP" --lines 20
    exit 1
fi

print_status "PM2 process started successfully"

# 9. Setup Nginx with security validation
print_status "Setting up Nginx..."

# Verify nginx configuration file exists
if [[ ! -f "nginx-production.conf" ]]; then
    print_error "Nginx configuration file not found: nginx-production.conf"
    exit 1
fi

# Backup existing configuration if it exists
if [[ -f "/etc/nginx/sites-available/$NGINX_SITE" ]]; then
    print_status "Backing up existing Nginx configuration"
    sudo cp "/etc/nginx/sites-available/$NGINX_SITE" "/etc/nginx/sites-available/$NGINX_SITE.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Copy nginx configuration with validation
sudo cp nginx-production.conf "/etc/nginx/sites-available/$NGINX_SITE" || {
    print_error "Failed to copy Nginx configuration"
    exit 1
}

# Set proper permissions for nginx config
sudo chmod 644 "/etc/nginx/sites-available/$NGINX_SITE"

# Enable site
sudo ln -sf "/etc/nginx/sites-available/$NGINX_SITE" "/etc/nginx/sites-enabled/" || {
    print_error "Failed to enable Nginx site"
    exit 1
}

# Remove default nginx site (with backup)
if [[ -f "/etc/nginx/sites-enabled/default" ]]; then
    print_status "Removing default Nginx site"
    sudo rm -f /etc/nginx/sites-enabled/default
fi

# Test nginx configuration before applying
print_status "Testing Nginx configuration..."
sudo nginx -t || {
    print_error "Nginx configuration test failed"
    print_error "Restoring previous configuration..."
    if [[ -f "/etc/nginx/sites-available/$NGINX_SITE.backup."* ]]; then
        sudo cp "/etc/nginx/sites-available/$NGINX_SITE.backup."* "/etc/nginx/sites-available/$NGINX_SITE"
    fi
    exit 1
}

# Restart nginx with validation
print_status "Restarting Nginx..."
sudo systemctl restart nginx || {
    print_error "Failed to restart Nginx"
    sudo systemctl status nginx --no-pager -l
    exit 1
}

sudo systemctl enable nginx || {
    print_warning "Failed to enable Nginx service"
}

# Verify nginx is running
if ! sudo systemctl is-active --quiet nginx; then
    print_error "Nginx is not running after restart"
    sudo systemctl status nginx --no-pager -l
    exit 1
fi

print_status "Nginx configured and running successfully"

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
print_status "🌐 Your application should be available at: http://180.93.138.113:3000/"
print_status "📝 Nginx logs: /var/log/nginx/ai-content-frontend.*.log"
print_status "📝 PM2 logs: pm2 logs $PM2_APP"

echo ""
echo "Next steps:"
echo "1. Update your domain in /etc/nginx/sites-available/$NGINX_SITE"
echo "2. Configure SSL certificate (Let's Encrypt recommended)"
echo "3. Update DNS records to point to your server"
echo "4. Test the application thoroughly"