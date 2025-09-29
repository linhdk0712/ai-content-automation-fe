/**
 * Toast utilities - Centralized export for all toast-related functionality
 */

// Core services and hooks
export { toastService } from '../services/toast.service'
export { useToast } from '../hooks/useToast'
export type { ToastServiceOptions, ToastAction } from '../services/toast.service'
export type { UseToastReturn } from '../hooks/useToast'

// Context and providers
export { useNotification } from '../contexts/NotificationContext'
export { 
  ToastProvider, 
  useToastContext, 
  withToast,
  useFormToast,
  useDataToast,
  useApiToast
} from '../components/common/ToastProvider'

// Migration utilities
export { 
  NotificationMigration, 
  migrationHelpers 
} from './notification-migration'
export type { LegacyNotificationOptions } from './notification-migration'

// Common toast patterns - ready-to-use functions
export const toast = {
  // Basic toasts
  success: (message: string, options?: any) => 
    import('../services/toast.service').then(({ toastService }) => 
      toastService.success(message, options)
    ),
  
  error: (message: string, options?: any) => 
    import('../services/toast.service').then(({ toastService }) => 
      toastService.error(message, options)
    ),
  
  warning: (message: string, options?: any) => 
    import('../services/toast.service').then(({ toastService }) => 
      toastService.warning(message, options)
    ),
  
  info: (message: string, options?: any) => 
    import('../services/toast.service').then(({ toastService }) => 
      toastService.info(message, options)
    ),

  // Convenience methods
  saveSuccess: (itemName = 'Item') => 
    import('../services/toast.service').then(({ toastService }) => 
      toastService.success(`${itemName} saved successfully`)
    ),
  
  saveError: (error?: string) => 
    import('../services/toast.service').then(({ toastService }) => 
      toastService.error(error || 'Failed to save item')
    ),
  
  deleteSuccess: (itemName = 'Item') => 
    import('../services/toast.service').then(({ toastService }) => 
      toastService.success(`${itemName} deleted successfully`)
    ),
  
  deleteError: (error?: string) => 
    import('../services/toast.service').then(({ toastService }) => 
      toastService.error(error || 'Failed to delete item')
    ),

  // Network and auth
  networkError: () => 
    import('../services/toast.service').then(({ toastService }) => 
      toastService.error('Network error. Please check your connection.', {
        title: 'Connection Error',
        actions: [{
          label: 'Retry',
          action: () => window.location.reload(),
          style: 'primary'
        }]
      })
    ),
  
  authError: () => 
    import('../services/toast.service').then(({ toastService }) => 
      toastService.error('Your session has expired. Please log in again.', {
        title: 'Authentication Required',
        actions: [{
          label: 'Login',
          action: () => {
            localStorage.removeItem('accessToken')
            window.location.href = '/login'
          },
          style: 'primary'
        }]
      })
    ),

  // API responses
  apiError: (error: any) => 
    import('../services/toast.service').then(({ toastService }) => 
      toastService.apiError(error)
    ),
  
  response: (status: number, errorCode?: string | null, errorMessage?: string | null, successMessage?: string) => 
    import('../services/toast.service').then(({ toastService }) => 
      toastService.response(status, errorCode, errorMessage, successMessage)
    )
}

// Quick access patterns for common scenarios
export const quickToast = {
  // Authentication
  loginSuccess: () => toast.success('Welcome back!'),
  loginError: (error?: string) => toast.error(error || 'Login failed'),
  logoutSuccess: () => toast.info('You have been logged out'),
  
  // Registration
  registerSuccess: () => toast.success('Account created successfully! Please check your email.'),
  registerError: (error?: string) => toast.error(error || 'Registration failed'),
  
  // Profile
  profileUpdated: () => toast.success('Profile updated successfully'),
  profileError: (error?: string) => toast.error(error || 'Failed to update profile'),
  
  // Content operations
  contentCreated: () => toast.saveSuccess('Content'),
  contentUpdated: () => toast.saveSuccess('Content'),
  contentDeleted: () => toast.deleteSuccess('Content'),
  contentPublished: () => toast.success('Content published successfully'),
  contentScheduled: () => toast.success('Content scheduled successfully'),
  
  // File operations
  fileUploaded: () => toast.success('File uploaded successfully'),
  fileUploadError: (error?: string) => toast.error(error || 'File upload failed'),
  fileDeleted: () => toast.deleteSuccess('File'),
  
  // Settings
  settingsSaved: () => toast.success('Settings saved successfully'),
  settingsError: (error?: string) => toast.error(error || 'Failed to save settings'),
  
  // Invitations
  invitationSent: () => toast.success('Invitation sent successfully'),
  invitationAccepted: () => toast.success('Invitation accepted'),
  invitationDeclined: () => toast.info('Invitation declined'),
  
  // Permissions
  permissionGranted: () => toast.success('Permission granted'),
  permissionRevoked: () => toast.warning('Permission revoked'),
  accessDenied: () => toast.error('Access denied', { title: 'Permission Error' }),
  
  // Data operations
  dataImported: (count: number) => toast.success(`${count} items imported successfully`),
  dataExported: () => toast.success('Data exported successfully'),
  dataSynced: () => toast.success('Data synchronized'),
  
  // Validation
  validationFailed: (message?: string) => 
    toast.warning(message || 'Please check your input', { title: 'Validation Error' }),
  
  // Generic operations
  operationSuccess: (operation = 'Operation') => toast.success(`${operation} completed successfully`),
  operationFailed: (operation = 'Operation', error?: string) => 
    toast.error(error || `${operation} failed`),
  
  // Maintenance and system
  maintenanceMode: () => toast.warning('System is under maintenance', { 
    title: 'Maintenance', 
    persistent: true 
  }),
  systemUpdate: () => toast.info('System has been updated. Please refresh the page.', {
    actions: [{
      label: 'Refresh',
      action: () => window.location.reload(),
      style: 'primary'
    }]
  })
}

// Type-safe toast configuration
export interface ToastConfig {
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center'
  autoClose?: number | false
  hideProgressBar?: boolean
  closeOnClick?: boolean
  pauseOnHover?: boolean
  draggable?: boolean
  theme?: 'light' | 'dark' | 'colored'
}

// Configure toast defaults
export const configureToast = (config: ToastConfig) => {
  import('../services/toast.service').then(({ toastService }) => {
    toastService.configure(config)
  })
}

// Utility functions
export const toastUtils = {
  // Dismiss toasts
  dismiss: (toastId?: any) => 
    import('../services/toast.service').then(({ toastService }) => 
      toastService.dismiss(toastId)
    ),
  
  dismissAll: () => 
    import('../services/toast.service').then(({ toastService }) => 
      toastService.dismiss()
    ),
  
  // Check if toast is active
  isActive: (toastId: any) => 
    import('../services/toast.service').then(({ toastService }) => 
      toastService.isActive(toastId)
    ),
  
  // Update existing toast
  update: (toastId: any, message: string, type: 'success' | 'error' | 'warning' | 'info', options?: any) => 
    import('../services/toast.service').then(({ toastService }) => 
      toastService.update(toastId, message, type, options)
    )
}

// Default export for convenience
export default {
  toast,
  quickToast,
  toastUtils,
  configureToast
}