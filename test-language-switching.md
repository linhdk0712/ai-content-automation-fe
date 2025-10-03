# Language Switching Feature Test Guide

## Overview
Tính năng chuyển đổi ngôn ngữ đã được tích hợp vào frontend với các thành phần sau:

## Components Added/Modified

### 1. Language Switcher Component
- **File**: `src/components/internationalization/LanguageSwitcher.tsx`
- **CSS**: `src/components/internationalization/LanguageSwitcher.css`
- **Features**:
  - Dropdown để chọn ngôn ngữ
  - Hiển thị cờ và tên ngôn ngữ
  - Hỗ trợ RTL (Right-to-Left)
  - Responsive design

### 2. I18n Manager
- **File**: `src/utils/internationalization/i18nManager.ts`
- **Features**:
  - Quản lý ngôn ngữ hiện tại
  - Load translation files động
  - Format số, tiền tệ, ngày tháng theo locale
  - Hỗ trợ RTL languages

### 3. useI18n Hook
- **File**: `src/hooks/useI18n.ts`
- **Features**:
  - React hook để sử dụng i18n dễ dàng
  - Auto re-render khi đổi ngôn ngữ
  - Các utility functions

### 4. Translation Files
- **English**: `public/locales/en.json`
- **Vietnamese**: `public/locales/vi.json`

### 5. Updated Header Component
- **File**: `src/components/common/Header.tsx`
- **Changes**:
  - Tích hợp LanguageSwitcher vào navbar
  - Sử dụng translations cho tất cả text
  - Responsive language switcher

### 6. Demo Component
- **File**: `src/components/demo/LanguageDemo.tsx`
- **Route**: `/demo/language`
- **Features**:
  - Demo tất cả tính năng i18n
  - Test formatting functions
  - Quick language switching

## How to Test

### 1. Start the Development Server
```bash
cd frontend
npm run dev
```

### 2. Access the Application
- Login to the application
- Navigate to any page with the header

### 3. Test Language Switching
1. **In Header**: Look for the language switcher in the top navigation bar
2. **Click on Language Switcher**: Should show dropdown with available languages
3. **Select Vietnamese**: Click on "🇻🇳 Tiếng Việt"
4. **Verify Changes**: All text in header should change to Vietnamese
5. **Select English**: Click on "🇺🇸 English" to switch back

### 4. Test Demo Page
1. Navigate to `/demo/language`
2. Test all language switching features
3. Verify formatting changes for different locales

### 5. Test Persistence
1. Switch to Vietnamese
2. Refresh the page
3. Language should remain Vietnamese (stored in localStorage)

## Supported Languages

Currently configured languages:
- 🇺🇸 English (en)
- 🇻🇳 Vietnamese (vi)
- 🇨🇳 Chinese (zh)
- 🇯🇵 Japanese (ja)
- 🇰🇷 Korean (ko)
- 🇸🇦 Arabic (ar) - RTL support
- 🇪🇸 Spanish (es)
- 🇫🇷 French (fr)
- 🇩🇪 German (de)
- 🇵🇹 Portuguese (pt)

Note: Only English and Vietnamese have complete translations. Other languages will fallback to English.

## Key Features

### 1. Automatic Language Detection
- Detects browser language on first visit
- Falls back to English if unsupported

### 2. Persistent Language Selection
- Saves selected language to localStorage
- Remembers choice across sessions

### 3. RTL Support
- Automatic text direction switching
- CSS custom properties for RTL layouts

### 4. Locale-specific Formatting
- Date/time formatting
- Number formatting
- Currency formatting

### 5. Responsive Design
- Compact mode on mobile
- Accessible keyboard navigation
- Screen reader support

## Expected Behavior

### Language Switcher in Header
- Should appear between theme toggle and notifications
- Shows current language with flag
- Dropdown shows all available languages
- Smooth transition when switching

### Text Changes
When switching to Vietnamese, you should see:
- "Dashboard" → "Bảng điều khiển"
- "Content" → "Nội dung"
- "Settings" → "Cài đặt"
- "Profile" → "Hồ sơ"
- "Logout" → "Đăng xuất"
- And many more...

### Formatting Changes
- Date format changes based on locale
- Number separators change
- Currency symbols and positions change

## Troubleshooting

### If Language Switcher Doesn't Appear
1. Check browser console for errors
2. Verify CSS is loading properly
3. Check if component is imported correctly

### If Translations Don't Work
1. Check if translation files exist in `public/locales/`
2. Verify network requests in browser dev tools
3. Check console for loading errors

### If Formatting Doesn't Change
1. Verify locale data is configured in i18nManager
2. Check browser support for Intl API

## Next Steps

To add more languages:
1. Create new translation file in `public/locales/[lang].json`
2. Add language info to `supportedLanguages` in `i18nManager.ts`
3. Add locale data for formatting

To add more translations:
1. Add new keys to existing translation files
2. Use `t('key.path')` in components
3. Test with both languages