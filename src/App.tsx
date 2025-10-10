import { Box } from '@mui/material'
import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AccessibilityProvider, AccessibilityToolbarComponent } from './components/common/AccessibilityUtils'
import { ErrorBoundary } from './components/common/ErrorBoundaries'
import Layout from './components/common/Layout'
import LoadingSpinner from './components/common/LoadingStates'
import NotificationContainer from './components/common/NotificationContainer'
import ProtectedRoute from './components/common/ProtectedRoute'
import { SupabaseProvider } from './contexts/RealTimeContext'
import { useAuth } from './hooks/useAuth'
// import { useUserPresence } from './hooks/useUserPresence' // deprecated realtime hook
import { ComponentPreloader, createRouteComponent } from './utils/codeSplitting'
import { usePerformanceMonitor } from './utils/performance'
import { i18nManager } from './utils/internationalization/i18nManager'

// Import debug utilities in development
if (import.meta.env.DEV) {
  import('./utils/login-test')
  import('./utils/response-debug')
}

// Import Dashboard directly for debugging
import Dashboard from './pages/Dashboard'

// Enhanced lazy loading with route-based code splitting
const Login = createRouteComponent(
  () => import('./pages/auth/Login'),
  'Login'
)

const Register = createRouteComponent(
  () => import('./pages/auth/Register'),
  'Register'
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
const ContentWorkflow = createRouteComponent(
  () => import('./pages/content/ContentWorkflow'),
  'Content Workflow'
)

const LanguageDemo = createRouteComponent(
  () => import('./components/demo/LanguageDemo'),
  'Language Demo'
)

const WorkflowDemo = createRouteComponent(
  () => import('./components/demo/WorkflowDemo'),
  'Workflow Demo'
)



const WorkflowRunsPage = createRouteComponent(
  () => import('./pages/workflows/WorkflowRunsPage'),
  'Workflow Runs'
)

const RunViewer = createRouteComponent(
  () => import('./pages/workflows/RunViewer'),
  'Run Viewer'
)

const ContentWorkflowPage = createRouteComponent(
  () => import('./pages/workflows/ContentWorkflowPage'),
  'Content Workflow Monitor'
)

const WorkflowTimelinePage = createRouteComponent(
  () => import('./pages/workflows/WorkflowTimelinePage'),
  'Workflow Timeline'
)

// Preload critical components
ComponentPreloader.preload('Dashboard', () => import('./pages/Dashboard'))
ComponentPreloader.preload('ContentCreator', () => import('./pages/content/ContentCreator'))



function AppContent() {
  const { isLoading, user } = useAuth()
  const { startMeasure, endMeasure } = usePerformanceMonitor()
  // const { initializeUser } = useUserPresence({ autoInitialize: false }) // deprecated realtime hook

  // Initialize i18n
  React.useEffect(() => {
    const initializeI18n = async () => {
      try {
        await i18nManager.loadLanguage(i18nManager.getCurrentLanguage())
      } catch (error) {
        console.error('Failed to initialize i18n:', error)
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
      // Initialize user presence - deprecated, to be replaced with new realtime technology
      // initializeUser({
      //   userId: user.id?.toString() || 'anonymous',
      //   username: user.username || user.email || 'Anonymous User',
      //   avatar: (user as any).avatar || (user as any).profilePictureUrl || undefined
      // })
      console.log('User authenticated:', user.email, '- Real-time features disabled pending new implementation')
    }
  }, [user, isLoading])

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
              <Route path="content/workflow" element={<ContentWorkflow />} />
              <Route path="content/create" element={<ContentCreator />} />
              <Route path="content/library" element={<ContentLibrary />} />
              <Route path="content/edit/:id" element={<ContentCreator />} />
              <Route path="templates" element={<Templates />} />
              <Route path="templates/new" element={<TemplateEditor />} />
              <Route path="templates/:id" element={<TemplateViewer />} />
              <Route path="templates/:id/edit" element={<TemplateEditor />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
              <Route path="workflows" element={<WorkflowRunsPage />} />
              <Route path="workflows/runs/:runId" element={<RunViewer />} />
              <Route path="workflows/content" element={<ContentWorkflowPage />} />
              <Route path="workflows/timeline" element={<WorkflowTimelinePage />} />
              <Route path="demo/language" element={<LanguageDemo />} />
              <Route path="demo/workflow" element={<WorkflowDemo />} />
             
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