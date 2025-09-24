// Enhanced Offline Data Service with Intelligent Sync
export interface OfflineContent {
  id: string;
  type: 'draft' | 'published' | 'scheduled';
  title: string;
  content: string;
  metadata: any;
  lastModified: number;
  syncStatus: 'pending' | 'synced' | 'conflict';
  version: number;
}

export interface OfflineAnalytics {
  id: string;
  event: string;
  data: any;
  timestamp: number;
  batchId?: string;
}

export interface SyncTask {
  id: string;
  type: 'content' | 'analytics' | 'media' | 'settings';
  priority: 'high' | 'medium' | 'low';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

class OfflineDataService {
  private dbName = 'AIContentAutomationDB';
  private dbVersion = 2;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initializeDB();
  }

  // Initialize IndexedDB
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createObjectStores(db);
      };
    });
  }

  // Create object stores
  private createObjectStores(db: IDBDatabase): void {
    // Offline content store
    if (!db.objectStoreNames.contains('offlineContent')) {
      const contentStore = db.createObjectStore('offlineContent', { keyPath: 'id' });
      contentStore.createIndex('lastModified', 'lastModified', { unique: false });
      contentStore.createIndex('syncStatus', 'syncStatus', { unique: false });
      contentStore.createIndex('type', 'type', { unique: false });
    }

    // Offline analytics store
    if (!db.objectStoreNames.contains('offlineAnalytics')) {
      const analyticsStore = db.createObjectStore('offlineAnalytics', { 
        keyPath: 'id', 
        autoIncrement: true 
      });
      analyticsStore.createIndex('timestamp', 'timestamp', { unique: false });
      analyticsStore.createIndex('batchId', 'batchId', { unique: false });
    }

    // Sync tasks store
    if (!db.objectStoreNames.contains('syncTasks')) {
      const syncStore = db.createObjectStore('syncTasks', { keyPath: 'id' });
      syncStore.createIndex('priority', 'priority', { unique: false });
      syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      syncStore.createIndex('type', 'type', { unique: false });
    }

    // Cache metadata store
    if (!db.objectStoreNames.contains('cacheMetadata')) {
      const metaStore = db.createObjectStore('cacheMetadata', { keyPath: 'key' });
      metaStore.createIndex('expiry', 'expiry', { unique: false });
    }

    // Performance metrics store
    if (!db.objectStoreNames.contains('performanceMetrics')) {
      const perfStore = db.createObjectStore('performanceMetrics', { 
        keyPath: 'id', 
        autoIncrement: true 
      });
      perfStore.createIndex('timestamp', 'timestamp', { unique: false });
    }
  }

  // Ensure DB is ready
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initializeDB();
    }
    return this.db!;
  }

  // Content operations
  async saveOfflineContent(content: OfflineContent): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['offlineContent'], 'readwrite');
    const store = transaction.objectStore('offlineContent');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(content);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getOfflineContent(id: string): Promise<OfflineContent | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['offlineContent'], 'readonly');
    const store = transaction.objectStore('offlineContent');
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllOfflineContent(): Promise<OfflineContent[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['offlineContent'], 'readonly');
    const store = transaction.objectStore('offlineContent');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteOfflineContent(id: string): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['offlineContent'], 'readwrite');
    const store = transaction.objectStore('offlineContent');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateSyncedContent(id: string, serverData: any): Promise<void> {
    const content = await this.getOfflineContent(id);
    if (content) {
      content.syncStatus = 'synced';
      content.version = serverData.version || content.version;
      await this.saveOfflineContent(content);
    }
  }

  // Analytics operations
  async saveOfflineAnalytics(analytics: OfflineAnalytics): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['offlineAnalytics'], 'readwrite');
    const store = transaction.objectStore('offlineAnalytics');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.add(analytics);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getOfflineAnalytics(limit?: number): Promise<OfflineAnalytics[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['offlineAnalytics'], 'readonly');
    const store = transaction.objectStore('offlineAnalytics');
    const index = store.index('timestamp');
    
    return new Promise((resolve, reject) => {
      const request = limit ? index.getAll(null, limit) : index.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncedAnalytics(batchId: string): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['offlineAnalytics'], 'readwrite');
    const store = transaction.objectStore('offlineAnalytics');
    const index = store.index('batchId');
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.only(batchId));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Sync tasks operations
  async savePendingSyncTasks(tasks: SyncTask[]): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['syncTasks'], 'readwrite');
    const store = transaction.objectStore('syncTasks');
    
    // Clear existing tasks first
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });
    
    // Add new tasks
    for (const task of tasks) {
      await new Promise<void>((resolve, reject) => {
        const request = store.add(task);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  async getPendingSyncTasks(): Promise<SyncTask[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['syncTasks'], 'readonly');
    const store = transaction.objectStore('syncTasks');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Cache operations with TTL
  async setCacheData(key: string, data: any, ttl: number): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['cacheMetadata'], 'readwrite');
    const store = transaction.objectStore('cacheMetadata');
    
    const cacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    };
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(cacheEntry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCacheData(key: string): Promise<any | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['cacheMetadata'], 'readonly');
    const store = transaction.objectStore('cacheMetadata');
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.expiry > Date.now()) {
          resolve(result.data);
        } else {
          if (result) {
            // Clean up expired entry
            this.deleteCacheData(key);
          }
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCacheData(key: string): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['cacheMetadata'], 'readwrite');
    const store = transaction.objectStore('cacheMetadata');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Clean up expired cache entries
  async cleanupExpiredCache(): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['cacheMetadata'], 'readwrite');
    const store = transaction.objectStore('cacheMetadata');
    const index = store.index('expiry');
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.upperBound(Date.now()));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Performance metrics
  async savePerformanceMetric(metric: any): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['performanceMetrics'], 'readwrite');
    const store = transaction.objectStore('performanceMetrics');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.add({
        ...metric,
        timestamp: Date.now()
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPerformanceMetrics(limit: number = 100): Promise<any[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['performanceMetrics'], 'readonly');
    const store = transaction.objectStore('performanceMetrics');
    const index = store.index('timestamp');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(null, limit);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Media operations
  async updateSyncedMedia(tempId: string, serverData: any): Promise<void> {
    // Update any references to the temporary media ID with the server ID
    const contents = await this.getAllOfflineContent();
    
    for (const content of contents) {
      if (content.content.includes(tempId)) {
        content.content = content.content.replace(tempId, serverData.id);
        content.lastModified = Date.now();
        await this.saveOfflineContent(content);
      }
    }
  }

  // Database maintenance
  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    
    return { used: 0, quota: 0 };
  }

  async clearAllData(): Promise<void> {
    const db = await this.ensureDB();
    const storeNames = ['offlineContent', 'offlineAnalytics', 'syncTasks', 'cacheMetadata', 'performanceMetrics'];
    
    for (const storeName of storeNames) {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  // Export data for backup
  async exportData(): Promise<any> {
    const data = {
      content: await this.getAllOfflineContent(),
      analytics: await this.getOfflineAnalytics(),
      syncTasks: await this.getPendingSyncTasks(),
      performanceMetrics: await this.getPerformanceMetrics(),
      timestamp: Date.now()
    };
    
    return data;
  }

  // Import data from backup
  async importData(data: any): Promise<void> {
    if (data.content) {
      for (const content of data.content) {
        await this.saveOfflineContent(content);
      }
    }
    
    if (data.analytics) {
      for (const analytics of data.analytics) {
        await this.saveOfflineAnalytics(analytics);
      }
    }
    
    if (data.syncTasks) {
      await this.savePendingSyncTasks(data.syncTasks);
    }
  }
}

export const offlineDataService = new OfflineDataService();