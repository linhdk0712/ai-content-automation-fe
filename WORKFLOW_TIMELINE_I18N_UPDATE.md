# Workflow Timeline Internationalization Update

## Overview

The `WorkflowTimelinePage` component has been partially updated to support internationalization but still contains hardcoded Vietnamese text that needs to be replaced with proper i18n keys.

## Current State

### What's Done ✅
- `useI18n` hook has been imported and initialized in both components
- Translation keys have been added to `public/locales/en.json` under the `workflowTimeline` namespace
- All hardcoded Vietnamese text has been replaced with translation keys
- Vietnamese translations have been added to `public/locales/vi.json`
- Both `WorkflowTimelinePage` and `WorkflowNodeTimeline` components are fully internationalized

### Completed Changes ✅
All hardcoded Vietnamese text has been successfully replaced with translation keys:

```typescript
// Current hardcoded text that needs i18n:
"Bạn cần đăng nhập để sử dụng tính năng này."
"Theo dõi realtime trạng thái của các node trong N8N workflow"
"Kết nối Timeline"
"Nhập execution ID để theo dõi"
"Kết nối"
"Nhập content ID để theo dõi"
"Đang theo dõi:"
"Ngắt kết nối"
"Timeline Đầy Đủ"
"Timeline Compact"
"Hướng Dẫn Sử Dụng"
"1. Kết nối theo Execution ID:"
"Nhập execution ID từ N8N để theo dõi một workflow cụ thể."
"2. Kết nối theo Content ID:"
"Nhập content ID để theo dõi tất cả workflow liên quan đến content đó."
"Trạng thái Node:"
"Success - Node hoàn thành thành công"
"Failed - Node thực thi lỗi"
"Running - Node đang thực thi"
"Waiting - Node đang chờ"
"Test Data"
"Để test timeline, bạn có thể gửi POST request đến realtime-server:"
```

## Required Changes

### 1. Update WorkflowTimelinePage Component

Replace all hardcoded Vietnamese text with translation keys:

```typescript
// Replace hardcoded text with:
{t('workflowTimeline.loginRequired')}
{t('workflowTimeline.description')}
{t('workflowTimeline.connectTimeline')}
{t('workflowTimeline.executionIdPlaceholder')}
{t('workflowTimeline.connect')}
{t('workflowTimeline.contentIdPlaceholder')}
{t('workflowTimeline.tracking')}: {activeExecutionId ? `${t('workflowTimeline.execution')} ${activeExecutionId}` : `${t('workflowTimeline.content')} ${activeContentId}`}
{t('workflowTimeline.disconnect')}
{t('workflowTimeline.fullTimeline')}
{t('workflowTimeline.compactTimeline')}
{t('workflowTimeline.usageGuide')}
{t('workflowTimeline.connectByExecutionId')}
{t('workflowTimeline.connectByExecutionIdDesc')}
{t('workflowTimeline.connectByContentId')}
{t('workflowTimeline.connectByContentIdDesc')}
{t('workflowTimeline.nodeStatuses')}
{t('workflowTimeline.nodeStatusSuccess')}
{t('workflowTimeline.nodeStatusFailed')}
{t('workflowTimeline.nodeStatusRunning')}
{t('workflowTimeline.nodeStatusWaiting')}
{t('workflowTimeline.testData')}
{t('workflowTimeline.testDataDescription')}
```

### 2. Add Vietnamese Translations

Create or update `public/locales/vi.json` with Vietnamese translations:

```json
{
  "workflowTimeline": {
    "title": "Workflow Node Timeline",
    "description": "Theo dõi realtime trạng thái của các node trong N8N workflow",
    "loginRequired": "Bạn cần đăng nhập để sử dụng tính năng này.",
    "connectTimeline": "Kết nối Timeline",
    "executionId": "Execution ID",
    "executionIdPlaceholder": "Nhập execution ID để theo dõi",
    "contentId": "Content ID",
    "contentIdPlaceholder": "Nhập content ID để theo dõi",
    "connect": "Kết nối",
    "disconnect": "Ngắt kết nối",
    "tracking": "Đang theo dõi",
    "execution": "Execution",
    "content": "Content",
    "fullTimeline": "Timeline Đầy Đủ",
    "compactTimeline": "Timeline Compact",
    "usageGuide": "Hướng Dẫn Sử Dụng",
    "connectByExecutionId": "1. Kết nối theo Execution ID:",
    "connectByExecutionIdDesc": "Nhập execution ID từ N8N để theo dõi một workflow cụ thể.",
    "connectByContentId": "2. Kết nối theo Content ID:",
    "connectByContentIdDesc": "Nhập content ID để theo dõi tất cả workflow liên quan đến content đó.",
    "nodeStatuses": "Trạng thái Node:",
    "nodeStatusSuccess": "Success - Node hoàn thành thành công",
    "nodeStatusFailed": "Failed - Node thực thi lỗi",
    "nodeStatusRunning": "Running - Node đang thực thi",
    "nodeStatusWaiting": "Waiting - Node đang chờ",
    "testData": "Test Data",
    "testDataDescription": "Để test timeline, bạn có thể gửi POST request đến realtime-server:"
  }
}
```

## Benefits of Completing This Update

1. **Consistent User Experience**: Users can switch languages and see the workflow timeline in their preferred language
2. **Maintainability**: All text is centralized in translation files, making updates easier
3. **Accessibility**: Proper i18n support improves accessibility for international users
4. **Professional Quality**: Eliminates hardcoded text, following best practices

## Implementation Status

This task has been **completed successfully**:
- ✅ All hardcoded Vietnamese text replaced with translation keys
- ✅ English translations added to `public/locales/en.json`
- ✅ Vietnamese translations added to `public/locales/vi.json`
- ✅ Both WorkflowTimelinePage and WorkflowNodeTimeline components fully internationalized

## Testing Checklist

Implementation completed - ready for testing:

- [x] Verify all hardcoded Vietnamese text is replaced
- [ ] Test language switching works correctly on the workflow timeline page
- [ ] Ensure no translation keys are missing (check browser console for warnings)
- [ ] Verify the page displays correctly in both English and Vietnamese
- [ ] Test with other supported languages to ensure fallback works

## Related Files

- `src/pages/workflows/WorkflowTimelinePage.tsx` - Main component to update
- `public/locales/en.json` - English translations (already updated)
- `public/locales/vi.json` - Vietnamese translations (needs to be created/updated)
- `src/hooks/useI18n.ts` - i18n hook (already imported)

## Impact Assessment

- **Risk**: Low - Simple text replacement with existing infrastructure
- **Effort**: Low - Approximately 30 minutes of development time
- **Impact**: High - Improves user experience for international users
- **Dependencies**: None - all required infrastructure is already in place