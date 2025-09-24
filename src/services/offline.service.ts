// Offline Service for PWA functionality
import { DBSchema, IDBPDatabase, openDB } from 'idb';

interface OfflineDB extends DBSchema {
  actions: {
    key: string;
    value: {
      id: string;
      type: 'CREATE' | 'UPDATE' | 'DELETE';
      endpoint: string;
      method: string;
      headers: Record<string, string>;
      body?: string;
      timestamp: number;
      retryCount: number;
    };
  };
  content: {
    key: string;
    value: {
      id: string;
      title: string;
      content: string;
      type: string;
      status: string;
      lastModified: number;
      synced: boolean;
    };
  };
  analytics: {
    key: string;
    value: {
      id: string;
      event: string;
      data: Record<string, any>;
      timestamp: number;
      synced: boolean;
    };
  };
  settings: {
    key: string;
    value: {
      key: string;
      value: any;
      lastModified: number;
    };
  };
}

export class OfflineService {
  private db: IDBPDatabase<OfflineDB> | null = null;
  private syncQueue: Set<string> = new Set();
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.initDB();
    this.setupEventListeners();
  }

  private async initDB(): Promise<void> {
    try {
      this.db = await openDB<OfflineDB>('AIContentAutomationDB', 1, {
        upgrade(db) {
          // Actions store for offline operations
          if (!db.objectStoreNames.contains('actions')) {
            const actionsStore = db.createObjectStore('actions', { keyPath: 'id' });
            (actionsStore as any).createIndex('timestamp', 'timestamp');
            (actionsStore as any).createIndex('type', 'type');
          }

          // Content store for offline content
          if (!db.objectStoreNames.contains('content')) {
            const contentStore = db.createObjectStore('content', { keyPath: 'id' });
            (contentStore as any).createIndex('lastModified', 'lastModified');
            (contentStore as any).createIndex('synced', 'synced');
          }

          // Analytics store for offline analytics
          if (!db.objectStoreNames.contains('analytics')) {
            const analyticsStore = db.createObjectStore('analytics', { keyPath: 'id' });
            (analyticsStore as any).createIndex('timestamp', 'timestamp');
            (analyticsStore as any).createIndex('synced', 'synced');
          }

          // Settings store for offline settings
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }
        },
      });
    } catch (error) {
      console.error('Failed to initialize offline database:', error);
    }
  }

  private setupEventListeners(): void {
    // Online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Background sync registration
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        // Register sync events
        (registration as any).sync?.register('content-sync');
        (registration as any).sync?.register('analytics-sync');
      });
    }
  }

  // Check if app is online
  public isAppOnline(): boolean {
    return this.isOnline;
  }

  // Store offline action
  public async storeOfflineAction(
    type: 'CREATE' | 'UPDATE' | 'DELETE',
    endpoint: string,
    method: string,
    headers: Record<string, string>,
    body?: any
  ): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const actionId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const action = {
      id: actionId,
      type,
      endpoint,
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await this.db.add('actions', action);
    this.syncQueue.add(actionId);

    return actionId;
  }

  // Store content offline
  public async storeContentOffline(content: {
    id: string;
    title: string;
    content: string;
    type: string;
    status: string;
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const offlineContent = {
      ...content,
      lastModified: Date.now(),
      synced: false,
    };

    await this.db.put('content', offlineContent);
  }

  // Get offline content
  public async getOfflineContent(): Promise<any[]> {
    if (!this.db) return [];

    const content = await this.db.getAll('content');
    return content.filter(item => !item.synced);
  }

  // Store analytics offline
  public async storeAnalyticsOffline(event: string, data: Record<string, any>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const analyticsEntry = {
      id: `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event,
      data,
      timestamp: Date.now(),
      synced: false,
    };

    await this.db.add('analytics', analyticsEntry);
  }

  // Store settings offline
  public async storeSettingOffline(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const setting = {
      key,
      value,
      lastModified: Date.now(),
    };

    await this.db.put('settings', setting);
  }

  // Get setting offline
  public async getSettingOffline(key: string): Promise<any> {
    if (!this.db) return null;

    const setting = await this.db.get('settings', key);
    return setting?.value || null;
  }

  // Sync offline data when online
  public async syncOfflineData(): Promise<void> {
    if (!this.isOnline || !this.db) return;

    try {
      // Sync offline actions
      await this.syncOfflineActions();
      
      // Sync offline content
      await this.syncOfflineContent();
      
      // Sync offline analytics
      await this.syncOfflineAnalytics();
      
      console.log('Offline data synced successfully');
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  }

  private async syncOfflineActions(): Promise<void> {
    if (!this.db) return;

    const actions = await this.db.getAll('actions');
    
    for (const action of actions) {
      try {
        const response = await fetch(action.endpoint, {
          method: action.method,
          headers: action.headers,
          body: action.body,
        });

        if (response.ok) {
          await this.db.delete('actions', action.id);
          this.syncQueue.delete(action.id);
        } else {
          // Increment retry count
          action.retryCount++;
          if (action.retryCount < 3) {
            await this.db.put('actions', action);
          } else {
            // Remove after 3 failed attempts
            await this.db.delete('actions', action.id);
            this.syncQueue.delete(action.id);
          }
        }
      } catch (error) {
        console.error('Failed to sync action:', action.id, error);
        
        // Increment retry count
        action.retryCount++;
        if (action.retryCount < 3) {
          await this.db.put('actions', action);
        } else {
          await this.db.delete('actions', action.id);
          this.syncQueue.delete(action.id);
        }
      }
    }
  }

  private async syncOfflineContent(): Promise<void> {
    if (!this.db) return;

    const unsyncedContent = await (this.db as any).getAllFromIndex('content', 'synced', false);
    
    for (const content of unsyncedContent) {
      try {
        const response = await fetch('/api/v1/content/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(content),
        });

        if (response.ok) {
          content.synced = true;
          await this.db.put('content', content);
        }
      } catch (error) {
        console.error('Failed to sync content:', content.id, error);
      }
    }
  }

  private async syncOfflineAnalytics(): Promise<void> {
    if (!this.db) return;

    const unsyncedAnalytics = await (this.db as any).getAllFromIndex('analytics', 'synced', false);
    
    if (unsyncedAnalytics.length > 0) {
      try {
        const response = await fetch('/api/v1/analytics/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(unsyncedAnalytics),
        });

        if (response.ok) {
          // Mark as synced
          for (const analytics of unsyncedAnalytics) {
            analytics.synced = true;
            await this.db.put('analytics', analytics);
          }
        }
      } catch (error) {
        console.error('Failed to sync analytics:', error);
      }
    }
  }

  // Handle conflict resolution
  public async resolveConflict(
    localData: any,
    serverData: any,
    strategy: 'local' | 'server' | 'merge' = 'server'
  ): Promise<any> {
    switch (strategy) {
      case 'local':
        return localData;
      case 'server':
        return serverData;
      case 'merge':
        return {
          ...serverData,
          ...localData,
          lastModified: Math.max(localData.lastModified || 0, serverData.lastModified || 0),
        };
      default:
        return serverData;
    }
  }

  // Clear offline data
  public async clearOfflineData(): Promise<void> {
    if (!this.db) return;

    await this.db.clear('actions');
    await this.db.clear('content');
    await this.db.clear('analytics');
    this.syncQueue.clear();
  }

  // Get sync status
  public getSyncStatus(): {
    pendingActions: number;
    isOnline: boolean;
    lastSync: number | null;
  } {
    return {
      pendingActions: this.syncQueue.size,
      isOnline: this.isOnline,
      lastSync: parseInt(localStorage.getItem('lastSync') || '0') || null,
    };
  }
}

export const offlineService = new OfflineService();