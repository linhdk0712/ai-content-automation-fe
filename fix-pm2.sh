#!/bin/bash

# Quick fix script for PM2 issues

echo "🔧 PM2 Quick Fix"
echo "================"

# Stop and delete all PM2 processes
echo "Stopping all PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Kill PM2 daemon
echo "Killing PM2 daemon..."
pm2 kill

# Clear PM2 logs
echo "Clearing PM2 logs..."
pm2 flush

# Ensure we're in the right directory
echo "Current directory: $(pwd)"

# Check if we have the required files
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: package.json not found in current directory"
    echo "Please run this script from the frontend directory"
    exit 1
fi

if [[ ! -d "dist" ]]; then
    echo "❌ Error: dist directory not found"
    echo "Please run 'npm run build' first"
    exit 1
fi

# Create simple PM2 config on the fly
cat > ecosystem.temp.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'ai-content-frontend',
    script: 'npm',
    args: 'run preview',
    cwd: process.cwd(),
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 4173,
      HOST: '0.0.0.0'
    }
  }]
}
EOF

echo "Starting PM2 with temporary config..."
pm2 start ecosystem.temp.cjs

echo "PM2 status:"
pm2 status

echo "Saving PM2 configuration..."
pm2 save

echo "✅ PM2 fix completed"
echo "Check status with: pm2 status"
echo "View logs with: pm2 logs ai-content-frontend"