import { AxiosRequestConfig } from 'axios'
import { apiRequest } from '../services/api'
import { notificationService } from '../services/notification.service'
import { ApiError } from '../types/api.types'

export interface ApiCallOptions extends AxiosRequestConfig {
  showSuccessNotification?: boolean
  showErrorNotification?: boolean
  successMessage?: string
  errorMessage?: string
  loadingMessage?: string
}

/**
 * Enhanced API call wrapper with automatic notification handling
 */
export async function apiCall<T>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  data?: unknown,
  options: ApiCallOptions = {}
): Promise<T> {
  const {
    showSuccessNotification = false,
    showErrorNotification = true,
    successMessage,
    errorMessage,
    loadingMessage,
    ...axiosConfig
  } = options

  let loadingNotificationId: string | null = null

  try {
    // Show loading notification if requested
    if (loadingMessage) {
      loadingNotificationId = notificationService.showInfo(loadingMessage, {
        persistent: true
      })
    }

    // Make API call
    let result: T
    if (method === 'get') {
      result = await apiRequest.get<T>(url, axiosConfig)
    } else if (method === 'delete') {
      result = await apiRequest.delete<T>(url, axiosConfig)
    } else if (method === 'post') {
      result = await apiRequest.post<T>(url, data, axiosConfig)
    } else if (method === 'put') {
      result = await apiRequest.put<T>(url, data, axiosConfig)
    } else if (method === 'patch') {
      result = await apiRequest.patch<T>(url, data, axiosConfig)
    } else {
      throw new Error(`Unsupported HTTP method: ${method}`)
    }

    // Remove loading notification
    if (loadingNotificationId) {
      notificationService.remove(loadingNotificationId)
    }

    // Show success notification if requested
    if (showSuccessNotification && successMessage) {
      notificationService.showSuccess(successMessage)
    }

    return result
  } catch (error) {
    // Remove loading notification
    if (loadingNotificationId) {
      notificationService.remove(loadingNotificationId)
    }

    // Show error notification if requested
    if (showErrorNotification) {
      if (errorMessage) {
        notificationService.showError(errorMessage)
      } else if (error instanceof Error) {
        const apiError: ApiError = {
          message: error.message,
          status: 500,
          timestamp: new Date().toISOString(),
          path: url
        }
        notificationService.showApiError(apiError)
      }
    }

    throw error
  }
}

/**
 * Convenience methods for different HTTP methods
 */
export const apiHelpers = {
  get: <T>(url: string, options?: ApiCallOptions) => 
    apiCall<T>('get', url, undefined, options),

  post: <T>(url: string, data?: unknown, options?: ApiCallOptions) => 
    apiCall<T>('post', url, data, options),

  put: <T>(url: string, data?: unknown, options?: ApiCallOptions) => 
    apiCall<T>('put', url, data, options),

  patch: <T>(url: string, data?: unknown, options?: ApiCallOptions) => 
    apiCall<T>('patch', url, data, options),

  delete: <T>(url: string, options?: ApiCallOptions) => 
    apiCall<T>('delete', url, undefined, options),
}

/**
 * Specialized helpers for common operations
 */
export const apiOperations = {
  // Create operations with success notification
  create: <T>(url: string, data: unknown, entityName: string = 'Item') =>
    apiHelpers.post<T>(url, data, {
      showSuccessNotification: true,
      successMessage: `${entityName} created successfully`,
      loadingMessage: `Creating ${entityName.toLowerCase()}...`
    }),

  // Update operations with success notification
  update: <T>(url: string, data: unknown, entityName: string = 'Item') =>
    apiHelpers.put<T>(url, data, {
      showSuccessNotification: true,
      successMessage: `${entityName} updated successfully`,
      loadingMessage: `Updating ${entityName.toLowerCase()}...`
    }),

  // Delete operations with success notification
  delete: <T>(url: string, entityName: string = 'Item') =>
    apiHelpers.delete<T>(url, {
      showSuccessNotification: true,
      successMessage: `${entityName} deleted successfully`,
      loadingMessage: `Deleting ${entityName.toLowerCase()}...`
    }),

  // Fetch operations (usually no notifications needed)
  fetch: <T>(url: string, showLoading: boolean = false, entityName: string = 'data') =>
    apiHelpers.get<T>(url, {
      showErrorNotification: true,
      loadingMessage: showLoading ? `Loading ${entityName}...` : undefined
    }),

  // Publish operations
  publish: <T>(url: string, data?: unknown) =>
    apiHelpers.post<T>(url, data, {
      showSuccessNotification: true,
      successMessage: 'Published successfully',
      loadingMessage: 'Publishing...'
    }),

  // Schedule operations
  schedule: <T>(url: string, data: unknown) =>
    apiHelpers.post<T>(url, data, {
      showSuccessNotification: true,
      successMessage: 'Scheduled successfully',
      loadingMessage: 'Scheduling...'
    }),

  // Generate operations (AI, etc.)
  generate: <T>(url: string, data: unknown, type: string = 'content') =>
    apiHelpers.post<T>(url, data, {
      showSuccessNotification: true,
      successMessage: `${type} generated successfully`,
      loadingMessage: `Generating ${type}...`
    }),
}

/**
 * Error handling utilities
 */
export const errorHandlers = {
  // Handle validation errors
  handleValidationError: (error: ApiError) => {
    if (error.status === 422 || error.status === 400) {
      notificationService.showError(
        error.message || 'Please check your input and try again',
        { title: 'Validation Error' }
      )
    }
  },

  // Handle permission errors
  handlePermissionError: (error: ApiError) => {
    if (error.status === 403) {
      notificationService.showError(
        'You do not have permission to perform this action',
        { title: 'Permission Denied' }
      )
    }
  },

  // Handle not found errors
  handleNotFoundError: (error: ApiError, entityName: string = 'Resource') => {
    if (error.status === 404) {
      notificationService.showError(
        `${entityName} not found`,
        { title: 'Not Found' }
      )
    }
  },

  // Generic error handler
  handleError: (error: unknown, fallbackMessage: string = 'An error occurred') => {
    if (error instanceof Error) {
      const apiError: ApiError = {
        message: error.message,
        status: 500,
        timestamp: new Date().toISOString(),
        path: ''
      }
      notificationService.showApiError(apiError)
    } else {
      notificationService.showError(fallbackMessage)
    }
  }
}

export default apiHelpers