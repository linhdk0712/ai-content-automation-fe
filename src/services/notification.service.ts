import { ApiError } from '../types/api.types'

export interface NotificationOptions {
  title?: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  persistent?: boolean
  actions?: NotificationAction[]
}

export interface NotificationAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary' | 'danger'
}

export interface Notification extends NotificationOptions {
  id: string
  timestamp: Date
}

class NotificationService {
  private notifications: Notification[] = []
  private listeners: ((notifications: Notification[]) => void)[] = []

  // Show success notification
  showSuccess(message: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      message,
      type: 'success',
      duration: 5000,
      ...options
    })
  }

  // Show error notification
  showError(message: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      message,
      type: 'error',
      duration: 8000,
      persistent: false,
      ...options
    })
  }

  // Show warning notification
  showWarning(message: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      message,
      type: 'warning',
      duration: 6000,
      ...options
    })
  }

  // Show info notification
  showInfo(message: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      message,
      type: 'info',
      duration: 5000,
      ...options
    })
  }

  // Show notification from API error
  showApiError(error: ApiError | Error): string {
    const message = error.message || 'An unexpected error occurred'
    const title = 'code' in error && error.code ? `Error: ${error.code}` : 'Error'
    
    return this.showError(message, {
      title,
      persistent: 'status' in error && error.status >= 500
    })
  }

  // Show notification based on HTTP status and ResponseBase
  showResponseNotification(
    status: number, 
    errorCode?: string | null, 
    errorMessage?: string | null,
    successMessage?: string
  ): string | null {
    // Success cases (2xx status codes AND errorCode = "SUCCESS")
    if (status >= 200 && status < 300) {
      if (errorCode === 'SUCCESS') {
        // Use the success message from ResponseBase or custom message
        const message = successMessage || errorMessage || 'Operation completed successfully'
        return this.showSuccess(message)
      } else if (errorCode && errorCode !== 'SUCCESS') {
        // Even with 2xx status, if errorCode is not SUCCESS, it's an error
        return this.showError(errorMessage || 'Operation failed')
      } else if (successMessage) {
        // Fallback for other success cases
        return this.showSuccess(successMessage)
      }
      return null
    }

    // Error cases
    const message = errorMessage || this.getDefaultErrorMessage(status)
    const title = errorCode ? `Error: ${errorCode}` : this.getDefaultErrorTitle(status)

    if (status >= 400 && status < 500) {
      // Client errors
      return this.showError(message, { title })
    } else if (status >= 500) {
      // Server errors
      return this.showError(message, { 
        title,
        persistent: true,
        actions: [{
          label: 'Retry',
          action: () => window.location.reload(),
          style: 'primary'
        }]
      })
    }

    return this.showError(message, { title })
  }

  // Generic show method
  show(options: NotificationOptions): string {
    const notification: Notification = {
      id: this.generateId(),
      timestamp: new Date(),
      duration: 5000,
      persistent: false,
      ...options
    }

    this.notifications.push(notification)
    this.notifyListeners()

    // Auto-remove non-persistent notifications
    if (!notification.persistent && notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.remove(notification.id)
      }, notification.duration)
    }

    return notification.id
  }

  // Remove notification
  remove(id: string): void {
    const index = this.notifications.findIndex(n => n.id === id)
    if (index > -1) {
      this.notifications.splice(index, 1)
      this.notifyListeners()
    }
  }

  // Clear all notifications
  clear(): void {
    this.notifications = []
    this.notifyListeners()
  }

  // Clear notifications by type
  clearByType(type: NotificationOptions['type']): void {
    this.notifications = this.notifications.filter(n => n.type !== type)
    this.notifyListeners()
  }

  // Get all notifications
  getAll(): Notification[] {
    return [...this.notifications]
  }

  // Subscribe to notifications changes
  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // Private methods
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notifications]))
  }

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
export const notificationService = new NotificationService()
export default notificationService