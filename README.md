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

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running on port 8080

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
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WS_URL=ws://localhost:8080/ws

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
│   ├── analytics/      # Analytics and reporting
│   ├── common/         # Shared components
│   ├── mobile/         # Mobile-specific components
│   └── ...
├── pages/              # Page components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── auth/          # Authentication pages
│   ├── content/       # Content management pages
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useAuth.ts     # Authentication hook
│   ├── useContentGeneration.ts # AI content generation
│   └── ...
├── services/           # API services and utilities
│   ├── api.ts         # Base API configuration
│   ├── auth.service.ts # Authentication service
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

- **Development Server** - Hot module replacement and API proxying
- **Build Optimization** - Code splitting, minification, and compression
- **PWA Support** - Service worker and manifest generation
- **Bundle Analysis** - Visual bundle size analysis

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
- **i18n Ready** - Framework for multiple languages
- **RTL Support** - Right-to-left language support
- **Dynamic Loading** - Language packs loaded on demand
- **Fallback Handling** - Graceful fallback to default language

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
- [Deployment Guide](./docs/deployment.md)

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
- **API Connection** - Verify backend is running on port 8080
- **PWA Issues** - Clear browser cache and reinstall service worker
- **Performance** - Use bundle analyzer to identify large dependencies

---

**Built with ❤️ by the AI Content Automation Team**
