# Content ID Fix - UUID Implementation

## Vấn đề
Trước đây, tất cả các workflow triggers đều sử dụng `contentId = 0` hardcoded, dẫn đến việc tất cả records trong database đều có `contentId = 0`.

## Nguyên nhân
Trong các file frontend:
- `ContentWorkflow.tsx`: `triggerAiAvatarWorkflow(0, workflowData)`
- `WorkflowDemo.tsx`: `triggerAiAvatarWorkflow(0, demoData)`
- `ContentCreator.tsx`: `triggerAiAvatarWorkflow(lastContentId ?? 0, contentData)` (có thể vẫn là 0)

## Giải pháp
Tạo utility functions để generate unique content IDs:

### 1. UUID Utils (`frontend/src/utils/uuid.ts`)
```typescript
// Generate UUID v4 standard
generateUUID(): string

// Generate short UUID (8 chars)
generateShortUUID(): string

// Generate numeric content ID based on timestamp + random
generateContentId(): number
```

### 2. Cập nhật các components
- **ContentWorkflow.tsx**: Tạo contentId mới cho mỗi workflow run
- **ContentCreator.tsx**: Sử dụng existing contentId hoặc tạo mới
- **WorkflowDemo.tsx**: Tạo contentId mới cho demo
- **ContentWorkflowSupabase.tsx.bak**: Cập nhật file backup

### 3. Content ID Generation Strategy
```typescript
// Sử dụng timestamp + random number để đảm bảo uniqueness
const contentId = generateContentId();
// Ví dụ: 1696598400123456 (timestamp + 3-digit random)
```

## Kết quả mong đợi
- Mỗi workflow run sẽ có contentId unique
- Database sẽ không còn records với contentId = 0
- Có thể track và debug workflows dễ dàng hơn
- Backend đã sẵn sàng xử lý contentId (không cần thay đổi)

## Testing
- Unit tests cho UUID functions
- Manual testing với workflow triggers
- Kiểm tra database records có contentId đúng

## Backward Compatibility
- Existing records với contentId = 0 vẫn hoạt động bình thường
- Không breaking changes cho API
- Frontend sẽ tự động sử dụng contentId mới cho các workflow mới

## Usage Examples

### ContentWorkflow.tsx
```typescript
// Trước
const run = await triggerAiAvatarWorkflow(0, workflowData);

// Sau
const contentId = generateContentId();
const run = await triggerAiAvatarWorkflow(contentId, workflowData);
```

### ContentCreator.tsx
```typescript
// Trước
const run = await triggerAiAvatarWorkflow(lastContentId ?? 0, contentData);

// Sau
const contentId = lastContentId || generateContentId();
const run = await triggerAiAvatarWorkflow(contentId, contentData);
```

## Monitoring
Có thể monitor trong browser console:
```
Generated content ID for workflow: 1696598400123456
Using content ID for workflow: 1696598400789012
```