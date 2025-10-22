# AI Content Automation Frontend

A modern, responsive React frontend application for AI-powered content automation platform. Built with TypeScript, Vite, and Material-UI, featuring advanced AI content generation, real-time collaboration, and comprehensive analytics.

## 🚀 Features

### Core Features
- **AI Content Generation** - Generate high-quality content using multiple AI providers (OpenAI, Gemini, Claude)
- **Real-time Collaboration** - Live editing with multiple users, cursor tracking, and presence indicators
- **Content Management** - Create, edit, organize, and version control content
- **Template System** - Pre-built templates for various content types and industries
- **Analytics Dashboard** - Comprehensive analytics and performance metrics
- **Social Media Integration** - Schedule and publish content across multiple platforms

### Advanced Features
- **Progressive Web App (PWA)** - Offline support, push notifications, and app-like experience
- **Accessibility** - WCAG 2.1 AA compliant with keyboard navigation and screen reader support
- **Internationalization** - Multi-language support with RTL language support
- **Mobile Optimization** - Responsive design with mobile-specific features
- **Voice Commands** - Voice-controlled content generation and navigation
- **Advanced Security** - Multi-factor authentication, role-based access control

## 🎯 Key Components

### ContentCreator Component
The `ContentCreator` is the flagship component providing comprehensive AI-powered content generation:

#### Features
- **Multi-Provider AI Integration** - Support for OpenAI, Gemini, Claude with dynamic provider selection
- **Comprehensive Form Interface** - Industry, content type, language, tone, and audience targeting
- **Optimization Criteria** - Quality, cost, speed, or balanced optimization modes
- **Advanced Settings** - Configurable AI parameters (temperature, max tokens)
- **Template Integration** - Pre-built templates with one-click application
- **Real-time Validation** - Form validation with user-friendly error messages
- **Tabbed Interface** - Create, Templates, and History tabs for organized workflow

#### Architecture
- **Location**: `src/components/content/ContentCreator.tsx`
- **State Management**: Local useState with custom hooks integration
- **Validation**: Comprehensive form validation with real-time feedback
- **Accessibility**: Full WCAG 2.1 AA compliance with keyboard navigation
- **Internationalization**: Complete i18n support with RTL language compatibility

#### Integration Points
- **AI Providers**: Dynamic provider selection with optimization criteria
- **Template System**: Integration with template library and selection
- **Workflow Automation**: N8N workflow triggering for generated content
- **Content Library**: Direct saving to content management system
- **Analytics**: Generation tracking and performance metrics

## 🛠️ Tech Stack

### Core Technologies
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development with strict configuration
- **Vite** - Fast build tool and development server
- **Material-UI (MUI)** - Comprehensive React component library
- **React Router** - Client-side routing with nested routes

### State Management & Data Fetching
- **TanStack Query** - Server state management and caching
- **React Context** - Global state management for auth and notifications
- **React Hook Form** - Form handling with validation

### UI/UX Libraries
- **Framer Motion** - Smooth animations and transitions
- **React DnD** - Drag and drop functionality
- **React Big Calendar** - Calendar and scheduling components
- **Recharts** - Data visualization and charts
- **TinyMCE** - Rich text editor integration
- **React-Toastify** - Modern toast notifications with advanced features

### Development Tools
- **ESLint** - Code linting and formatting
- **Vitest** - Unit and integration testing
- **Cypress** - End-to-end testing
- **MSW** - API mocking for testing
- **Bundle Analyzer** - Performance optimization

## 📦 Installation

### ⚠️ Recent Updates
**API Port Change**: The backend authentication service port has been updated from 8081 to **8082**. All configurations have been updated automatically. Ensure your backend service is running on port 8082.

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running on port 8082

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd ai-content-automation/frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables
Create a `.env.local` file with the following variables:

```env
# API Configuration
VITE_API_BASE_URL=/api/v1
VITE_REALTIME_SERVER_URL=http://localhost:3001

# Backend Services Configuration
AUTH_SERVICE_PORT=8082
REALTIME_SERVER_PORT=3001

# Environment
VITE_NODE_ENV=development

# Feature Flags
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_VOICE_COMMANDS=true

# External Services
VITE_GOOGLE_ANALYTICS_ID=your-ga-id
VITE_SENTRY_DSN=your-sentry-dsn
```

## 🚀 Development

### Available Scripts

#### Development
```bash
npm run dev          # Start development server
npm run preview      # Preview production build
```

#### Building
```bash
npm run build        # Build for production
npm run build:prod   # Build with production optimizations
npm run build:analyze # Build with bundle analysis
```

#### Testing
```bash
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run test:e2e     # Run end-to-end tests
npm run test:all     # Run all test suites
```

#### Code Quality
```bash
npm run lint         # Run ESLint
npm run security:audit # Security audit
```

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── content/        # Content management components
│   │   ├── ContentCreator.tsx # AI content generation interface
│   │   ├── AIProviderSelector.tsx # AI provider selection
│   │   ├── ContentPreview.tsx # Real-time content preview
│   │   ├── TemplateLibrary.tsx # Template management
│   │   └── GenerationHistory.tsx # Generation history
│   ├── analytics/      # Analytics and reporting
│   ├── common/         # Shared components
│   │   ├── ListOfValuesSelect.tsx # Dynamic form selects
│   │   ├── ErrorBoundaries/ # Error handling components
│   │   └── ...
│   ├── mobile/         # Mobile-specific components
│   └── ...
├── pages/              # Page components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── auth/          # Authentication pages
│   ├── content/       # Content management pages
│   │   └── ContentCreator.tsx # Content creator page wrapper
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useAuth.ts     # Authentication hook
│   ├── useContentGeneration.ts # AI content generation
│   ├── useTemplates.ts # Template management
│   └── ...
├── services/           # API services and utilities
│   ├── api.ts         # Base API configuration
│   ├── auth.service.ts # Authentication service
│   ├── content.service.ts # Content management service
│   ├── n8n.service.ts # Workflow automation service
│   └── ...
├── contexts/           # React contexts
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── theme/              # Theme configuration
```

## 🎨 UI/UX Features

### Design System
- **Material Design 3** - Modern design language
- **Custom Theme** - Branded color palette and typography
- **Dark/Light Mode** - User preference-based theme switching
- **Responsive Design** - Mobile-first approach with breakpoints

### Accessibility
- **WCAG 2.1 AA Compliance** - Screen reader support, keyboard navigation
- **High Contrast Mode** - Enhanced visibility for users with visual impairments
- **Focus Management** - Proper focus indicators and management
- **ARIA Labels** - Semantic markup for assistive technologies

### Performance
- **Code Splitting** - Route-based and component-based splitting
- **Lazy Loading** - Dynamic imports for better performance
- **Caching Strategy** - Service worker caching for offline support
- **Bundle Optimization** - Tree shaking and dead code elimination

## 🔧 Configuration

### Vite Configuration
The project uses Vite with the following key configurations:

- **Development Server** - Hot module replacement with API and realtime proxying
- **API Proxy** - Routes `/api` requests to authentication service (port 8082)
- **Realtime Proxy** - Handles WebSocket connections to realtime server (port 3001)
- **Docker Support** - Environment-aware proxy configuration for containerized development
- **Build Optimization** - Memory-optimized builds with code splitting and minification
- **PWA Support** - Service worker and manifest generation
- **Bundle Analysis** - Visual bundle size analysis with rollup-plugin-visualizer

### TypeScript Configuration
- **Strict Mode** - Enhanced type checking
- **Path Mapping** - Clean import paths with `@/` aliases
- **Modern Target** - ES2020 with modern features

### ESLint Configuration
- **TypeScript Rules** - Type-aware linting
- **React Rules** - React-specific best practices
- **Import Rules** - Import organization and optimization

## 🧪 Testing

### Test Strategy
- **Unit Tests** - Component and hook testing with Vitest
- **Integration Tests** - API integration and user flows
- **E2E Tests** - Full user journey testing with Cypress
- **Visual Regression** - UI consistency testing
- **Performance Tests** - Load and performance testing

### Test Commands
```bash
# Unit tests
npm run test:unit

# Integration tests  
npm run test:integration

# E2E tests
npm run test:e2e

# Visual regression
npm run test:visual

# Performance tests
npm run test:performance
```

## 📱 PWA Features

### Progressive Web App
- **Offline Support** - Cached resources and offline functionality
- **Push Notifications** - Real-time notifications
- **App-like Experience** - Native app feel with splash screens
- **Install Prompt** - Add to home screen functionality

### Service Worker
- **Caching Strategy** - Network-first for API, cache-first for assets
- **Background Sync** - Sync data when connection is restored
- **Update Management** - Automatic updates with user notification

## 🔔 Notification System (React-Toastify)

### Toast Notifications
The application uses React-Toastify for a unified notification system with advanced features:

- **Unified Interface** - Consistent styling and behavior across the app
- **Advanced Features** - Loading states, actions, persistent notifications
- **Responsive Design** - Mobile-optimized with touch gestures
- **Accessibility** - Screen reader support and keyboard navigation
- **Backward Compatibility** - Seamless migration from old notification systems

### Usage Examples
```typescript
import { useToast } from './hooks/useToast'

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

  // Promise-based toasts
  const handleAsyncOperation = () => {
    toast.promise(
      fetchData(),
      {
        pending: 'Loading...',
        success: 'Data loaded successfully!',
        error: 'Failed to load data'
      }
    )
  }
}
```

### Quick Access Patterns
```typescript
import { quickToast } from './utils/toast'

// Authentication
quickToast.loginSuccess()
quickToast.registerError('Email already exists')

// Content operations
quickToast.contentCreated()
quickToast.contentPublished()

// File operations
quickToast.fileUploaded()
quickToast.fileUploadError('File too large')
```

### Demo & Testing
Visit `/toast-demo` in the application to test all notification features and patterns.

## 🌐 Internationalization

### Multi-language Support
- **10 Supported Languages** - English, Vietnamese, Chinese, Japanese, Korean, Arabic, Spanish, French, German, Portuguese
- **Production-Ready Loading** - Translation files loaded from `/locales/` directory with production-optimized paths
- **RTL Support** - Full right-to-left language support for Arabic with automatic text direction
- **Dynamic Loading** - Language packs loaded on demand with intelligent fallback handling
- **Multi-Level Fallback System** - Graceful degradation through current language → fallback language → built-in translations → key display
- **Locale-Aware Formatting** - Dates, numbers, currency, and time formatting per locale
- **Real-time Switching** - Language changes without page reload
- **Pluralization** - Smart pluralization rules for different languages
- **Missing Translation Warnings** - Development-friendly logging for missing translation keys

### Current I18n Status
- **Core Components**: Fully internationalized with comprehensive translation coverage
- **Workflow Timeline**: ✅ **Completed** - Full internationalization including WorkflowTimelinePage and WorkflowNodeTimeline components
- **Content Creator**: Fully internationalized with all UI elements using translation keys
- **Dashboard & Navigation**: Complete i18n support across all navigation elements
- **Authentication**: Full translation support for login, register, and user management flows

### Translation File Structure
Translation files are located in `public/locales/` and loaded via absolute paths for production compatibility:
```
public/locales/
├── en.json          # English (default)
├── vi.json          # Vietnamese  
├── ar.json          # Arabic (RTL)
├── zh.json          # Chinese
├── ja.json          # Japanese
├── ko.json          # Korean
├── es.json          # Spanish
├── fr.json          # French
├── de.json          # German
└── pt.json          # Portuguese
```

### Usage Examples
```typescript
import { i18nManager } from '@/utils/internationalization/i18nManager';

// Change language with automatic RTL detection
await i18nManager.changeLanguage('ar');

// Get translations with intelligent fallback system
const message = i18nManager.t('welcome.message', { name: 'John' });
// Fallback order: current language → fallback language → built-in translations → key

// Handle missing translations gracefully
const unknownKey = i18nManager.t('missing.key'); // Returns 'missing.key' with console warning

// Format locale-specific data
const price = i18nManager.formatCurrency(99.99); // $99.99 or ٩٩.٩٩ ر.س
const date = i18nManager.formatDate(new Date()); // MM/DD/YYYY or DD/MM/YYYY

// Handle pluralization with fallback support
const itemCount = i18nManager.pluralize('items.count', 5, { count: 5 });
```

## 🔒 Security

### Security Features
- **Content Security Policy** - XSS protection
- **HTTPS Enforcement** - Secure communication
- **Input Validation** - Client-side validation with Yup/Zod
- **Secure Storage** - Encrypted local storage for sensitive data

## 📊 Performance Monitoring

### Analytics & Monitoring
- **Performance Metrics** - Core Web Vitals tracking
- **Error Tracking** - Sentry integration for error monitoring
- **User Analytics** - Google Analytics integration
- **Bundle Analysis** - Build size monitoring

## 🚀 Deployment

### Build Process
```bash
# Production build
npm run build:prod

# Build analysis
npm run build:analyze
```

### Docker Support
The frontend is containerized with Nginx for production deployment:

```bash
# Build Docker image
docker build -t ai-content-frontend .

# Run container
docker run -p 3000:3000 ai-content-frontend
```

### Environment-specific Builds
- **Development** - Hot reloading and debugging
- **Staging** - Production-like environment
- **Production** - Optimized build with minification

### Critical Production Considerations

#### Translation Files
Ensure translation files in `public/locales/` are properly served:
- Files must be accessible via absolute paths (`/locales/en.json`)
- Configure proper MIME types (`application/json`)
- Set appropriate cache headers for performance

#### Server Configuration
```nginx
# Nginx example
location /locales/ {
    add_header Cache-Control "public, max-age=3600";
    add_header Content-Type "application/json; charset=utf-8";
}
```

#### Enhanced Translation System

**Multi-Level Fallback System**: The i18n manager now includes an improved fallback mechanism for robust translation handling:

```typescript
// Translation resolution order:
// 1. Current language files (/locales/{lang}.json)
// 2. Fallback language files (/locales/en.json)
// 3. Built-in fallback translations (hardcoded)
// 4. Translation key itself (with console warning)
```

**Development Features**:
- Console warnings for missing translation keys
- Graceful degradation when translation files are unavailable
- Built-in fallback translations for core UI elements

#### Deployment Checklist
- ✅ Translation files copied to build output
- ✅ Server configured to serve `/locales/` directory
- ✅ Multi-level fallback system tested
- ✅ Missing translation warnings reviewed
- ✅ RTL languages display correctly
- ✅ All supported languages load properly

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch
3. **Write** tests for new features
4. **Ensure** all tests pass
5. **Submit** a pull request

### Code Standards
- **TypeScript** - Strict typing and interfaces
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting
- **Conventional Commits** - Standardized commit messages

### Pull Request Process
- **Tests** - All tests must pass
- **Linting** - Code must pass ESLint checks
- **Documentation** - Update docs for new features
- **Performance** - No performance regressions

## 📚 Additional Resources

### Documentation
- [Component Library](./src/components/README.md)
- [API Integration](./src/services/README.md)
- [Testing Guide](./src/test/README.md)
- [Deployment Guide](./DEPLOYMENT_README.md)
- [API Configuration Update](./docs/api-configuration-update.md)
- [Realtime Server Configuration](./docs/realtime-server-configuration.md)
- [Accessibility & Internationalization](./src/accessibility-i18n-README.md)
- [I18n Production Fix](./docs/i18n-production-fix.md)
- [Workflow Timeline I18n Update](./WORKFLOW_TIMELINE_I18n_UPDATE.md)

#### Component Documentation
- [ContentCreator Component](./docs/ai/implementation/content-creator-component.md)
- [Implementation Guide](./docs/ai/implementation/README.md)

### External Links
- [React Documentation](https://react.dev/)
- [Material-UI Documentation](https://mui.com/)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🆘 Support

### Getting Help
- **Documentation** - Check the docs folder for detailed guides
- **Issues** - Report bugs and request features via GitHub issues
- **Discussions** - Join community discussions for questions

### Common Issues
- **Build Errors** - Check Node.js version and dependencies
- **API Connection** - Verify backend is running on port 8082
- **PWA Issues** - Clear browser cache and reinstall service worker
- **Performance** - Use bundle analyzer to identify large dependencies

---

**Built with ❤️ by the AI Content Automation Team**
