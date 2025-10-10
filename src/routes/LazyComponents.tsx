import { createLazyWrapper, createRetryableLazy } from '../components/common/LazyWrapper'

// ===================
// MAIN PAGES
// ===================

// Dashboard - Critical page, load with retry
const LazyDashboard = createRetryableLazy(
  () => import('../pages/Dashboard'),
  { name: 'Dashboard', retries: 3 }
)
export const Dashboard = createLazyWrapper(LazyDashboard, {
  name: 'Dashboard',
  fallbackType: 'dashboard'
})

// Auth pages - Simple, no heavy dependencies
const LazyLogin = createRetryableLazy(
  () => import('../pages/auth/Login'),
  { name: 'Login' }
)
export const Login = createLazyWrapper(LazyLogin, {
  name: 'Login',
  fallbackType: 'form'
})

const LazyRegister = createRetryableLazy(
  () => import('../pages/auth/Register'),
  { name: 'Register' }
)
export const Register = createLazyWrapper(LazyRegister, {
  name: 'Register',
  fallbackType: 'form'
})

// Content pages - Feature heavy
const LazyContentCreator = createRetryableLazy(
  () => import('../pages/content/ContentCreator'),
  { name: 'ContentCreator', retries: 2 }
)
export const ContentCreator = createLazyWrapper(LazyContentCreator, {
  name: 'Content Creator',
  fallbackType: 'form'
})

const LazyContentLibrary = createRetryableLazy(
  () => import('../pages/content/ContentLibrary'),
  { name: 'ContentLibrary' }
)
export const ContentLibrary = createLazyWrapper(LazyContentLibrary, {
  name: 'Content Library',
  fallbackType: 'list'
})

const LazyContentAnalytics = createRetryableLazy(
  () => import('../pages/content/ContentAnalytics'),
  { name: 'Analytics' }
)
export const Analytics = createLazyWrapper(LazyContentAnalytics, {
  name: 'Analytics',
  fallbackType: 'dashboard'
})

// Settings - Admin functionality
const LazySettings = createRetryableLazy(
  () => import('../pages/settings/Settings'),
  { name: 'Settings' }
)
export const Settings = createLazyWrapper(LazySettings, {
  name: 'Settings',
  fallbackType: 'form'
})

// Templates - Less frequently used
const LazyTemplates = createRetryableLazy(
  () => import('../pages/templates/Templates'),
  { name: 'Templates' }
)
export const Templates = createLazyWrapper(LazyTemplates, {
  name: 'Templates',
  fallbackType: 'list'
})

// Pricing - Static content
const LazyPricing = createRetryableLazy(
  () => import('../pages/pricing/Pricing'),
  { name: 'Pricing' }
)
export const Pricing = createLazyWrapper(LazyPricing, {
  name: 'Pricing',
  fallbackType: 'page'
})