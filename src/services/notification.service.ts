import { api } from './api';
import { WebSocketService } from './websocket.service';

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  userId: string;
  workspaceId?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  channels: NotificationChannel[];
  status: NotificationStatus;
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
  metadata?: NotificationMetadata;
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  REMINDER = 'reminder',
  INVITATION = 'invitation',
  APPROVAL = 'approval',
  SYSTEM = 'system'
}

export enum NotificationCategory {
  CONTENT = 'content',
  COLLABORATION = 'collaboration',
  PAYMENT = 'payment',
  SECURITY = 'security',
  SYSTEM = 'system',
  MARKETING = 'marketing',
  ANALYTICS = 'analytics',
  WORKSPACE = 'workspace'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WEBHOOK = 'webhook',
  SLACK = 'slack',
  TEAMS = 'teams'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export interface NotificationAction {
  id: string;
  label: string;
  action: string;
  style?: 'primary' | 'secondary' | 'danger';
  url?: string;
  data?: Record<string, any>;
}

export interface NotificationMetadata {
  sourceId?: string;
  sourceType?: string;
  templateId?: string;
  campaignId?: string;
  batchId?: string;
  retryCount?: number;
  deliveryAttempts?: DeliveryAttempt[];
}

export interface DeliveryAttempt {
  channel: NotificationChannel;
  timestamp: string;
  status: 'success' | 'failed';
  error?: string;
  deliveryId?: string;
}

export interface NotificationPreferences {
  userId: string;
  channels: ChannelPreferences;
  categories: CategoryPreferences;
  quietHours: QuietHours;
  frequency: NotificationFrequency;
  language: string;
  timezone: string;
  updatedAt: string;
}

export interface ChannelPreferences {
  [NotificationChannel.IN_APP]: ChannelConfig;
  [NotificationChannel.EMAIL]: ChannelConfig;
  [NotificationChannel.SMS]: ChannelConfig;
  [NotificationChannel.PUSH]: ChannelConfig;
  [NotificationChannel.WEBHOOK]: ChannelConfig;
  [NotificationChannel.SLACK]: ChannelConfig;
  [NotificationChannel.TEAMS]: ChannelConfig;
}

export interface ChannelConfig {
  enabled: boolean;
  address?: string;
  settings?: Record<string, any>;
}

export interface CategoryPreferences {
  [key: string]: {
    enabled: boolean;
    channels: NotificationChannel[];
    priority: NotificationPriority;
  };
}

export interface QuietHours {
  enabled: boolean;
  start: string; // HH:mm format
  end: string; // HH:mm format
  timezone: string;
  days: number[]; // 0-6, Sunday = 0
}

export enum NotificationFrequency {
  IMMEDIATE = 'immediate',
  BATCHED_HOURLY = 'batched_hourly',
  BATCHED_DAILY = 'batched_daily',
  BATCHED_WEEKLY = 'batched_weekly'
}

export interface NotificationTemplate {
  id: string;
  name: string;
  category: NotificationCategory;
  type: NotificationType;
  channels: NotificationChannel[];
  subject: string;
  content: string;
  variables: TemplateVariable[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'url';
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface NotificationCampaign {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  targetAudience: AudienceFilter;
  schedule: CampaignSchedule;
  status: CampaignStatus;
  statistics: CampaignStatistics;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface AudienceFilter {
  userIds?: string[];
  workspaceIds?: string[];
  roles?: string[];
  subscriptionPlans?: string[];
  customFilters?: Record<string, any>;
}

export interface CampaignSchedule {
  type: 'immediate' | 'scheduled' | 'recurring';
  scheduledAt?: string;
  timezone?: string;
  recurrence?: RecurrencePattern;
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: string;
}

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface CampaignStatistics {
  totalRecipients: number;
  sent: number;
  delivered: number;
  read: number;
  clicked: number;
  failed: number;
  unsubscribed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

export interface NotificationFilter {
  types?: NotificationType[];
  categories?: NotificationCategory[];
  priorities?: NotificationPriority[];
  status?: NotificationStatus[];
  dateRange?: {
    start: string;
    end: string;
  };
  read?: boolean;
  workspaceId?: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export class NotificationService {
  private wsService: WebSocketService;
  private notifications: Map<string, Notification> = new Map();
  private preferences: NotificationPreferences | null = null;
  private unreadCount = 0;
  
  // Event callbacks
  private notificationCallbacks: ((notification: Notification) => void)[] = [];
  private unreadCountCallbacks: ((count: number) => void)[] = [];
  private preferencesCallbacks: ((preferences: NotificationPreferences) => void)[] = [];

  constructor(wsService: WebSocketService) {
    this.wsService = wsService;
    this.setupWebSocketListeners();
    this.loadPreferences();
  }

  private setupWebSocketListeners(): void {
    this.wsService.subscribe('notification_received');
    this.wsService.subscribe('notification_updated');
    this.wsService.subscribe('notification_read');
    this.wsService.subscribe('bulk_notifications_read');
    this.wsService.subscribe('preferences_updated');
  }

  // Notification Management
  async sendNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'status'>): Promise<Notification> {
    const response = await api.post('/notifications', notification);
    return response.data;
  }

  async getNotifications(
    filter?: NotificationFilter,
    page = 1,
    limit = 20
  ): Promise<NotificationListResponse> {
    const params = new URLSearchParams();
    
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else if (typeof value === 'object') {
            params.append(key, JSON.stringify(value));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await api.get(`/notifications?${params.toString()}`);
    const result = response.data;
    
    // Cache notifications
    result.notifications.forEach((notification: Notification) => {
      this.notifications.set(notification.id, notification);
    });
    
    this.unreadCount = result.unreadCount;
    
    return result;
  }

  async getNotification(id: string): Promise<Notification> {
    const response = await api.get(`/notifications/${id}`);
    const notification = response.data;
    this.notifications.set(notification.id, notification);
    return notification;
  }

  async markAsRead(id: string): Promise<void> {
    await api.put(`/notifications/${id}/read`);
    
    const notification = this.notifications.get(id);
    if (notification && notification.status !== NotificationStatus.READ) {
      notification.status = NotificationStatus.READ;
      notification.readAt = new Date().toISOString();
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.notifyUnreadCountChange();
    }
  }

  async markAllAsRead(filter?: NotificationFilter): Promise<void> {
    await api.put('/notifications/read-all', { filter });
    
    // Update local cache
    this.notifications.forEach(notification => {
      if (notification.status !== NotificationStatus.READ) {
        notification.status = NotificationStatus.READ;
        notification.readAt = new Date().toISOString();
      }
    });
    
    this.unreadCount = 0;
    this.notifyUnreadCountChange();
  }

  async deleteNotification(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
    
    const notification = this.notifications.get(id);
    if (notification && notification.status !== NotificationStatus.READ) {
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.notifyUnreadCountChange();
    }
    
    this.notifications.delete(id);
  }

  async deleteAllNotifications(filter?: NotificationFilter): Promise<void> {
    await api.delete('/notifications', { data: { filter } });
    
    this.notifications.clear();
    this.unreadCount = 0;
    this.notifyUnreadCountChange();
  }

  async performAction(notificationId: string, actionId: string, data?: Record<string, any>): Promise<any> {
    const response = await api.post(`/notifications/${notificationId}/actions/${actionId}`, { data });
    return response.data;
  }

  // Preferences Management
  async getPreferences(): Promise<NotificationPreferences> {
    if (this.preferences) {
      return this.preferences;
    }
    
    const response = await api.get('/notifications/preferences');
    this.preferences = response.data;
    return this.preferences!;
  }

  async updatePreferences(updates: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const response = await api.put('/notifications/preferences', updates);
    this.preferences = response.data;
    this.notifyPreferencesChange();
    return this.preferences!;
  }

  async updateChannelPreferences(channel: NotificationChannel, config: ChannelConfig): Promise<void> {
    await api.put(`/notifications/preferences/channels/${channel}`, config);
    
    if (this.preferences) {
      this.preferences.channels[channel] = config;
      this.notifyPreferencesChange();
    }
  }

  async updateCategoryPreferences(
    category: NotificationCategory,
    preferences: { enabled: boolean; channels: NotificationChannel[]; priority: NotificationPriority }
  ): Promise<void> {
    await api.put(`/notifications/preferences/categories/${category}`, preferences);
    
    if (this.preferences) {
      this.preferences.categories[category] = preferences;
      this.notifyPreferencesChange();
    }
  }

  private async loadPreferences(): Promise<void> {
    try {
      await this.getPreferences();
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  }

  // Template Management
  async createTemplate(template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplate> {
    const response = await api.post('/notifications/templates', template);
    return response.data;
  }

  async getTemplates(): Promise<NotificationTemplate[]> {
    const response = await api.get('/notifications/templates');
    return response.data;
  }

  async getTemplate(id: string): Promise<NotificationTemplate> {
    const response = await api.get(`/notifications/templates/${id}`);
    return response.data;
  }

  async updateTemplate(id: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    const response = await api.put(`/notifications/templates/${id}`, updates);
    return response.data;
  }

  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/notifications/templates/${id}`);
  }

  async sendFromTemplate(
    templateId: string,
    recipients: string[],
    variables?: Record<string, any>
  ): Promise<Notification[]> {
    const response = await api.post(`/notifications/templates/${templateId}/send`, {
      recipients,
      variables
    });
    return response.data;
  }

  // Campaign Management
  async createCampaign(campaign: Omit<NotificationCampaign, 'id' | 'createdAt' | 'statistics'>): Promise<NotificationCampaign> {
    const response = await api.post('/notifications/campaigns', campaign);
    return response.data;
  }

  async getCampaigns(): Promise<NotificationCampaign[]> {
    const response = await api.get('/notifications/campaigns');
    return response.data;
  }

  async getCampaign(id: string): Promise<NotificationCampaign> {
    const response = await api.get(`/notifications/campaigns/${id}`);
    return response.data;
  }

  async updateCampaign(id: string, updates: Partial<NotificationCampaign>): Promise<NotificationCampaign> {
    const response = await api.put(`/notifications/campaigns/${id}`, updates);
    return response.data;
  }

  async startCampaign(id: string): Promise<NotificationCampaign> {
    const response = await api.post(`/notifications/campaigns/${id}/start`);
    return response.data;
  }

  async pauseCampaign(id: string): Promise<NotificationCampaign> {
    const response = await api.post(`/notifications/campaigns/${id}/pause`);
    return response.data;
  }

  async stopCampaign(id: string): Promise<NotificationCampaign> {
    const response = await api.post(`/notifications/campaigns/${id}/stop`);
    return response.data;
  }

  async getCampaignStatistics(id: string): Promise<CampaignStatistics> {
    const response = await api.get(`/notifications/campaigns/${id}/statistics`);
    return response.data;
  }

  // Push Notifications
  async requestPushPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  async registerPushSubscription(subscription: PushSubscription): Promise<void> {
    await api.post('/notifications/push/subscribe', {
      subscription: subscription.toJSON()
    });
  }

  async unregisterPushSubscription(): Promise<void> {
    await api.post('/notifications/push/unsubscribe');
  }

  // Analytics
  async getNotificationAnalytics(
    dateRange?: { start: string; end: string }
  ): Promise<any> {
    const params = new URLSearchParams();
    if (dateRange) {
      params.append('start', dateRange.start);
      params.append('end', dateRange.end);
    }
    
    const response = await api.get(`/notifications/analytics?${params.toString()}`);
    return response.data;
  }

  async getChannelPerformance(): Promise<any> {
    const response = await api.get('/notifications/analytics/channels');
    return response.data;
  }

  async getCategoryEngagement(): Promise<any> {
    const response = await api.get('/notifications/analytics/categories');
    return response.data;
  }

  // Webhooks
  async createWebhook(
    url: string,
    events: string[],
    secret?: string
  ): Promise<any> {
    const response = await api.post('/notifications/webhooks', {
      url,
      events,
      secret
    });
    return response.data;
  }

  async getWebhooks(): Promise<any[]> {
    const response = await api.get('/notifications/webhooks');
    return response.data;
  }

  async updateWebhook(id: string, updates: any): Promise<any> {
    const response = await api.put(`/notifications/webhooks/${id}`, updates);
    return response.data;
  }

  async deleteWebhook(id: string): Promise<void> {
    await api.delete(`/notifications/webhooks/${id}`);
  }








  private isInQuietHours(): boolean {
    if (!this.preferences?.quietHours.enabled) return false;
    
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Check if current day is in quiet hours days
    if (!this.preferences.quietHours.days.includes(currentDay)) {
      return false;
    }
    
    const [startHour, startMin] = this.preferences.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = this.preferences.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }


  // Event Listeners
  onNotification(callback: (notification: Notification) => void): () => void {
    this.notificationCallbacks.push(callback);
    return () => {
      const index = this.notificationCallbacks.indexOf(callback);
      if (index > -1) {
        this.notificationCallbacks.splice(index, 1);
      }
    };
  }

  onUnreadCountChange(callback: (count: number) => void): () => void {
    this.unreadCountCallbacks.push(callback);
    return () => {
      const index = this.unreadCountCallbacks.indexOf(callback);
      if (index > -1) {
        this.unreadCountCallbacks.splice(index, 1);
      }
    };
  }

  onPreferencesChange(callback: (preferences: NotificationPreferences) => void): () => void {
    this.preferencesCallbacks.push(callback);
    return () => {
      const index = this.preferencesCallbacks.indexOf(callback);
      if (index > -1) {
        this.preferencesCallbacks.splice(index, 1);
      }
    };
  }

  // Getters
  getUnreadCount(): number {
    return this.unreadCount;
  }

  getCachedNotifications(): Notification[] {
    return Array.from(this.notifications.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Private helper methods
  private notifyUnreadCountChange(): void {
    this.unreadCountCallbacks.forEach(callback => callback(this.unreadCount));
  }

  private notifyPreferencesChange(): void {
    if (this.preferences) {
      this.preferencesCallbacks.forEach(callback => callback(this.preferences!));
    }
  }
}