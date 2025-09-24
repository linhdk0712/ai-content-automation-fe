// Enhanced Push Notifications Service with Personalization and Targeting
export interface NotificationConfig {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  silent?: boolean;
  requireInteraction?: boolean;
  timestamp?: number;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  categories: {
    content: boolean;
    analytics: boolean;
    collaboration: boolean;
    system: boolean;
    marketing: boolean;
  };
  schedule: {
    startTime: string; // HH:MM format
    endTime: string;   // HH:MM format
    timezone: string;
    weekdays: boolean[];
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

class PushNotificationsService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private preferences: NotificationPreferences;
  private isSupported = false;

  constructor() {
    this.isSupported = this.checkSupport();
    this.preferences = this.loadPreferences();
    this.initialize();
  }

  private checkSupport(): boolean {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  private async initialize() {
    if (!this.isSupported) {
      console.warn('Push notifications not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      await this.loadExistingSubscription();
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  // Request notification permission with enhanced UX
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Push notifications not supported');
    }

    // Check current permission
    let permission = Notification.permission;

    if (permission === 'default') {
      // Show custom permission dialog first
      const userConsent = await this.showPermissionDialog();
      
      if (!userConsent) {
        return 'denied';
      }

      // Request browser permission
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      await this.subscribeToPush();
    }

    return permission;
  } 
 // Show custom permission dialog
  private async showPermissionDialog(): Promise<boolean> {
    return new Promise((resolve) => {
      // This would typically show a custom modal
      // For now, we'll use a simple confirm dialog
      const result = confirm(
        'Enable notifications to stay updated with your content performance, ' +
        'team collaboration, and important system updates. You can customize ' +
        'notification preferences in settings.'
      );
      resolve(result);
    });
  }

  // Subscribe to push notifications
  private async subscribeToPush(): Promise<void> {
    if (!this.registration) {
      throw new Error('Service worker not registered');
    }

    try {
      // Check for existing subscription
      this.subscription = await this.registration.pushManager.getSubscription();

      if (!this.subscription) {
        // Create new subscription
        const vapidPublicKey = await this.getVapidPublicKey();
        
        this.subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey || '').buffer as ArrayBuffer
        });
      }

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);
      
      console.log('Push subscription successful');
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  // Load existing subscription
  private async loadExistingSubscription(): Promise<void> {
    if (!this.registration) return;

    try {
      this.subscription = await this.registration.pushManager.getSubscription();
      
      if (this.subscription) {
        // Verify subscription is still valid
        await this.verifySubscription(this.subscription);
      }
    } catch (error) {
      console.error('Failed to load existing subscription:', error);
    }
  }

  // Send subscription to server
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    const response = await fetch('/api/v1/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        preferences: this.preferences,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send subscription to server');
    }
  }

  // Verify subscription with server
  private async verifySubscription(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/v1/notifications/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });

      if (!response.ok) {
        // Subscription invalid, resubscribe
        await this.subscribeToPush();
      }
    } catch (error) {
      console.error('Failed to verify subscription:', error);
    }
  }

  // Get VAPID public key from server
  private async getVapidPublicKey(): Promise<string> {
    const response = await fetch('/api/v1/notifications/vapid-key');
    
    if (!response.ok) {
      throw new Error('Failed to get VAPID public key');
    }

    const data = await response.json();
    return data.publicKey;
  }

  // Convert VAPID key to Uint8Array
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Send targeted notification
  async sendTargetedNotification(config: NotificationConfig): Promise<void> {
    if (!this.isNotificationAllowed(config)) {
      console.log('Notification blocked by user preferences');
      return;
    }

    // Personalize notification content
    const personalizedConfig = await this.personalizeNotification(config);

    // Check if within allowed time window
    if (!this.isWithinAllowedTime()) {
      // Queue for later delivery
      await this.queueNotification(personalizedConfig);
      return;
    }

    // Send immediate notification
    await this.showNotification(personalizedConfig);
  }

  // Check if notification is allowed based on preferences
  private isNotificationAllowed(config: NotificationConfig): boolean {
    if (!this.preferences.enabled) {
      return false;
    }

    // Check category preferences
    const category = this.getNotificationCategory(config);
    if (category && !this.preferences.categories[category]) {
      return false;
    }

    return true;
  }

  // Get notification category from config
  private getNotificationCategory(config: NotificationConfig): keyof NotificationPreferences['categories'] | null {
    const { data } = config;
    
    if (data?.type) {
      switch (data.type) {
        case 'content_generated':
        case 'content_published':
        case 'content_scheduled':
          return 'content';
        case 'analytics_report':
        case 'performance_alert':
          return 'analytics';
        case 'team_invite':
        case 'approval_request':
        case 'comment_added':
          return 'collaboration';
        case 'system_maintenance':
        case 'security_alert':
          return 'system';
        case 'feature_announcement':
        case 'tips_and_tricks':
          return 'marketing';
      }
    }
    
    return null;
  }

  // Personalize notification content
  private async personalizeNotification(config: NotificationConfig): Promise<NotificationConfig> {
    try {
      const response = await fetch('/api/v1/notifications/personalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        const personalizedConfig = await response.json();
        return { ...config, ...personalizedConfig };
      }
    } catch (error) {
      console.error('Failed to personalize notification:', error);
    }

    return config;
  }

  // Check if current time is within allowed notification window
  private isWithinAllowedTime(): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const currentDay = now.getDay();

    // Check if current day is allowed
    if (!this.preferences.schedule.weekdays[currentDay]) {
      return false;
    }

    // Parse start and end times
    const [startHour, startMin] = this.preferences.schedule.startTime.split(':').map(Number);
    const [endHour, endMin] = this.preferences.schedule.endTime.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle overnight time windows
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }

    return currentTime >= startTime && currentTime <= endTime;
  }

  // Queue notification for later delivery
  private async queueNotification(config: NotificationConfig): Promise<void> {
    try {
      await fetch('/api/v1/notifications/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          config,
          deliveryTime: this.getNextAllowedTime()
        })
      });
    } catch (error) {
      console.error('Failed to queue notification:', error);
    }
  }

  // Get next allowed delivery time
  private getNextAllowedTime(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const [startHour, startMin] = this.preferences.schedule.startTime.split(':').map(Number);
    tomorrow.setHours(startHour, startMin, 0, 0);
    
    return tomorrow.getTime();
  }

  // Show notification
  private async showNotification(config: NotificationConfig): Promise<void> {
    if (!this.registration) {
      throw new Error('Service worker not registered');
    }

    const options: NotificationOptions = {
      body: config.body,
      icon: config.icon || '/icon-192x192.png',
      badge: config.badge || '/badge-72x72.png',
      tag: config.tag,
      data: config.data,
      silent: config.silent || false,
      requireInteraction: config.requireInteraction || false,
    };

    await this.registration.showNotification(config.title, options);
  }

  // Update notification preferences
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    this.preferences = { ...this.preferences, ...preferences };
    this.savePreferences();

    // Update server with new preferences
    if (this.subscription) {
      await this.sendSubscriptionToServer(this.subscription);
    }
  }

  // Get current preferences
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  // Load preferences from storage
  private loadPreferences(): NotificationPreferences {
    const stored = localStorage.getItem('notificationPreferences');
    
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse notification preferences:', error);
      }
    }

    // Default preferences
    return {
      enabled: true,
      categories: {
        content: true,
        analytics: true,
        collaboration: true,
        system: true,
        marketing: false
      },
      schedule: {
        startTime: '09:00',
        endTime: '18:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        weekdays: [true, true, true, true, true, false, false] // Mon-Fri
      },
      frequency: 'immediate'
    };
  }

  // Save preferences to storage
  private savePreferences(): void {
    localStorage.setItem('notificationPreferences', JSON.stringify(this.preferences));
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<void> {
    if (!this.subscription) {
      return;
    }

    try {
      // Unsubscribe from browser
      await this.subscription.unsubscribe();
      
      // Notify server
      await fetch('/api/v1/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          endpoint: this.subscription.endpoint
        })
      });

      this.subscription = null;
      console.log('Successfully unsubscribed from push notifications');
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      throw error;
    }
  }

  // Check if subscribed
  isSubscribed(): boolean {
    return this.subscription !== null;
  }

  // Get subscription status
  getSubscriptionStatus(): { supported: boolean; subscribed: boolean; permission: NotificationPermission } {
    return {
      supported: this.isSupported,
      subscribed: this.isSubscribed(),
      permission: Notification.permission
    };
  }

  // Convenience method to trigger a simple test notification
  async testNotification(): Promise<void> {
    await this.sendTargetedNotification({
      title: 'Test Notification',
      body: 'Notifications are configured correctly.',
      data: { type: 'system_maintenance' }
    });
  }
}

export const pushNotificationsService = new PushNotificationsService();