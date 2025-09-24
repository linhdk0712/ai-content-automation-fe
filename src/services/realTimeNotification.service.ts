import { webSocketService } from './websocket.service';
import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  userId?: string;
  workspaceId?: string;
  actionUrl?: string;
  actionText?: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'system' | 'content' | 'collaboration' | 'payment' | 'security';
  metadata?: Record<string, any>;
}

export interface SystemEvent {
  type: string;
  payload: any;
  timestamp: number;
  source: string;
}

export interface UserActivity {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class RealTimeNotificationService extends BrowserEventEmitter {
  private notifications: Map<string, Notification> = new Map();
  private userActivities: UserActivity[] = [];
  private maxActivities = 100;
  private notificationQueue: Notification[] = [];
  private isOnline = true;

  constructor() {
    super();
    this.setupWebSocketListeners();
    this.setupVisibilityListener();
  }

  private setupWebSocketListeners(): void {
    webSocketService.on('notification', (data: any) => {
      this.handleIncomingNotification(data);
    });

    webSocketService.on('system_event', (event: SystemEvent) => {
      this.handleSystemEvent(event);
    });

    webSocketService.on('user_activity', (activity: UserActivity) => {
      this.handleUserActivity(activity);
    });

    webSocketService.on('connected', () => {
      this.isOnline = true;
      this.processNotificationQueue();
      this.emit('connectionStatusChanged', true);
    });

    webSocketService.on('disconnected', () => {
      this.isOnline = false;
      this.emit('connectionStatusChanged', false);
    });
  }

  private setupVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.notificationQueue.length > 0) {
        this.processNotificationQueue();
      }
    });
  }

  private handleIncomingNotification(data: any): void {
    const notification: Notification = {
      id: data.id || this.generateId(),
      type: data.type || 'info',
      title: data.title,
      message: data.message,
      timestamp: data.timestamp || Date.now(),
      userId: data.userId,
      workspaceId: data.workspaceId,
      actionUrl: data.actionUrl,
      actionText: data.actionText,
      isRead: false,
      priority: data.priority || 'medium',
      category: data.category || 'system',
      metadata: data.metadata
    };

    this.addNotification(notification);
  }

  private handleSystemEvent(event: SystemEvent): void {
    // Convert system events to notifications if needed
    const notification = this.createNotificationFromEvent(event);
    if (notification) {
      this.addNotification(notification);
    }

    this.emit('systemEvent', event);
  }

  private handleUserActivity(activity: UserActivity): void {
    this.userActivities.unshift(activity);
    
    // Keep only recent activities
    if (this.userActivities.length > this.maxActivities) {
      this.userActivities = this.userActivities.slice(0, this.maxActivities);
    }

    this.emit('userActivity', activity);
  }

  private createNotificationFromEvent(event: SystemEvent): Notification | null {
    switch (event.type) {
      case 'content_published':
        return {
          id: this.generateId(),
          type: 'success',
          title: 'Content Published',
          message: `Your content "${event.payload.title}" has been published successfully`,
          timestamp: event.timestamp,
          isRead: false,
          priority: 'medium',
          category: 'content',
          actionUrl: `/content/${event.payload.contentId}`,
          actionText: 'View Content'
        };

      case 'ai_generation_completed':
        return {
          id: this.generateId(),
          type: 'success',
          title: 'AI Generation Complete',
          message: `Your AI-generated content is ready`,
          timestamp: event.timestamp,
          isRead: false,
          priority: 'medium',
          category: 'content',
          actionUrl: `/content/${event.payload.contentId}`,
          actionText: 'View Content'
        };

      case 'payment_received':
        return {
          id: this.generateId(),
          type: 'success',
          title: 'Payment Received',
          message: `Payment of ${event.payload.amount} has been processed`,
          timestamp: event.timestamp,
          isRead: false,
          priority: 'high',
          category: 'payment'
        };

      case 'security_alert':
        return {
          id: this.generateId(),
          type: 'warning',
          title: 'Security Alert',
          message: event.payload.message,
          timestamp: event.timestamp,
          isRead: false,
          priority: 'urgent',
          category: 'security'
        };

      default:
        return null;
    }
  }

  addNotification(notification: Notification): void {
    this.notifications.set(notification.id, notification);

    if (this.isOnline && !document.hidden) {
      this.displayNotification(notification);
    } else {
      this.notificationQueue.push(notification);
    }

    this.emit('notificationAdded', notification);
  }

  private displayNotification(notification: Notification): void {
    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent'
      });

      browserNotification.onclick = () => {
        if (notification.actionUrl) {
          window.open(notification.actionUrl, '_blank');
        }
        browserNotification.close();
      };

      // Auto-close after 5 seconds unless urgent
      if (notification.priority !== 'urgent') {
        setTimeout(() => browserNotification.close(), 5000);
      }
    }

    this.emit('notificationDisplayed', notification);
  }

  private processNotificationQueue(): void {
    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      if (notification) {
        this.displayNotification(notification);
      }
    }
  }

  markAsRead(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.isRead = true;
      this.emit('notificationRead', notification);
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(notification => {
      notification.isRead = true;
    });
    this.emit('allNotificationsRead');
  }

  removeNotification(notificationId: string): void {
    if (this.notifications.delete(notificationId)) {
      this.emit('notificationRemoved', notificationId);
    }
  }

  clearAllNotifications(): void {
    this.notifications.clear();
    this.emit('allNotificationsCleared');
  }

  getNotifications(filter?: {
    category?: string;
    priority?: string;
    isRead?: boolean;
    limit?: number;
  }): Notification[] {
    let notifications = Array.from(this.notifications.values());

    if (filter) {
      if (filter.category) {
        notifications = notifications.filter(n => n.category === filter.category);
      }
      if (filter.priority) {
        notifications = notifications.filter(n => n.priority === filter.priority);
      }
      if (filter.isRead !== undefined) {
        notifications = notifications.filter(n => n.isRead === filter.isRead);
      }
      if (filter.limit) {
        notifications = notifications.slice(0, filter.limit);
      }
    }

    return notifications.sort((a, b) => b.timestamp - a.timestamp);
  }

  getUnreadCount(): number {
    return Array.from(this.notifications.values()).filter(n => !n.isRead).length;
  }

  getUserActivities(userId?: string, limit = 20): UserActivity[] {
    let activities = this.userActivities;
    
    if (userId) {
      activities = activities.filter(a => a.userId === userId);
    }
    
    return activities.slice(0, limit);
  }

  subscribeToUserActivities(userId: string): void {
    webSocketService.subscribe(`user_activity:${userId}`);
  }

  unsubscribeFromUserActivities(userId: string): void {
    webSocketService.unsubscribe(`user_activity:${userId}`);
  }

  requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return Notification.requestPermission();
    }
    return Promise.resolve('denied');
  }

  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConnectionStatus(): boolean {
    return this.isOnline;
  }
}

export const realTimeNotificationService = new RealTimeNotificationService();