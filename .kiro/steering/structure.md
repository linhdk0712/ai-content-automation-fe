# Project Structure & Organization

## Root Directory Structure

```
├── src/                    # Source code
├── public/                 # Static assets and PWA files
├── cypress/               # End-to-end tests
├── scripts/               # Build and deployment scripts
├── coverage/              # Test coverage reports
├── test-results/          # Test output files
└── dist/                  # Production build output
```

## Source Code Organization (`src/`)

### Core Application Files
```
src/
├── main.tsx              # Application entry point with providers
├── App.tsx               # Root component with routing
├── vite-env.d.ts         # Vite type definitions
```

### Component Architecture
```
src/components/
├── common/               # Shared/reusable components
│   ├── ErrorBoundaries/  # Error handling components
│   ├── Header.tsx        # Application header
│   ├── Layout.tsx        # Page layout wrapper
│   ├── LoadingSpinner.tsx # Loading states
│   └── ...
├── auth/                 # Authentication components
├── content/              # Content management components
├── analytics/            # Analytics and reporting
├── scheduling/           # Content scheduling
├── mobile/               # Mobile-specific components
├── accessibility/        # Accessibility features
├── internationalization/ # i18n components
└── [feature]/            # Feature-specific components
```

### Page Components
```
src/pages/
├── Dashboard.tsx         # Main dashboard
├── auth/                 # Login, register, password reset
├── content/              # Content creation and management
├── analytics/            # Analytics pages
├── scheduling/           # Scheduling interface
├── settings/             # User and admin settings
├── social/               # Social media management
├── team/                 # Team collaboration
└── [feature]/            # Feature-specific pages
```

### Custom Hooks
```
src/hooks/
├── useAuth.ts            # Authentication state
├── useContent.ts         # Content operations
├── useAnalytics.ts       # Analytics data
├── useScheduling.ts      # Scheduling functionality
├── useRealTime.ts        # Real-time features
├── useAccessibility.ts   # Accessibility helpers
└── use[Feature].ts       # Feature-specific hooks
```

### Services Layer
```
src/services/
├── api.ts                # Base API configuration
├── auth.service.ts       # Authentication API
├── content.service.ts    # Content management API
├── analytics.service.ts  # Analytics API
├── realtime.manager.ts   # WebSocket management
├── notification.service.ts # Push notifications
└── [feature].service.ts  # Feature-specific services
```

### Utilities & Helpers
```
src/utils/
├── accessibility/        # Accessibility utilities
├── internationalization/ # i18n management
├── voice/               # Voice command utilities
├── api-helpers.ts       # API utility functions
├── performance.ts       # Performance monitoring
├── error-handler.ts     # Error handling utilities
└── codeSplitting.tsx    # Component lazy loading
```

### Type Definitions
```
src/types/
├── api.types.ts         # API response types
├── auth.ts              # Authentication types
├── scheduling.ts        # Scheduling types
├── template.types.ts    # Template system types
├── global.d.ts          # Global type declarations
└── css-modules.d.ts     # CSS module types
```

### Styling & Theming
```
src/styles/              # Global CSS files
src/theme/               # MUI theme configuration
```

## Naming Conventions

### Files & Directories
- **Components**: PascalCase (e.g., `ContentCreator.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useContentGeneration.ts`)
- **Services**: camelCase with `.service.ts` suffix (e.g., `auth.service.ts`)
- **Types**: camelCase with `.types.ts` suffix (e.g., `api.types.ts`)
- **Utilities**: camelCase (e.g., `api-helpers.ts`)
- **Directories**: kebab-case for multi-word (e.g., `error-boundaries/`)

### Component Organization Patterns
- **Feature-based**: Group related components by feature/domain
- **Shared components**: Place in `common/` for reusability
- **Index files**: Use for clean imports and re-exports
- **Co-location**: Keep related files (component, styles, tests) together

### Import Path Standards
- Use TypeScript path mapping with `@/` prefix
- Absolute imports for `src/` files: `@/components/common/Header`
- Relative imports only for same-directory files
- Barrel exports via index files for clean imports

## Architecture Principles

### Component Design
- **Single Responsibility**: Each component has one clear purpose
- **Composition over Inheritance**: Use composition patterns
- **Props Interface**: Well-defined TypeScript interfaces
- **Error Boundaries**: Wrap components with error handling
- **Accessibility**: WCAG 2.1 AA compliance by default

### State Management Patterns
- **Server State**: TanStack Query for API data
- **Client State**: React Context for global app state
- **Form State**: React Hook Form for form management
- **Local State**: useState/useReducer for component state

### Code Organization Rules
- **Feature Folders**: Group by business domain, not technical layer
- **Barrel Exports**: Use index.ts files for clean imports
- **Dependency Direction**: Components depend on services, not vice versa
- **Separation of Concerns**: UI, business logic, and data access separated

### Performance Patterns
- **Lazy Loading**: Route-level code splitting with React.lazy
- **Memoization**: React.memo for expensive components
- **Query Optimization**: Proper cache keys and stale times
- **Bundle Splitting**: Feature-based chunks for optimal loading