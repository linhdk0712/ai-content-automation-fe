# Component Library

This directory contains all reusable UI components for the AI Content Automation platform. Components are organized by feature and functionality to promote reusability and maintainability.

## Directory Structure

```
src/components/
├── accessibility/       # Accessibility-focused components
├── analytics/          # Analytics and reporting components
├── auth/               # Authentication components
├── collaboration/      # Real-time collaboration components
├── common/             # Shared/reusable components
├── content/            # Content management components
├── debug/              # Development and debugging components
├── demo/               # Demo and showcase components
├── feedback/           # User feedback components
├── internationalization/ # i18n components
├── mobile/             # Mobile-specific components
├── notifications/      # Notification system components
├── onboarding/         # User onboarding components
├── payment/            # Payment and subscription components
├── pwa/                # Progressive Web App components
├── scheduling/         # Content scheduling components
├── search/             # Search and discovery components
├── security/           # Security dashboard components
├── shortcuts/          # Keyboard shortcuts components
├── social/             # Social media integration components
├── support/            # Help and support components
├── team/               # Team collaboration components
├── templates/          # Template management components
└── workflow/           # Workflow automation components
```

## Core Components

### Content Management

#### ContentCreator
**Location**: `src/components/content/ContentCreator.tsx`

The flagship AI content generation component providing:
- Multi-provider AI integration (OpenAI, Gemini, Claude)
- Comprehensive form interface with validation
- Template integration and management
- Real-time content preview
- Workflow automation integration

**Key Features**:
- Form validation with real-time feedback
- Optimization criteria selection (Quality, Cost, Speed, Balanced)
- Advanced AI parameter controls (temperature, max tokens)
- Tabbed interface (Create, Templates, History) with streamlined navigation
- Quick action chips for efficient workflow navigation
- Full accessibility and internationalization support

**Dependencies**:
- `AIProviderSelector`: AI provider selection interface
- `ContentPreview`: Real-time content preview
- `TemplateLibrary`: Template browsing and selection
- `GenerationHistory`: Historical generation management
- `ListOfValuesSelect`: Dynamic form field components

#### AIProviderSelector
**Location**: `src/components/content/AIProviderSelector.tsx`

Dynamic AI provider selection with optimization integration:
- Provider availability checking
- Optimization criteria-based recommendations
- Real-time provider status updates
- Cost and performance indicators

#### ContentPreview
**Location**: `src/components/content/ContentPreview.tsx`

Real-time content preview and action interface:
- Live content rendering
- Action buttons (Save, Send to Workflow, Export)
- Loading states and progress indicators
- Content formatting and styling

### Common Components

#### ListOfValuesSelect
**Location**: `src/components/common/ListOfValuesSelect.tsx`

Dynamic select components for form fields:
- `IndustrySelect`: Industry category selection
- `ContentTypeSelect`: Content type selection
- `LanguageSelect`: Language selection with flags
- `ToneSelect`: Tone and style selection
- `TargetAudienceSelect`: Audience demographic selection

**Features**:
- Icon integration for visual enhancement
- Internationalization support
- Accessibility compliance
- Real-time validation integration

#### ErrorBoundaries
**Location**: `src/components/common/ErrorBoundaries/`

Comprehensive error handling system:
- `ComponentErrorBoundary`: Component-level error catching
- `RouteErrorBoundary`: Route-level error handling
- `AsyncErrorBoundary`: Async operation error management

### Authentication Components

#### LoginForm
**Location**: `src/components/auth/LoginForm.tsx`

Secure authentication interface:
- Form validation and error handling
- Multi-factor authentication support
- Social login integration
- Accessibility compliance

#### AuthGuard
**Location**: `src/components/auth/AuthGuard.tsx`

Route protection and authentication checking:
- Role-based access control
- Redirect handling for unauthenticated users
- Loading states during authentication checks

## Component Patterns

### Design Principles

1. **Single Responsibility**: Each component has one clear purpose
2. **Composition over Inheritance**: Use composition patterns for flexibility
3. **Accessibility First**: WCAG 2.1 AA compliance by default
4. **Internationalization**: Full i18n support with RTL languages
5. **Performance**: Optimized with memoization and lazy loading

### State Management

- **Local State**: useState for component-specific state
- **Global State**: React Context for shared application state
- **Server State**: TanStack Query for API data management
- **Form State**: React Hook Form patterns for complex forms

### Styling Approach

- **Material-UI**: Primary component library with custom theming
- **sx Prop**: Inline styling for component-specific styles
- **CSS Modules**: For complex styling requirements
- **Responsive Design**: Mobile-first approach with breakpoints

### Accessibility Standards

- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Logical tab order and focus indicators
- **High Contrast**: Support for high contrast mode
- **Error Announcements**: Screen reader accessible error messages

### Internationalization

- **Translation Keys**: Structured translation key naming
- **RTL Support**: Right-to-left language compatibility
- **Locale Formatting**: Date, time, number, currency formatting
- **Dynamic Loading**: Language packs loaded on demand

## Testing Strategy

### Unit Testing
- Component rendering and behavior
- Props validation and default values
- Event handling and state changes
- Accessibility compliance

### Integration Testing
- Component interaction and data flow
- API integration and error handling
- Form validation and submission
- Navigation and routing

### Visual Testing
- Component appearance across themes
- Responsive design validation
- Accessibility visual indicators
- Cross-browser compatibility

## Performance Considerations

### Optimization Techniques
- **React.memo**: Prevent unnecessary re-renders
- **useMemo/useCallback**: Memoize expensive calculations
- **Lazy Loading**: Dynamic imports for large components
- **Code Splitting**: Feature-based component bundles

### Bundle Size Management
- Tree shaking for unused code elimination
- Dynamic imports for optional features
- Vendor chunk optimization
- Asset optimization and compression

## Development Guidelines

### Component Creation Checklist
- [ ] TypeScript interfaces for props
- [ ] Default props and prop validation
- [ ] Accessibility attributes (ARIA labels, roles)
- [ ] Internationalization support
- [ ] Error boundary integration
- [ ] Unit tests with good coverage
- [ ] Storybook documentation (if applicable)
- [ ] Performance optimization review

### Code Quality Standards
- **ESLint**: TypeScript-aware linting rules
- **Prettier**: Consistent code formatting
- **Type Safety**: Strict TypeScript configuration
- **Documentation**: Comprehensive inline comments
- **Testing**: Minimum 80% test coverage

### Review Process
- Code review for functionality and performance
- Accessibility audit using automated tools
- Cross-browser testing on major browsers
- Mobile responsiveness validation
- Internationalization testing with multiple languages

## Contributing

### Adding New Components
1. Create component in appropriate feature directory
2. Follow naming conventions (PascalCase for components)
3. Include TypeScript interfaces and proper typing
4. Add comprehensive unit tests
5. Update this README with component documentation
6. Ensure accessibility and internationalization compliance

### Modifying Existing Components
1. Maintain backward compatibility when possible
2. Update tests to reflect changes
3. Update documentation and examples
4. Consider performance impact of changes
5. Test across different browsers and devices

## Related Documentation

- [Implementation Guide](../../docs/ai/implementation/README.md)
- [ContentCreator Component](../../docs/ai/implementation/content-creator-component.md)
- [Accessibility Guidelines](../accessibility-i18n-README.md)
- [Testing Guide](../test/README.md)
- [API Integration](../services/README.md)