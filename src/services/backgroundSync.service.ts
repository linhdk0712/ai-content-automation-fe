// Enhanced Background Sync Service for PWA
import { offlineDataService } from './offlineData.service';

export interface SyncStatus {
  pendingTasks: number;
  isProcessing: boolean;
  lastSyncTime?: number;
  nextSyncTime?: number;
  failedTasks: number;
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

class BackgroundSyncService {
  private syncStatus: SyncStatus = {
    pendingTasks: 0,
    isProcessing: false,
    failedTasks: 0
  };

  private syncQueue: SyncTask[] = [];
  private isOnline = navigator.onLine;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: ((status: SyncStatus) => void)[] = [];

  constructor() {
    this.initializeSync();
    this.setupEventListeners();
  }

  private initializeSync() {
    // Load pending tasks from IndexedDB
    this.loadPendingTasks();
    
    // Setup periodic sync check
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncStatus.isProcessing) {
        this.processSyncQueue();
      }
    }, 30000); // Check every 30 seconds

    // Register service worker sync events
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        // Register background sync
        (registration as any).sync?.register('background-sync');
      });
    }
  }

  private setupEventListeners() {
    // Online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateSyncStatus({ isProcessing: false });
    });

    // Service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_COMPLETE') {
          this.handleSyncComplete(event.data);
        } else if (event.data.type === 'SYNC_FAILED') {
          this.handleSyncFailed(event.data);
        }
      });
    }

    // Page visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.processSyncQueue();
      }
    });
  }

  // Add task to sync queue
  async addSyncTask(task: Omit<SyncTask, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const syncTask: SyncTask = {
      ...task,
      id: this.generateTaskId(),
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: task.maxRetries || 3
    };

    this.syncQueue.push(syncTask);
    await this.savePendingTasks();
    
    this.updateSyncStatus({
      pendingTasks: this.syncQueue.length
    });

    // Try to sync immediately if online
    if (this.isOnline && !this.syncStatus.isProcessing) {
      this.processSyncQueue();
    }

    return syncTask.id;
  }

  // Process sync queue
  private async processSyncQueue() {
    if (!this.isOnline || this.syncStatus.isProcessing || this.syncQueue.length === 0) {
      return;
    }

    this.updateSyncStatus({ isProcessing: true });

    try {
      // Sort by priority and timestamp
      const sortedTasks = this.syncQueue.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
      });

      // Process tasks in batches
      const batchSize = 5;
      const batch = sortedTasks.slice(0, batchSize);

      const results = await Promise.allSettled(
        batch.map(task => this.processSyncTask(task))
      );

      // Handle results
      let successCount = 0;
      let failureCount = 0;

      results.forEach((result, index) => {
        const task = batch[index];
        
        if (result.status === 'fulfilled') {
          // Remove successful task from queue
          this.syncQueue = this.syncQueue.filter(t => t.id !== task.id);
          successCount++;
        } else {
          // Handle failed task
          task.retryCount++;
          if (task.retryCount >= task.maxRetries) {
            // Remove permanently failed task
            this.syncQueue = this.syncQueue.filter(t => t.id !== task.id);
            failureCount++;
          }
        }
      });

      await this.savePendingTasks();
      
      this.updateSyncStatus({
        pendingTasks: this.syncQueue.length,
        lastSyncTime: Date.now(),
        failedTasks: this.syncStatus.failedTasks + failureCount
      });

      console.log(`Sync batch complete: ${successCount} success, ${failureCount} failed`);

      // Continue processing if there are more tasks
      if (this.syncQueue.length > 0) {
        setTimeout(() => this.processSyncQueue(), 1000);
      }

    } catch (error) {
      console.error('Sync queue processing failed:', error);
    } finally {
      this.updateSyncStatus({ isProcessing: false });
    }
  }

  // Process individual sync task
  private async processSyncTask(task: SyncTask): Promise<void> {
    console.log(`Processing sync task: ${task.type} (${task.priority})`);

    switch (task.type) {
      case 'content':
        return this.syncContent(task);
      case 'analytics':
        return this.syncAnalytics(task);
      case 'media':
        return this.syncMedia(task);
      case 'settings':
        return this.syncSettings(task);
      default:
        throw new Error(`Unknown sync task type: ${task.type}`);
    }
  }

  // Sync content data
  private async syncContent(task: SyncTask): Promise<void> {
    const { data } = task;
    
    const response = await fetch('/api/v1/content/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Content sync failed: ${response.statusText}`);
    }

    // Update local storage with synced data
    const result = await response.json();
    await offlineDataService.updateSyncedContent(data.id, result);
  }

  // Sync analytics data
  private async syncAnalytics(task: SyncTask): Promise<void> {
    const { data } = task;
    
    const response = await fetch('/api/v1/analytics/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Analytics sync failed: ${response.statusText}`);
    }

    // Clear synced analytics data
    await offlineDataService.clearSyncedAnalytics(data.batchId);
  }

  // Sync media files
  private async syncMedia(task: SyncTask): Promise<void> {
    const { data } = task;
    
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('metadata', JSON.stringify(data.metadata));

    const response = await fetch('/api/v1/media/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Media sync failed: ${response.statusText}`);
    }

    const result = await response.json();
    await offlineDataService.updateSyncedMedia(data.tempId, result);
  }

  // Sync settings
  private async syncSettings(task: SyncTask): Promise<void> {
    const { data } = task;
    
    const response = await fetch('/api/v1/user/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Settings sync failed: ${response.statusText}`);
    }
  }

  // Force sync now
  async forceSyncNow(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    await this.processSyncQueue();
  }

  // Get sync status
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Subscribe to sync status updates
  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Update sync status and notify listeners
  private updateSyncStatus(updates: Partial<SyncStatus>) {
    this.syncStatus = { ...this.syncStatus, ...updates };
    this.listeners.forEach(listener => listener(this.syncStatus));
  }

  // Generate unique task ID
  private generateTaskId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load pending tasks from storage
  private async loadPendingTasks() {
    try {
      const tasks = await offlineDataService.getPendingSyncTasks();
      this.syncQueue = tasks;
      this.updateSyncStatus({ pendingTasks: tasks.length });
    } catch (error) {
      console.error('Failed to load pending sync tasks:', error);
    }
  }

  // Save pending tasks to storage
  private async savePendingTasks() {
    try {
      await offlineDataService.savePendingSyncTasks(this.syncQueue);
    } catch (error) {
      console.error('Failed to save pending sync tasks:', error);
    }
  }

  // Handle sync completion from service worker
  private handleSyncComplete(data: any) {
    console.log('Sync completed:', data);
    this.updateSyncStatus({
      lastSyncTime: Date.now(),
      pendingTasks: Math.max(0, this.syncStatus.pendingTasks - 1)
    });
  }

  // Handle sync failure from service worker
  private handleSyncFailed(data: any) {
    console.error('Sync failed:', data);
    this.updateSyncStatus({
      failedTasks: this.syncStatus.failedTasks + 1
    });
  }

  // Cleanup
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.listeners = [];
  }
}

export const backgroundSyncService = new BackgroundSyncService();