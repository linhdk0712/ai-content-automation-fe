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

# Parse command line arguments
FORCE_ROOT=false
for arg in "$@"; do
    case $arg in
        --force-root)
            FORCE_ROOT=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --force-root    Allow running as root user (not recommended)"
            echo "  --help, -h      Show this help message"
            echo ""
            echo "Example:"
            echo "  $0                    # Run as non-root user (recommended)"
            echo "  $0 --force-root      # Force run as root (use with caution)"
            exit 0
            ;;
    esac
done

# Security checks
if [[ $EUID -eq 0 ]]; then
    if [[ "$FORCE_ROOT" != "true" ]]; then
        print_error "Running as root is not recommended for security reasons."
        print_error "If you must run as root, use: $0 --force-root"
        print_error "Recommended: Run as non-root user with sudo privileges."
        exit 1
    else
        print_warning "Running as root user (forced). This is not recommended for security."
        print_warning "Consider creating a dedicated user for deployment."
        sleep 3
    fi
fi

# 1. Update system packages
print_status "Updating system packages..."
if [[ $EUID -eq 0 ]]; then
    apt update && apt upgrade -y
else
    sudo apt update && sudo apt upgrade -y
fi

# 2. Install required packages
print_status "Installing required packages..."
if [[ $EUID -eq 0 ]]; then
    apt install -y nginx nodejs npm git curl
else
    sudo apt install -y nginx nodejs npm git curl
fi

# 3. Install PM2 globally
print_status "Installing PM2..."
if [[ $EUID -eq 0 ]]; then
    npm install -g pm2
else
    sudo npm install -g pm2
fi

# 4. Create project directory with proper permissions
print_status "Setting up project directory..."
if [[ ! -d "$PROJECT_DIR" ]]; then
    if [[ $EUID -eq 0 ]]; then
        mkdir -p "$PROJECT_DIR" || {
            print_error "Failed to create project directory: $PROJECT_DIR"
            exit 1
        }
    else
        sudo mkdir -p "$PROJECT_DIR" || {
            print_error "Failed to create project directory: $PROJECT_DIR"
            exit 1
        }
    fi
fi

# Set appropriate permissions based on user
if [[ $EUID -eq 0 ]]; then
    # Running as root - set ownership to root but make it accessible
    chown -R root:root "$PROJECT_DIR"
    chmod -R 755 "$PROJECT_DIR"
    print_warning "Project directory owned by root. Consider using a dedicated user."
else
    # Running as non-root - set ownership to current user
    sudo chown -R "$USER:$USER" "$PROJECT_DIR" || {
        print_error "Failed to set ownership for: $PROJECT_DIR"
        exit 1
    }
fi

# Verify directory is writable
if [[ ! -w "$PROJECT_DIR" ]]; then
    print_error "Project directory is not writable: $PROJECT_DIR"
    exit 1
fi

# 5. Navigate to project directory
cd $PROJECT_DIR

# 6. Clone or update repository with error handling
if [ -d ".git" ]; then
    print_status "Updating existing repository..."
    
    # Try to pull, handle SSH permission errors
    if ! git pull origin main 2>/dev/null; then
        print_warning "Git pull failed. Checking for SSH permission issues..."
        
        # Check if it's an SSH permission error
        if git remote -v | grep -q "git@github.com"; then
            print_warning "Repository uses SSH. Checking SSH permissions..."
            
            # Try to fix SSH permissions
            if [[ -f "/root/.ssh/id_rsa" ]]; then
                chmod 600 /root/.ssh/id_rsa
                chmod 700 /root/.ssh
                print_status "Fixed SSH permissions. Retrying git pull..."
                
                if ! git pull origin main; then
                    print_error "Git pull still failing. Consider switching to HTTPS:"
                    print_error "Run: ./setup-https-git.sh"
                    exit 1
                fi
            else
                print_error "SSH key not found. Consider using HTTPS instead:"
                print_error "Run: ./setup-https-git.sh"
                exit 1
            fi
        else
            print_error "Git pull failed for unknown reason"
            git status
            exit 1
        fi
    fi
else
    print_status "No Git repository found in $PROJECT_DIR"
    print_warning "Please ensure your code is properly deployed to this directory"
    print_warning "You can:"
    print_warning "1. Clone manually: git clone <your-repo-url> ."
    print_warning "2. Upload code via SCP/SFTP"
    print_warning "3. Use CI/CD pipeline"
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

# Generate PM2 config for current directory
print_status "Generating PM2 configuration for current directory..."
if [[ -f "generate-pm2-config.sh" ]]; then
    ./generate-pm2-config.sh
else
    # Generate config inline if script not found
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
      },
      "log_file": "/var/log/pm2/ai-content-frontend.log",
      "out_file": "/var/log/pm2/ai-content-frontend-out.log",
      "error_file": "/var/log/pm2/ai-content-frontend-error.log",
      "min_uptime": "10s",
      "max_restarts": 10,
      "restart_delay": 4000
    }
  ]
}
EOF
    print_status "Generated ecosystem.json with cwd: $CURRENT_DIR"
fi

# Create PM2 log directory with proper permissions
if [[ $EUID -eq 0 ]]; then
    mkdir -p /var/log/pm2
    chown -R root:root /var/log/pm2
    chmod 755 /var/log/pm2
else
    sudo mkdir -p /var/log/pm2
    sudo chown -R "$USER:$USER" /var/log/pm2
fi
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
elif [[ -f "ecosystem.simple.cjs" ]]; then
    print_status "Using ecosystem.simple.cjs configuration"
    pm2 start ecosystem.simple.cjs --env production || {
        print_error "Failed to start PM2 with ecosystem.simple.cjs"
        exit 1
    }
elif [[ -f "ecosystem.config.cjs" ]]; then
    print_status "Using ecosystem.config.cjs configuration"
    pm2 start ecosystem.config.cjs --env production || {
        print_error "Failed to start PM2 with ecosystem.config.cjs"
        exit 1
    }
else
    print_error "No PM2 configuration file found (ecosystem.json, ecosystem.simple.cjs, or ecosystem.config.cjs)"
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
if [[ $EUID -eq 0 ]]; then
    cp nginx-production.conf "/etc/nginx/sites-available/$NGINX_SITE" || {
        print_error "Failed to copy Nginx configuration"
        exit 1
    }
else
    sudo cp nginx-production.conf "/etc/nginx/sites-available/$NGINX_SITE" || {
        print_error "Failed to copy Nginx configuration"
        exit 1
    }
fi

# Set proper permissions for nginx config
if [[ $EUID -eq 0 ]]; then
    chmod 644 "/etc/nginx/sites-available/$NGINX_SITE"
    # Enable site
    ln -sf "/etc/nginx/sites-available/$NGINX_SITE" "/etc/nginx/sites-enabled/" || {
        print_error "Failed to enable Nginx site"
        exit 1
    }
else
    sudo chmod 644 "/etc/nginx/sites-available/$NGINX_SITE"
    # Enable site
    sudo ln -sf "/etc/nginx/sites-available/$NGINX_SITE" "/etc/nginx/sites-enabled/" || {
        print_error "Failed to enable Nginx site"
        exit 1
    }
fi

# Remove default nginx site (with backup)
if [[ -f "/etc/nginx/sites-enabled/default" ]]; then
    print_status "Removing default Nginx site"
    if [[ $EUID -eq 0 ]]; then
        rm -f /etc/nginx/sites-enabled/default
    else
        sudo rm -f /etc/nginx/sites-enabled/default
    fi
fi

# Test nginx configuration before applying
print_status "Testing Nginx configuration..."
if [[ $EUID -eq 0 ]]; then
    nginx -t || {
        print_error "Nginx configuration test failed"
        exit 1
    }
else
    sudo nginx -t || {
        print_error "Nginx configuration test failed"
        exit 1
    }
fi

# Restart nginx with validation
print_status "Restarting Nginx..."
if [[ $EUID -eq 0 ]]; then
    systemctl restart nginx || {
        print_error "Failed to restart Nginx"
        systemctl status nginx --no-pager -l
        exit 1
    }
    systemctl enable nginx
else
    sudo systemctl restart nginx || {
        print_error "Failed to restart Nginx"
        sudo systemctl status nginx --no-pager -l
        exit 1
    }
    sudo systemctl enable nginx
fi

# Verify nginx is running
if [[ $EUID -eq 0 ]]; then
    if ! systemctl is-active --quiet nginx; then
        print_error "Nginx is not running after restart"
        systemctl status nginx --no-pager -l
        exit 1
    fi
else
    if ! sudo systemctl is-active --quiet nginx; then
        print_error "Nginx is not running after restart"
        sudo systemctl status nginx --no-pager -l
        exit 1
    fi
fi

print_status "Nginx configured and running successfully"

# 10. Setup firewall (if ufw is available)
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

# 11. Comprehensive health checks and final status
print_status "Performing final health checks..."

# Check Nginx status
echo "=== Nginx Status ==="
if [[ $EUID -eq 0 ]]; then
    if systemctl is-active --quiet nginx; then
        echo "✅ Nginx is running"
        systemctl status nginx --no-pager -l | head -10
    else
        echo "❌ Nginx is not running"
        systemctl status nginx --no-pager -l
    fi
else
    if sudo systemctl is-active --quiet nginx; then
        echo "✅ Nginx is running"
        sudo systemctl status nginx --no-pager -l | head -10
    else
        echo "❌ Nginx is not running"
        sudo systemctl status nginx --no-pager -l
    fi
fi

echo ""
echo "=== PM2 Status ==="
if pm2 list | grep -q "$PM2_APP.*online"; then
    print_status "✅ PM2 process is running"
    pm2 status
else
    print_error "❌ PM2 process is not running properly"
    pm2 status
    pm2 logs "$PM2_APP" --lines 10
fi

echo ""
echo "=== Application Health Check ==="
# Test if application is responding
sleep 5
if curl -f -s "http://localhost:4173" > /dev/null; then
    print_status "✅ Application is responding on port 4173"
else
    print_warning "⚠️  Application may not be responding on port 4173"
fi

# Check disk space
echo ""
echo "=== System Resources ==="
df -h / | tail -1 | awk '{print "Disk usage: " $5 " of " $2 " used"}'
free -h | grep "Mem:" | awk '{print "Memory usage: " $3 "/" $2}'

echo ""
print_status "🎉 Deployment completed!"

# Dynamic IP detection for better user experience
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")
print_status "🌐 Application should be available at: http://$SERVER_IP:4173/"

echo ""
echo "📋 Important Information:"
echo "   📝 Nginx logs: /var/log/nginx/ai-content-frontend.*.log"
echo "   📝 PM2 logs: pm2 logs $PM2_APP"
echo "   📝 Application logs: /var/log/pm2/ai-content-frontend*.log"
echo ""
echo "🔧 Next Steps:"
echo "   1. Update domain configuration in /etc/nginx/sites-available/$NGINX_SITE"
echo "   2. Configure SSL certificate (certbot --nginx recommended)"
echo "   3. Update DNS records to point to your server IP: $SERVER_IP"
echo "   4. Test application functionality thoroughly"
echo "   5. Set up monitoring and backup procedures"
echo ""
echo "🚨 Security Reminders:"
echo "   - Change default passwords and API keys"
echo "   - Configure firewall rules appropriately"
echo "   - Enable automatic security updates"
echo "   - Regular backup of application data"