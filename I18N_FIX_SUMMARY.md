# Tóm tắt sửa lỗi i18n (Internationalization)

## Vấn đề
Hệ thống đang hiển thị các translation key thay vì text đã được dịch trong môi trường production, đặc biệt ở:
- Content Creator form (contentCreator.contentGeneration, contentCreator.contentSettings, etc.)
- Workflow page (workflow.title, workflow.description, etc.)

## Nguyên nhân
1. **Đường dẫn file translation sai**: i18nManager đang sử dụng `../locales/` thay vì `/locales/` trong production
2. **Thiếu translation keys**: Nhiều key được sử dụng trong components nhưng chưa được định nghĩa trong file translation
3. **Xử lý lỗi không đầy đủ**: Khi load translation thất bại, hệ thống không có fallback tốt

## Các thay đổi đã thực hiện

### 1. Sửa đường dẫn translation files
**File**: `src/utils/internationalization/i18nManager.ts`
```typescript
// Trước
const response = await fetch(`../locales/${languageCode}.json`);

// Sau  
const response = await fetch(`/locales/${languageCode}.json`);
```

### 2. Thêm translation keys thiếu

**File**: `public/locales/vi.json` và `public/locales/en.json`

#### Content Creator keys:
```json
{
  "contentCreator": {
    "contentGeneration": "Tạo nội dung / Content Generation",
    "contentSettings": "Cài đặt nội dung / Content Settings", 
    "styleAndLanguage": "Phong cách & Ngôn ngữ / Style & Language",
    "targetAudience": "Đối tượng mục tiêu / Target Audience",
    "readyToGenerate": "Sẵn sàng tạo nội dung / Ready to Generate",
    "enterPromptInstruction": "Nhập yêu cầu... / Enter your prompt...",
    "contentPrompt": "Yêu cầu nội dung / Content Prompt",
    "contentPromptPlaceholder": "Nhập yêu cầu... / Enter your prompt...",
    "contentPromptRequired": "Yêu cầu là bắt buộc / Prompt is required",
    "targetAudienceRequired": "Đối tượng mục tiêu là bắt buộc / Target audience is required"
  }
}
```

#### Workflow keys:
```json
{
  "workflow": {
    "title": "Quy trình làm việc / Workflow",
    "description": "Mô tả quy trình / Workflow description",
    "enterContentInfo": "Nhập thông tin nội dung / Enter Content Information",
    "titleRequired": "Tiêu đề (Bắt buộc) / Title (Required)",
    "titlePlaceholder": "Nhập tiêu đề... / Enter your title...",
    "contentRequired": "Nội dung (Bắt buộc) / Content (Required)", 
    "contentPlaceholder": "Nhập nội dung... / Enter your content...",
    "contentSettings": "Cài đặt nội dung / Content Settings",
    "styleAndAudience": "Phong cách & Đối tượng / Style & Audience",
    "selectIndustry": "Chọn ngành / Select Industry",
    "selectContentType": "Chọn loại nội dung / Select Content Type",
    "selectTone": "Chọn giọng điệu / Select Tone", 
    "selectTargetAudience": "Chọn đối tượng mục tiêu / Select Target Audience"
  }
}
```

### 3. Cải thiện xử lý lỗi
**File**: `src/App.tsx`
- Thêm logging để debug
- Thêm fallback về tiếng Anh khi load ngôn ngữ hiện tại thất bại

**File**: `src/utils/internationalization/i18nManager.ts`  
- Cải thiện method `t()` với fallback tốt hơn
- Thêm warning khi translation key không tìm thấy

### 4. Sửa ContentPreview component
**File**: `src/components/content/ContentPreview.tsx`
- Thêm `useI18n` hook
- Thay thế hardcoded text bằng translation keys

### 5. Thêm debug component
**File**: `src/components/debug/I18nDebug.tsx`
- Component để debug i18n issues trong production
- Accessible tại `/debug/i18n`

## Cách test

### 1. Local testing
```bash
npm run build
npm run preview
```

### 2. Production debugging
Truy cập: `http://your-domain/debug/i18n`

Component này sẽ hiển thị:
- Ngôn ngữ hiện tại
- Danh sách ngôn ngữ được hỗ trợ  
- Test load từng ngôn ngữ
- Test các translation key quan trọng

### 3. Deploy
```bash
./deploy-fix.sh
```

## Kết quả mong đợi
- Tất cả text hiển thị đúng ngôn ngữ thay vì translation keys
- Chuyển đổi ngôn ngữ hoạt động mượt mà
- Fallback về tiếng Anh khi có lỗi
- Debug component giúp troubleshoot issues

### 6. Sửa WorkflowTimeline components
**Files**: `src/pages/workflows/WorkflowTimelinePage.tsx`, `src/components/workflow/WorkflowNodeTimeline.tsx`
- Thêm `useI18n` hook
- Thay thế tất cả hardcoded Vietnamese text bằng translation keys
- Thêm translation keys cho workflow timeline

## Files đã thay đổi
- `src/utils/internationalization/i18nManager.ts`
- `src/App.tsx` 
- `src/components/content/ContentPreview.tsx`
- `src/pages/workflows/WorkflowTimelinePage.tsx`
- `src/components/workflow/WorkflowNodeTimeline.tsx`
- `public/locales/vi.json`
- `public/locales/en.json`
- `src/components/debug/I18nDebug.tsx` (new)
- `src/router/index.tsx`
- `deploy-fix.sh` (new)
- `reset-language.js` (new)
- `debug-i18n.js` (new)