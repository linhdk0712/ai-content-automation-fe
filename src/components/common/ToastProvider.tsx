import React, { createContext, useContext, ReactNode } from 'react'
import { useToast, UseToastReturn } from '../../hooks/useToast'

// Create context for toast
const ToastContext = createContext<UseToastReturn | undefined>(undefined)

interface ToastProviderProps {
  children: ReactNode
}

/**
 * ToastProvider component that provides toast functionality to child components
 * This is an alternative to using useToast hook directly in each component
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const toast = useToast()

  return (
    <ToastContext.Provider value={toast}>
      {children}
    </ToastContext.Provider>
  )
}

/**
 * Hook to use toast from context
 * This is useful when you want to share toast instance across multiple components
 */
export const useToastContext = (): UseToastReturn => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}

/**
 * Higher-order component that provides toast functionality
 */
export function withToast<P extends object>(
  Component: React.ComponentType<P & { toast: UseToastReturn }>
) {
  return function WithToastComponent(props: P) {
    const toast = useToast()
    return <Component {...props} toast={toast} />
  }
}

/**
 * Hook that provides common toast patterns for forms
 */
export function useFormToast() {
  const toast = useToast()

  return {
    // Form submission states
    submitting: (message = 'Submitting...') => toast.loading(message),
    
    submitSuccess: (message = 'Form submitted successfully!') => 
      toast.success(message),
    
    submitError: (error: any) => {
      const message = error?.response?.data?.message || 
                    error?.message || 
                    'Form submission failed. Please try again.'
      return toast.error(message, {
        title: 'Submission Failed'
      })
    },

    // Validation errors
    validationError: (message = 'Please check your input and try again') =>
      toast.validationError(message),

    // Field-specific errors
    fieldError: (fieldName: string, message: string) =>
      toast.warning(`${fieldName}: ${message}`, {
        title: 'Validation Error'
      }),

    // Form reset
    formReset: () => toast.info('Form has been reset'),

    // Auto-save
    autoSaved: () => toast.info('Changes saved automatically', {
      autoClose: 2000
    }),

    autoSaveError: () => toast.warning('Auto-save failed. Please save manually.', {
      title: 'Auto-save Warning'
    })
  }
}

/**
 * Hook that provides common toast patterns for data operations
 */
export function useDataToast() {
  const toast = useToast()

  return {
    // Loading states
    loading: (operation = 'Loading') => toast.loading(`${operation}...`),
    
    // CRUD operations
    created: (itemName = 'Item') => toast.saveSuccess(itemName),
    updated: (itemName = 'Item') => toast.saveSuccess(itemName),
    deleted: (itemName = 'Item') => toast.deleteSuccess(itemName),
    
    // Error states
    createError: (error?: string) => toast.saveError(error),
    updateError: (error?: string) => toast.saveError(error),
    deleteError: (error?: string) => toast.deleteError(error),
    loadError: (error?: string) => toast.loadError(error),
    
    // Bulk operations
    bulkSuccess: (count: number, operation: string) =>
      toast.success(`${count} items ${operation} successfully`),
    
    bulkError: (count: number, operation: string) =>
      toast.error(`Failed to ${operation} ${count} items`),
    
    bulkPartial: (success: number, failed: number, operation: string) =>
      toast.warning(`${operation} completed: ${success} successful, ${failed} failed`, {
        title: 'Partial Success'
      }),

    // Import/Export
    importSuccess: (count: number) =>
      toast.success(`${count} items imported successfully`),
    
    importError: (error?: string) =>
      toast.error(error || 'Import failed', { title: 'Import Failed' }),
    
    exportSuccess: () =>
      toast.success('Data exported successfully'),
    
    exportError: (error?: string) =>
      toast.error(error || 'Export failed', { title: 'Export Failed' }),

    // Sync operations
    syncSuccess: () => toast.success('Data synchronized successfully'),
    syncError: () => toast.error('Synchronization failed', {
      actions: [{
        label: 'Retry',
        action: () => window.location.reload(),
        style: 'primary'
      }]
    })
  }
}

/**
 * Hook that provides common toast patterns for API operations
 */
export function useApiToast() {
  const toast = useToast()

  return {
    // Promise-based API calls
    apiCall: function<T>(
      promise: Promise<T>,
      messages: {
        pending?: string
        success?: string | ((data: T) => string)
        error?: string | ((error: any) => string)
      } = {}
    ) {
      return toast.promise(promise, {
        pending: messages.pending || 'Processing request...',
        success: messages.success || 'Request completed successfully',
        error: messages.error || 'Request failed. Please try again.'
      })
    },

    // HTTP status-based responses
    handleResponse: (
      status: number,
      errorCode?: string | null,
      errorMessage?: string | null,
      successMessage?: string
    ) => toast.response(status, errorCode, errorMessage, successMessage),

    // API errors
    apiError: (error: any) => toast.apiError(error),

    // Network issues
    networkError: () => toast.networkError(),
    
    // Authentication issues
    authError: () => toast.authError(),
    permissionError: () => toast.permissionError(),

    // Rate limiting
    rateLimitError: () => toast.warning('Too many requests. Please wait a moment and try again.', {
      title: 'Rate Limited'
    }),

    // Server maintenance
    maintenanceError: () => toast.warning('Service is under maintenance. Please try again later.', {
      title: 'Maintenance Mode',
      persistent: true
    })
  }
}

export default ToastProvider