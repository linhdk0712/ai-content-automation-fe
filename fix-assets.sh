#!/bin/bash

# Script để chẩn đoán và sửa lỗi assets 404

set -e

echo "🔍 Chẩn đoán lỗi assets..."
echo "=========================="

# Kiểm tra build directory
if [[ -d "dist" ]]; then
    echo "✅ Thư mục dist tồn tại"
    
    if [[ -f "dist/index.html" ]]; then
        echo "✅ File index.html tồn tại"
        
        # Kiểm tra assets trong index.html
        echo "📋 Assets được tham chiếu trong index.html:"
        grep -o 'src="[^"]*"' dist/index.html | head -5
        grep -o 'href="[^"]*"' dist/index.html | head -5
        
        # Kiểm tra thư mục assets
        if [[ -d "dist/assets" ]]; then
            echo "✅ Thư mục dist/assets tồn tại"
            echo "📁 Nội dung thư mục assets:"
            ls -la dist/assets/ | head -10
        else
            echo "❌ Thư mục dist/assets không tồn tại!"
        fi
    else
        echo "❌ File dist/index.html không tồn tại!"
    fi
else
    echo "❌ Thư mục dist không tồn tại!"
fi

echo ""
echo "🔧 Kiểm tra cấu hình Nginx..."

# Kiểm tra nginx config
if [[ -f "nginx-production.conf" ]]; then
    echo "✅ File nginx-production.conf tồn tại"
    echo "📋 Root directory trong nginx config:"
    grep "root " nginx-production.conf
else
    echo "❌ File nginx-production.conf không tồn tại!"
fi

# Kiểm tra nginx config đã deploy
if [[ -f "/etc/nginx/sites-available/ai-content-frontend" ]]; then
    echo "✅ Nginx config đã được deploy"
    echo "📋 Root directory trong nginx config đã deploy:"
    sudo grep "root " /etc/nginx/sites-available/ai-content-frontend
else
    echo "❌ Nginx config chưa được deploy!"
fi

echo ""
echo "🌐 Kiểm tra truy cập..."

# Test truy cập file assets
current_dir=$(pwd)
if [[ -f "$current_dir/dist/index.html" ]]; then
    echo "✅ File có thể truy cập tại: $current_dir/dist/index.html"
    
    # Kiểm tra quyền truy cập
    ls -la "$current_dir/dist/index.html"
    
    # Test với curl nếu server đang chạy
    if curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null | grep -q "200"; then
        echo "✅ Server đang chạy và phản hồi"
        
        # Test assets
        echo "🧪 Testing assets access..."
        if [[ -d "$current_dir/dist/assets" ]]; then
            first_js=$(find "$current_dir/dist/assets" -name "*.js" | head -1)
            if [[ -n "$first_js" ]]; then
                asset_name=$(basename "$first_js")
                echo "Testing: http://localhost/assets/$asset_name"
                curl -s -o /dev/null -w "Status: %{http_code}\n" "http://localhost/assets/$asset_name"
            fi
        fi
    else
        echo "❌ Server không phản hồi hoặc không chạy"
    fi
fi

echo ""
echo "💡 Khuyến nghị sửa lỗi:"

if [[ ! -d "dist" ]] || [[ ! -f "dist/index.html" ]]; then
    echo "🔨 Cần build lại:"
    echo "   ./build-production.sh"
    echo "   hoặc"
    echo "   npm run build:production"
elif [[ ! -d "dist/assets" ]]; then
    echo "🔨 Build bị lỗi, cần build lại với cấu hình đúng"
    echo "   ./rebuild-and-restart.sh"
else
    echo "🔧 Cần cập nhật cấu hình Nginx và restart:"
    echo "   ./rebuild-and-restart.sh"
    echo "   hoặc"
    echo "   ./deploy.sh --skip-build --force-root"
fi