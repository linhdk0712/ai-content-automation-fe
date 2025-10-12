# Frontend Docker Setup

## Tổng quan

Frontend được containerized sử dụng multi-stage Docker build với Nginx để serve static files.

## Cấu hình

### Environment Variables

Các biến môi trường được định nghĩa trong file `.env`:

```bash
# API Configuration
VITE_API_BASE_URL=/api/v1                    # API endpoint (relative path)
VITE_SUPABASE_URL=https://...                # Supabase URL
VITE_SUPABASE_ANON_KEY=...                   # Supabase anonymous key

# WebSocket & Realtime
VITE_WS_URL=ws://180.93.138.113:8080/ws      # WebSocket URL
VITE_REALTIME_SERVER_URL=http://180.93.138.113:3001  # Realtime server

# Environment
VITE_NODE_ENV=production                     # Build environment
NODE_ENV=production                          # Node environment
```

### Base Path

Application được cấu hình với base path `/app/` trong `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/app/',
  // ...
})
```

## Build & Deploy

### Sử dụng Script

```bash
# Build image
./docker-build.sh

# Build và chạy container
./docker-build.sh --run

# Sử dụng docker-compose
./docker-build.sh --compose
```

### Manual Commands

```bash
# Build image
docker build -t ai-content-frontend .

# Run container
docker run -d \
  --name frontend \
  -p 3000:3000 \
  --network ai-content-net \
  ai-content-frontend

# Sử dụng docker-compose
docker-compose up -d
```

## Nginx Configuration

Container sử dụng Nginx với cấu hình:

- **Port**: 3000
- **Base path**: `/app/`
- **SPA routing**: Tất cả routes được redirect về `index.html`
- **API proxy**: `/api/` được proxy tới `auth-service:8081`
- **Static caching**: 1 năm cho assets
- **Security headers**: Được thêm tự động

## Truy cập

- **Frontend**: http://localhost:3000/app/
- **Health check**: http://localhost:3000/app/

## Troubleshooting

### Build Issues

1. **Node version**: Sử dụng Node 20 LTS
2. **Dependencies**: Chạy `npm ci` thay vì `npm install`
3. **Environment**: Đảm bảo file `.env` tồn tại

### Runtime Issues

1. **API connection**: Kiểm tra network `ai-content-net`
2. **Base path**: Đảm bảo truy cập qua `/app/`
3. **CORS**: Nginx đã cấu hình CORS headers

### Logs

```bash
# Container logs
docker logs -f frontend

# Nginx access logs
docker exec frontend tail -f /var/log/nginx/access.log

# Nginx error logs
docker exec frontend tail -f /var/log/nginx/error.log
```

## Network

Container cần kết nối với network `ai-content-net` để giao tiếp với các services khác:

```bash
# Tạo network nếu chưa có
docker network create ai-content-net
```

## Health Check

Container có health check tự động:
- **Endpoint**: `http://localhost:3000/app/`
- **Interval**: 30s
- **Timeout**: 10s
- **Retries**: 3