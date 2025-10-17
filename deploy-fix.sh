#!/bin/bash

# Script để deploy bản fix i18n lên production
echo "🚀 Deploying i18n fixes to production..."

# Build project
echo "📦 Building project..."
npm run build

# Copy files to production server (adjust path as needed)
echo "📤 Uploading files..."

# Nếu bạn sử dụng rsync
# rsync -avz --delete dist/ user@your-server:/path/to/your/app/

# Nếu bạn sử dụng scp
# scp -r dist/* user@your-server:/path/to/your/app/

# Nếu bạn sử dụng Docker
# docker build -t your-app .
# docker push your-registry/your-app

echo "✅ Deployment completed!"
echo ""
echo "🔍 To debug i18n issues, visit: http://your-domain/debug/i18n"
echo ""
echo "📋 Changes made:"
echo "  - Fixed translation file paths in production"
echo "  - Added missing translation keys for workflow components"
echo "  - Added missing translation keys for content creator"
echo "  - Improved error handling for translation loading"
echo "  - Added debug component for troubleshooting"