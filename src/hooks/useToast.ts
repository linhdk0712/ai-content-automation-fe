import { useCallback } from 'react'
import { Id } from 'react-toastify'
import { toastService, ToastServiceOptions } from '../services/toast.service'
import { ApiError } from '../types/api.types'

export interface UseToastReturn {
  // Basic toast methods
  success: (message: string, options?: ToastServiceOptions) => Id
  error: (message: string, options?: ToastServiceOptions) => Id
  warning: (message: string, options?: ToastServiceOptions) => Id
  info: (message: string, options?: ToastServiceOptions) => Id
  loading: (message: string, options?: Omit<ToastServiceOptions, 'persistent'>) => Id
  
  // Advanced methods
  update: (toastId: Id, message: string, type: 'success' | 'error' | 'warning' | 'info', options?: ToastServiceOptions) => void
  promise: <T>(
    promise: Promise<T>,
    messages: {
      pending: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    },
    options?: ToastServiceOptions
  ) => Promise<T>
  
  // Specialized methods
  apiError: (error: ApiError | Error, options?: ToastServiceOptions) => Id
  response: (
    status: number,
    errorCode?: string | null,
    errorMessage?: string | null,
    successMessage?: string,
    options?: ToastServiceOptions
  ) => Id | null
  
  // Control methods
  dismiss: (toastId?: Id) => void
  isActive: (toastId: Id) => boolean
  
  // Convenience methods for common scenarios
  saveSuccess: (itemName?: string) => Id
  saveError: (error?: string) => Id
  deleteSuccess: (itemName?: string) => Id
  deleteError: (error?: string) => Id
  loadError: (error?: string) => Id
  networkError: () => Id
  validationError: (message?: string) => Id
  authError: () => Id
  permissionError: () => Id
}

export function useToast(): UseToastReturn {
  // Basic toast methods
  const success = useCallback((message: string, options?: ToastServiceOptions) => {
    return toastService.success(message, options)
  }, [])

  const error = useCallback((message: string, options?: ToastServiceOptions) => {
    return toastService.error(message, options)
  }, [])

  const warning = useCallback((message: string, options?: ToastServiceOptions) => {
    return toastService.warning(message, options)
  }, [])

  const info = useCallback((message: string, options?: ToastServiceOptions) => {
    return toastService.info(message, options)
  }, [])

  const loading = useCallback((message: string, options?: Omit<ToastServiceOptions, 'persistent'>) => {
    return toastService.loading(message, options)
  }, [])

  // Advanced methods
  const update = useCallback((
    toastId: Id,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info',
    options?: ToastServiceOptions
  ) => {
    toastService.update(toastId, message, type, options)
  }, [])

  const promise = useCallback(<T>(
    promiseToResolve: Promise<T>,
    messages: {
      pending: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    },
    options?: ToastServiceOptions
  ) => {
    return toastService.promise(promiseToResolve, messages, options)
  }, [])

  // Specialized methods
  const apiError = useCallback((error: ApiError | Error, options?: ToastServiceOptions) => {
    return toastService.apiError(error, options)
  }, [])

  const response = useCallback((
    status: number,
    errorCode?: string | null,
    errorMessage?: string | null,
    successMessage?: string,
    options?: ToastServiceOptions
  ) => {
    return toastService.response(status, errorCode, errorMessage, successMessage, options)
  }, [])

  // Control methods
  const dismiss = useCallback((toastId?: Id) => {
    toastService.dismiss(toastId)
  }, [])

  const isActive = useCallback((toastId: Id) => {
    return toastService.isActive(toastId)
  }, [])

  // Convenience methods for common scenarios
  const saveSuccess = useCallback((itemName = 'Item') => {
    return success(`${itemName} saved successfully`)
  }, [success])

  const saveError = useCallback((errorMsg = 'Failed to save item') => {
    return error(errorMsg)
  }, [error])

  const deleteSuccess = useCallback((itemName = 'Item') => {
    return success(`${itemName} deleted successfully`)
  }, [success])

  const deleteError = useCallback((errorMsg = 'Failed to delete item') => {
    return error(errorMsg)
  }, [error])

  const loadError = useCallback((errorMsg = 'Failed to load data') => {
    return error(errorMsg)
  }, [error])

  const networkError = useCallback(() => {
    return error('Network error. Please check your connection and try again.', {
      title: 'Connection Error',
      actions: [{
        label: 'Retry',
        action: () => window.location.reload(),
        style: 'primary'
      }]
    })
  }, [error])

  const validationError = useCallback((message = 'Please check your input and try again') => {
    return warning(message, {
      title: 'Validation Error'
    })
  }, [warning])

  const authError = useCallback(() => {
    return error('Your session has expired. Please log in again.', {
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
  }, [error])

  const permissionError = useCallback(() => {
    return error('You do not have permission to perform this action.', {
      title: 'Access Denied'
    })
  }, [error])

  return {
    // Basic methods
    success,
    error,
    warning,
    info,
    loading,
    
    // Advanced methods
    update,
    promise,
    
    // Specialized methods
    apiError,
    response,
    
    // Control methods
    dismiss,
    isActive,
    
    // Convenience methods
    saveSuccess,
    saveError,
    deleteSuccess,
    deleteError,
    loadError,
    networkError,
    validationError,
    authError,
    permissionError,
  }
}

export default useToast