#!/bin/bash

# Script kiểm tra trạng thái build và đưa ra khuyến nghị

set -e

echo "🔍 Kiểm tra trạng thái build..."
echo "================================"

# Kiểm tra thư mục dist
if [[ -d "dist" ]]; then
    if [[ -f "dist/index.html" ]]; then
        # Tính tuổi của build
        local build_date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" dist/index.html 2>/dev/null || stat -c "%y" dist/index.html 2>/dev/null || echo "unknown")
        local build_size=$(du -sh dist 2>/dev/null | cut -f1 || echo "unknown")
        
        echo "✅ Build tồn tại:"
        echo "   📅 Ngày tạo: $build_date"
        echo "   📊 Kích thước: $build_size"
        echo "   📁 Vị trí: $(pwd)/dist"
        
        # Kiểm tra tuổi của build
        if [[ -n "$(find dist -name "index.html" -mtime +1 2>/dev/null)" ]]; then
            echo "⚠️  Build cũ hơn 1 ngày - nên build lại"
        else
            echo "✅ Build còn mới (dưới 1 ngày)"
        fi
        
        # Kiểm tra git changes
        if [[ -d ".git" ]]; then
            if ! git diff --quiet || ! git diff --cached --quiet; then
                echo "⚠️  Có thay đổi code chưa commit - nên build lại"
            else
                echo "✅ Không có thay đổi code uncommitted"
            fi
        fi
        
    else
        echo "❌ Thư mục dist tồn tại nhưng thiếu index.html"
        echo "   🔧 Cần build lại"
    fi
else
    echo "❌ Không có thư mục dist"
    echo "   🔧 Cần build lần đầu"
fi

echo ""
echo "📋 Khuyến nghị:"

if [[ -f "dist/index.html" ]]; then
    echo "✅ CÓ THỂ bỏ qua build nếu:"
    echo "   - Không có thay đổi code mới"
    echo "   - Chỉ thay đổi cấu hình server"
    echo "   - Đang test deployment process"
    echo ""
    echo "🚀 Lệnh deploy không build:"
    echo "   ./deploy.sh --skip-build --force-root"
    echo ""
    echo "❌ NÊN BUILD LẠI nếu:"
    echo "   - Có thay đổi code"
    echo "   - Build cũ hơn 1 ngày"
    echo "   - Thay đổi dependencies"
    echo ""
    echo "🔨 Lệnh chỉ build:"
    echo "   ./deploy.sh --build-only --force-root"
else
    echo "🔨 BẮT BUỘC phải build vì không có build hiện tại"
    echo ""
    echo "🚀 Lệnh build đầy đủ:"
    echo "   ./deploy.sh --force-root"
fi