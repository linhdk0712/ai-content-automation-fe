#!/bin/bash

# Script để rebuild và restart nhanh khi có lỗi assets

set -e

echo "🔄 Rebuilding and restarting application..."
echo "=========================================="

# Stop PM2 process
echo "🛑 Stopping PM2 process..."
pm2 stop ai-content-frontend 2>/dev/null || true

# Clean and rebuild
echo "🧹 Cleaning old build..."
rm -rf dist

echo "🔨 Building with new configuration..."
export NODE_OPTIONS="--max-old-space-size=4096"
export NODE_ENV="production"
npm run build:production

# Verify build
if [[ ! -f "dist/index.html" ]]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully!"

# Regenerate nginx config with correct path
echo "🔧 Updating Nginx configuration..."
current_dir=$(pwd)
cat > nginx-production.conf << EOF
server {
    listen 80;
    server_name _;
    
    root $current_dir/dist;
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
        proxy_pass http://localhost:8082;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static assets with caching
    location ^~ /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }
    
    # SPA fallback for all other routes
    location / {
        try_files \$uri \$uri/ @pm2;
    }
    
    # Fallback to PM2 application
    location @pm2 {
        proxy_pass http://localhost:4173;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Update nginx config
echo "📝 Updating Nginx configuration..."
sudo cp nginx-production.conf /etc/nginx/sites-available/ai-content-frontend
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx config is valid"
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Nginx config error!"
    exit 1
fi

# Restart PM2
echo "🚀 Starting PM2 process..."
pm2 start ai-content-frontend 2>/dev/null || pm2 start npm --name "ai-content-frontend" -- run preview

# Wait and check
sleep 3
if pm2 list | grep -q "ai-content-frontend.*online"; then
    echo "✅ PM2 process started successfully"
else
    echo "❌ PM2 process failed to start"
    pm2 logs ai-content-frontend --lines 10
    exit 1
fi

echo ""
echo "🎉 Rebuild and restart completed!"
echo "🌐 Application should be available at: http://180.93.138.113"
echo "📊 Check status: pm2 status"
echo "📝 Check logs: pm2 logs ai-content-frontend"