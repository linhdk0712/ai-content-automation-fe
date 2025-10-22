# Technology Stack & Build System

## Core Technologies

- **React 18**: Modern React with hooks, concurrent features, and strict mode
- **TypeScript**: Strict typing with ES2020 target and comprehensive type checking
- **Vite**: Fast build tool and development server with HMR
- **Material-UI (MUI)**: Component library with custom theming and Material Design 3
- **React Router v6**: Client-side routing with nested routes and lazy loading

## State Management & Data Fetching

- **TanStack Query (React Query)**: Server state management, caching, and background sync
- **React Context**: Global state for authentication and notifications
- **React Hook Form**: Form handling with Yup/Zod validation

## Key Libraries

- **UI/UX**: Framer Motion (animations), React DnD (drag-drop), Recharts (charts)
- **Rich Text**: TinyMCE integration for content editing
- **Notifications**: React-Toastify with custom toast system
- **Real-time**: Socket.io-client for live collaboration
- **Date/Time**: Date-fns with MUI date pickers
- **Testing**: Vitest (unit), Cypress (e2e), Testing Library, MSW (mocking)

## Development Tools

- **ESLint**: TypeScript-aware linting with React hooks rules
- **Bundle Analysis**: Rollup visualizer for performance optimization
- **Coverage**: V8 provider with 95% thresholds
- **PWA**: Service worker with offline support and push notifications

## Build System

### Development Commands
```bash
npm run dev              # Start dev server (port 3000)
npm run dev:docker       # Docker development setup
npm run dev:nginx        # Nginx proxy development
```

### Build Commands
```bash
npm run build                    # Standard production build
npm run build:production         # Memory-optimized production build
npm run build:analyze           # Build with bundle analysis
npm run build:memory-optimized  # 4GB memory limit build
```

### Testing Commands
```bash
npm run test             # Run unit tests (Vitest)
npm run test:coverage    # Run with coverage reports
npm run test:e2e         # Cypress end-to-end tests
npm run test:visual      # Visual regression tests
npm run test:all         # Complete test suite
```

### Quality & Security
```bash
npm run lint             # ESLint code quality
npm run security:audit   # NPM security audit
npm run perf:lighthouse  # Performance testing
```

## Configuration Standards

### TypeScript Configuration
- Strict mode enabled with comprehensive type checking
- Path mapping with `@/` aliases for clean imports
- ES2020 target with modern features
- Bundler module resolution for Vite compatibility

### Build Optimization
- Memory-optimized builds with 4GB limit for large projects
- Single vendor chunk strategy to reduce memory usage
- Asset optimization with proper file naming conventions
- Code splitting at route level with lazy loading

### Environment Setup
- Docker support with polling for file watching
- Proxy configuration for API integration (port 8082)
- CORS handling for development
- PWA manifest and service worker generation

## Architecture Patterns

### Component Organization
- Feature-based folder structure under `src/components/`
- Shared components in `src/components/common/`
- Page components in `src/pages/` with nested routing
- Custom hooks in `src/hooks/` for reusable logic

### Service Layer
- API services in `src/services/` with consistent patterns
- Real-time manager for WebSocket connections
- Background sync service for offline support
- Centralized error handling and logging

### Performance Considerations
- Component lazy loading with preloading for critical routes
- Query optimization with stale-time and cache configuration
- Bundle size monitoring with chunk size limits (2MB)
- Memory-conscious build process for CI/CD environments