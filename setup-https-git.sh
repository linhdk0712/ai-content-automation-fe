#!/bin/bash

# Script to setup Git with HTTPS instead of SSH

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

echo "🌐 Git HTTPS Setup"
echo "=================="

# Check if we're in a git repository
if [[ ! -d ".git" ]]; then
    print_error "Not in a Git repository"
    print_error "Please run this script from your project root directory"
    exit 1
fi

# Show current remote
print_status "Current Git remote:"
git remote -v

# Get current remote URL
CURRENT_URL=$(git remote get-url origin 2>/dev/null || echo "")

if [[ -z "$CURRENT_URL" ]]; then
    print_error "No origin remote found"
    exit 1
fi

# Convert SSH URL to HTTPS if needed
if [[ "$CURRENT_URL" == git@github.com:* ]]; then
    # Extract username/repo from SSH URL
    REPO_PATH=$(echo "$CURRENT_URL" | sed 's/git@github.com://' | sed 's/\.git$//')
    HTTPS_URL="https://github.com/$REPO_PATH.git"
    
    print_status "Converting SSH URL to HTTPS..."
    print_status "From: $CURRENT_URL"
    print_status "To: $HTTPS_URL"
    
    git remote set-url origin "$HTTPS_URL"
    
    echo "✅ Remote URL updated to HTTPS"
elif [[ "$CURRENT_URL" == https://github.com/* ]]; then
    print_status "Repository already using HTTPS"
    HTTPS_URL="$CURRENT_URL"
else
    print_warning "Unknown remote URL format: $CURRENT_URL"
    read -p "Enter HTTPS repository URL: " HTTPS_URL
    git remote set-url origin "$HTTPS_URL"
fi

# Show updated remote
print_status "Updated Git remote:"
git remote -v

# Configure Git credentials helper
print_status "Configuring Git credentials helper..."
git config --global credential.helper store

# Test connection
print_status "Testing Git connection..."
if git ls-remote origin HEAD >/dev/null 2>&1; then
    echo "✅ Git HTTPS connection successful"
else
    print_warning "Git connection test failed"
    echo ""
    echo "You may need to:"
    echo "1. Generate a Personal Access Token on GitHub"
    echo "2. Use your GitHub username and token as password"
    echo "3. Or run: git config --global credential.helper cache"
fi

echo ""
print_status "HTTPS Git setup completed!"
echo ""
echo "Next steps:"
echo "1. Try: git pull"
echo "2. If prompted, enter your GitHub username"
echo "3. For password, use your Personal Access Token (not your GitHub password)"
echo ""
echo "To create a Personal Access Token:"
echo "1. Go to GitHub Settings > Developer settings > Personal access tokens"
echo "2. Generate new token with 'repo' permissions"
echo "3. Use this token as your password when prompted"