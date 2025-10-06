# Toast-Only Error Handling for Backend Integration

## Tổng quan

Frontend đã được cập nhật để **chỉ sử dụng Toast notifications** cho tất cả thông báo lỗi và thành công. Tất cả các Alert components, inline error displays, và notification systems khác đã được loại bỏ để đảm bảo consistent user experience thông qua toast system.

## Các thay đổi chính

### 1. Cập nhật API Types

**File**: `src/types/api.types.ts`

Cập nhật `ApiError` interface để match với `ErrorResponse` format từ backend:

```typescript
export interface ApiError {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
  errorCode?: string
  validationErrors?: Record<string, string>
  suggestions?: string[]
  documentationUrl?: string
  details?: Record<string, unknown>
  traceId?: string
}
```

### 2. Enhanced API Service

**File**: `src/services/api.ts`

- Cập nhật `createApiError()` function để xử lý ErrorResponse format mới
- Detect và parse backend ErrorResponse structure
- Maintain backward compatibility với legacy formats
- Enhanced error logging và debugging

### 3. Improved Error Handler

**File**: `src/utils/error-handler.ts`

**Cải tiến chính:**
- Process ErrorResponse format từ GlobalExceptionHandler
- Extract validation errors từ `validationErrors` field
- Support suggestions và documentation URLs
- Enhanced user messages với suggestions
- Trace ID support cho debugging

**New helper methods:**
```typescript
ValidationErrorHelper.getSuggestions(error)
ValidationErrorHelper.getDocumentationUrl(error)
ValidationErrorHelper.getTraceId(error)
```

### 4. Toast-Only Error Display

**Approach**: Tất cả errors và success messages được hiển thị qua Toast notifications

**Features:**
- Consistent error display across toàn bộ application
- Enhanced toast messages với field errors và suggestions
- Automatic error categorization và appropriate toast types
- No inline error components hoặc alert dialogs
- Clean UI without error state clutter

**Usage:**
```tsx
// Errors are automatically shown via toast through API service
try {
  await apiCall()
} catch (error) {
  // Error automatically displayed via toast
  // No manual error handling needed
}
```

### 5. Updated Components và Hooks

**All components và hooks updated to:**
- Remove inline error displays
- Remove Alert components cho errors
- Use toast-only approach
- Leverage useErrorHandler hook
- Automatic error processing và display

## Error Response Formats Supported

### 1. New ErrorResponse Format (Primary)

```json
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 400,
  "error": "Validation Error",
  "message": "Invalid input data",
  "path": "/api/v1/content",
  "errorCode": "VALIDATION_ERROR",
  "validationErrors": {
    "title": "Title is required",
    "email": "Email must be valid"
  },
  "suggestions": [
    "Check your input fields",
    "Ensure all required fields are filled"
  ],
  "documentationUrl": "https://docs.example.com/errors/validation_error"
}
```

### 2. ResponseBase Format (Legacy Support)

```json
{
  "errorCode": "VALIDATION_ERROR",
  "errorMessage": "Invalid input data",
  "data": null
}
```

### 3. ApiResponse Format (Legacy Support)

```json
{
  "success": false,
  "message": "Request failed",
  "data": null
}
```

## Error Types và Handling

### Authentication Errors (401)
- Automatic token refresh attempt
- Redirect to login if refresh fails
- Clear error message về session expiry

### Authorization Errors (403)
- Clear access denied message
- No retry option (not retryable)
- Suggestions về contacting admin

### Validation Errors (400)
- Field-level error display
- Suggestions từ backend
- Highlight problematic fields
- Documentation links

### Business Logic Errors (409, 422)
- Context-specific error messages
- Actionable suggestions
- State-specific guidance

### Server Errors (500+)
- Retry functionality
- Error tracking với trace IDs
- User-friendly messages
- Technical details for debugging

### Network Errors
- Connection status indication
- Retry với exponential backoff
- Offline handling

## User Experience Improvements

### 1. Better Error Messages
- User-friendly language thay vì technical jargon
- Contextual suggestions
- Clear action items

### 2. Visual Improvements
- Color-coded error types
- Appropriate icons
- Progressive disclosure of technical details

### 3. Actionable Errors
- Retry buttons cho retryable errors
- Documentation links
- Direct fixes cho validation errors

### 4. Developer Experience
- Comprehensive error logging
- Trace ID tracking
- Debug information
- Error categorization

## Testing

### Unit Tests
**File**: `src/test/enhanced-error-handling.test.ts`

Tests cover:
- ErrorResponse format parsing
- Error type detection
- Validation error extraction
- User message generation
- Suggestion và documentation URL handling

### Running Tests
```bash
npm run test:unit
npm run test:coverage
```

## Usage Examples

### Basic Error Handling
```tsx
const { error, setError, clearError } = useEnhancedError()

try {
  await apiCall()
} catch (err) {
  setError(err) // Automatically processes và logs error
}

return (
  <>
    {error && (
      <EnhancedErrorDisplay
        error={error}
        onRetry={() => {
          clearError()
          retryOperation()
        }}
      />
    )}
  </>
)
```

### Form Validation Errors
```tsx
const { fieldErrors, hasValidationErrors } = useEnhancedError()

return (
  <form>
    <TextField
      error={!!fieldErrors.title}
      helperText={fieldErrors.title}
      // ... other props
    />
    
    {hasValidationErrors && (
      <Alert severity="warning">
        Please fix the validation errors above
      </Alert>
    )}
  </form>
)
```

### API Service Usage
```tsx
// API service automatically handles ErrorResponse format
const data = await apiRequest.post('/content', contentData)

// Errors are automatically processed và thrown as ApiError
// with enhanced information from backend
```

## Migration Guide

### From Old Error Handling

1. **Replace manual error parsing:**
   ```tsx
   // Old
   catch (error) {
     setErrorMessage(error.response?.data?.message || 'Error occurred')
   }
   
   // New
   catch (error) {
     setError(error) // Automatically processed
   }
   ```

2. **Use EnhancedErrorDisplay instead of basic alerts:**
   ```tsx
   // Old
   {error && <Alert severity="error">{error}</Alert>}
   
   // New
   {error && <EnhancedErrorDisplay error={error} onRetry={handleRetry} />}
   ```

3. **Leverage validation error helpers:**
   ```tsx
   // Old
   const fieldError = error?.response?.data?.fieldErrors?.title
   
   // New
   const fieldError = ValidationErrorHelper.getFieldError(processedError, 'title')
   ```

## Best Practices

### 1. Error Handling
- Always use `useEnhancedError` hook cho consistent error handling
- Show suggestions when available
- Provide retry options cho retryable errors
- Log errors với proper context

### 2. User Experience
- Use appropriate error severity levels
- Show field-level errors inline
- Provide clear action items
- Don't overwhelm users với technical details

### 3. Development
- Include trace IDs trong error reports
- Use error codes cho programmatic handling
- Test error scenarios thoroughly
- Monitor error patterns

## Monitoring và Debugging

### Error Logging
- All errors are automatically logged với context
- Trace IDs help correlate frontend/backend errors
- Error patterns can be analyzed

### Debug Information
- Technical details available in collapsed sections
- Full error objects logged to console in development
- Error tracking integration ready

## Future Enhancements

### Planned Features
1. **Error Analytics Dashboard**
   - Error frequency tracking
   - User impact analysis
   - Error pattern detection

2. **Smart Error Recovery**
   - Automatic retry với intelligent backoff
   - Context-aware error handling
   - Predictive error prevention

3. **Enhanced User Guidance**
   - Interactive error resolution
   - Step-by-step fix guides
   - Video tutorials for common errors

4. **Integration Improvements**
   - Real-time error notifications
   - Error reporting to external services
   - Advanced error categorization

## Conclusion

Frontend hiện tại đã được enhanced để hoạt động seamlessly với backend Exception Handling system. Users sẽ có experience tốt hơn với:

- Clear, actionable error messages
- Helpful suggestions từ backend
- Easy retry mechanisms
- Better visual error presentation
- Comprehensive validation feedback

Developers cũng benefit từ:
- Consistent error handling patterns
- Better debugging information
- Automated error processing
- Comprehensive testing coverage