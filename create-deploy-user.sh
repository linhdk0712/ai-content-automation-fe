#!/bin/bash

# Script to create a dedicated deployment user (recommended approach)

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

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    print_error "This script must be run as root to create users"
    print_error "Usage: sudo $0"
    exit 1
fi

DEPLOY_USER="deploy"
DEPLOY_HOME="/home/$DEPLOY_USER"
PROJECT_DIR="/var/www/ai-content-automation"

print_status "Creating deployment user: $DEPLOY_USER"

# Create user if doesn't exist
if ! id "$DEPLOY_USER" &>/dev/null; then
    useradd -m -s /bin/bash "$DEPLOY_USER"
    print_status "User $DEPLOY_USER created"
else
    print_warning "User $DEPLOY_USER already exists"
fi

# Add user to sudo group
usermod -aG sudo "$DEPLOY_USER"
print_status "Added $DEPLOY_USER to sudo group"

# Create project directory and set ownership
mkdir -p "$PROJECT_DIR"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$PROJECT_DIR"
print_status "Created and configured project directory: $PROJECT_DIR"

# Setup SSH directory
mkdir -p "$DEPLOY_HOME/.ssh"
chown "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_HOME/.ssh"
chmod 700 "$DEPLOY_HOME/.ssh"

# Create authorized_keys file if it doesn't exist
if [[ ! -f "$DEPLOY_HOME/.ssh/authorized_keys" ]]; then
    touch "$DEPLOY_HOME/.ssh/authorized_keys"
    chown "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_HOME/.ssh/authorized_keys"
    chmod 600 "$DEPLOY_HOME/.ssh/authorized_keys"
    print_status "Created SSH authorized_keys file"
fi

# Configure sudo without password for deployment tasks (optional)
read -p "Allow $DEPLOY_USER to run deployment commands without password? (y/n): " allow_nopasswd
if [[ "$allow_nopasswd" == "y" ]]; then
    echo "$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl, /usr/bin/nginx, /usr/sbin/ufw, /bin/mkdir, /bin/chown, /bin/chmod, /bin/cp, /bin/ln, /bin/rm" > "/etc/sudoers.d/$DEPLOY_USER"
    print_status "Configured passwordless sudo for deployment commands"
fi

print_status "✅ Deployment user setup completed!"
echo ""
echo "Next steps:"
echo "1. Set password for $DEPLOY_USER: passwd $DEPLOY_USER"
echo "2. Add SSH public key to $DEPLOY_HOME/.ssh/authorized_keys"
echo "3. Test SSH login: ssh $DEPLOY_USER@your-server"
echo "4. Clone your repository to $PROJECT_DIR"
echo "5. Run deployment as $DEPLOY_USER: su - $DEPLOY_USER"