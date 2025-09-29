import React, { createContext, useContext, ReactNode } from 'react'
import { Id } from 'react-toastify'
import { toastService, ToastServiceOptions } from '../services/toast.service'

interface NotificationContextType {
  showNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info', options?: ToastServiceOptions) => Id
  showSuccess: (message: string, options?: ToastServiceOptions) => Id
  showError: (message: string, options?: ToastServiceOptions) => Id
  showWarning: (message: string, options?: ToastServiceOptions) => Id
  showInfo: (message: string, options?: ToastServiceOptions) => Id
  showLoading: (message: string, options?: Omit<ToastServiceOptions, 'persistent'>) => Id
  dismiss: (toastId?: Id) => void
  dismissAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const showNotification = (
    message: string, 
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    options?: ToastServiceOptions
  ): Id => {
    switch (type) {
      case 'success':
        return toastService.success(message, options)
      case 'error':
        return toastService.error(message, options)
      case 'warning':
        return toastService.warning(message, options)
      case 'info':
      default:
        return toastService.info(message, options)
    }
  }

  const showSuccess = (message: string, options?: ToastServiceOptions): Id => {
    return toastService.success(message, options)
  }

  const showError = (message: string, options?: ToastServiceOptions): Id => {
    return toastService.error(message, options)
  }

  const showWarning = (message: string, options?: ToastServiceOptions): Id => {
    return toastService.warning(message, options)
  }

  const showInfo = (message: string, options?: ToastServiceOptions): Id => {
    return toastService.info(message, options)
  }

  const showLoading = (message: string, options?: Omit<ToastServiceOptions, 'persistent'>): Id => {
    return toastService.loading(message, options)
  }

  const dismiss = (toastId?: Id): void => {
    toastService.dismiss(toastId)
  }

  const dismissAll = (): void => {
    toastService.dismiss()
  }

  const value: NotificationContextType = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    dismiss,
    dismissAll,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}