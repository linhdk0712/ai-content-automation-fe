# Accessibility & Internationalization Implementation

This document provides a comprehensive overview of the accessibility and internationalization features implemented for the AI Content Automation system, ensuring WCAG 2.1 AA compliance and full multilingual support.

## 🌟 Features Overview

### ✅ WCAG 2.1 AA Compliance
- **Screen Reader Optimization**: Semantic markup, ARIA labels, live regions
- **Keyboard Navigation**: Full keyboard accessibility with focus management
- **Focus Management**: Intelligent focus trapping and restoration
- **Color Contrast**: High contrast mode with customizable themes
- **Motion Preferences**: Reduced motion support for accessibility
- **Font Scaling**: Customizable font sizes (small, medium, large, extra-large)

### 🌍 Internationalization (i18n)
- **10 Supported Languages**: English, Vietnamese, Chinese, Japanese, Korean, Arabic, Spanish, French, German, Portuguese
- **RTL Support**: Full right-to-left language support for Arabic
- **Dynamic Language Switching**: Real-time language changes without page reload
- **Locale-Aware Formatting**: Dates, numbers, currency, and time formatting
- **Pluralization**: Smart pluralization rules for different languages

### 🎤 Voice Commands
- **Hands-free Operation**: Complete voice control functionality
- **Custom Commands**: Extensible voice command system
- **Wake Word Support**: Configurable activation phrases
- **Voice Feedback**: Spoken confirmations and announcements
- **Multi-language Support**: Voice commands in multiple languages

### 🎨 Customizable UI Themes
- **User Preferences**: Persistent accessibility and theme settings
- **High Contrast Mode**: Enhanced visibility for users with visual impairments
- **Font Size Control**: Scalable typography system
- **Reduced Motion**: Respects user motion preferences
- **Dark/Light Themes**: Automatic and manual theme switching

## 📁 File Structure

```
frontend/src/
├── utils/
│   ├── accessibility/
│   │   └── AccessibilityManager.ts          # Core accessibility management
│   ├── internationalization/
│   │   └── i18nManager.ts                   # Internationalization engine
│   └── voice/
│       └── VoiceCommandManager.ts           # Voice command system
├── components/
│   ├── accessibility/
│   │   └── AccessibilityPanel.tsx           # Accessibility settings UI
│   ├── internationalization/
│   │   └── LanguageSwitcher.tsx             # Language selection component
│   └── demo/
│       └── AccessibilityDemo.tsx            # Comprehensive demo component
├── hooks/
│   ├── useAccessibility.ts                 # Accessibility React hooks
│   └── useInternationalization.ts          # i18n React hooks
├── styles/
│   └── accessibility.css                   # WCAG-compliant CSS
└── test/
    ├── accessibility/
    │   └── AccessibilityManager.test.ts     # Accessibility tests
    ├── internationalization/
    │   └── i18nManager.test.ts              # i18n tests
    └── voice/
        └── VoiceCommandManager.test.ts      # Voice command tests

frontend/public/locales/
├── en.json                                  # English translations
├── vi.json                                  # Vietnamese translations
├── ar.json                                  # Arabic translations (RTL)
└── demo-en.json                            # Demo-specific translations
```

## 🚀 Quick Start

### 1. Basic Setup

```typescript
import { accessibilityManager } from './utils/accessibility/AccessibilityManager';
import { i18nManager } from './utils/internationalization/i18nManager';
import { voiceCommandManager } from './utils/voice/VoiceCommandManager';

// Initialize accessibility features
accessibilityManager.updateOptions({
  announceChanges: true,
  manageFocus: true,
  enableKeyboardNavigation: true
});

// Load and set language
await i18nManager.changeLanguage('en');

// Enable voice commands
await voiceCommandManager.startListening();
```

### 2. Using React Hooks

```typescript
import { useAccessibility, useInternationalization } from './hooks';

function MyComponent() {
  const { announce, manageFocus, isHighContrast } = useAccessibility();
  const { t, formatDate, isRTL } = useInternationalization();

  const handleAction = () => {
    announce(t('action.completed'));
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <h1>{t('welcome.title')}</h1>
      <p>{formatDate(new Date())}</p>
      <button onClick={handleAction}>
        {t('actions.submit')}
      </button>
    </div>
  );
}
```

### 3. Adding Voice Commands

```typescript
voiceCommandManager.addCommand('custom-action', {
  phrases: ['perform action', 'do something'],
  action: () => {
    // Your custom action
    console.log('Voice command executed');
  },
  description: 'Performs a custom action',
  category: 'custom',
  enabled: true
});
```

## 🎯 Core Components

### AccessibilityManager

The `AccessibilityManager` is a singleton class that handles all accessibility features:

**Key Features:**
- Screen reader announcements with live regions
- Focus management and restoration
- Keyboard navigation enhancement
- WCAG 2.1 AA compliance testing
- User preference persistence

**Usage:**
```typescript
// Announce to screen readers
accessibilityManager.announce('Content updated', 'polite');

// Manage focus
accessibilityManager.manageFocus(element, { restoreFocus: true });

// Test compliance
const results = await accessibilityManager.testCompliance();
```

### I18nManager

The `I18nManager` handles all internationalization features with production-optimized loading:

**Key Features:**
- **Production-Ready Loading**: Translation files loaded from absolute paths (`/locales/`) for deployment compatibility
- **Dynamic Language Loading**: On-demand loading with intelligent caching
- **RTL/LTR Text Direction**: Automatic direction switching with CSS custom properties
- **Locale-Aware Formatting**: Dates, numbers, currency, and time formatting per locale
- **Pluralization Rules**: Smart pluralization with fallback handling
- **Translation Interpolation**: Parameter substitution with `{{key}}` syntax
- **Multi-Level Fallback System**: Enhanced fallback through current → fallback → built-in → key display
- **Development Warnings**: Console logging for missing translations to aid development

**Critical Production Fix:**
The translation loading system now uses absolute paths (`/locales/${languageCode}.json`) instead of relative paths, ensuring compatibility with production builds and various deployment configurations.

**Usage:**
```typescript
// Change language with automatic RTL detection
await i18nManager.changeLanguage('ar'); // Switches to Arabic with RTL

// Format with locale-specific rules
const price = i18nManager.formatCurrency(99.99); // $99.99 or ٩٩.٩٩ ر.س
const date = i18nManager.formatDate(new Date()); // MM/DD/YYYY or DD/MM/YYYY

// Handle pluralization with parameters
const message = i18nManager.pluralize('notifications.count', 5, { count: 5 });

// Get relative time formatting
const timeAgo = i18nManager.getRelativeTime(new Date(Date.now() - 3600000)); // "1 hour ago"
```

**Enhanced Translation System:**
```typescript
// Multi-level fallback system for robust translation handling
public t(key: string, params?: Record<string, string | number>): string {
  // 1. Try current language first
  let translation = this.getTranslation(key, this.currentLanguage);

  // 2. If not found, try fallback language
  if (!translation && this.currentLanguage !== this.fallbackLanguage) {
    translation = this.getTranslation(key, this.fallbackLanguage);
  }

  // 3. If still not found, try built-in fallback translations
  if (!translation) {
    const fallbackTranslations = this.getFallbackTranslations(this.currentLanguage);
    translation = this.getTranslationFromObject(key, fallbackTranslations);
  }

  // 4. Final fallback to key itself with warning
  if (!translation) {
    console.warn(`Translation missing for key: ${key}`);
    translation = key;
  }

  return params ? this.interpolateParams(translation, params) : translation;
}
```

**File Loading with Fallback:**
```typescript
// Files loaded from public/locales/ directory with graceful fallback
private async fetchTranslations(languageCode: string): Promise<Translations> {
  try {
    const response = await fetch(`/locales/${languageCode}.json`);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
    return await response.json();
  } catch (error) {
    // Graceful fallback to comprehensive built-in translations
    return this.getFallbackTranslations(languageCode);
  }
}
```

### VoiceCommandManager

The `VoiceCommandManager` provides hands-free operation:

**Key Features:**
- Speech recognition with confidence thresholds
- Custom command registration
- Wake word support
- Voice feedback with speech synthesis
- Multi-language voice support

**Usage:**
```typescript
// Start listening
await voiceCommandManager.startListening();

// Add custom command
voiceCommandManager.addCommand('navigate-home', {
  phrases: ['go home', 'navigate home'],
  action: () => window.location.href = '/',
  description: 'Navigate to home page',
  category: 'navigation',
  enabled: true
});
```

## 🎨 Styling & Themes

### CSS Custom Properties

The system uses CSS custom properties for dynamic theming:

```css
:root {
  --font-size-base: 16px;
  --focus-ring-color: #005fcc;
  --text-align-start: left;
  --text-align-end: right;
}

.rtl {
  --text-align-start: right;
  --text-align-end: left;
}

.high-contrast {
  --text-color: #000000;
  --bg-color: #ffffff;
}
```

### Responsive Design

All components are fully responsive and mobile-friendly:

```css
@media (max-width: 768px) {
  button, [role="button"] {
    min-height: 48px; /* Larger touch targets */
    min-width: 48px;
  }
}
```

## 🧪 Testing

### Accessibility Testing

```typescript
// Run compliance tests
const results = await accessibilityManager.testCompliance();

if (!results.passed) {
  console.log('Issues found:', results.issues);
}
```

### Voice Command Testing

```typescript
// Test voice recognition availability
const isSupported = await voiceCommandManager.testVoiceRecognition();

if (isSupported) {
  await voiceCommandManager.startListening();
}
```

### Unit Tests

Comprehensive test suites are provided:

```bash
# Run all accessibility tests
npm test accessibility

# Run i18n tests
npm test internationalization

# Run voice command tests
npm test voice
```

### Testing Enhanced Fallback System

```typescript
// Test multi-level fallback behavior
describe('I18n Enhanced Fallback System', () => {
  it('should use current language translation when available', () => {
    const manager = I18nManager.getInstance();
    expect(manager.t('common.dashboard')).toBe('Dashboard');
  });
  
  it('should fall back to default language when current language missing', async () => {
    await manager.changeLanguage('nonexistent');
    expect(manager.t('common.dashboard')).toBe('Dashboard'); // From built-in fallback
  });
  
  it('should warn about missing translations in development', () => {
    const consoleSpy = jest.spyOn(console, 'warn');
    manager.t('completely.missing.key');
    expect(consoleSpy).toHaveBeenCalledWith('Translation missing for key: completely.missing.key');
  });
  
  it('should return key as final fallback', () => {
    expect(manager.t('missing.key')).toBe('missing.key');
  });
});
```

## 🌐 Supported Languages

| Language | Code | RTL | Currency | Date Format |
|----------|------|-----|----------|-------------|
| English | en | No | USD ($) | MM/DD/YYYY |
| Vietnamese | vi | No | VND (₫) | DD/MM/YYYY |
| Chinese | zh | No | CNY (¥) | YYYY/MM/DD |
| Japanese | ja | No | JPY (¥) | YYYY/MM/DD |
| Korean | ko | No | KRW (₩) | YYYY.MM.DD |
| Arabic | ar | Yes | SAR (ر.س) | DD/MM/YYYY |
| Spanish | es | No | EUR (€) | DD/MM/YYYY |
| French | fr | No | EUR (€) | DD/MM/YYYY |
| German | de | No | EUR (€) | DD/MM/YYYY |
| Portuguese | pt | No | EUR (€) | DD/MM/YYYY |

## 🎤 Default Voice Commands

### Navigation
- "go home" / "navigate home"
- "go to dashboard" / "open dashboard"
- "create content" / "new content"

### Content Actions
- "generate content" / "ai generate"
- "save content" / "save draft"
- "publish content" / "publish now"

### UI Control
- "open menu" / "show menu"
- "close modal" / "close dialog"

### Accessibility
- "increase font size" / "bigger text"
- "decrease font size" / "smaller text"
- "toggle high contrast"
- "help" / "available commands"

## 📱 Mobile & PWA Support

### Touch Optimization
- Minimum 44px touch targets
- Touch-friendly navigation
- Swipe gesture support

### Offline Support
- Service worker integration
- Offline translation caching
- Background sync capabilities

### Progressive Enhancement
- Works without JavaScript
- Graceful degradation
- Performance optimization

## 🔧 Configuration

### Accessibility Settings

```typescript
accessibilityManager.updateOptions({
  announceChanges: true,        // Screen reader announcements
  manageFocus: true,           // Automatic focus management
  enableKeyboardNavigation: true, // Enhanced keyboard support
  highContrast: false,         // High contrast mode
  reducedMotion: false,        // Reduced motion preference
  fontSize: 'medium'           // Font size preference
});
```

### Voice Settings

```typescript
voiceCommandManager.updateSettings({
  enabled: true,               // Enable voice commands
  language: 'en-US',          // Recognition language
  continuous: true,           // Continuous listening
  confidenceThreshold: 0.7,   // Minimum confidence
  wakeWord: 'hey assistant',  // Activation phrase
  voiceFeedback: true         // Spoken confirmations
});
```

### Language Settings

```typescript
// Change language with automatic RTL detection
await i18nManager.changeLanguage('ar');

// Load additional languages
await i18nManager.loadLanguage('zh');
```

## 🚀 Performance Optimizations

### Lazy Loading
- Dynamic translation loading with absolute paths for production compatibility
- Code splitting by language
- Progressive enhancement

### Caching
- Translation caching with intelligent cache invalidation
- Voice model caching
- Preference persistence in localStorage

### Bundle Optimization
- Tree shaking for unused languages
- Compression for translation files
- Efficient polyfill loading

## 🔧 Production Deployment

### Translation File Loading Fix

**Critical Update**: The i18n system now uses absolute paths for loading translation files, ensuring compatibility with production builds and various deployment configurations.

**Before (Problematic):**
```typescript
// Relative path that could break in production
const response = await fetch(`../locales/${languageCode}.json`);
```

**After (Production-Ready):**
```typescript
// Absolute path that works in all environments
const response = await fetch(`/locales/${languageCode}.json`);
```

### Deployment Checklist

1. **Translation Files**: Ensure all translation files are in `public/locales/` directory
2. **Build Process**: Verify translation files are copied to build output
3. **Server Configuration**: Configure server to serve `/locales/` files with proper MIME types
4. **CDN Setup**: If using CDN, ensure translation files are properly cached and accessible
5. **Fallback Testing**: Test fallback behavior when translation files are unavailable

### Server Configuration Examples

**Nginx:**
```nginx
location /locales/ {
    add_header Cache-Control "public, max-age=3600";
    add_header Content-Type "application/json; charset=utf-8";
}
```

**Apache:**
```apache
<Directory "/path/to/public/locales">
    Header set Cache-Control "public, max-age=3600"
    Header set Content-Type "application/json; charset=utf-8"
</Directory>
```

### Docker Deployment

Ensure translation files are properly copied in your Dockerfile:
```dockerfile
# Copy public assets including locales
COPY public/ /app/public/

# Verify locales directory exists
RUN ls -la /app/public/locales/
```

## 🔒 Security Considerations

### Input Validation
- Voice command sanitization
- Translation parameter validation
- XSS prevention in dynamic content

### Privacy
- Local storage for preferences
- No sensitive data in voice commands
- GDPR-compliant data handling

## 📊 Analytics & Monitoring

### Accessibility Metrics
- Compliance test results
- User preference tracking
- Error rate monitoring

### Usage Analytics
- Language preference distribution
- Voice command usage patterns
- Accessibility feature adoption

## 🤝 Contributing

### Adding New Languages

1. Create translation file: `public/locales/{lang}.json`
2. Add language to `supportedLanguages` in `i18nManager.ts`
3. Add locale data for formatting
4. Test RTL support if applicable

### Adding Voice Commands

1. Register command with `voiceCommandManager.addCommand()`
2. Define multiple phrase variations
3. Implement action handler
4. Add to appropriate category
5. Test with different accents/pronunciations

### Accessibility Improvements

1. Follow WCAG 2.1 AA guidelines
2. Test with screen readers
3. Verify keyboard navigation
4. Check color contrast ratios
5. Test with real users

## 📚 Resources

### WCAG Guidelines
- [WCAG 2.1 AA Checklist](https://www.w3.org/WAI/WCAG21/quickref/)
- [Screen Reader Testing Guide](https://webaim.org/articles/screenreader_testing/)
- [Keyboard Navigation Best Practices](https://webaim.org/techniques/keyboard/)

### Internationalization
- [Unicode CLDR](http://cldr.unicode.org/)
- [RTL Language Support](https://rtlstyling.com/)
- [Locale Data Standards](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)

### Voice Commands
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Speech Recognition Best Practices](https://developers.google.com/web/updates/2013/01/Voice-Driven-Web-Apps-Introduction-to-the-Web-Speech-API)

## 🎉 Demo

To see all features in action, check out the `AccessibilityDemo` component which demonstrates:

- Real-time language switching
- Voice command integration
- Accessibility feature testing
- Theme customization
- Keyboard navigation
- Screen reader announcements
- RTL text direction
- Locale-aware formatting

The demo provides a comprehensive showcase of all implemented accessibility and internationalization features working together seamlessly.

---

This implementation ensures that the AI Content Automation system is accessible to users with disabilities and supports a global audience with comprehensive internationalization features, meeting and exceeding WCAG 2.1 AA compliance standards.