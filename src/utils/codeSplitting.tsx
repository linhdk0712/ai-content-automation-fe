import { Box, CircularProgress, Skeleton, Typography } from '@mui/material';
import React, { ComponentType, LazyExoticComponent, Suspense } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

// Enhanced loading component
const LoadingFallback: React.FC<{
  message?: string;
  variant?: 'spinner' | 'skeleton' | 'minimal';
}> = ({
  message = 'Loading...',
  variant = 'spinner'
}) => {
    switch (variant) {
      case 'skeleton':
        return (
          <Box sx={{ p: 3 }}>
            <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
            <Skeleton variant="text" height={40} sx={{ mb: 1 }} />
            <Skeleton variant="text" height={40} sx={{ mb: 1 }} />
            <Skeleton variant="text" height={40} width="60%" />
          </Box>
        );

      case 'minimal':
        return (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px'
            }}
          >
            <CircularProgress size={24} />
          </Box>
        );

      default:
        return (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
              gap: 2
            }}
          >
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary">
              {message}
            </Typography>
          </Box>
        );
    }
  };

// Error fallback component
const ErrorFallback: React.FC<{
  error: Error;
  resetErrorBoundary: () => void;
}> = ({ error, resetErrorBoundary }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
      gap: 2,
      p: 3,
      textAlign: 'center'
    }}
  >
    <Typography variant="h6" color="error">
      Something went wrong
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {error.message}
    </Typography>
    <button
      onClick={resetErrorBoundary}
      style={{
        padding: '8px 16px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        background: 'white',
        cursor: 'pointer'
      }}
    >
      Try again
    </button>
  </Box>
);

// Enhanced lazy loading with error boundary and custom loading
export function createLazyComponent<TProps>(
  importFunc: () => Promise<{ default: ComponentType<TProps> }>,
  options: {
    fallback?: React.ComponentType;
    errorFallback?: React.ComponentType<FallbackProps>;
    loadingMessage?: string;
    loadingVariant?: 'spinner' | 'skeleton' | 'minimal';
    preload?: boolean;
  } = {}
): LazyExoticComponent<ComponentType<TProps>> {
  const LazyComponent = React.lazy(importFunc);

  // Preload component if requested
  if (options.preload) {
    importFunc();
  }

  const WrappedComponent = React.forwardRef<unknown, TProps>((props, ref) => (
    <ErrorBoundary
      FallbackComponent={options.errorFallback ?? ((props) => <ErrorFallback error={props.error} resetErrorBoundary={props.resetErrorBoundary} />)}
      onReset={() => window.location.reload()}
    >
      <Suspense
        fallback={
          options.fallback ? (
            <options.fallback />
          ) : (
            <LoadingFallback
              message={options.loadingMessage}
              variant={options.loadingVariant}
            />
          )
        }
      >

        <LazyComponent {...props} ref={ref} />
      </Suspense>
    </ErrorBoundary>
  ));

  const lazyDisplayName: string | undefined = (LazyComponent as unknown as { displayName?: string }).displayName;
  WrappedComponent.displayName = `LazyWrapper(${lazyDisplayName || 'Component'})`;

  return WrappedComponent as unknown as LazyExoticComponent<ComponentType<TProps>>;
}

// Route-based code splitting
export const createRouteComponent = <TProps,>(
  importFunc: () => Promise<{ default: ComponentType<TProps> }>,
  routeName: string
) => {
  return createLazyComponent(importFunc, {
    loadingMessage: `Loading ${routeName}...`,
    loadingVariant: 'skeleton'
  });
};

// Feature-based code splitting
export const createFeatureComponent = <TProps,>(
  importFunc: () => Promise<{ default: ComponentType<TProps> }>,
  featureName: string
) => {
  return createLazyComponent(importFunc, {
    loadingMessage: `Loading ${featureName}...`,
    loadingVariant: 'minimal'
  });
};

// Preload utilities
export class ComponentPreloader {
  private static preloadedComponents = new Set<string>();

  static preload(
    componentName: string,
    importFunc: () => Promise<unknown>
  ): void {
    if (this.preloadedComponents.has(componentName)) {
      return;
    }

    this.preloadedComponents.add(componentName);

    // Preload on idle or after a delay
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        importFunc().catch((err) => console.error(err));
      });
    } else {
      setTimeout(() => {
        importFunc().catch((err) => console.error(err));
      }, 100);
    }
  }

  static preloadOnHover(
    element: HTMLElement,
    componentName: string,
    importFunc: () => Promise<unknown>
  ): void {
    const handleMouseEnter = () => {
      this.preload(componentName, importFunc);
      element.removeEventListener('mouseenter', handleMouseEnter);
    };

    element.addEventListener('mouseenter', handleMouseEnter);
  }

  static preloadOnIntersection(
    element: HTMLElement,
    componentName: string,
    importFunc: () => Promise<unknown>,
    options: IntersectionObserverInit = {}
  ): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.preload(componentName, importFunc);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '100px', ...options }
    );

    observer.observe(element);
  }
}

// Bundle splitting utilities
export const BundleSplitter = {
  // Split by route
  byRoute: (routePath: string) => {
    const routeName = routePath.split('/').pop() || 'unknown';
    return `route-${routeName}`;
  },

  // Split by feature
  byFeature: (featureName: string) => {
    return `feature-${featureName}`;
  },

  // Split by vendor
  byVendor: (packageName: string) => {
    if (packageName.includes('react')) return 'react-vendor';
    if (packageName.includes('@mui')) return 'mui-vendor';
    if (packageName.includes('@tanstack')) return 'query-vendor';
    if (packageName.includes('router')) return 'router-vendor';
    return 'vendor';
  }
};

// Performance monitoring for lazy components
export const LazyComponentMonitor = {
  measureLoadTime: (componentName: string) => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      console.log(`[Lazy Load] ${componentName}: ${loadTime.toFixed(2)}ms`);

      // Report to analytics in production
      if (import.meta.env.PROD) {
        // Send to analytics service
        (window as typeof window & { gtag?: (...args: unknown[]) => void }).gtag?.(
          'event',
          'lazy_component_load',
          {
          component_name: componentName,
          load_time: loadTime
        }
        );
      }
    };
  }
};

// React hook for lazy loading with monitoring
export const useLazyComponent = <TProps,>(
  componentName: string,
  importFunc: () => Promise<{ default: ComponentType<TProps> }>
) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [Component, setComponent] = React.useState<ComponentType<TProps> | null>(null);

  React.useEffect(() => {
    const measureEnd = LazyComponentMonitor.measureLoadTime(componentName);

    importFunc()
      .then((module) => {
        setComponent(() => module.default);
        setIsLoading(false);
        measureEnd();
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
        console.error(`Failed to load component ${componentName}:`, err);
      });
  }, [componentName, importFunc]);

  return { Component, isLoading, error };
};