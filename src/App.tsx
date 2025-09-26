import { Box } from '@mui/material'
import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AccessibilityProvider, AccessibilityToolbarComponent } from './components/common/AccessibilityUtils'
import ErrorBoundary from './components/common/ErrorBoundary'
import Layout from './components/common/Layout'
import LoadingSpinner from './components/common/LoadingStates'
import NotificationContainer from './components/common/NotificationContainer'
import ProtectedRoute from './components/common/ProtectedRoute'
import { SupabaseProvider } from './contexts/RealTimeContext'
import { useAuth } from './hooks/useAuth'
import { useUserPresence } from './hooks/useUserPresence'
import { ComponentPreloader, createRouteComponent } from './utils/codeSplitting'
import { usePerformanceMonitor } from './utils/performance'

// Import debug utilities in development
if (import.meta.env.DEV) {
  import('./utils/login-test')
  import('./utils/response-debug')
}

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

const ContentLibrary = createRouteComponent(
  () => import('./pages/content/ContentLibraryEnhanced'),
  'Content Library'
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

const RunViewer = createRouteComponent(
  () => import('./pages/workflows/RunViewer'),
  'Workflow Run'
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

const RealtimeEventsTest = createRouteComponent(
  () => import('./components/realtime/RealtimeEventsTest').then(m => ({ default: m.RealtimeEventsTest })),
  'Realtime Events Test'
)

const EnvTest = createRouteComponent(
  () => import('./components/debug/EnvTest').then(m => ({ default: m.EnvTest })),
  'Environment Test'
)

const AuthDebug = createRouteComponent(
  () => import('./components/debug/AuthDebug'),
  'Auth Debug'
)

// Preload critical components
ComponentPreloader.preload('Dashboard', () => import('./pages/Dashboard'))
ComponentPreloader.preload('ContentCreator', () => import('./pages/content/ContentCreator'))



function AppContent() {
  const { isLoading, user } = useAuth()
  const { startMeasure, endMeasure } = usePerformanceMonitor()
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
    }
  }, [user, isLoading, initializeUser])

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading application..." />
  }

  return (
    <SupabaseProvider>
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
            <Route path="content/library" element={<ContentLibrary />} />
            <Route path="content/edit/:id" element={<ContentCreator />} />
            <Route path="templates" element={<Templates />} />
            <Route path="templates/new" element={<TemplateEditor />} />
            <Route path="templates/:id" element={<TemplateViewer />} />
            <Route path="templates/:id/edit" element={<TemplateEditor />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
            <Route path="workflows/run/:runId" element={<RunViewer />} />
            <Route path="realtime-test" element={<RealtimeEventsTest />} />
            <Route path="env-test" element={<EnvTest />} />
            <Route path="auth-debug" element={<AuthDebug />} />
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          
          {/* Accessibility toolbar */}
          <AccessibilityToolbarComponent />
          
          {/* Notification container for ResponseBase notifications */}
          <NotificationContainer />
        </Box>
      </ErrorBoundary>
    </SupabaseProvider>
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