// PWA Service for managing Progressive Web App features
export class PWAService {
  private deferredPrompt: any = null;
  private isInstalled = false;
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.initializePWA();
  }

  private async initializePWA() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
        
        // Listen for updates
        this.registration.addEventListener('updatefound', () => {
          this.handleServiceWorkerUpdate();
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallPrompt();
    });

    // Check if already installed
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.hideInstallPrompt();
    });

    // Check if running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
    }
  }

  // Install PWA
  async installPWA(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installation accepted');
        this.isInstalled = true;
        return true;
      } else {
        console.log('PWA installation declined');
        return false;
      }
    } catch (error) {
      console.error('PWA installation failed:', error);
      return false;
    } finally {
      this.deferredPrompt = null;
    }
  }

  // Check if PWA can be installed
  canInstall(): boolean {
    return !!this.deferredPrompt && !this.isInstalled;
  }

  // Check if PWA is installed
  isAppInstalled(): boolean {
    return this.isInstalled;
  }

  // Show install prompt UI
  private showInstallPrompt() {
    const installBanner = document.createElement('div');
    installBanner.id = 'pwa-install-banner';
    installBanner.className = 'pwa-install-banner';
    installBanner.innerHTML = `
      <div class="pwa-install-content">
        <div class="pwa-install-icon">
          <img src="/icons/icon-72x72.png" alt="AI Content Automation" />
        </div>
        <div class="pwa-install-text">
          <h3>Install AI Content Automation</h3>
          <p>Get quick access and work offline</p>
        </div>
        <div class="pwa-install-actions">
          <button id="pwa-install-btn" class="btn-primary">Install</button>
          <button id="pwa-dismiss-btn" class="btn-secondary">Not now</button>
        </div>
      </div>
    `;

    document.body.appendChild(installBanner);

    // Add event listeners
    document.getElementById('pwa-install-btn')?.addEventListener('click', () => {
      this.installPWA();
      this.hideInstallPrompt();
    });

    document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
      this.hideInstallPrompt();
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      this.hideInstallPrompt();
    }, 10000);
  }

  // Hide install prompt UI
  private hideInstallPrompt() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.remove();
    }
  }

  // Handle service worker updates
  private handleServiceWorkerUpdate() {
    if (!this.registration) return;

    const newWorker = this.registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        this.showUpdatePrompt();
      }
    });
  }

  // Show update prompt
  private showUpdatePrompt() {
    const updateBanner = document.createElement('div');
    updateBanner.id = 'pwa-update-banner';
    updateBanner.className = 'pwa-update-banner';
    updateBanner.innerHTML = `
      <div class="pwa-update-content">
        <div class="pwa-update-text">
          <h3>New version available</h3>
          <p>Refresh to get the latest features</p>
        </div>
        <div class="pwa-update-actions">
          <button id="pwa-refresh-btn" class="btn-primary">Refresh</button>
          <button id="pwa-later-btn" class="btn-secondary">Later</button>
        </div>
      </div>
    `;

    document.body.appendChild(updateBanner);

    // Add event listeners
    document.getElementById('pwa-refresh-btn')?.addEventListener('click', () => {
      window.location.reload();
    });

    document.getElementById('pwa-later-btn')?.addEventListener('click', () => {
      updateBanner.remove();
    });
  }

  // Request push notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Subscribe to push notifications
  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.error('Service Worker not registered');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY || '').buffer as ArrayBuffer as ArrayBuffer
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  // Send subscription to server
  private async sendSubscriptionToServer(subscription: PushSubscription) {
    try {
      await fetch('/api/v1/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  // Convert VAPID key
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

  // Check network status
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Listen for network changes
  onNetworkChange(callback: (isOnline: boolean) => void) {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }

  // Cache management
  async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
  }

  // Get cache usage
  async getCacheUsage(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { used: 0, quota: 0 };
  }

  // Background sync
  async scheduleBackgroundSync(tag: string): Promise<void> {
    if (!this.registration) return;

    try {
      await (this.registration as any).sync?.register(tag);
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }

  // Share API
  async share(data: ShareData): Promise<boolean> {
    if (navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        console.error('Sharing failed:', error);
        return false;
      }
    }
    
    // Fallback to clipboard
    if (navigator.clipboard && data.url) {
      try {
        await navigator.clipboard.writeText(data.url);
        return true;
      } catch (error) {
        console.error('Clipboard write failed:', error);
        return false;
      }
    }
    
    return false;
  }

  // Device capabilities
  getDeviceCapabilities() {
    return {
      hasCamera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      hasGeolocation: 'geolocation' in navigator,
      hasVibration: 'vibrate' in navigator,
      hasNotifications: 'Notification' in window,
      hasServiceWorker: 'serviceWorker' in navigator,
      hasPushManager: 'PushManager' in window,
      hasBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      hasShare: 'share' in navigator,
      hasClipboard: 'clipboard' in navigator,
      hasWakeLock: 'wakeLock' in navigator,
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches
    };
  }

  // Wake lock (keep screen on)
  async requestWakeLock(): Promise<WakeLockSentinel | null> {
    if ('wakeLock' in navigator) {
      try {
        const wakeLock = await (navigator as any).wakeLock.request('screen');
        return wakeLock;
      } catch (error) {
        console.error('Wake lock request failed:', error);
        return null;
      }
    }
    return null;
  }
}

// Singleton instance
export const pwaService = new PWAService();