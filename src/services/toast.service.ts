import { toast, ToastOptions, Id } from 'react-toastify'
import { ApiError } from '../types/api.types'

export interface ToastServiceOptions extends Omit<ToastOptions, 'type' | 'autoClose'> {
  title?: string
  persistent?: boolean
  actions?: ToastAction[]
  autoClose?: number | false
}

export interface ToastAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary' | 'danger'
}

// Helper function to format message with title
const formatMessage = (message: string, title?: string): string => {
  if (title) {
    return `${title}: ${message}`
  }
  return message
}

class ToastService {
  private defaultOptions: ToastOptions = {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  }

  // Success toast
  success(message: string, options?: ToastServiceOptions): Id {
    const { title, actions, persistent, ...toastOptions } = options || {}
    
    // For now, we'll use simple text formatting
    // Complex content with actions will be handled by components using the hook
    const formattedMessage = formatMessage(message, title)

    return toast.success(formattedMessage, {
      ...this.defaultOptions,
      autoClose: persistent ? false : (toastOptions.autoClose ?? 5000),
      ...toastOptions,
    })
  }

  // Error toast
  error(message: string, options?: ToastServiceOptions): Id {
    const { title, actions, persistent, ...toastOptions } = options || {}
    
    const formattedMessage = formatMessage(message, title)

    return toast.error(formattedMessage, {
      ...this.defaultOptions,
      autoClose: persistent ? false : (toastOptions.autoClose ?? 8000),
      ...toastOptions,
    })
  }

  // Warning toast
  warning(message: string, options?: ToastServiceOptions): Id {
    const { title, actions, persistent, ...toastOptions } = options || {}
    
    const formattedMessage = formatMessage(message, title)

    return toast.warning(formattedMessage, {
      ...this.defaultOptions,
      autoClose: persistent ? false : (toastOptions.autoClose ?? 6000),
      ...toastOptions,
    })
  }

  // Info toast
  info(message: string, options?: ToastServiceOptions): Id {
    const { title, actions, persistent, ...toastOptions } = options || {}
    
    const formattedMessage = formatMessage(message, title)

    return toast.info(formattedMessage, {
      ...this.defaultOptions,
      autoClose: persistent ? false : (toastOptions.autoClose ?? 5000),
      ...toastOptions,
    })
  }

  // Loading toast
  loading(message: string, options?: Omit<ToastServiceOptions, 'persistent'>): Id {
    const { title, ...toastOptions } = options || {}
    
    const formattedMessage = formatMessage(message, title)

    return toast.loading(formattedMessage, {
      ...this.defaultOptions,
      autoClose: false,
      closeOnClick: false,
      ...toastOptions,
    })
  }

  // Update existing toast
  update(toastId: Id, message: string, type: 'success' | 'error' | 'warning' | 'info', options?: ToastServiceOptions): void {
    const { title, actions, persistent, ...toastOptions } = options || {}
    
    const formattedMessage = formatMessage(message, title)

    toast.update(toastId, {
      render: formattedMessage,
      type,
      autoClose: persistent ? false : 5000,
      isLoading: false,
      ...toastOptions,
    })
  }

  // Promise toast - automatically handles loading, success, and error states
  promise<T>(
    promise: Promise<T>,
    messages: {
      pending: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    },
    options?: ToastServiceOptions
  ): Promise<T> {
    return toast.promise(
      promise,
      {
        pending: {
          render: messages.pending,
          ...this.defaultOptions,
          ...options,
        },
        success: {
          render: typeof messages.success === 'function' 
            ? (props: any) => (messages.success as (data: T) => string)(props.data)
            : messages.success,
          ...this.defaultOptions,
          autoClose: 5000,
          ...options,
        },
        error: {
          render: typeof messages.error === 'function'
            ? (props: any) => (messages.error as (error: any) => string)(props.data)
            : messages.error,
          ...this.defaultOptions,
          autoClose: 8000,
          ...options,
        },
      }
    ) as Promise<T>
  }

  // API Error toast with enhanced formatting
  apiError(error: ApiError | Error, options?: ToastServiceOptions): Id {
    let message = error.message || 'An unexpected error occurred'
    let title = 'Error'
    
    // Handle new ErrorResponse format
    if ('errorCode' in error && error.errorCode) {
      title = `Error: ${error.errorCode}`
    } else if ('code' in error && error.code) {
      title = `Error: ${error.code}`
    }
    
    // Add validation errors if present
    if ('validationErrors' in error && error.validationErrors) {
      const fieldErrors = Object.entries(error.validationErrors)
        .map(([field, msg]) => `• ${field}: ${msg}`)
        .join('\n')
      message += '\n\nField Errors:\n' + fieldErrors
    }
    
    // Add suggestions if present
    if ('suggestions' in error && error.suggestions && error.suggestions.length > 0) {
      message += '\n\nSuggestions:\n' + error.suggestions.map(s => `• ${s}`).join('\n')
    }
    
    return this.error(message, {
      title,
      persistent: 'status' in error && error.status >= 500,
      autoClose: 'validationErrors' in error && error.validationErrors ? 12000 : undefined, // Longer for validation errors
      ...options,
    })
  }

  // Response-based toast (for ResponseBase pattern)
  response(
    status: number,
    errorCode?: string | null,
    errorMessage?: string | null,
    successMessage?: string,
    options?: ToastServiceOptions
  ): Id | null {
    // Success cases (2xx status codes AND errorCode = "SUCCESS")
    if (status >= 200 && status < 300) {
      if (errorCode === 'SUCCESS') {
        const message = successMessage || errorMessage || 'Operation completed successfully'
        return this.success(message, options)
      } else if (errorCode && errorCode !== 'SUCCESS') {
        return this.error(errorMessage || 'Operation failed', {
          title: `Error: ${errorCode}`,
          ...options,
        })
      } else if (successMessage) {
        return this.success(successMessage, options)
      }
      return null
    }

    // Error cases
    const message = errorMessage || this.getDefaultErrorMessage(status)
    const title = errorCode ? `Error: ${errorCode}` : this.getDefaultErrorTitle(status)

    if (status >= 400 && status < 500) {
      return this.error(message, { title, ...options })
    } else if (status >= 500) {
      return this.error(message, {
        title,
        persistent: true,
        actions: [{
          label: 'Retry',
          action: () => window.location.reload(),
          style: 'primary' as const
        }],
        ...options,
      })
    }

    return this.error(message, { title, ...options })
  }

  // Dismiss toast
  dismiss(toastId?: Id): void {
    if (toastId) {
      toast.dismiss(toastId)
    } else {
      toast.dismiss()
    }
  }

  // Check if toast is active
  isActive(toastId: Id): boolean {
    return toast.isActive(toastId)
  }

  // Update default options
  configure(options: Partial<ToastOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options }
  }

  // Private helper methods
  private getDefaultErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Bad request. Please check your input and try again.'
      case 401:
        return 'You are not authorized. Please log in and try again.'
      case 403:
        return 'You do not have permission to perform this action.'
      case 404:
        return 'The requested resource was not found.'
      case 409:
        return 'There was a conflict with your request.'
      case 422:
        return 'The data you provided is invalid.'
      case 429:
        return 'Too many requests. Please wait a moment and try again.'
      case 500:
        return 'Internal server error. Please try again later.'
      case 502:
        return 'Bad gateway. The server is temporarily unavailable.'
      case 503:
        return 'Service unavailable. Please try again later.'
      case 504:
        return 'Gateway timeout. The request took too long to process.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  private getDefaultErrorTitle(status: number): string {
    if (status >= 400 && status < 500) {
      return 'Client Error'
    } else if (status >= 500) {
      return 'Server Error'
    }
    return 'Error'
  }
}

// Export singleton instance
export const toastService = new ToastService()
export default toastService