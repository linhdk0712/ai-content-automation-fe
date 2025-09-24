import React, { createContext, useContext, useReducer, useCallback } from 'react'
import {
  Snackbar,
  Alert,
  AlertTitle,
  Slide,
  Fade,
  Grow,
  IconButton,
  Box,
  Typography,
  LinearProgress
} from '@mui/material'
import {
  Close,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Info,
  Notifications
} from '@mui/icons-material'
import { TransitionProps } from '@mui/material/transitions'

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info'
export type NotificationPosition = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'

export interface Notification {
  id: string
  type: NotificationType
  title?: string
  message: string
  duration?: number
  persistent?: boolean
  action?: {
    label: string
    onClick: () => void
  }
  progress?: number
  timestamp: number
}

interface NotificationState {
  notifications: Notification[]
  position: NotificationPosition
  maxNotifications: number
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'UPDATE_NOTIFICATION'; payload: { id: string; updates: Partial<Notification> } }
  | { type: 'CLEAR_ALL' }
  | { type: 'SET_POSITION'; payload: NotificationPosition }

// Context
interface NotificationContextType {
  notifications: Notification[]
  showNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string
  hideNotification: (id: string) => void
  updateNotification: (id: string, updates: Partial<Notification>) => void
  clearAll: () => void
  setPosition: (position: NotificationPosition) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Reducer
const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      const newNotifications = [action.payload, ...state.notifications]
      return {
        ...state,
        notifications: newNotifications.slice(0, state.maxNotifications)
      }
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      }
    
    case 'UPDATE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload.id ? { ...n, ...action.payload.updates } : n
        )
      }
    
    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: []
      }
    
    case 'SET_POSITION':
      return {
        ...state,
        position: action.payload
      }
    
    default:
      return state
  }
}

// Transition components
const SlideTransition = (props: TransitionProps & { children: React.ReactElement }) => {
  return <Slide {...props} direction="down" />
}

const FadeTransition = (props: TransitionProps & { children: React.ReactElement }) => {
  return <Fade {...props} />
}

const GrowTransition = (props: TransitionProps & { children: React.ReactElement }) => {
  return <Grow {...props} />
}

// Notification icons
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <CheckCircle />
    case 'error':
      return <ErrorIcon />
    case 'warning':
      return <Warning />
    case 'info':
      return <Info />
    default:
      return <Notifications />
  }
}

// Individual notification component
interface NotificationItemProps {
  notification: Notification
  onClose: (id: string) => void
  onUpdate: (id: string, updates: Partial<Notification>) => void
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClose,
  onUpdate
}) => {
  const handleClose = useCallback(() => {
    onClose(notification.id)
  }, [notification.id, onClose])

  const handleActionClick = useCallback(() => {
    notification.action?.onClick()
    if (!notification.persistent) {
      handleClose()
    }
  }, [notification.action, notification.persistent, handleClose])

  return (
    <Alert
      severity={notification.type}
      variant="filled"
      icon={getNotificationIcon(notification.type)}
      action={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {notification.action && (
            <IconButton
              size="small"
              color="inherit"
              onClick={handleActionClick}
              aria-label={notification.action.label}
            >
              <Typography variant="button" sx={{ fontSize: '0.75rem' }}>
                {notification.action.label}
              </Typography>
            </IconButton>
          )}
          <IconButton
            size="small"
            color="inherit"
            onClick={handleClose}
            aria-label="Close notification"
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>
      }
      sx={{
        mb: 1,
        minWidth: 300,
        maxWidth: 500,
        boxShadow: 3,
        '& .MuiAlert-message': {
          width: '100%'
        }
      }}
    >
      {notification.title && (
        <AlertTitle>{notification.title}</AlertTitle>
      )}
      <Typography variant="body2">
        {notification.message}
      </Typography>
      
      {typeof notification.progress === 'number' && (
        <Box sx={{ mt: 1 }}>
          <LinearProgress
            variant="determinate"
            value={notification.progress}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'rgba(255, 255, 255, 0.8)'
              }
            }}
          />
          <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
            {Math.round(notification.progress)}% complete
          </Typography>
        </Box>
      )}
    </Alert>
  )
}

// Provider component
interface NotificationProviderProps {
  children: React.ReactNode
  maxNotifications?: number
  defaultPosition?: NotificationPosition
  defaultDuration?: number
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 5,
  defaultPosition = 'top-right',
  defaultDuration = 5000
}) => {
  const [state, dispatch] = useReducer(notificationReducer, {
    notifications: [],
    position: defaultPosition,
    maxNotifications
  })

  const showNotification = useCallback((
    notification: Omit<Notification, 'id' | 'timestamp'>
  ): string => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      duration: notification.duration ?? defaultDuration
    }

    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification })

    // Auto-remove notification after duration (unless persistent)
    if (
      !notification.persistent &&
      typeof newNotification.duration === 'number' &&
      newNotification.duration > 0
    ) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
      }, newNotification.duration)
    }

    return id
  }, [defaultDuration])

  const hideNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
  }, [])

  const updateNotification = useCallback((id: string, updates: Partial<Notification>) => {
    dispatch({ type: 'UPDATE_NOTIFICATION', payload: { id, updates } })
  }, [])

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' })
  }, [])

  const setPosition = useCallback((position: NotificationPosition) => {
    dispatch({ type: 'SET_POSITION', payload: position })
  }, [])

  // Calculate position styles
  const getPositionStyles = (position: NotificationPosition) => {
    const styles: any = {
      position: 'fixed',
      zIndex: 9999,
      pointerEvents: 'none'
    }

    if (position.includes('top')) {
      styles.top = 24
    } else {
      styles.bottom = 24
    }

    if (position.includes('left')) {
      styles.left = 24
    } else if (position.includes('right')) {
      styles.right = 24
    } else {
      styles.left = '50%'
      styles.transform = 'translateX(-50%)'
    }

    return styles
  }

  const contextValue: NotificationContextType = {
    notifications: state.notifications,
    showNotification,
    hideNotification,
    updateNotification,
    clearAll,
    setPosition
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Notification container */}
      <Box sx={getPositionStyles(state.position)}>
        {state.notifications.map((notification) => (
          <Box
            key={notification.id}
            sx={{ pointerEvents: 'auto' }}
          >
            <NotificationItem
              notification={notification}
              onClose={hideNotification}
              onUpdate={updateNotification}
            />
          </Box>
        ))}
      </Box>
    </NotificationContext.Provider>
  )
}

// Hook to use notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

// Convenience hooks for different notification types
export const useNotificationHelpers = () => {
  const { showNotification } = useNotifications()

  const showSuccess = useCallback((message: string, options?: Partial<Notification>) => {
    return showNotification({ type: 'success', message, ...options })
  }, [showNotification])

  const showError = useCallback((message: string, options?: Partial<Notification>) => {
    return showNotification({ type: 'error', message, persistent: true, ...options })
  }, [showNotification])

  const showWarning = useCallback((message: string, options?: Partial<Notification>) => {
    return showNotification({ type: 'warning', message, ...options })
  }, [showNotification])

  const showInfo = useCallback((message: string, options?: Partial<Notification>) => {
    return showNotification({ type: 'info', message, ...options })
  }, [showNotification])

  const showProgress = useCallback((message: string, progress: number, options?: Partial<Notification>) => {
    return showNotification({ 
      type: 'info', 
      message, 
      progress, 
      persistent: true,
      ...options 
    })
  }, [showNotification])

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showProgress
  }
}