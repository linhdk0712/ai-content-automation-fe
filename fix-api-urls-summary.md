# API URL Fix Summary

## Vấn đề
Frontend đang gửi request đến URL bị duplicate `/api/v1`:
- URL sai: `http://localhost:3000/api/v1/api/v1/templates`
- URL đúng: `http://localhost:3000/api/v1/templates`

## Nguyên nhân
- File `api.ts` đã cấu hình `baseURL: '/api/v1'`
- Một số service lại thêm `/api/v1` vào URL, gây ra duplicate

## Đã sửa

### 1. template.service.ts ✅
**Trước:**
```typescript
await api.get('/api/v1/templates', { params: searchRequest });
await api.get('/api/v1/templates/categories');
await api.get('/api/v1/templates/my-templates');
```

**Sau:**
```typescript
await api.get('/templates', { params: searchRequest });
await api.get('/templates/categories');
await api.get('/templates/my-templates');
```

### 2. advancedAnalytics.service.ts ✅
**Trước:**
```typescript
const BASE_URL = '/api/v1/analytics/advanced';
api.get(`${BASE_URL}/dashboard`) // → /api/v1/api/v1/analytics/advanced/dashboard
```

**Sau:**
```typescript
const BASE_URL = '/analytics/advanced';
api.get(`${BASE_URL}/dashboard`) // → /api/v1/analytics/advanced/dashboard
```

### 3. collaborativeEditing.service.ts ✅
**Trước:**
```typescript
private baseUrl = '/api/v1/collaboration';
api.post(`${this.baseUrl}/sessions`) // → /api/v1/api/v1/collaboration/sessions
```

**Sau:**
```typescript
private baseUrl = '/collaboration';
api.post(`${this.baseUrl}/sessions`) // → /api/v1/collaboration/sessions
```

## Không cần sửa

### Files sử dụng fetch() trực tiếp ✅
Các file sau sử dụng `fetch()` trực tiếp (không qua API instance) nên cần giữ `/api/v1`:
- `pushNotifications.service.ts`
- `backgroundSync.service.ts`
- `performanceMonitoring.service.ts`
- `pwa.service.ts`
- `offline.service.ts`
- `useAnalytics.ts`
- `useAdvancedFeatures.ts`

### auth.service.ts ✅
File này sử dụng `/api/v1` cho OAuth URL là đúng vì không đi qua API instance.

## Kết quả
Sau khi sửa, các API call sẽ có URL đúng:
- ✅ `GET /api/v1/templates`
- ✅ `GET /api/v1/templates/categories`
- ✅ `GET /api/v1/templates/my-templates`
- ✅ `POST /api/v1/analytics/advanced/dashboard`
- ✅ `POST /api/v1/collaboration/sessions`

## Kiểm tra
Để kiểm tra xem còn URL nào bị duplicate:
```bash
# Tìm các service sử dụng api instance với /api/v1
grep -r "api\.(get|post|put|delete).*'/api/v1" frontend/src/services/

# Kết quả mong đợi: không có kết quả nào
```