import { ApiError } from '../types/api.types'

// Error types for better categorization
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

export interface ProcessedError {
  type: ErrorType
  message: string
  userMessage: string
  code?: string
  details?: Record<string, any>
  retryable: boolean
  timestamp: string
}

// Error processing utility
export class ErrorHandler {
  static processError(error: any): ProcessedError {
    const timestamp = new Date().toISOString()
    
    // Handle ApiError from our API
    if (this.isApiError(error)) {
      return this.processApiError(error, timestamp)
    }
    
    // Handle Axios errors
    if (error.response) {
      return this.processHttpError(error, timestamp)
    }
    
    // Handle network errors
    if (error.request) {
      return {
        type: ErrorType.NETWORK,
        message: 'Network error - please check your connection',
        userMessage: 'Unable to connect to the server. Please check your internet connection and try again.',
        retryable: true,
        timestamp
      }
    }
    
    // Handle JavaScript errors
    if (error instanceof Error) {
      return {
        type: ErrorType.CLIENT,
        message: error.message,
        userMessage: 'An unexpected error occurred. Please try again.',
        retryable: false,
        timestamp
      }
    }
    
    // Handle unknown errors
    return {
      type: ErrorType.UNKNOWN,
      message: String(error),
      userMessage: 'An unexpected error occurred. Please try again.',
      retryable: false,
      timestamp
    }
  }

  private static isApiError(error: any): error is ApiError {
    return error && typeof error === 'object' && 'status' in error && 'message' in error
  }

  private static processApiError(error: ApiError, timestamp: string): ProcessedError {
    const type = this.categorizeErrorByStatus(error.status)
    const userMessage = this.getUserMessage(error.status, error.message)
    
    return {
      type,
      message: error.message,
      userMessage,
      code: error.code,
      details: error.details,
      retryable: this.isRetryable(error.status),
      timestamp
    }
  }

  private static processHttpError(error: any, timestamp: string): ProcessedError {
    const status = error.response?.status || 0
    const message = error.response?.data?.message || error.message || 'Request failed'
    const type = this.categorizeErrorByStatus(status)
    const userMessage = this.getUserMessage(status, message)
    
    return {
      type,
      message,
      userMessage,
      code: error.response?.data?.error,
      details: error.response?.data,
      retryable: this.isRetryable(status),
      timestamp
    }
  }

  private static categorizeErrorByStatus(status: number): ErrorType {
    if (status === 401) return ErrorType.AUTHENTICATION
    if (status === 403) return ErrorType.AUTHORIZATION
    if (status >= 400 && status < 500) return ErrorType.VALIDATION
    if (status >= 500) return ErrorType.SERVER
    if (status === 0) return ErrorType.NETWORK
    return ErrorType.UNKNOWN
  }

  private static getUserMessage(status: number, originalMessage: string): string {
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.'
      case 401:
        return 'Your session has expired. Please log in again.'
      case 403:
        return 'You do not have permission to perform this action.'
      case 404:
        return 'The requested resource was not found.'
      case 409:
        return 'This action conflicts with existing data. Please refresh and try again.'
      case 422:
        return 'Please check your input and correct any errors.'
      case 429:
        return 'Too many requests. Please wait a moment and try again.'
      case 500:
        return 'Server error. Our team has been notified. Please try again later.'
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again in a few minutes.'
      default:
        // Try to make the original message more user-friendly
        return this.humanizeErrorMessage(originalMessage)
    }
  }

  private static humanizeErrorMessage(message: string): string {
    // Common technical terms to user-friendly translations
    const translations: Record<string, string> = {
      'validation failed': 'Please check your input',
      'constraint violation': 'This value is not allowed',
      'foreign key constraint': 'This item is being used elsewhere and cannot be deleted',
      'unique constraint': 'This value already exists',
      'not null constraint': 'This field is required',
      'timeout': 'The request took too long. Please try again',
      'connection refused': 'Unable to connect to the server',
      'internal server error': 'A server error occurred'
    }

    const lowerMessage = message.toLowerCase()
    for (const [technical, friendly] of Object.entries(translations)) {
      if (lowerMessage.includes(technical)) {
        return friendly
      }
    }

    return message
  }

  private static isRetryable(status: number): boolean {
    // Retryable status codes
    return [0, 408, 429, 500, 502, 503, 504].includes(status)
  }

  // Utility methods for common error scenarios
  static isAuthenticationError(error: ProcessedError): boolean {
    return error.type === ErrorType.AUTHENTICATION
  }

  static isAuthorizationError(error: ProcessedError): boolean {
    return error.type === ErrorType.AUTHORIZATION
  }

  static isValidationError(error: ProcessedError): boolean {
    return error.type === ErrorType.VALIDATION
  }

  static isNetworkError(error: ProcessedError): boolean {
    return error.type === ErrorType.NETWORK
  }

  static isServerError(error: ProcessedError): boolean {
    return error.type === ErrorType.SERVER
  }

  static isRetryableError(error: ProcessedError): boolean {
    return error.retryable
  }

  // Error logging
  static logError(error: ProcessedError, context?: string): void {
    const logData = {
      ...error,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId()
    }

    // In development, log to console
    if (import.meta.env.DEV) {
      console.error('Error occurred:', logData)
    }

    // In production, send to error tracking service
    if (import.meta.env.PROD) {
      this.sendToErrorTracking(logData)
    }
  }

  private static getCurrentUserId(): string | null {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return null
      
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.sub || null
    } catch {
      return null
    }
  }

  private static sendToErrorTracking(errorData: any): void {
    // This would integrate with services like Sentry, LogRocket, etc.
    // For now, we'll just store in localStorage for debugging
    try {
      const errors = JSON.parse(localStorage.getItem('error_logs') || '[]')
      errors.push(errorData)
      
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50)
      }
      
      localStorage.setItem('error_logs', JSON.stringify(errors))
    } catch (e) {
      console.warn('Failed to store error log:', e)
    }
  }
}

// React hook for error handling
export function useErrorHandler() {
  const handleError = (error: any, context?: string) => {
    const processedError = ErrorHandler.processError(error)
    ErrorHandler.logError(processedError, context)
    return processedError
  }

  const showUserError = (error: ProcessedError) => {
    // Import toast service dynamically to avoid circular dependencies
    import('../services/toast.service').then(({ toastService }) => {
      const options = {
        title: error.type !== ErrorType.UNKNOWN ? error.type : undefined,
        persistent: error.type === ErrorType.SERVER,
        actions: error.retryable ? [{
          label: 'Retry',
          action: () => window.location.reload(),
          style: 'primary' as const
        }] : undefined
      }

      if (error.type === ErrorType.AUTHENTICATION) {
        toastService.error(error.userMessage, {
          ...options,
          title: 'Authentication Required',
          actions: [{
            label: 'Login',
            action: () => {
              localStorage.removeItem('accessToken')
              window.location.href = '/login'
            },
            style: 'primary' as const
          }]
        })
      } else if (error.type === ErrorType.AUTHORIZATION) {
        toastService.error(error.userMessage, {
          ...options,
          title: 'Access Denied'
        })
      } else if (error.type === ErrorType.VALIDATION) {
        toastService.warning(error.userMessage, {
          ...options,
          title: 'Validation Error'
        })
      } else if (error.type === ErrorType.NETWORK) {
        toastService.error(error.userMessage, {
          ...options,
          title: 'Connection Error'
        })
      } else {
        toastService.error(error.userMessage, options)
      }
    })
  }

  return {
    handleError,
    showUserError,
    isAuthError: ErrorHandler.isAuthenticationError,
    isNetworkError: ErrorHandler.isNetworkError,
    isRetryable: ErrorHandler.isRetryableError
  }
}

// Error boundary helper
export class ErrorBoundaryHelper {
  static getDerivedStateFromError(error: Error) {
    const processedError = ErrorHandler.processError(error)
    ErrorHandler.logError(processedError, 'React Error Boundary')
    
    return {
      hasError: true,
      error: processedError
    }
  }

  static componentDidCatch(error: Error, errorInfo: any) {
    const processedError = ErrorHandler.processError(error)
    ErrorHandler.logError({
      ...processedError,
      details: {
        ...processedError.details,
        componentStack: errorInfo.componentStack
      }
    }, 'React Error Boundary')
  }
}

// Validation error helpers
export class ValidationErrorHelper {
  static extractFieldErrors(error: ProcessedError): Record<string, string> {
    if (!error.details || !error.details.fieldErrors) {
      return {}
    }

    const fieldErrors: Record<string, string> = {}
    
    for (const [field, messages] of Object.entries(error.details.fieldErrors)) {
      if (Array.isArray(messages) && messages.length > 0) {
        fieldErrors[field] = messages[0]
      } else if (typeof messages === 'string') {
        fieldErrors[field] = messages
      }
    }

    return fieldErrors
  }

  static hasFieldError(error: ProcessedError, fieldName: string): boolean {
    const fieldErrors = this.extractFieldErrors(error)
    return fieldName in fieldErrors
  }

  static getFieldError(error: ProcessedError, fieldName: string): string | null {
    const fieldErrors = this.extractFieldErrors(error)
    return fieldErrors[fieldName] || null
  }
}

export default ErrorHandler