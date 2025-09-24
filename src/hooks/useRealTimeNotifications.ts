import { useCallback, useEffect, useState } from 'react';
import { Notification as NotificationType, realTimeNotificationService, UserActivity } from '../services/realTimeNotification.service';

export interface UseRealTimeNotificationsOptions {
  autoRequestPermission?: boolean;
  maxNotifications?: number;
}

export interface NotificationState {
  notifications: NotificationType[];
  unreadCount: number;
  isOnline: boolean;
  recentActivities: UserActivity[];
}

export function useRealTimeNotifications(options: UseRealTimeNotificationsOptions = {}) {
  const { autoRequestPermission = true, maxNotifications = 50 } = options;
  
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    isOnline: true,
    recentActivities: []
  });

  const requestPermission = useCallback(async () => {
    return await realTimeNotificationService.requestNotificationPermission();
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    realTimeNotificationService.markAsRead(notificationId);
  }, []);

  const markAllAsRead = useCallback(() => {
    realTimeNotificationService.markAllAsRead();
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    realTimeNotificationService.removeNotification(notificationId);
  }, []);

  const clearAllNotifications = useCallback(() => {
    realTimeNotificationService.clearAllNotifications();
  }, []);

  const getNotifications = useCallback((filter?: {
    category?: string;
    priority?: string;
    isRead?: boolean;
    limit?: number;
  }) => {
    return realTimeNotificationService.getNotifications(filter);
  }, []);

  const subscribeToUserActivities = useCallback((userId: string) => {
    realTimeNotificationService.subscribeToUserActivities(userId);
  }, []);

  const unsubscribeFromUserActivities = useCallback((userId: string) => {
    realTimeNotificationService.unsubscribeFromUserActivities(userId);
  }, []);

  useEffect(() => {
    const updateNotifications = () => {
      const notifications = realTimeNotificationService.getNotifications({ limit: maxNotifications });
      const unreadCount = realTimeNotificationService.getUnreadCount();
      
      setState(prev => ({
        ...prev,
        notifications,
        unreadCount
      }));
    };

    const handleNotificationAdded = () => {
      updateNotifications();
    };

    const handleNotificationRead = () => {
      updateNotifications();
    };

    const handleAllNotificationsRead = () => {
      updateNotifications();
    };

    const handleNotificationRemoved = () => {
      updateNotifications();
    };

    const handleAllNotificationsCleared = () => {
      updateNotifications();
    };

    const handleConnectionStatusChanged = (isOnline: unknown) => {
      const online = isOnline as boolean;
      setState(prev => ({ ...prev, isOnline: online }));
    };

    const handleUserActivity = (activity: unknown) => {
      const userActivity = activity as UserActivity;
      setState(prev => ({
        ...prev,
        recentActivities: [userActivity, ...prev.recentActivities.slice(0, 19)] // Keep last 20
      }));
    };

    realTimeNotificationService.on('notificationAdded', handleNotificationAdded);
    realTimeNotificationService.on('notificationRead', handleNotificationRead);
    realTimeNotificationService.on('allNotificationsRead', handleAllNotificationsRead);
    realTimeNotificationService.on('notificationRemoved', handleNotificationRemoved);
    realTimeNotificationService.on('allNotificationsCleared', handleAllNotificationsCleared);
    realTimeNotificationService.on('connectionStatusChanged', handleConnectionStatusChanged);
    realTimeNotificationService.on('userActivity', handleUserActivity);

    // Initial load
    updateNotifications();
    setState(prev => ({
      ...prev,
      isOnline: realTimeNotificationService.getConnectionStatus(),
      recentActivities: realTimeNotificationService.getUserActivities(undefined, 20)
    }));

    // Request permission if enabled
    if (autoRequestPermission && Notification.permission === 'default') {
      requestPermission();
    }

    return () => {
      realTimeNotificationService.off('notificationAdded', handleNotificationAdded);
      realTimeNotificationService.off('notificationRead', handleNotificationRead);
      realTimeNotificationService.off('allNotificationsRead', handleAllNotificationsRead);
      realTimeNotificationService.off('notificationRemoved', handleNotificationRemoved);
      realTimeNotificationService.off('allNotificationsCleared', handleAllNotificationsCleared);
      realTimeNotificationService.off('connectionStatusChanged', handleConnectionStatusChanged);
      realTimeNotificationService.off('userActivity', handleUserActivity);
    };
  }, [maxNotifications, autoRequestPermission, requestPermission]);

  return {
    ...state,
    requestPermission,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    getNotifications,
    subscribeToUserActivities,
    unsubscribeFromUserActivities
  };
}