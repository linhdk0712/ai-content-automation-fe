# ResponseBase<T> Migration Guide - Frontend

## Tổng quan

Frontend đã được cập nhật để xử lý cấu trúc phản hồi `ResponseBase<T>` mới từ backend thay vì format `ApiResponse` cũ.

## Cấu trúc ResponseBase<T>

### Backend Format (Java)
```java
public class ResponseBase<T> {
    private String errorCode = "SUCCESS";
    private String errorMessage = "Operation completed successfully";
    private T data;
}
```

### Frontend Type (TypeScript)
```typescript
export interface ResponseBase<T = unknown> {
  errorCode: string // "SUCCESS" for success, specific error code for errors
  errorMessage: string // "Operation completed successfully" for success, error message for errors
  data: T | null
}
```

## So sánh Format Cũ vs Mới

### Format Cũ (ApiResponse)
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Format Mới (ResponseBase)

**Success Response:**
```json
{
  "errorCode": "SUCCESS",
  "errorMessage": "Operation completed successfully",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "errorCode": "AUTHENTICATION_FAILED",
  "errorMessage": "Invalid username/email or password",
  "data": null
}
```

## Các Thay đổi Chính

### 1. API Types
- ✅ Thêm `ResponseBase<T>` interface
- ✅ Giữ lại `ApiResponse<T>` cho backward compatibility
- ✅ Cập nhật tất cả service types

### 2. API Service (api.ts)
- ✅ Cập nhật `extractResponseData()` để xử lý cả hai format
- ✅ Cập nhật `createApiError()` để xử lý ResponseBase errors
- ✅ Thêm automatic notification handling
- ✅ Enhanced error interceptor

### 3. Notification System
- ✅ Tạo `NotificationService` mới
- ✅ Tạo `useNotifications` hook
- ✅ Tạo `NotificationContainer` component
- ✅ Automatic error/success notifications

### 4. API Helpers
- ✅ Tạo `api-helpers.ts` với convenience methods
- ✅ Automatic loading/success/error notifications
- ✅ Specialized operations (create, update, delete, etc.)

## Cách Sử dụng

### 1. Basic API Calls
```typescript
import { apiRequest } from '../services/api'

// Automatic ResponseBase handling
const data = await apiRequest.get<UserProfile>('/auth/me')
const result = await apiRequest.post<ContentResponse>('/content', contentData)
```

### 2. With Notifications
```typescript
import { apiOperations } from '../utils/api-helpers'

// Automatic success/error notifications
const content = await apiOperations.create<ContentResponse>(
  '/content', 
  contentData, 
  'Content'
)
```

### 3. Custom Notification Handling
```typescript
import { apiHelpers } from '../utils/api-helpers'

const content = await apiHelpers.post<ContentResponse>('/content', data, {
  showSuccessNotification: true,
  successMessage: 'Content created successfully!',
  loadingMessage: 'Creating content...'
})
```

### 4. Using Notification Hook
```typescript
import { useNotifications } from '../hooks/useNotifications'

const { showSuccess, showError, notifications } = useNotifications()

// Manual notifications
showSuccess('Operation completed!')
showError('Something went wrong')
```

## Error Handling

### ResponseBase Error Detection
Frontend sử dụng quy tắc đơn giản:
- **`errorCode = "SUCCESS"`** → Thành công
- **`errorCode ≠ "SUCCESS"`** → Lỗi, hiển thị `errorMessage`

### Automatic Error Notifications
```typescript
// Errors are automatically detected and shown as notifications
try {
  await apiRequest.post('/content', data)
  // Success: errorCode = "SUCCESS" → No error thrown
} catch (error) {
  // Error: errorCode ≠ "SUCCESS" → Error thrown with errorMessage
  console.error('Operation failed:', error.message) // Shows specific errorMessage
}
```

### Custom Error Handling
```typescript
import { errorHandlers } from '../utils/api-helpers'

try {
  await apiRequest.post('/content', data)
} catch (error) {
  errorHandlers.handleValidationError(error)
  errorHandlers.handlePermissionError(error)
  errorHandlers.handleNotFoundError(error, 'Content')
}
```

## HTTP Status Code Mapping

| Status | Notification Type | Auto-shown |
|--------|------------------|------------|
| 200-299 | Success (Green) | Optional |
| 400 | Error (Red) | Yes |
| 401 | Error (Red) | No (handled by auth) |
| 403 | Error (Red) | Yes |
| 404 | Error (Red) | Yes |
| 422 | Error (Red) | Yes |
| 429 | Warning (Yellow) | Yes |
| 500+ | Error (Red) | Yes |

## Error Codes từ Backend

### Success Code
- `SUCCESS` - Nghiệp vụ xử lý thành công

### Error Codes
Backend trả về các error codes cụ thể khi có lỗi:
- `REGISTRATION_FAILED` - Đăng ký thất bại
- `AUTHENTICATION_FAILED` - Xác thực thất bại  
- `ACCESS_DENIED` - Không có quyền truy cập
- `ACCOUNT_LOCKED` - Tài khoản bị khóa
- `CONTENT_NOT_FOUND` - Không tìm thấy nội dung
- `VALIDATION_ERROR` - Lỗi validation
- `CREATE_CONTENT_ERROR` - Lỗi tạo nội dung
- `UPDATE_CONTENT_ERROR` - Lỗi cập nhật nội dung
- `DELETE_CONTENT_ERROR` - Lỗi xóa nội dung
- etc.

**Quy tắc:** `errorMessage` luôn chứa thông tin lỗi cụ thể để hiển thị cho user.

## Migration Checklist

### ✅ Completed
- [x] Cập nhật API types
- [x] Cập nhật API service
- [x] Tạo notification system
- [x] Cập nhật auth service
- [x] Tạo API helpers
- [x] Tạo example components
- [x] Thêm NotificationContainer vào App

### 🔄 In Progress
- [ ] Cập nhật tất cả services khác
- [ ] Cập nhật tất cả components
- [ ] Testing với backend mới
- [ ] Performance optimization

### 📋 TODO
- [ ] Cập nhật unit tests
- [ ] Cập nhật integration tests
- [ ] Documentation cho team
- [ ] Training cho developers

## Best Practices

### 1. API Calls
```typescript
// ✅ Good - Use apiOperations for common operations
const content = await apiOperations.create('/content', data, 'Content')

// ✅ Good - Use apiHelpers for custom notifications
const data = await apiHelpers.get('/data', {
  showSuccessNotification: false,
  showErrorNotification: true
})

// ❌ Avoid - Direct axios calls
const response = await axios.post('/content', data)
```

### 2. Error Handling
```typescript
// ✅ Good - Let automatic notifications handle common errors
try {
  await apiOperations.create('/content', data, 'Content')
} catch (error) {
  // Only handle specific business logic errors
  if (error.code === 'CONTENT_LIMIT_EXCEEDED') {
    // Handle specific error
  }
}

// ❌ Avoid - Manual error notifications for common errors
try {
  await apiRequest.post('/content', data)
} catch (error) {
  showError(error.message) // This is already handled automatically
}
```

### 3. Loading States
```typescript
// ✅ Good - Use built-in loading notifications
await apiOperations.create('/content', data, 'Content')

// ✅ Good - Custom loading with state
const [loading, setLoading] = useState(false)
try {
  setLoading(true)
  await apiHelpers.post('/content', data, {
    loadingMessage: 'Creating content...'
  })
} finally {
  setLoading(false)
}
```

## Troubleshooting

### Common Issues

1. **Notifications not showing**
   - Ensure `NotificationContainer` is added to App.tsx
   - Check if `showNotification` option is enabled

2. **Type errors**
   - Update imports to use `ResponseBase<T>`
   - Check if service methods return correct types

3. **Error handling not working**
   - Verify error interceptor is properly configured
   - Check if error codes match backend implementation

### Debug Mode
```typescript
// Enable debug logging
localStorage.setItem('debug_api', 'true')

// Check notifications state
import { notificationService } from '../services/notification.service'
console.log(notificationService.getAll())
```

## Performance Considerations

- Notifications are automatically cleaned up
- API calls include retry logic with exponential backoff
- Loading states prevent duplicate requests
- Error notifications are debounced

## Browser Support

- Modern browsers (ES2018+)
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+