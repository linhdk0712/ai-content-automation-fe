# React-Toastify Integration Guide

## Tổng quan

React-Toastify đã được tích hợp thành công vào ứng dụng để đồng nhất việc hiển thị thông báo. Hệ thống mới cung cấp:

- **Giao diện đồng nhất**: Tất cả thông báo sử dụng cùng một style và animation
- **Tính năng nâng cao**: Loading states, actions, persistent notifications
- **Tương thích ngược**: Hỗ trợ migration từ hệ thống cũ
- **Responsive**: Tối ưu cho mobile và desktop
- **Accessibility**: Hỗ trợ screen readers và keyboard navigation

## Cách sử dụng

### 1. Hook useToast (Cho toasts đơn giản)

```typescript
import { useToast } from '../hooks/useToast'

function MyComponent() {
  const toast = useToast()

  const handleSave = async () => {
    try {
      await saveData()
      toast.saveSuccess('Document')
    } catch (error) {
      toast.saveError('Failed to save document')
    }
  }

  return (
    <button onClick={handleSave}>Save</button>
  )
}
```

### 1.1. Hook useCustomToast (Cho toasts phức tạp với actions)

```typescript
import { useCustomToast } from '../hooks/useCustomToast'

function MyComponent() {
  const customToast = useCustomToast()

  const handleFailedOperation = () => {
    customToast.errorWithRetry(
      'Operation failed',
      () => retryOperation(),
      'Error'
    )
  }

  const handleWarning = () => {
    customToast.persistentWarning(
      'Please review your settings',
      'Configuration Warning'
    )
  }

  return (
    <div>
      <button onClick={handleFailedOperation}>Test Error with Retry</button>
      <button onClick={handleWarning}>Test Persistent Warning</button>
    </div>
  )
}
```

### 2. Toast Service (Direct)

```typescript
import { toastService } from '../services/toast.service'

// Basic usage
toastService.success('Operation completed!')
toastService.error('Something went wrong')
toastService.warning('Please check your input')
toastService.info('New feature available')

// With options
toastService.success('Data saved', {
  title: 'Success',
  autoClose: 3000
})

// With actions
toastService.error('Operation failed', {
  title: 'Error',
  actions: [{
    label: 'Retry',
    action: () => retryOperation(),
    style: 'primary'
  }]
})
```

### 3. NotificationContext (Backward Compatible)

```typescript
import { useNotification } from '../contexts/NotificationContext'

function MyComponent() {
  const { showSuccess, showError } = useNotification()

  const handleAction = () => {
    showSuccess('Action completed successfully!')
  }

  return (
    <button onClick={handleAction}>Do Action</button>
  )
}
```

## Các loại thông báo

### Basic Toasts

```typescript
// Success - màu xanh lá
toast.success('Operation completed successfully')

// Error - màu đỏ
toast.error('Something went wrong')

// Warning - màu vàng
toast.warning('Please check your input')

// Info - màu xanh dương
toast.info('New update available')
```

### Loading Toasts

```typescript
// Loading toast
const loadingId = toast.loading('Processing...')

// Update loading toast
setTimeout(() => {
  toast.update(loadingId, 'Completed!', 'success')
}, 2000)
```

### Promise Toasts

```typescript
// Automatically handles loading, success, and error states
toast.promise(
  fetchData(),
  {
    pending: 'Loading data...',
    success: 'Data loaded successfully!',
    error: 'Failed to load data'
  }
)
```

### Persistent Toasts

```typescript
// Toast that doesn't auto-dismiss
toast.error('Critical error occurred', {
  persistent: true,
  actions: [{
    label: 'Reload Page',
    action: () => window.location.reload(),
    style: 'primary'
  }]
})
```

## Convenience Methods

### CRUD Operations

```typescript
// Save operations
toast.saveSuccess('Document')  // "Document saved successfully"
toast.saveError('Network timeout')

// Delete operations
toast.deleteSuccess('Item')    // "Item deleted successfully"
toast.deleteError('Permission denied')

// Load operations
toast.loadError('Failed to fetch data')
```

### Authentication

```typescript
toast.authError()        // Shows login prompt
toast.permissionError()  // Access denied message
```

### Network

```typescript
toast.networkError()     // Network error with retry option
```

### Validation

```typescript
toast.validationError('Please fill all required fields')
```

## API Integration

### ResponseBase Pattern

```typescript
// Automatically handles ResponseBase format
toast.response(
  response.status,
  response.errorCode,
  response.errorMessage,
  'Operation completed successfully'
)
```

### API Errors

```typescript
try {
  await apiCall()
} catch (error) {
  toast.apiError(error)  // Automatically formats API errors
}
```

## Advanced Features

### Custom Actions

```typescript
toast.error('Upload failed', {
  title: 'Upload Error',
  actions: [
    {
      label: 'Retry',
      action: () => retryUpload(),
      style: 'primary'
    },
    {
      label: 'Choose Different File',
      action: () => openFileDialog(),
      style: 'secondary'
    }
  ]
})
```

### Custom Styling

```typescript
toast.success('Custom styled toast', {
  className: 'my-custom-toast',
  bodyClassName: 'my-custom-body',
  progressClassName: 'my-custom-progress'
})
```

### Position and Timing

```typescript
toast.info('Custom positioned toast', {
  position: 'bottom-left',
  autoClose: 10000,
  hideProgressBar: true
})
```

## Migration từ hệ thống cũ

### Material-UI Snackbar

```typescript
// Cũ
const { showSuccess, showError } = useNotification()
showSuccess('Success message')

// Mới (tương thích ngược)
const { showSuccess, showError } = useNotification()
showSuccess('Success message')  // Tự động sử dụng React-Toastify
```

### Notification Service

```typescript
// Cũ
import { notificationService } from '../services/notification.service'
notificationService.showSuccess('Message')

// Mới
import { toastService } from '../services/toast.service'
toastService.success('Message')

// Hoặc sử dụng hook
const toast = useToast()
toast.success('Message')
```

## Best Practices

### 1. Sử dụng Convenience Methods

```typescript
// Tốt
toast.saveSuccess('Document')

// Không tốt
toast.success('Document saved successfully')
```

### 2. Xử lý Errors Properly

```typescript
// Tốt
try {
  await operation()
  toast.saveSuccess('Data')
} catch (error) {
  toast.apiError(error)  // Tự động format error
}

// Không tốt
try {
  await operation()
  toast.success('Success')
} catch (error) {
  toast.error('Error')  // Không cung cấp thông tin hữu ích
}
```

### 3. Sử dụng Promise Toasts cho Async Operations

```typescript
// Tốt
toast.promise(
  saveDocument(),
  {
    pending: 'Saving document...',
    success: 'Document saved successfully!',
    error: 'Failed to save document'
  }
)

// Không tốt
const loadingId = toast.loading('Saving...')
try {
  await saveDocument()
  toast.update(loadingId, 'Saved!', 'success')
} catch (error) {
  toast.update(loadingId, 'Failed!', 'error')
}
```

### 4. Cung cấp Actions cho Critical Errors

```typescript
toast.error('Server connection lost', {
  persistent: true,
  actions: [{
    label: 'Retry',
    action: () => window.location.reload(),
    style: 'primary'
  }]
})
```

## Testing

### Demo Component

Truy cập `/toast-demo` để test tất cả tính năng:

- Basic toasts với các loại khác nhau
- Advanced features (actions, persistent, loading)
- API integration examples
- Migration helpers
- Common business scenarios

### Manual Testing

```typescript
// Test trong console
import { toastService } from './services/toast.service'

// Test basic
toastService.success('Test success')
toastService.error('Test error')

// Test với actions
toastService.error('Test with actions', {
  actions: [{
    label: 'Test Action',
    action: () => console.log('Action clicked'),
    style: 'primary'
  }]
})
```

## Customization

### Theme Colors

Chỉnh sửa trong `frontend/src/styles/toast.css`:

```css
/* Success toast */
.Toastify__toast--success.custom-toast {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}
```

### Animation

```css
/* Custom animation */
@keyframes customSlideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
```

### Mobile Responsive

```css
@media (max-width: 480px) {
  .Toastify__toast-container {
    width: 100vw;
    padding: 0 16px;
  }
}
```

## Troubleshooting

### Common Issues

1. **Toast không hiển thị**
   - Kiểm tra `ToastContainer` đã được thêm vào `main.tsx`
   - Kiểm tra CSS đã được import

2. **Styling không đúng**
   - Kiểm tra `toast.css` đã được import
   - Kiểm tra `toastClassName="custom-toast"` trong ToastContainer

3. **Actions không hoạt động**
   - Kiểm tra function được truyền vào action
   - Kiểm tra console để xem lỗi JavaScript

### Debug Mode

```typescript
// Enable debug logging
if (import.meta.env.DEV) {
  console.log('Toast service initialized')
}
```

## Performance

### Code Splitting

Toast service được lazy load để không ảnh hưởng đến bundle size ban đầu.

### Memory Management

- Toasts tự động cleanup sau khi dismiss
- Event listeners được properly removed
- No memory leaks với proper cleanup

## Accessibility

- Screen reader support
- Keyboard navigation
- High contrast mode support
- Reduced motion support
- Focus management

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Kết luận

React-Toastify đã được tích hợp thành công với:

✅ **Backward compatibility** - Hệ thống cũ vẫn hoạt động  
✅ **Enhanced features** - Loading, actions, persistence  
✅ **Better UX** - Consistent styling và animations  
✅ **Developer friendly** - Easy to use hooks và services  
✅ **Production ready** - Error handling và performance optimized  

Sử dụng `useToast()` hook cho các component mới và migration dần dần từ hệ thống cũ.