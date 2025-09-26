import { useEffect, useState } from 'react'
import { notificationService, Notification, NotificationOptions } from '../services/notification.service'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    // Subscribe to notifications
    const unsubscribe = notificationService.subscribe(setNotifications)
    
    // Get initial notifications
    setNotifications(notificationService.getAll())
    
    // Cleanup subscription
    return unsubscribe
  }, [])

  return {
    notifications,
    showSuccess: (message: string, options?: Partial<NotificationOptions>) => 
      notificationService.showSuccess(message, options),
    showError: (message: string, options?: Partial<NotificationOptions>) => 
      notificationService.showError(message, options),
    showWarning: (message: string, options?: Partial<NotificationOptions>) => 
      notificationService.showWarning(message, options),
    showInfo: (message: string, options?: Partial<NotificationOptions>) => 
      notificationService.showInfo(message, options),
    remove: (id: string) => notificationService.remove(id),
    clear: () => notificationService.clear(),
    clearByType: (type: NotificationOptions['type']) => notificationService.clearByType(type)
  }
}

export default useNotifications