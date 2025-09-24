import { useEffect, useState } from 'react';
// Mock notification service until actual service is implemented
const notificationService = {
  getNotifications: async () => {
    console.log('Getting notifications');
    return [];
  },
  getPreferences: async () => {
    console.log('Getting preferences');
    return { email: true, push: true, sound: true, types: {} };
  },
  markAsRead: async (notificationId: string) => {
    console.log('Marking notification as read:', notificationId);
  },
  markAllAsRead: async () => {
    console.log('Marking all notifications as read');
  },
  deleteNotification: async (notificationId: string) => {
    console.log('Deleting notification:', notificationId);
  },
  updatePreferences: async (preferences: NotificationPreferences) => {
    console.log('Updating preferences:', preferences);
    return preferences;
  }
};

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'content' | 'team' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  actionText?: string;
  actor?: {
    id: string;
    name: string;
    avatar: string;
  };
  metadata?: {
    [key: string]: any;
  };
}

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sound: boolean;
  types: {
    [key: string]: boolean;
  };
}

interface UseNotificationsReturn {
  notifications: Notification[] | null;
  unreadCount: number;
  preferences: NotificationPreferences | null;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updatePreferences: (preferences: NotificationPreferences) => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const [notificationsData, preferencesData] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getPreferences()
      ]);
      setNotifications(notificationsData);
      setPreferences(preferencesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state optimistically
      setNotifications(prev => 
        prev?.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        ) || null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
      throw err;
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update local state optimistically
      setNotifications(prev => 
        prev?.map(notification => ({ ...notification, isRead: true })) || null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
      throw err;
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Update local state optimistically
      setNotifications(prev => 
        prev?.filter(notification => notification.id !== notificationId) || null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
      throw err;
    }
  };

  const updatePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      const updatedPreferences = await notificationService.updatePreferences(newPreferences);
      setPreferences(updatedPreferences);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
      throw err;
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time updates (WebSocket or polling)
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Set up browser notification listener
  useEffect(() => {
    if (preferences?.push && 'serviceWorker' in navigator) {
      // Register service worker for push notifications
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, [preferences?.push]);

  return {
    notifications,
    unreadCount,
    preferences,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    requestPermission
  };
};