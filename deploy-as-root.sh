#!/bin/bash

# Wrapper script to deploy as root
# This is a convenience script that calls deploy-production.sh with --force-root

echo "🔐 AI Content Automation - Root Deployment"
echo "⚠️  WARNING: Running deployment as root user"
echo "    This is not recommended for security reasons."
echo "    Consider creating a dedicated deployment user."
echo ""

# Confirm with user
read -p "Are you sure you want to continue as root? (yes/no): " confirm
if [[ "$confirm" != "yes" ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "🚀 Starting deployment with root privileges..."

# Execute the main deployment script with force-root flag
./deploy-production.sh --force-root

echo ""
echo "📋 Post-deployment security recommendations:"
echo "1. Create a dedicated deployment user (e.g., 'deploy')"
echo "2. Configure sudo access for that user"
echo "3. Use that user for future deployments"
echo "4. Consider using SSH keys instead of passwords"