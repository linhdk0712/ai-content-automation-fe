#!/bin/bash

# Script to fix SSH permissions and setup

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

echo "🔐 SSH Configuration Fix"
echo "======================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    print_error "This script should be run as root to fix /root/.ssh/"
    print_error "Usage: sudo $0"
    exit 1
fi

SSH_DIR="/root/.ssh"
PRIVATE_KEY="$SSH_DIR/id_rsa"
PUBLIC_KEY="$SSH_DIR/id_rsa.pub"
AUTHORIZED_KEYS="$SSH_DIR/authorized_keys"

print_status "Checking SSH directory: $SSH_DIR"

# Create .ssh directory if it doesn't exist
if [[ ! -d "$SSH_DIR" ]]; then
    print_status "Creating SSH directory..."
    mkdir -p "$SSH_DIR"
fi

# Fix directory permissions
print_status "Setting correct permissions for SSH directory..."
chmod 700 "$SSH_DIR"
chown root:root "$SSH_DIR"

# Fix private key permissions if exists
if [[ -f "$PRIVATE_KEY" ]]; then
    print_status "Fixing private key permissions..."
    chmod 600 "$PRIVATE_KEY"
    chown root:root "$PRIVATE_KEY"
    echo "✅ Private key permissions fixed"
else
    print_warning "Private key not found: $PRIVATE_KEY"
fi

# Fix public key permissions if exists
if [[ -f "$PUBLIC_KEY" ]]; then
    print_status "Fixing public key permissions..."
    chmod 644 "$PUBLIC_KEY"
    chown root:root "$PUBLIC_KEY"
    echo "✅ Public key permissions fixed"
else
    print_warning "Public key not found: $PUBLIC_KEY"
fi

# Fix authorized_keys permissions if exists
if [[ -f "$AUTHORIZED_KEYS" ]]; then
    print_status "Fixing authorized_keys permissions..."
    chmod 600 "$AUTHORIZED_KEYS"
    chown root:root "$AUTHORIZED_KEYS"
    echo "✅ Authorized keys permissions fixed"
fi

# Show current permissions
print_status "Current SSH directory permissions:"
ls -la "$SSH_DIR"

# Test SSH key if exists
if [[ -f "$PRIVATE_KEY" ]]; then
    print_status "Testing SSH connection to GitHub..."
    if ssh -T -o ConnectTimeout=10 -o StrictHostKeyChecking=no git@github.com 2>&1 | grep -q "successfully authenticated"; then
        echo "✅ SSH connection to GitHub successful"
    else
        print_warning "SSH connection test failed or key not added to GitHub"
        echo ""
        echo "To add your SSH key to GitHub:"
        echo "1. Copy the public key:"
        if [[ -f "$PUBLIC_KEY" ]]; then
            echo "   cat $PUBLIC_KEY"
        fi
        echo "2. Go to GitHub Settings > SSH and GPG keys"
        echo "3. Click 'New SSH key' and paste the public key"
    fi
else
    print_warning "No SSH key found. Generate one with:"
    echo "ssh-keygen -t rsa -b 4096 -C 'your-email@example.com'"
fi

echo ""
print_status "SSH permissions fix completed!"

# Alternative: Setup HTTPS instead of SSH
echo ""
echo "Alternative: Use HTTPS instead of SSH"
echo "====================================="
echo "If SSH continues to have issues, you can use HTTPS:"
echo ""
echo "1. Clone with HTTPS:"
echo "   git clone https://github.com/username/repository.git"
echo ""
echo "2. Or change existing remote to HTTPS:"
echo "   git remote set-url origin https://github.com/username/repository.git"
echo ""
echo "3. Use Personal Access Token for authentication"