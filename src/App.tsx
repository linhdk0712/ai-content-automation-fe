import { Box } from '@mui/material'
import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AccessibilityProvider, AccessibilityToolbarComponent } from './components/common/AccessibilityUtils'
import ErrorBoundary from './components/common/ErrorBoundary'
import Layout from './components/common/Layout'
import LoadingSpinner from './components/common/LoadingStates'
import { NotificationProvider } from './components/common/NotificationSystem'
import ProtectedRoute from './components/common/ProtectedRoute'
import { RealTimeProvider } from './contexts/RealTimeContext'
import { useAuth } from './hooks/useAuth'
import { useUserPresence } from './hooks/useUserPresence'
import { useWebSocket } from './hooks/useWebSocket'
import { ThemeProvider } from './theme/ThemeProvider'
import { ComponentPreloader, createRouteComponent } from './utils/codeSplitting'
import { usePerformanceMonitor } from './utils/performance'

// Enhanced lazy loading with route-based code splitting
const Login = createRouteComponent(
  () => import('./pages/auth/Login'),
  'Login'
)

const Register = createRouteComponent(
  () => import('./pages/auth/Register'),
  'Register'
)

const Dashboard = createRouteComponent(
  () => import('./pages/Dashboard'),
  'Dashboard'
)

const ContentCreator = createRouteComponent(
  () => import('./pages/content/ContentCreator'),
  'Content Creator'
)

const Templates = createRouteComponent(
  () => import('./pages/templates/Templates'),
  'Templates'
)

const TemplateEditor = createRouteComponent(
  () => import('./components/templates/TemplateEditor'),
  'Template Editor'
)

const TemplateViewer = createRouteComponent(
  () => import('./components/templates/TemplateViewer'),
  'Template Viewer'
)

const Analytics = createRouteComponent(
  () => import('./pages/analytics/Analytics'),
  'Analytics'
)

const Settings = createRouteComponent(
  () => import('./pages/settings/Settings'),
  'Settings'
)

const Pricing = createRouteComponent(
  () => import('./pages/pricing/Pricing'),
  'Pricing'
)

const PaymentSuccess = createRouteComponent(
  () => import('./pages/payment/PaymentSuccess'),
  'Payment Success'
)

const PaymentFailure = createRouteComponent(
  () => import('./pages/payment/PaymentFailure'),
  'Payment Failure'
)

// Preload critical components
ComponentPreloader.preload('Dashboard', () => import('./pages/Dashboard'))
ComponentPreloader.preload('ContentCreator', () => import('./pages/content/ContentCreator'))



function App() {
  const { isLoading, user } = useAuth()
  const { startMeasure, endMeasure } = usePerformanceMonitor()
  const { isConnected, connect } = useWebSocket({ autoConnect: true })
  const { initializeUser } = useUserPresence({ autoInitialize: false })

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
      // Initialize user presence
      initializeUser({
        userId: user.id?.toString() || 'anonymous',
        username: user.username || user.email || 'Anonymous User',
        avatar: (user as any).avatar || (user as any).profilePictureUrl || undefined
      })

      // Connect WebSocket if not already connected
      if (!isConnected) {
        const token = localStorage.getItem('auth_token')
        if (token) {
          connect(token)
        }
      }
    }
  }, [user, isLoading, isConnected, connect, initializeUser])

  if (isLoading) {
    return (
      <ThemeProvider>
        <LoadingSpinner fullScreen message="Loading application..." />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <AccessibilityProvider>
        <NotificationProvider>
          <RealTimeProvider autoConnect={!!user}>
            <ErrorBoundary
              onError={(error, errorInfo) => {
                console.error('App Error:', error, errorInfo)
                // Send to error tracking service in production
              }}
            >
              <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/pricing" element={<Pricing />} />
                  
                  {/* Payment routes */}
                  <Route path="/payment/success" element={<PaymentSuccess />} />
                  <Route path="/payment/failure" element={<PaymentFailure />} />
                  
                  {/* Protected routes */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="content/create" element={<ContentCreator />} />
                    <Route path="templates" element={<Templates />} />
                    <Route path="templates/new" element={<TemplateEditor />} />
                    <Route path="templates/:id" element={<TemplateViewer />} />
                    <Route path="templates/:id/edit" element={<TemplateEditor />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                  
                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
                
                {/* Accessibility toolbar */}
                <AccessibilityToolbarComponent />
              </Box>
            </ErrorBoundary>
          </RealTimeProvider>
        </NotificationProvider>
      </AccessibilityProvider>
    </ThemeProvider>
  )
}

export default App