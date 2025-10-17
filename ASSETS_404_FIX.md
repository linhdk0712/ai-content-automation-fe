# Sửa Lỗi Assets 404

## Vấn đề
```
GET http://180.93.138.113:4173/assets/index-BLKU6d23.js net::ERR_ABORTED 404 (Not Found)
GET http://180.93.138.113:4173/assets/vendor-CYwq7WHk.js net::ERR_ABORTED 404 (Not Found)
GET http://180.93.138.113:4173/assets/style-BPNxKmSr.css net::ERR_ABORTED 404 (Not Found)
```

## Nguyên nhân
1. **Base path sai**: Vite config có `base: '/app/'` nhưng server serve từ `/`
2. **Nginx config sai**: Root directory không trỏ đúng vào thư mục `dist`
3. **Build cũ**: Build với cấu hình cũ chưa được cập nhật

## Giải pháp

### Bước 1: Chẩn đoán
```bash
./fix-assets.sh
```

### Bước 2: Sửa nhanh (Khuyến nghị)
```bash
./rebuild-and-restart.sh
```

### Bước 3: Hoặc sửa từng bước

#### 3.1. Build lại với cấu hình mới
```bash
# Clean build
rm -rf dist

# Build với cấu hình đã sửa
npm run build:production
```

#### 3.2. Cập nhật Nginx config
```bash
# Deploy lại chỉ cấu hình
./deploy.sh --skip-build --force-root
```

#### 3.3. Restart services
```bash
pm2 restart ai-content-frontend
sudo systemctl reload nginx
```

## Kiểm tra kết quả

### Kiểm tra build
```bash
ls -la dist/
ls -la dist/assets/
```

### Kiểm tra Nginx config
```bash
sudo nginx -t
grep "root " /etc/nginx/sites-available/ai-content-frontend
```

### Kiểm tra truy cập
```bash
curl -I http://localhost/
curl -I http://localhost/assets/
```

## Các thay đổi đã thực hiện

### 1. Vite Config (`vite.config.ts`)
```typescript
// Trước
base: (isDocker || isVercel || isDevelopment) ? '/' : '/app/',

// Sau  
base: '/', // Always use root path
```

### 2. Nginx Config (trong `deploy.sh`)
```nginx
# Trước
root /var/www/html;

# Sau
root /path/to/frontend/dist;
```

### 3. Scripts mới
- `fix-assets.sh` - Chẩn đoán lỗi
- `rebuild-and-restart.sh` - Sửa nhanh
- `check-build.sh` - Kiểm tra build

## Ngăn ngừa lỗi tương lai

### 1. Luôn kiểm tra sau khi deploy
```bash
./fix-assets.sh
```

### 2. Test local trước khi deploy
```bash
npm run build:production
npm run preview
# Kiểm tra http://localhost:4173
```

### 3. Sử dụng consistent base path
- Development: `/`
- Production: `/`
- Docker: `/`

## Troubleshooting

### Nếu vẫn lỗi 404:
1. Kiểm tra quyền truy cập file: `ls -la dist/`
2. Kiểm tra Nginx error log: `sudo tail -f /var/log/nginx/error.log`
3. Kiểm tra PM2 logs: `pm2 logs ai-content-frontend`

### Nếu build fail:
1. Tăng memory: `export NODE_OPTIONS="--max-old-space-size=6144"`
2. Clean cache: `npm cache clean --force`
3. Reinstall: `rm -rf node_modules && npm install`