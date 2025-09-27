import { useCallback, useEffect, useState } from 'react';
import { supabaseService } from '../services/supabase.service';
import { useSupabase } from '../contexts/RealTimeContext';

export interface NotificationType {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  metadata: Record<string, any> | null;
  created_at: string;
  // Additional properties for compatibility
  isRead?: boolean;
  priority?: 'low' | 'medium' | 'high';
  timestamp?: number;
  actionUrl?: string;
  actionText?: string;
}

export interface UseRealTimeNotificationsOptions {
  autoRequestPermission?: boolean;
  maxNotifications?: number;
  autoSubscribe?: boolean;
}

export interface NotificationState {
  notifications: NotificationType[];
  unreadCount: number;
  isSubscribed: boolean;
  channelName: string | null;
}

export function useRealTimeNotifications(options: UseRealTimeNotificationsOptions = {}) {
  const { autoRequestPermission = true, maxNotifications = 50, autoSubscribe = true } = options;
  const { user, isAuthenticated } = useSupabase();
  
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    isSubscribed: false,
    channelName: null
  });

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const notifications = await supabaseService.select('notifications', {
        filter: { user_id: user.id },
        order: { column: 'created_at', ascending: false },
        limit: maxNotifications
      });

      const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

      setState(prev => ({
        ...prev,
        notifications: notifications || [],
        unreadCount
      }));
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, [isAuthenticated, user, maxNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!isAuthenticated) return;

    try {
      await supabaseService.update('notifications', notificationId, {
        is_read: true
      });

      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [isAuthenticated]);

  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      // Update all unread notifications for this user
      const unreadNotifications = state.notifications.filter(n => !n.is_read);
      
      await Promise.all(
        unreadNotifications.map(notification =>
          supabaseService.update('notifications', notification.id, { is_read: true })
        )
      );

      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [isAuthenticated, user, state.notifications]);

  const removeNotification = useCallback(async (notificationId: string) => {
    if (!isAuthenticated) return;

    try {
      await supabaseService.delete('notifications', notificationId);

      setState(prev => {
        const notification = prev.notifications.find(n => n.id === notificationId);
        const wasUnread = notification && !notification.is_read;
        
        return {
          ...prev,
          notifications: prev.notifications.filter(n => n.id !== notificationId),
          unreadCount: wasUnread ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount
        };
      });
    } catch (error) {
      console.error('Failed to remove notification:', error);
    }
  }, [isAuthenticated]);

  const clearAllNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      await Promise.all(
        state.notifications.map(notification =>
          supabaseService.delete('notifications', notification.id)
        )
      );

      setState(prev => ({
        ...prev,
        notifications: [],
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  }, [isAuthenticated, user, state.notifications]);

  const subscribeToNotifications = useCallback(() => {
    if (!isAuthenticated || !user) return null;

    const channelName = supabaseService.subscribeToTable(
      'notifications',
      (payload) => {
        if (payload.eventType === 'INSERT' && payload.new.user_id === user.id) {
          const newNotification = payload.new as NotificationType;
          
          setState(prev => ({
            ...prev,
            notifications: [newNotification, ...prev.notifications.slice(0, maxNotifications - 1)],
            unreadCount: prev.unreadCount + 1
          }));

          // Show browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/favicon.ico'
            });
          }
        } else if (payload.eventType === 'UPDATE' && payload.new.user_id === user.id) {
          const updatedNotification = payload.new as NotificationType;
          
          setState(prev => ({
            ...prev,
            notifications: prev.notifications.map(n => 
              n.id === updatedNotification.id ? updatedNotification : n
            )
          }));
        } else if (payload.eventType === 'DELETE' && payload.old.user_id === user.id) {
          setState(prev => {
            const wasUnread = !payload.old.is_read;
            return {
              ...prev,
              notifications: prev.notifications.filter(n => n.id !== payload.old.id),
              unreadCount: wasUnread ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount
            };
          });
        }
      },
      `user_id=eq.${user.id}`
    );

    setState(prev => ({
      ...prev,
      isSubscribed: true,
      channelName
    }));

    return channelName;
  }, [isAuthenticated, user, maxNotifications]);

  const unsubscribeFromNotifications = useCallback(() => {
    if (state.channelName) {
      supabaseService.unsubscribe(state.channelName);
      setState(prev => ({
        ...prev,
        isSubscribed: false,
        channelName: null
      }));
    }
  }, [state.channelName]);

  // Auto-subscribe and load notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated && autoSubscribe) {
      loadNotifications();
      subscribeToNotifications();
    } else {
      unsubscribeFromNotifications();
      setState(prev => ({
        ...prev,
        notifications: [],
        unreadCount: 0
      }));
    }
  }, [isAuthenticated, autoSubscribe, loadNotifications, subscribeToNotifications, unsubscribeFromNotifications]);

  // Request permission on mount if enabled
  useEffect(() => {
    if (autoRequestPermission && 'Notification' in window && Notification.permission === 'default') {
      requestPermission();
    }
  }, [autoRequestPermission, requestPermission]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeFromNotifications();
    };
  }, [unsubscribeFromNotifications]);

  return {
    ...state,
    requestPermission,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    loadNotifications,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    isOnline: true, // Placeholder - could be connected to actual online status
    recentActivities: [] // Placeholder - could be connected to actual activities
  };
}