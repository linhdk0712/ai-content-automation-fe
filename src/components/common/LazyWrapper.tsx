import { Box, CircularProgress, Skeleton, Typography } from '@mui/material'
import React, { ComponentType, LazyExoticComponent, Suspense } from 'react'
import { RouteErrorBoundary } from './ErrorBoundaries'

interface LazyWrapperProps {
  fallback?: React.ReactNode
  errorFallback?: React.ReactNode
  minDelay?: number
}

/**
 * Custom loading fallback component
 */
const DefaultLoadingFallback = ({ message = 'Loading...' }: { message?: string }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '200px',
      p: 3
    }}
  >
    <CircularProgress size={40} sx={{ mb: 2 }} />
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
)

/**
 * Skeleton loading for different content types
 */
export const SkeletonFallbacks = {
  page: (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="60%" height={24} />
    </Box>
  ),
  
  form: (
    <Box sx={{ p: 3, maxWidth: 600 }}>
      <Skeleton variant="text" width="50%" height={32} sx={{ mb: 3 }} />
      <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={120} sx={{ mb: 3 }} />
      <Skeleton variant="rectangular" width="30%" height={40} />
    </Box>
  ),
  
  list: (
    <Box sx={{ p: 2 }}>
      {[0, 1, 2, 3, 4].map((index) => (
        <Box key={`skeleton-list-item-${index}`} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="70%" height={24} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="40%" height={16} />
          </Box>
        </Box>
      ))}
    </Box>
  ),
  
  card: (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="60%" height={28} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="80%" height={20} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="40%" height={20} />
    </Box>
  ),
  
  dashboard: (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Skeleton variant="rectangular" width="25%" height={120} />
        <Skeleton variant="rectangular" width="25%" height={120} />
        <Skeleton variant="rectangular" width="25%" height={120} />
        <Skeleton variant="rectangular" width="25%" height={120} />
      </Box>
      <Skeleton variant="rectangular" width="100%" height={300} sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Skeleton variant="rectangular" width="50%" height={200} />
        <Skeleton variant="rectangular" width="50%" height={200} />
      </Box>
    </Box>
  )
}

/**
 * Enhanced lazy loading wrapper with error boundaries and custom fallbacks
 */
export const createLazyWrapper = <P = {}>(
  LazyComponent: LazyExoticComponent<ComponentType<P>>,
  options: LazyWrapperProps & {
    name?: string
    fallbackType?: keyof typeof SkeletonFallbacks
  } = {}
) => {
  const {
    fallback,
    errorFallback,
    name = 'Component',
    fallbackType
  } = options

  const WrappedComponent = (props: P) => {
    const loadingFallback = fallback || 
      (fallbackType ? SkeletonFallbacks[fallbackType] : null) ||
      <DefaultLoadingFallback message={`Loading ${name}...`} />

    return (
      <RouteErrorBoundary fallback={errorFallback}>
        <Suspense fallback={loadingFallback}>
          <LazyComponent {...(props as any)} />
        </Suspense>
      </RouteErrorBoundary>
    )
  }

  WrappedComponent.displayName = `LazyWrapper(${name})`
  return WrappedComponent
}

/**
 * Higher-order function for creating lazy components with retry logic
 */
export const createRetryableLazy = <P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: {
    name?: string
    retries?: number
    retryDelay?: number
  } = {}
) => {
  const { name = 'Component', retries = 3, retryDelay = 1000 } = options

  const retryableImport = async (attempt = 1): Promise<{ default: ComponentType<P> }> => {
    try {
      return await importFn()
    } catch (error) {
      if (attempt < retries) {
        console.warn(`Failed to load ${name}, retrying... (${attempt}/${retries})`)
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
        return retryableImport(attempt + 1)
      }
      throw error
    }
  }

  return React.lazy(retryableImport)
}

/**
 * Preload function for lazy components
 */
export const preloadLazyComponent = (importFn: () => Promise<{ default: ComponentType<unknown> }>) => {
  return importFn().catch((error) => {
    console.warn('Failed to preload component:', error)
  })
}

export default createLazyWrapper