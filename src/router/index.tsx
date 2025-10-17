import { Navigate, RouteObject } from 'react-router-dom'

import Layout from '../components/common/Layout'
import ProtectedRoute from '../components/common/ProtectedRoute'
import { createRouteComponent } from '../utils/codeSplitting'

// Lazy load all route components for optimal SPA performance
const Dashboard = createRouteComponent(
  () => import('../pages/Dashboard'),
  'Dashboard'
)

const Login = createRouteComponent(
  () => import('../pages/auth/Login'),
  'Login'
)

const Register = createRouteComponent(
  () => import('../pages/auth/Register'),
  'Register'
)

const ContentCreator = createRouteComponent(
  () => import('../pages/content/ContentCreator'),
  'Content Creator'
)

const ContentLibrary = createRouteComponent(
  () => import('../pages/content/ContentLibraryEnhanced'),
  'Content Library'
)

const ContentWorkflow = createRouteComponent(
  () => import('../pages/content/ContentWorkflow'),
  'Content Workflow'
)

const Templates = createRouteComponent(
  () => import('../pages/templates/Templates'),
  'Templates'
)

const TemplateEditor = createRouteComponent(
  () => import('../components/templates/TemplateEditor'),
  'Template Editor'
)

const TemplateViewer = createRouteComponent(
  () => import('../components/templates/TemplateViewer'),
  'Template Viewer'
)

const Analytics = createRouteComponent(
  () => import('../pages/analytics/Analytics'),
  'Analytics'
)

const Settings = createRouteComponent(
  () => import('../pages/settings/Settings'),
  'Settings'
)

const Pricing = createRouteComponent(
  () => import('../pages/pricing/Pricing'),
  'Pricing'
)

const PaymentSuccess = createRouteComponent(
  () => import('../pages/payment/PaymentSuccess'),
  'Payment Success'
)

const PaymentFailure = createRouteComponent(
  () => import('../pages/payment/PaymentFailure'),
  'Payment Failure'
)

const WorkflowRunsPage = createRouteComponent(
  () => import('../pages/workflows/WorkflowRunsPage'),
  'Workflow Runs'
)

const RunViewer = createRouteComponent(
  () => import('../pages/workflows/RunViewer'),
  'Run Viewer'
)

const ContentWorkflowPage = createRouteComponent(
  () => import('../pages/workflows/ContentWorkflowPage'),
  'Content Workflow Monitor'
)

const WorkflowTimelinePage = createRouteComponent(
  () => import('../pages/workflows/WorkflowTimelinePage'),
  'Workflow Timeline'
)

const LanguageDemo = createRouteComponent(
  () => import('../components/demo/LanguageDemo'),
  'Language Demo'
)

const WorkflowDemo = createRouteComponent(
  () => import('../components/demo/WorkflowDemo'),
  'Workflow Demo'
)

const I18nDebug = createRouteComponent(
  () => import('../components/debug/I18nDebug'),
  'i18n Debug'
)

// SPA Route Configuration
export const routes: RouteObject[] = [
  // Public routes
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/pricing',
    element: <Pricing />,
  },

  // Payment routes
  {
    path: '/payment/success',
    element: <PaymentSuccess />,
  },
  {
    path: '/payment/failure',
    element: <PaymentFailure />,
  },

  // Protected routes with layout
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },

      // Content routes
      {
        path: 'content',
        children: [
          {
            path: 'workflow',
            element: <ContentWorkflow />,
          },
          {
            path: 'create',
            element: <ContentCreator />,
          },
          {
            path: 'library',
            element: <ContentLibrary />,
          },
          {
            path: 'edit/:id',
            element: <ContentCreator />,
          },
        ],
      },

      // Template routes
      {
        path: 'templates',
        children: [
          {
            index: true,
            element: <Templates />,
          },
          {
            path: 'new',
            element: <TemplateEditor />,
          },
          {
            path: ':id',
            element: <TemplateViewer />,
          },
          {
            path: ':id/edit',
            element: <TemplateEditor />,
          },
        ],
      },

      // Workflow routes
      {
        path: 'workflows',
        children: [
          {
            index: true,
            element: <WorkflowRunsPage />,
          },
          {
            path: 'runs/:runId',
            element: <RunViewer />,
          },
          {
            path: 'content',
            element: <ContentWorkflowPage />,
          },
          {
            path: 'timeline',
            element: <WorkflowTimelinePage />,
          },
        ],
      },

      // Demo routes
      {
        path: 'demo',
        children: [
          {
            path: 'language',
            element: <LanguageDemo />,
          },
          {
            path: 'workflow',
            element: <WorkflowDemo />,
          },
        ],
      },

      // Debug routes
      {
        path: 'debug',
        children: [
          {
            path: 'i18n',
            element: <I18nDebug />,
          },
        ],
      },

      // Other routes
      {
        path: 'analytics',
        element: <Analytics />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },

  // Catch all route - redirect to dashboard for SPA
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]

export default routes