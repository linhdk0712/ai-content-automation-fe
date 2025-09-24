import { api } from './api';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface PushNotificationSettings {
  enabled: boolean;
  categories: {
    [key: string]: {
      enabled: boolean;
      sound: boolean;
      vibration: boolean;
      showBadge: boolean;
    };
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  deviceSettings: {
    sound: boolean;
    vibration: boolean;
    showOnLockScreen: boolean;
    priority: 'min' | 'low' | 'default' | 'high' | 'max';
  };
}

export interface PushStatistics {
  totalSent: number;
  delivered: number;
  clicked: number;
  dismissed: number;
  deliveryRate: number;
  clickRate: number;
  lastDelivery?: string;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  vendor: string;
  language: string;
  timezone: string;
  screenResolution: string;
  colorDepth: number;
  touchSupport: boolean;
}

export enum PushPermissionState {
  DEFAULT = 'default',
  GRANTED = 'granted',
  DENIED = 'denied'
}

export class PushNotificationService {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private pushSubscription: PushSubscription | null = null;
  private settings: PushNotificationSettings;
  private vapidPublicKey: string = '';
  private isSupported: boolean;
  
  // Event callbacks
  private permissionCallbacks: ((permission: PushPermissionState) => void)[] = [];
  private subscriptionCallbacks: ((subscription: PushSubscription | null) => void)[] = [];
  private notificationCallbacks: ((notification: NotificationPayload) => void)[] = [];
  private clickCallbacks: ((notification: NotificationPayload, action?: string) => void)[] = [];

  constructor() {
    this.isSupported = this.checkSupport();
    this.settings = this.getDefaultSettings();
    
    if (this.isSupported) {
      this.initialize();
    }
  }

  private checkSupport(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  private async initialize(): Promise<void> {
    try {
      // Register service worker
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
      
      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });

      // Get VAPID public key from server
      await this.fetchVapidKey();
      
      // Check existing subscription
      await this.checkExistingSubscription();
      
      // Setup notification event listeners
      this.setupNotificationListeners();
      
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  private async fetchVapidKey(): Promise<void> {
    try {
      const response = await api.get('/push/vapid-key');
      this.vapidPublicKey = response.data.publicKey;
    } catch (error) {
      console.error('Failed to fetch VAPID key:', error);
    }
  }

  private async checkExistingSubscription(): Promise<void> {
    if (!this.serviceWorkerRegistration) return;

    try {
      this.pushSubscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      this.notifySubscriptionCallbacks();
    } catch (error) {
      console.error('Failed to check existing subscription:', error);
    }
  }

  private setupNotificationListeners(): void {
    // Listen for notification clicks
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'NOTIFICATION_CLICK') {
        this.handleNotificationClick(event.data.notification, event.data.action);
      }
    });

    // Listen for notification close
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'NOTIFICATION_CLOSE') {
        this.handleNotificationClose(event.data.notification);
      }
    });
  }

  // Permission Management
  async requestPermission(): Promise<PushPermissionState> {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    this.notifyPermissionCallbacks(permission as PushPermissionState);
    
    return permission as PushPermissionState;
  }

  getPermissionState(): PushPermissionState {
    if (!this.isSupported) {
      return PushPermissionState.DENIED;
    }
    
    return Notification.permission as PushPermissionState;
  }

  // Subscription Management
  async subscribe(): Promise<PushSubscription> {
    if (!this.serviceWorkerRegistration) {
      throw new Error('Service worker not registered');
    }

    if (!this.vapidPublicKey) {
      throw new Error('VAPID public key not available');
    }

    const permission = this.getPermissionState();
    if (permission !== PushPermissionState.GRANTED) {
      throw new Error('Push notification permission not granted');
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey || '').buffer as ArrayBuffer
      });

      this.pushSubscription = subscription;
      
      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      this.notifySubscriptionCallbacks();
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  async unsubscribe(): Promise<void> {
    if (!this.pushSubscription) {
      return;
    }

    try {
      await this.pushSubscription.unsubscribe();
      
      // Remove subscription from server
      await this.removeSubscriptionFromServer();
      
      this.pushSubscription = null;
      this.notifySubscriptionCallbacks();
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }

  async updateSubscription(): Promise<PushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      return null;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      
      if (subscription && subscription !== this.pushSubscription) {
        this.pushSubscription = subscription;
        await this.sendSubscriptionToServer(subscription);
        this.notifySubscriptionCallbacks();
      }
      
      return subscription;
    } catch (error) {
      console.error('Failed to update subscription:', error);
      return null;
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
      },
      expirationTime: subscription.expirationTime || undefined
    };

    const deviceInfo = this.getDeviceInfo();

    await api.post('/push/subscribe', {
      subscription: subscriptionData,
      deviceInfo,
      settings: this.settings
    });
  }

  private async removeSubscriptionFromServer(): Promise<void> {
    if (this.pushSubscription) {
      await api.post('/push/unsubscribe', {
        endpoint: this.pushSubscription.endpoint
      });
    }
  }

  // Notification Display
  async showNotification(payload: NotificationPayload): Promise<void> {
    if (!this.serviceWorkerRegistration) {
      throw new Error('Service worker not registered');
    }

    const permission = this.getPermissionState();
    if (permission !== PushPermissionState.GRANTED) {
      throw new Error('Push notification permission not granted');
    }

    // Check if notifications should be shown based on settings
    if (!this.shouldShowNotification(payload)) {
      return;
    }

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/badge-72x72.png',
      tag: payload.tag,
      data: payload.data,
      requireInteraction: payload.requireInteraction || false,
      silent: payload.silent || false,
    };

    // Add vibration pattern if enabled
    if (this.settings.deviceSettings.vibration) {
      (options as any).vibrate = [200, 100, 200];
    }

    await this.serviceWorkerRegistration.showNotification(payload.title, options);
    
    this.notifyNotificationCallbacks(payload);
  }

  private shouldShowNotification(payload: NotificationPayload): boolean {
    // Check if notifications are enabled
    if (!this.settings.enabled) {
      return false;
    }

    // Check category settings
    const category = payload.data?.category || 'default';
    const categorySettings = this.settings.categories[category];
    if (categorySettings && !categorySettings.enabled) {
      return false;
    }

    // Check quiet hours
    if (this.settings.quietHours.enabled && this.isInQuietHours()) {
      return false;
    }

    return true;
  }

  private isInQuietHours(): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = this.settings.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = this.settings.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Event Handlers
  private handleServiceWorkerMessage(data: any): void {
    switch (data.type) {
      case 'PUSH_RECEIVED':
        this.handlePushReceived(data.payload);
        break;
      case 'NOTIFICATION_CLICK':
        this.handleNotificationClick(data.notification, data.action);
        break;
      case 'NOTIFICATION_CLOSE':
        this.handleNotificationClose(data.notification);
        break;
    }
  }

  private handlePushReceived(payload: NotificationPayload): void {
    this.notifyNotificationCallbacks(payload);
  }

  private handleNotificationClick(notification: NotificationPayload, action?: string): void {
    this.notifyClickCallbacks(notification, action);
    
    // Handle default actions
    if (notification.data?.url) {
      window.open(notification.data.url, '_blank');
    }
  }

  private handleNotificationClose(notification: NotificationPayload): void {
    // Track notification dismissal
    this.trackNotificationEvent('dismissed', notification);
  }

  // Settings Management
  updateSettings(updates: Partial<PushNotificationSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.persistSettings();
    
    // Update server settings
    this.updateServerSettings();
  }

  getSettings(): PushNotificationSettings {
    return { ...this.settings };
  }

  private async updateServerSettings(): Promise<void> {
    if (this.pushSubscription) {
      try {
        await api.put('/push/settings', {
          endpoint: this.pushSubscription.endpoint,
          settings: this.settings
        });
      } catch (error) {
        console.error('Failed to update server settings:', error);
      }
    }
  }

  private getDefaultSettings(): PushNotificationSettings {
    const stored = localStorage.getItem('pushNotificationSettings');
    if (stored) {
      try {
        return { ...this.getBaseSettings(), ...JSON.parse(stored) };
      } catch (error) {
        console.error('Failed to load push notification settings:', error);
      }
    }
    
    return this.getBaseSettings();
  }

  private getBaseSettings(): PushNotificationSettings {
    return {
      enabled: true,
      categories: {
        default: {
          enabled: true,
          sound: true,
          vibration: true,
          showBadge: true
        },
        content: {
          enabled: true,
          sound: false,
          vibration: false,
          showBadge: true
        },
        collaboration: {
          enabled: true,
          sound: true,
          vibration: true,
          showBadge: true
        },
        system: {
          enabled: true,
          sound: true,
          vibration: false,
          showBadge: true
        }
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      deviceSettings: {
        sound: true,
        vibration: true,
        showOnLockScreen: true,
        priority: 'default'
      }
    };
  }

  private persistSettings(): void {
    try {
      localStorage.setItem('pushNotificationSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to persist push notification settings:', error);
    }
  }

  // Analytics and Statistics
  async getStatistics(): Promise<PushStatistics> {
    try {
      const response = await api.get('/push/statistics');
      return response.data;
    } catch (error) {
      console.error('Failed to get push statistics:', error);
      return {
        totalSent: 0,
        delivered: 0,
        clicked: 0,
        dismissed: 0,
        deliveryRate: 0,
        clickRate: 0
      };
    }
  }

  private async trackNotificationEvent(
    event: 'delivered' | 'clicked' | 'dismissed',
    notification: NotificationPayload
  ): Promise<void> {
    try {
      await api.post('/push/events', {
        event,
        notificationId: notification.data?.id,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to track notification event:', error);
    }
  }

  // Device Information
  private getDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      touchSupport: 'ontouchstart' in window
    };
  }

  // Event Listeners
  onPermissionChange(callback: (permission: PushPermissionState) => void): () => void {
    this.permissionCallbacks.push(callback);
    return () => {
      const index = this.permissionCallbacks.indexOf(callback);
      if (index > -1) {
        this.permissionCallbacks.splice(index, 1);
      }
    };
  }

  onSubscriptionChange(callback: (subscription: PushSubscription | null) => void): () => void {
    this.subscriptionCallbacks.push(callback);
    return () => {
      const index = this.subscriptionCallbacks.indexOf(callback);
      if (index > -1) {
        this.subscriptionCallbacks.splice(index, 1);
      }
    };
  }

  onNotification(callback: (notification: NotificationPayload) => void): () => void {
    this.notificationCallbacks.push(callback);
    return () => {
      const index = this.notificationCallbacks.indexOf(callback);
      if (index > -1) {
        this.notificationCallbacks.splice(index, 1);
      }
    };
  }

  onNotificationClick(callback: (notification: NotificationPayload, action?: string) => void): () => void {
    this.clickCallbacks.push(callback);
    return () => {
      const index = this.clickCallbacks.indexOf(callback);
      if (index > -1) {
        this.clickCallbacks.splice(index, 1);
      }
    };
  }

  // Getters
  isSubscribed(): boolean {
    return this.pushSubscription !== null;
  }

  getSubscription(): PushSubscription | null {
    return this.pushSubscription;
  }

  getIsSupported(): boolean {
    return this.isSupported;
  }

  // Utility Methods
  private notifyPermissionCallbacks(permission: PushPermissionState): void {
    this.permissionCallbacks.forEach(callback => callback(permission));
  }

  private notifySubscriptionCallbacks(): void {
    this.subscriptionCallbacks.forEach(callback => callback(this.pushSubscription));
  }

  private notifyNotificationCallbacks(notification: NotificationPayload): void {
    this.notificationCallbacks.forEach(callback => callback(notification));
  }

  private notifyClickCallbacks(notification: NotificationPayload, action?: string): void {
    this.clickCallbacks.forEach(callback => callback(notification, action));
  }

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

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}