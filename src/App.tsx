import { Box } from '@mui/material'
import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { AccessibilityProvider, AccessibilityToolbarComponent } from './components/common/AccessibilityUtils'
import { ErrorBoundary } from './components/common/ErrorBoundaries'
import LoadingSpinner from './components/common/LoadingStates'
import NotificationContainer from './components/common/NotificationContainer'

import { useAuth } from './hooks/useAuth'
import routes from './router'
import { realTimeManager } from './services/realtime.manager'
import { ComponentPreloader } from './utils/codeSplitting'
import { i18nManager } from './utils/internationalization/i18nManager'
import { usePerformanceMonitor } from './utils/performance'

// Import debug utilities in development
if (import.meta.env.DEV) {
  import('./utils/login-test')
  import('./utils/response-debug')
}

// Create router instance for SPA
const router = createBrowserRouter(routes, {
  // Enable future flags for better SPA performance
  future: {
    v7_normalizeFormMethod: true,
    // @ts-expect-error: Flag exists at runtime in newer React Router versions
    v7_startTransition: true,
  },
})

// Preload critical components for better SPA performance
ComponentPreloader.preload('Dashboard', () => import('./pages/Dashboard'))
ComponentPreloader.preload('ContentCreator', () => import('./pages/content/ContentCreator'))
ComponentPreloader.preload('Login', () => import('./pages/auth/Login'))



function AppContent() {
  const { isLoading, user } = useAuth()
  const { startMeasure, endMeasure } = usePerformanceMonitor()
  // const { initializeUser } = useUserPresence({ autoInitialize: false }) // deprecated realtime hook

  // Initialize i18n
  React.useEffect(() => {
    const initializeI18n = async () => {
      try {
        const currentLang = i18nManager.getCurrentLanguage()
        console.log('Initializing i18n with language:', currentLang)
        await i18nManager.loadLanguage(currentLang)
        console.log('i18n initialized successfully')
      } catch (error) {
        console.error('Failed to initialize i18n:', error)
        // Fallback to English if current language fails
        try {
          console.log('Falling back to English...')
          await i18nManager.loadLanguage('en')
        } catch (fallbackError) {
          console.error('Failed to load fallback language:', fallbackError)
        }
      }
    }

    initializeI18n()
  }, [])

  // Measure app initialization time
  React.useEffect(() => {
    startMeasure('app-initialization')

    return () => {
      endMeasure('app-initialization')
    }
  }, [startMeasure, endMeasure])

  // Initialize real-time features when user is authenticated
  React.useEffect(() => {
    if (user && !isLoading) {
      console.log('User authenticated:', user.email, '- Initializing real-time features')

      // Initialize real-time services with user context
      realTimeManager.initialize(user.id).catch(error => {
        console.error('Failed to initialize real-time services:', error)
      })
    } else if (!user && !isLoading) {
      // Disconnect real-time services when user logs out
      realTimeManager.disconnect()
    }
  }, [user, isLoading])

  // Cleanup real-time connections on unmount
  React.useEffect(() => {
    return () => {
      realTimeManager.disconnect()
    }
  }, [])

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading application..." />
  }

  return (
    <ErrorBoundary>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* Use RouterProvider for optimized SPA routing */}
        <RouterProvider
          router={router}
          fallbackElement={<LoadingSpinner fullScreen message="Loading page..." />}
        />

        {/* Accessibility toolbar */}
        <AccessibilityToolbarComponent />

        {/* Notification container for ResponseBase notifications */}
        <NotificationContainer />
      </Box>
    </ErrorBoundary>
  )
}

function App() {
  return (
    <AccessibilityProvider>
      <AppContent />
    </AccessibilityProvider>
  )
}

export default App