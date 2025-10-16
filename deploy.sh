#!/bin/bash

# =============================================================================
# AI Content Automation - Unified Deployment Script
# =============================================================================
# This script consolidates all deployment functionality into a single,
# idempotent script that can be run multiple times safely.
#
# Usage:
#   ./deploy.sh                    # Deploy as current user
#   ./deploy.sh --force-root       # Deploy as root (not recommended)
#   ./deploy.sh --help             # Show help
#
# Features:
# - Idempotent: Can be run multiple times safely
# - Auto-detects environment and fixes issues
# - Handles both SSH and HTTPS Git repositories
# - Supports both root and non-root deployment
# - Comprehensive error handling and recovery
# =============================================================================

set -e  # Exit on any error

# =============================================================================
# CONFIGURATION
# =============================================================================

# Script metadata
SCRIPT_VERSION="1.0.0"
SCRIPT_NAME="AI Content Automation Deployment"

# Deployment configuration - Use current directory
CURRENT_DIR="$(pwd)"
PROJECT_DIR="$(dirname "$CURRENT_DIR")"
FRONTEND_DIR="$CURRENT_DIR"
NGINX_SITE="ai-content-frontend"
PM2_APP="ai-content-frontend"

# Environment-based configuration
ENVIRONMENT="${DEPLOY_ENV:-production}"
if [[ "$ENVIRONMENT" == "development" ]]; then
    PM2_PORT="3000"
    PM2_SCRIPT="dev"
else
    PM2_PORT="4173"
    PM2_SCRIPT="preview"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if service is running
service_running() {
    if [[ $EUID -eq 0 ]]; then
        systemctl is-active --quiet "$1" 2>/dev/null
    else
        sudo systemctl is-active --quiet "$1" 2>/dev/null
    fi
}

# Run command with appropriate privileges
run_privileged() {
    if [[ $EUID -eq 0 ]]; then
        "$@"
    else
        sudo "$@"
    fi
}

# =============================================================================
# ARGUMENT PARSING
# =============================================================================

FORCE_ROOT=false
SKIP_GIT=false
SKIP_BUILD=false
SKIP_PM2=false
SKIP_NGINX=false
SKIP_CLEANUP=false
HELP=false

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force-root)
                FORCE_ROOT=true
                shift
                ;;
            --skip-git)
                SKIP_GIT=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-pm2)
                SKIP_PM2=true
                shift
                ;;
            --skip-nginx)
                SKIP_NGINX=true
                shift
                ;;
            --skip-cleanup)
                SKIP_CLEANUP=true
                shift
                ;;
            --help|-h)
                HELP=true
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                HELP=true
                shift
                ;;
        esac
    done
}

show_help() {
    echo "$SCRIPT_NAME v$SCRIPT_VERSION"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "This script performs a CLEAN DEPLOYMENT by default:"
    echo "  1. Stops existing services (PM2, Nginx)"
    echo "  2. Removes old build artifacts and dependencies"
    echo "  3. Resets Git state to clean"
    echo "  4. Fresh install and build"
    echo "  5. Restart services with new code"
    echo ""
    echo "Options:"
    echo "  --force-root     Allow running as root user (not recommended)"
    echo "  --skip-git       Skip Git repository update"
    echo "  --skip-build     Skip npm build process"
    echo "  --skip-pm2       Skip PM2 setup"
    echo "  --skip-nginx     Skip Nginx setup"
    echo "  --skip-cleanup   Skip cleanup of existing deployment"
    echo "  --help, -h       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Full clean deployment"
    echo "  $0 --force-root      # Clean deployment as root"
    echo "  $0 --skip-cleanup    # Deploy without cleaning existing"
    echo "  $0 --skip-git        # Deploy without updating Git"
    echo ""
    echo "Clean Deployment Benefits:"
    echo "  ✅ Ensures no conflicts with old code"
    echo "  ✅ Fresh dependency installation"
    echo "  ✅ Clean build artifacts"
    echo "  ✅ Reliable deployment state"
    echo ""
    echo "Security Note:"
    echo "  Running as root is not recommended. Consider creating a dedicated"
    echo "  deployment user with sudo privileges instead."
}

# =============================================================================
# VALIDATION FUNCTIONS
# =============================================================================

validate_environment() {
    print_step "Validating environment..."
    
    # Check if we're in the right directory (frontend)
    if [[ ! -f "package.json" ]]; then
        print_error "package.json not found. Please run this script from the frontend directory."
        exit 1
    fi
    
    # Verify this is a frontend project
    if ! grep -q "vite" package.json; then
        print_error "This doesn't appear to be a Vite frontend project."
        print_error "Please run this script from the frontend directory containing package.json with Vite."
        exit 1
    fi
    
    print_status "Running from directory: $(pwd)"
    
    # Check Node.js version
    if ! command_exists node; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $node_version -lt 16 ]]; then
        print_warning "Node.js version $node_version detected. Recommended: 18+"
    fi
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_status "Environment validation passed"
}

validate_permissions() {
    print_step "Validating permissions..."
    
    # Root user check
    if [[ $EUID -eq 0 ]]; then
        if [[ "$FORCE_ROOT" != "true" ]]; then
            print_error "Running as root is not recommended for security reasons."
            print_error "Use --force-root flag if you must run as root."
            print_error "Recommended: Create a dedicated deployment user."
            exit 1
        else
            print_warning "Running as root (forced). This is not recommended for security."
            sleep 2
        fi
    fi
    
    print_status "Permission validation passed"
}

# =============================================================================
# SYSTEM SETUP FUNCTIONS
# =============================================================================

install_system_dependencies() {
    print_step "Installing system dependencies..."
    
    # Update package list
    print_status "Updating package list..."
    run_privileged apt update
    
    # Install required packages
    local packages=("nginx" "nodejs" "npm" "git" "curl" "net-tools")
    local missing_packages=()
    
    for package in "${packages[@]}"; do
        if ! dpkg -l | grep -q "^ii  $package "; then
            missing_packages+=("$package")
        fi
    done
    
    if [[ ${#missing_packages[@]} -gt 0 ]]; then
        print_status "Installing missing packages: ${missing_packages[*]}"
        run_privileged apt install -y "${missing_packages[@]}"
    else
        print_status "All required packages are already installed"
    fi
    
    # Install PM2 globally if not present
    if ! command_exists pm2; then
        print_status "Installing PM2 globally..."
        run_privileged npm install -g pm2
    else
        print_status "PM2 is already installed"
    fi
}

setup_directories() {
    print_step "Setting up directories..."
    
    local current_dir=$(pwd)
    
    # Create log directories
    run_privileged mkdir -p /var/log/pm2
    run_privileged mkdir -p /var/log/nginx
    
    # Set appropriate permissions
    if [[ $EUID -eq 0 ]]; then
        chown -R root:root /var/log/pm2
        chmod 755 /var/log/pm2
    else
        run_privileged chown -R "$USER:$USER" /var/log/pm2
    fi
    
    print_status "Directories setup completed"
}

# =============================================================================
# CLEANUP FUNCTIONS
# =============================================================================

clean_existing_deployment() {
    if [[ "$SKIP_CLEANUP" == "true" ]]; then
        print_status "Skipping cleanup (--skip-cleanup flag)"
        return 0
    fi
    
    print_step "Cleaning existing deployment..."
    print_warning "This will stop running services and remove build artifacts"
    
    # Add confirmation for interactive mode
    if [[ -t 0 ]] && [[ "$FORCE_ROOT" != "true" ]]; then
        read -p "Continue with cleanup? (y/N): " confirm
        if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
            print_status "Cleanup cancelled. Use --skip-cleanup to skip this step."
            exit 0
        fi
    fi
    
    # Stop and remove existing PM2 processes
    if command_exists pm2; then
        print_status "Stopping existing PM2 processes..."
        
        # Stop specific app if running
        if pm2 list | grep -q "$PM2_APP"; then
            pm2 stop "$PM2_APP" 2>/dev/null || true
            pm2 delete "$PM2_APP" 2>/dev/null || true
            print_status "Stopped existing PM2 process: $PM2_APP"
        fi
        
        # Clean up any orphaned processes
        pm2 kill 2>/dev/null || true
        print_status "Cleaned PM2 daemon"
    fi
    
    # Clean build artifacts
    if [[ -d "dist" ]]; then
        print_status "Removing old build artifacts..."
        rm -rf dist
    fi
    
    if [[ -d "node_modules" ]]; then
        print_status "Removing old node_modules for clean install..."
        rm -rf node_modules
    fi
    
    if [[ -f "package-lock.json" ]]; then
        print_status "Removing package-lock.json for clean install..."
        rm -f package-lock.json
    fi
    
    # Clean old PM2 logs
    if [[ -d "/var/log/pm2" ]]; then
        print_status "Cleaning old PM2 logs..."
        run_privileged find /var/log/pm2 -name "*$PM2_APP*" -type f -delete 2>/dev/null || true
    fi
    
    # Remove old ecosystem config if exists
    if [[ -f "ecosystem.json" ]]; then
        print_status "Removing old PM2 configuration..."
        rm -f ecosystem.json
    fi
    
    # Clean npm cache
    print_status "Cleaning npm cache..."
    npm cache clean --force 2>/dev/null || true
    
    print_status "Existing deployment cleaned successfully"
}

reset_git_state() {
    if [[ "$SKIP_GIT" == "true" ]] || [[ "$SKIP_CLEANUP" == "true" ]]; then
        return 0
    fi
    
    print_step "Resetting Git state for clean deployment..."
    
    if [[ -d ".git" ]]; then
        # Stash any local changes
        if ! git diff --quiet || ! git diff --cached --quiet; then
            print_status "Stashing local changes..."
            git stash push -m "Auto-stash before deployment $(date)" 2>/dev/null || true
        fi
        
        # Reset to clean state
        print_status "Resetting to clean Git state..."
        git reset --hard HEAD 2>/dev/null || true
        git clean -fd 2>/dev/null || true
        
        print_status "Git state reset completed"
    fi
}

# =============================================================================
# GIT FUNCTIONS
# =============================================================================

fix_git_permissions() {
    print_step "Fixing Git/SSH permissions..."
    
    local ssh_dir="/root/.ssh"
    if [[ $EUID -ne 0 ]]; then
        ssh_dir="$HOME/.ssh"
    fi
    
    if [[ -d "$ssh_dir" ]]; then
        chmod 700 "$ssh_dir"
        if [[ -f "$ssh_dir/id_rsa" ]]; then
            chmod 600 "$ssh_dir/id_rsa"
        fi
        if [[ -f "$ssh_dir/id_rsa.pub" ]]; then
            chmod 644 "$ssh_dir/id_rsa.pub"
        fi
        if [[ -f "$ssh_dir/authorized_keys" ]]; then
            chmod 600 "$ssh_dir/authorized_keys"
        fi
        print_status "SSH permissions fixed"
    fi
}

setup_git_repository() {
    if [[ "$SKIP_GIT" == "true" ]]; then
        print_status "Skipping Git setup (--skip-git flag)"
        return 0
    fi
    
    print_step "Setting up Git repository..."
    
    if [[ -d ".git" ]]; then
        print_status "Git repository found, attempting to update..."
        
        # Try to pull, handle various error scenarios
        if ! git pull origin main 2>/dev/null; then
            print_warning "Git pull failed, attempting to fix..."
            
            # Check if it's an SSH permission issue
            if git remote -v | grep -q "git@github.com"; then
                print_status "SSH repository detected, fixing permissions..."
                fix_git_permissions
                
                # Retry pull
                if ! git pull origin main 2>/dev/null; then
                    print_warning "SSH still failing, offering HTTPS alternative..."
                    local current_url=$(git remote get-url origin)
                    local repo_path=$(echo "$current_url" | sed 's/git@github.com://' | sed 's/\.git$//')
                    local https_url="https://github.com/$repo_path.git"
                    
                    print_status "Converting to HTTPS: $https_url"
                    git remote set-url origin "$https_url"
                    git config --global credential.helper store
                    
                    if ! git pull origin main; then
                        print_error "Git pull still failing. Please check repository access."
                        print_error "You may need to provide GitHub credentials or Personal Access Token."
                        return 1
                    fi
                fi
            else
                print_error "Git pull failed for unknown reason"
                git status
                return 1
            fi
        fi
        
        print_status "Repository updated successfully"
    else
        print_warning "No Git repository found in current directory"
        print_warning "Please ensure your code is properly deployed here"
    fi
}

# =============================================================================
# BUILD FUNCTIONS
# =============================================================================

install_dependencies() {
    if [[ "$SKIP_BUILD" == "true" ]]; then
        print_status "Skipping dependency installation (--skip-build flag)"
        return 0
    fi
    
    print_step "Installing dependencies..."
    
    # Clean install for production
    if [[ -f "package-lock.json" ]]; then
        print_status "Using npm ci for clean install..."
        npm ci --only=production=false
    else
        print_status "Using npm install..."
        npm install
    fi
    
    # Run security audit (non-blocking)
    print_status "Running security audit..."
    npm audit --audit-level moderate || print_warning "Security vulnerabilities detected. Consider updating dependencies."
    
    print_status "Dependencies installed successfully"
}

build_application() {
    if [[ "$SKIP_BUILD" == "true" ]]; then
        print_status "Skipping build process (--skip-build flag)"
        return 0
    fi
    
    print_step "Building application..."
    
    # Set production environment
    export NODE_ENV=production
    
    # Build the application
    npm run build
    
    # Verify build output
    if [[ ! -d "dist" ]]; then
        print_error "Build output directory 'dist' not found"
        exit 1
    fi
    
    # Check if main files exist
    if [[ ! -f "dist/index.html" ]]; then
        print_error "Build output appears incomplete (no index.html)"
        exit 1
    fi
    
    print_status "Application built successfully"
}

# =============================================================================
# PM2 FUNCTIONS
# =============================================================================

generate_pm2_config() {
    print_step "Generating PM2 configuration..."
    
    local current_dir=$(pwd)
    
    # Generate ecosystem.json with current directory
    cat > ecosystem.json << EOF
{
  "apps": [
    {
      "name": "$PM2_APP",
      "script": "npm",
      "args": "run $PM2_SCRIPT",
      "cwd": "$current_dir",
      "instances": 1,
      "autorestart": true,
      "watch": false,
      "max_memory_restart": "1G",
      "env": {
        "NODE_ENV": "production",
        "PORT": $PM2_PORT,
        "HOST": "0.0.0.0"
      },
      "log_file": "/var/log/pm2/$PM2_APP.log",
      "out_file": "/var/log/pm2/$PM2_APP-out.log",
      "error_file": "/var/log/pm2/$PM2_APP-error.log",
      "min_uptime": "10s",
      "max_restarts": 10,
      "restart_delay": 4000
    }
  ]
}
EOF
    
    print_status "PM2 configuration generated for: $current_dir"
}

setup_pm2() {
    if [[ "$SKIP_PM2" == "true" ]]; then
        print_status "Skipping PM2 setup (--skip-pm2 flag)"
        return 0
    fi
    
    print_step "Setting up PM2..."
    
    # Generate fresh config
    generate_pm2_config
    
    # Stop existing processes gracefully
    if pm2 list | grep -q "$PM2_APP"; then
        print_status "Stopping existing PM2 process: $PM2_APP"
        pm2 stop "$PM2_APP" 2>/dev/null || true
        pm2 delete "$PM2_APP" 2>/dev/null || true
    fi
    
    # Kill PM2 daemon to ensure clean state
    pm2 kill 2>/dev/null || true
    
    # Start new process
    print_status "Starting PM2 process..."
    pm2 start ecosystem.json --env production
    
    # Verify process is running
    sleep 3
    if ! pm2 list | grep -q "$PM2_APP.*online"; then
        print_error "PM2 process failed to start properly"
        pm2 logs "$PM2_APP" --lines 20
        exit 1
    fi
    
    # Save PM2 configuration
    pm2 save
    
    # Setup startup script (only if not already configured)
    if ! pm2 startup | grep -q "already"; then
        pm2 startup systemd || print_warning "Failed to setup PM2 startup script"
    fi
    
    print_status "PM2 setup completed successfully"
}

# =============================================================================
# NGINX FUNCTIONS
# =============================================================================

generate_nginx_config() {
    print_step "Generating Nginx configuration..."
    
    # Generate nginx config if it doesn't exist
    if [[ ! -f "nginx-production.conf" ]]; then
        cat > nginx-production.conf << 'EOF'
server {
    listen 80;
    server_name _;
    
    root /var/www/html;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # API proxy to backend service
    location /api/ {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static assets with caching
    location ^~ /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    # SPA fallback for all other routes
    location / {
        try_files $uri $uri/ @pm2;
    }
    
    # Fallback to PM2 application
    location @pm2 {
        proxy_pass http://localhost:4173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
        print_status "Generated nginx-production.conf"
    fi
}

setup_nginx() {
    if [[ "$SKIP_NGINX" == "true" ]]; then
        print_status "Skipping Nginx setup (--skip-nginx flag)"
        return 0
    fi
    
    print_step "Setting up Nginx..."
    
    # Generate config if needed
    generate_nginx_config
    
    # Backup existing configuration if it exists
    if [[ -f "/etc/nginx/sites-available/$NGINX_SITE" ]]; then
        print_status "Backing up existing Nginx configuration"
        run_privileged cp "/etc/nginx/sites-available/$NGINX_SITE" "/etc/nginx/sites-available/$NGINX_SITE.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Copy new configuration
    run_privileged cp nginx-production.conf "/etc/nginx/sites-available/$NGINX_SITE"
    run_privileged chmod 644 "/etc/nginx/sites-available/$NGINX_SITE"
    
    # Enable site
    run_privileged ln -sf "/etc/nginx/sites-available/$NGINX_SITE" "/etc/nginx/sites-enabled/"
    
    # Remove default site if it exists
    if [[ -f "/etc/nginx/sites-enabled/default" ]]; then
        run_privileged rm -f /etc/nginx/sites-enabled/default
    fi
    
    # Test configuration
    if ! run_privileged nginx -t; then
        print_error "Nginx configuration test failed"
        exit 1
    fi
    
    # Restart and enable Nginx
    run_privileged systemctl restart nginx
    run_privileged systemctl enable nginx
    
    # Verify Nginx is running
    if ! service_running nginx; then
        print_error "Nginx failed to start"
        run_privileged systemctl status nginx --no-pager -l
        exit 1
    fi
    
    print_status "Nginx setup completed successfully"
}

# =============================================================================
# FIREWALL FUNCTIONS
# =============================================================================

setup_firewall() {
    print_step "Setting up firewall..."
    
    if command_exists ufw; then
        print_status "Configuring UFW firewall..."
        run_privileged ufw allow 'Nginx Full'
        run_privileged ufw allow ssh
        run_privileged ufw --force enable
        print_status "Firewall configured"
    else
        print_warning "UFW not available, skipping firewall configuration"
    fi
}

# =============================================================================
# STATUS AND TESTING FUNCTIONS
# =============================================================================

test_services() {
    print_step "Testing services..."
    
    local all_good=true
    
    # Test PM2
    echo "PM2 Status:"
    if pm2 list | grep -q "$PM2_APP.*online"; then
        echo "✅ PM2 application is running"
    else
        echo "❌ PM2 application is not running"
        all_good=false
    fi
    
    # Test Nginx
    echo "Nginx Status:"
    if service_running nginx; then
        echo "✅ Nginx is running"
    else
        echo "❌ Nginx is not running"
        all_good=false
    fi
    
    # Test ports
    echo "Port Status:"
    if netstat -tlnp 2>/dev/null | grep -q ":$PM2_PORT "; then
        echo "✅ Port $PM2_PORT is in use (PM2)"
    else
        echo "❌ Port $PM2_PORT is not in use"
        all_good=false
    fi
    
    if netstat -tlnp 2>/dev/null | grep -q ":80 "; then
        echo "✅ Port 80 is in use (Nginx)"
    else
        echo "❌ Port 80 is not in use"
        all_good=false
    fi
    
    # Test HTTP responses
    echo "HTTP Status:"
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PM2_PORT 2>/dev/null | grep -q "200"; then
        echo "✅ PM2 application responding"
    else
        echo "❌ PM2 application not responding"
        all_good=false
    fi
    
    if curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null | grep -q "200"; then
        echo "✅ Nginx responding"
    else
        echo "❌ Nginx not responding"
        all_good=false
    fi
    
    if [[ "$all_good" == "true" ]]; then
        print_status "All services are running correctly"
    else
        print_warning "Some services have issues. Check the status above."
    fi
}

show_final_status() {
    print_header "Deployment Summary"
    
    echo "🚀 Deployment completed successfully!"
    echo ""
    echo "📊 Service Status:"
    test_services
    echo ""
    echo "🌐 Access URLs:"
    echo "   - Main Application: http://your-server-ip"
    echo "   - Direct PM2 Access: http://your-server-ip:$PM2_PORT"
    echo ""
    echo "📝 Management Commands:"
    echo "   - Check all services: $0 --help"
    echo "   - PM2 status: pm2 status"
    echo "   - PM2 logs: pm2 logs $PM2_APP"
    echo "   - Nginx status: sudo systemctl status nginx"
    echo "   - Restart PM2: pm2 restart $PM2_APP"
    echo "   - Restart Nginx: sudo systemctl restart nginx"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   - If PM2 fails: pm2 logs $PM2_APP"
    echo "   - If Nginx fails: sudo nginx -t && sudo systemctl status nginx"
    echo "   - Re-run deployment: $0"
    echo ""
    echo "✅ Deployment script can be run multiple times safely for updates."
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    # Parse command line arguments
    parse_arguments "$@"
    
    # Show help if requested
    if [[ "$HELP" == "true" ]]; then
        show_help
        exit 0
    fi
    
    # Print header
    print_header "$SCRIPT_NAME v$SCRIPT_VERSION - Clean Deployment"
    
    # Validation phase
    validate_environment
    validate_permissions
    
    # Cleanup phase - Clean existing deployment first
    if [[ "$SKIP_CLEANUP" != "true" ]]; then
        print_header "Phase 1: Cleanup"
        clean_existing_deployment
        reset_git_state
    else
        print_status "Skipping cleanup phase (--skip-cleanup flag)"
    fi
    
    # System setup phase
    print_header "Phase 2: System Setup"
    install_system_dependencies
    setup_directories
    
    # Application setup phase
    print_header "Phase 3: Application Setup"
    setup_git_repository
    install_dependencies
    build_application
    
    # Service setup phase
    print_header "Phase 4: Service Setup"
    setup_pm2
    setup_nginx
    setup_firewall
    
    # Final verification
    print_header "Phase 5: Verification"
    show_final_status
}

# Execute main function with all arguments
main "$@"