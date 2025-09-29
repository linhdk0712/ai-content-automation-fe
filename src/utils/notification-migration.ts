/**
 * Migration utility to help transition from old notification systems to React-Toastify
 * This provides backward compatibility while encouraging use of the new toast system
 */

import { toastService, ToastServiceOptions, ToastAction } from '../services/toast.service'
import { notificationService } from '../services/notification.service'

// Legacy notification interface for backward compatibility
export interface LegacyNotificationOptions {
  title?: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  persistent?: boolean
  actions?: ToastAction[]
}

/**
 * Migration wrapper that converts old notification calls to React-Toastify
 */
export class NotificationMigration {
  /**
   * Show notification using the new toast system
   * This replaces the old notificationService.show() method
   */
  static show(options: LegacyNotificationOptions) {
    const { message, type, title, actions, persistent, duration } = options
    
    // Properly handle autoClose type
    let autoCloseValue: number | false
    if (duration !== undefined) {
      autoCloseValue = duration
    } else if (persistent) {
      autoCloseValue = false
    } else {
      autoCloseValue = 5000
    }
    
    const toastOptions: ToastServiceOptions = {
      title,
      actions,
      persistent,
      autoClose: autoCloseValue
    }

    switch (type) {
      case 'success':
        return toastService.success(message, toastOptions)
      case 'error':
        return toastService.error(message, toastOptions)
      case 'warning':
        return toastService.warning(message, toastOptions)
      case 'info':
      default:
        return toastService.info(message, toastOptions)
    }
  }

  /**
   * Migrate old notification service calls to toast service
   */
  static migrateNotificationService() {
    // Override old notification service methods to use toast service
    const originalShow = notificationService.show.bind(notificationService)
    const originalShowSuccess = notificationService.showSuccess.bind(notificationService)
    const originalShowError = notificationService.showError.bind(notificationService)
    const originalShowWarning = notificationService.showWarning.bind(notificationService)
    const originalShowInfo = notificationService.showInfo.bind(notificationService)

    // Override with toast service implementations
    notificationService.show = (options) => {
      console.warn('notificationService.show() is deprecated. Use toastService or useToast hook instead.')
      return this.show(options) as any
    }

    notificationService.showSuccess = (message, options = {}) => {
      console.warn('notificationService.showSuccess() is deprecated. Use toastService.success() or useToast hook instead.')
      
      const autoClose: number | false = options.duration !== undefined 
        ? options.duration 
        : (options.persistent ? false : 5000)
      
      return toastService.success(message, {
        title: options.title,
        actions: options.actions,
        persistent: options.persistent,
        autoClose
      }) as any
    }

    notificationService.showError = (message, options = {}) => {
      console.warn('notificationService.showError() is deprecated. Use toastService.error() or useToast hook instead.')
      
      const autoClose: number | false = options.duration !== undefined 
        ? options.duration 
        : (options.persistent ? false : 8000)
      
      return toastService.error(message, {
        title: options.title,
        actions: options.actions,
        persistent: options.persistent,
        autoClose
      }) as any
    }

    notificationService.showWarning = (message, options = {}) => {
      console.warn('notificationService.showWarning() is deprecated. Use toastService.warning() or useToast hook instead.')
      
      const autoClose: number | false = options.duration !== undefined 
        ? options.duration 
        : (options.persistent ? false : 6000)
      
      return toastService.warning(message, {
        title: options.title,
        actions: options.actions,
        persistent: options.persistent,
        autoClose
      }) as any
    }

    notificationService.showInfo = (message, options = {}) => {
      console.warn('notificationService.showInfo() is deprecated. Use toastService.info() or useToast hook instead.')
      
      const autoClose: number | false = options.duration !== undefined 
        ? options.duration 
        : (options.persistent ? false : 5000)
      
      return toastService.info(message, {
        title: options.title,
        actions: options.actions,
        persistent: options.persistent,
        autoClose
      }) as any
    }

    // Keep original methods available for rollback if needed
    return {
      restore: () => {
        notificationService.show = originalShow
        notificationService.showSuccess = originalShowSuccess
        notificationService.showError = originalShowError
        notificationService.showWarning = originalShowWarning
        notificationService.showInfo = originalShowInfo
      }
    }
  }

  /**
   * Convert Material-UI AlertColor to toast type
   */
  static convertMuiSeverity(severity: 'success' | 'error' | 'warning' | 'info'): 'success' | 'error' | 'warning' | 'info' {
    return severity // They're the same, but this provides a clear migration path
  }

  /**
   * Helper to show API response notifications
   */
  static showApiResponse(
    status: number,
    errorCode?: string | null,
    errorMessage?: string | null,
    successMessage?: string
  ) {
    return toastService.response(status, errorCode, errorMessage, successMessage)
  }

  /**
   * Helper to show API error notifications
   */
  static showApiError(error: any) {
    return toastService.apiError(error)
  }

  /**
   * Batch migration for common notification patterns
   */
  static createMigrationHelpers() {
    return {
      // CRUD operation helpers
      saveSuccess: (itemName = 'Item') => 
        toastService.success(`${itemName} saved successfully`),
      
      saveError: (error?: string) => 
        toastService.error(error || 'Failed to save item'),
      
      deleteSuccess: (itemName = 'Item') => 
        toastService.success(`${itemName} deleted successfully`),
      
      deleteError: (error?: string) => 
        toastService.error(error || 'Failed to delete item'),
      
      loadError: (error?: string) => 
        toastService.error(error || 'Failed to load data'),
      
      // Authentication helpers
      loginSuccess: () => 
        toastService.success('Welcome back!'),
      
      loginError: (error?: string) => 
        toastService.error(error || 'Login failed'),
      
      logoutSuccess: () => 
        toastService.info('You have been logged out'),
      
      sessionExpired: () => 
        toastService.warning('Your session has expired. Please log in again.', {
          title: 'Session Expired',
          actions: [{
            label: 'Login',
            action: () => window.location.href = '/login',
            style: 'primary'
          }]
        }),
      
      // Network helpers
      networkError: () => 
        toastService.error('Network error. Please check your connection.', {
          title: 'Connection Error',
          actions: [{
            label: 'Retry',
            action: () => window.location.reload(),
            style: 'primary'
          }]
        }),
      
      // Validation helpers
      validationError: (message?: string) => 
        toastService.warning(message || 'Please check your input', {
          title: 'Validation Error'
        }),
      
      // Permission helpers
      permissionDenied: () => 
        toastService.error('You do not have permission to perform this action', {
          title: 'Access Denied'
        }),
      
      // Generic helpers
      operationSuccess: (operation = 'Operation') => 
        toastService.success(`${operation} completed successfully`),
      
      operationError: (operation = 'Operation', error?: string) => 
        toastService.error(error || `${operation} failed`),
      
      // Promise-based operations
      promiseOperation: <T>(
        promise: Promise<T>,
        operation = 'Operation'
      ) => toastService.promise(promise, {
        pending: `${operation} in progress...`,
        success: `${operation} completed successfully`,
        error: `${operation} failed`
      })
    }
  }
}

// Initialize migration on import (in development mode)
if (import.meta.env.DEV) {
  NotificationMigration.migrateNotificationService()
}

// Export migration helpers for easy use
export const migrationHelpers = NotificationMigration.createMigrationHelpers()

// Export for manual migration
export default NotificationMigration