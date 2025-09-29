import React from 'react'
import { toast, Id } from 'react-toastify'
import CustomToastContent, { ToastAction } from '../components/common/CustomToastContent'

export interface CustomToastOptions {
  title?: string
  actions?: ToastAction[]
  autoClose?: number | false
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center'
  closeOnClick?: boolean
  pauseOnHover?: boolean
  draggable?: boolean
}

export function useCustomToast() {
  const showCustomSuccess = (message: string, options?: CustomToastOptions): Id => {
    const { title, actions, ...toastOptions } = options || {}
    
    if (title || actions) {
      return toast.success(
        <CustomToastContent title={title} message={message} actions={actions} />,
        {
          autoClose: 5000,
          ...toastOptions,
        }
      )
    }
    
    return toast.success(message, {
      autoClose: 5000,
      ...toastOptions,
    })
  }

  const showCustomError = (message: string, options?: CustomToastOptions): Id => {
    const { title, actions, ...toastOptions } = options || {}
    
    if (title || actions) {
      return toast.error(
        <CustomToastContent title={title} message={message} actions={actions} />,
        {
          autoClose: 8000,
          ...toastOptions,
        }
      )
    }
    
    return toast.error(message, {
      autoClose: 8000,
      ...toastOptions,
    })
  }

  const showCustomWarning = (message: string, options?: CustomToastOptions): Id => {
    const { title, actions, ...toastOptions } = options || {}
    
    if (title || actions) {
      return toast.warning(
        <CustomToastContent title={title} message={message} actions={actions} />,
        {
          autoClose: 6000,
          ...toastOptions,
        }
      )
    }
    
    return toast.warning(message, {
      autoClose: 6000,
      ...toastOptions,
    })
  }

  const showCustomInfo = (message: string, options?: CustomToastOptions): Id => {
    const { title, actions, ...toastOptions } = options || {}
    
    if (title || actions) {
      return toast.info(
        <CustomToastContent title={title} message={message} actions={actions} />,
        {
          autoClose: 5000,
          ...toastOptions,
        }
      )
    }
    
    return toast.info(message, {
      autoClose: 5000,
      ...toastOptions,
    })
  }

  const showErrorWithRetry = (message: string, onRetry: () => void, title?: string): Id => {
    return toast.error(
      <CustomToastContent 
        title={title || 'Error'}
        message={message}
        actions={[
          {
            label: 'Retry',
            action: onRetry,
            style: 'primary'
          },
          {
            label: 'Dismiss',
            action: () => toast.dismiss(),
            style: 'secondary'
          }
        ]}
      />,
      {
        autoClose: false,
        closeOnClick: false
      }
    )
  }

  const showPersistentWarning = (message: string, title?: string): Id => {
    return toast.warning(
      <CustomToastContent 
        title={title || 'Warning'}
        message={message}
        actions={[{
          label: 'Dismiss',
          action: () => toast.dismiss(),
          style: 'primary'
        }]}
      />,
      {
        autoClose: false,
        closeOnClick: false
      }
    )
  }

  return {
    success: showCustomSuccess,
    error: showCustomError,
    warning: showCustomWarning,
    info: showCustomInfo,
    errorWithRetry: showErrorWithRetry,
    persistentWarning: showPersistentWarning,
    dismiss: toast.dismiss,
    dismissAll: () => toast.dismiss()
  }
}

export default useCustomToast