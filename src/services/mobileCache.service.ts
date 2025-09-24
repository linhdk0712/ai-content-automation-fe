export interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  expiresAt?: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
  priority: CachePriority;
  tags: string[];
}

export enum CachePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

export interface CacheConfig {
  maxSize: number; // in bytes
  maxEntries: number;
  defaultTTL: number; // in milliseconds
  cleanupInterval: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  persistToDisk: boolean;
}

export interface CacheStatistics {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  compressionRatio: number;
  averageAccessTime: number;
}

export interface CacheStrategy {
  type: 'LRU' | 'LFU' | 'FIFO' | 'TTL' | 'PRIORITY';
  maxAge?: number;
  maxSize?: number;
  priority?: CachePriority;
}

export class MobileCacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private statistics: CacheStatistics;
  private cleanupTimer?: NodeJS.Timeout;
  private accessTimes: Map<string, number[]> = new Map();
  private compressionWorker?: Worker;
  private encryptionKey?: CryptoKey;

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...this.getDefaultConfig(), ...config };
    this.statistics = this.initializeStatistics();
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Load persisted cache if enabled
    if (this.config.persistToDisk) {
      await this.loadPersistedCache();
    }

    // Initialize compression worker
    if (this.config.compressionEnabled) {
      this.initializeCompressionWorker();
    }

    // Initialize encryption
    if (this.config.encryptionEnabled) {
      await this.initializeEncryption();
    }

    // Start cleanup timer
    this.startCleanupTimer();
  }

  // Core Cache Operations
  async set(
    key: string,
    data: any,
    options?: {
      ttl?: number;
      priority?: CachePriority;
      tags?: string[];
      compress?: boolean;
      encrypt?: boolean;
    }
  ): Promise<void> {
    const now = Date.now();
    const ttl = options?.ttl || this.config.defaultTTL;
    const expiresAt = ttl > 0 ? now + ttl : undefined;
    
    let processedData = data;
    let size = this.calculateSize(data);

    // Compress data if enabled
    if ((options?.compress ?? this.config.compressionEnabled) && size > 1024) {
      processedData = await this.compressData(processedData);
      size = this.calculateSize(processedData);
    }

    // Encrypt data if enabled
    if ((options?.encrypt ?? this.config.encryptionEnabled) && this.encryptionKey) {
      processedData = await this.encryptData(processedData);
      size = this.calculateSize(processedData);
    }

    const entry: CacheEntry = {
      key,
      data: processedData,
      timestamp: now,
      expiresAt,
      size,
      accessCount: 0,
      lastAccessed: now,
      priority: options?.priority || CachePriority.NORMAL,
      tags: options?.tags || []
    };

    // Check if we need to evict entries
    await this.ensureCapacity(size);

    // Store the entry
    this.cache.set(key, entry);
    this.updateStatistics('set', size);

    // Persist to disk if enabled
    if (this.config.persistToDisk) {
      await this.persistEntry(entry);
    }
  }

  async get(key: string): Promise<any | null> {
    const startTime = performance.now();
    const entry = this.cache.get(key);

    if (!entry) {
      this.updateStatistics('miss');
      return null;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.updateStatistics('miss');
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.recordAccessTime(key, performance.now() - startTime);

    let data = entry.data;

    // Decrypt data if needed
    if (this.config.encryptionEnabled && this.encryptionKey) {
      try {
        data = await this.decryptData(data);
      } catch (error) {
        console.warn('Failed to decrypt cache entry:', error);
        this.cache.delete(key);
        return null;
      }
    }

    // Decompress data if needed
    if (this.config.compressionEnabled) {
      try {
        data = await this.decompressData(data);
      } catch (error) {
        console.warn('Failed to decompress cache entry:', error);
        // Return compressed data as fallback
      }
    }

    this.updateStatistics('hit');
    return data;
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.updateStatistics('delete', -entry.size);
      
      if (this.config.persistToDisk) {
        await this.deletePersistedEntry(key);
      }
      
      return true;
    }
    return false;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.statistics = this.initializeStatistics();
    
    if (this.config.persistToDisk) {
      await this.clearPersistedCache();
    }
  }

  // Advanced Operations
  async getMultiple(keys: string[]): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    
    await Promise.all(
      keys.map(async (key) => {
        const value = await this.get(key);
        if (value !== null) {
          results.set(key, value);
        }
      })
    );
    
    return results;
  }

  async setMultiple(entries: Array<{ key: string; data: any; options?: any }>): Promise<void> {
    await Promise.all(
      entries.map(({ key, data, options }) => this.set(key, data, options))
    );
  }

  async deleteMultiple(keys: string[]): Promise<number> {
    let deletedCount = 0;
    
    await Promise.all(
      keys.map(async (key) => {
        if (await this.delete(key)) {
          deletedCount++;
        }
      })
    );
    
    return deletedCount;
  }

  // Tag-based Operations
  async getByTag(tag: string): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        const value = await this.get(key);
        if (value !== null) {
          results.set(key, value);
        }
      }
    }
    
    return results;
  }

  async deleteByTag(tag: string): Promise<number> {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        keysToDelete.push(key);
      }
    }
    
    return this.deleteMultiple(keysToDelete);
  }

  async invalidateByTag(tag: string): Promise<void> {
    await this.deleteByTag(tag);
  }

  // Cache Management
  private async ensureCapacity(newEntrySize: number): Promise<void> {
    const currentSize = this.getCurrentSize();
    const currentEntries = this.cache.size;

    // Check size limit
    if (currentSize + newEntrySize > this.config.maxSize) {
      await this.evictBySize(currentSize + newEntrySize - this.config.maxSize);
    }

    // Check entry limit
    if (currentEntries >= this.config.maxEntries) {
      await this.evictByCount(currentEntries - this.config.maxEntries + 1);
    }
  }

  private async evictBySize(bytesToEvict: number): Promise<void> {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, entry }))
      .sort(this.getEvictionComparator());

    let evictedBytes = 0;
    const keysToEvict: string[] = [];

    for (const { key, entry } of entries) {
      keysToEvict.push(key);
      evictedBytes += entry.size;
      
      if (evictedBytes >= bytesToEvict) {
        break;
      }
    }

    await this.deleteMultiple(keysToEvict);
    this.statistics.evictionCount += keysToEvict.length;
  }

  private async evictByCount(entriesToEvict: number): Promise<void> {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, entry }))
      .sort(this.getEvictionComparator());

    const keysToEvict = entries
      .slice(0, entriesToEvict)
      .map(({ key }) => key);

    await this.deleteMultiple(keysToEvict);
    this.statistics.evictionCount += keysToEvict.length;
  }

  private getEvictionComparator(): (a: any, b: any) => number {
    // LRU strategy by default
    return (a, b) => {
      // First, prioritize by priority level
      if (a.entry.priority !== b.entry.priority) {
        return a.entry.priority - b.entry.priority;
      }
      
      // Then by last accessed time (LRU)
      return a.entry.lastAccessed - b.entry.lastAccessed;
    };
  }

  // Cleanup Operations
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private async cleanup(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Find expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    // Remove expired entries
    await this.deleteMultiple(expiredKeys);

    // Persist statistics
    if (this.config.persistToDisk) {
      await this.persistStatistics();
    }
  }

  // Compression
  private initializeCompressionWorker(): void {
    if ('Worker' in window) {
      try {
        this.compressionWorker = new Worker('/workers/compression-worker.js');
      } catch (error) {
        console.warn('Failed to initialize compression worker:', error);
      }
    }
  }

  private async compressData(data: any): Promise<any> {
    if (!this.compressionWorker) {
      return data; // Return uncompressed if worker not available
    }

    return new Promise((resolve, reject) => {
      const messageId = Date.now().toString();
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data.id === messageId) {
          this.compressionWorker!.removeEventListener('message', handleMessage);
          
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        }
      };

      this.compressionWorker!.addEventListener('message', handleMessage);
      this.compressionWorker!.postMessage({
        id: messageId,
        type: 'compress',
        data
      });
    });
  }

  private async decompressData(data: any): Promise<any> {
    if (!this.compressionWorker) {
      return data; // Return as-is if worker not available
    }

    return new Promise((resolve, reject) => {
      const messageId = Date.now().toString();
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data.id === messageId) {
          this.compressionWorker!.removeEventListener('message', handleMessage);
          
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        }
      };

      this.compressionWorker!.addEventListener('message', handleMessage);
      this.compressionWorker!.postMessage({
        id: messageId,
        type: 'decompress',
        data
      });
    });
  }

  // Encryption
  private async initializeEncryption(): Promise<void> {
    if ('crypto' in window && 'subtle' in window.crypto) {
      try {
        // Generate or retrieve encryption key
        const keyData = localStorage.getItem('cacheEncryptionKey');
        
        if (keyData) {
          const keyBuffer = this.base64ToArrayBuffer(keyData);
          this.encryptionKey = await window.crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
          );
        } else {
          this.encryptionKey = await window.crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
          );
          
          const keyBuffer = await window.crypto.subtle.exportKey('raw', this.encryptionKey);
          localStorage.setItem('cacheEncryptionKey', this.arrayBufferToBase64(keyBuffer));
        }
      } catch (error) {
        console.warn('Failed to initialize encryption:', error);
        this.config.encryptionEnabled = false;
      }
    } else {
      console.warn('Web Crypto API not supported, disabling encryption');
      this.config.encryptionEnabled = false;
    }
  }

  private async encryptData(data: any): Promise<any> {
    if (!this.encryptionKey) {
      return data;
    }

    try {
      const dataString = JSON.stringify(data);
      const dataBuffer = new TextEncoder().encode(dataString);
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv.buffer },
        this.encryptionKey,
        dataBuffer
      );

      return {
        encrypted: true,
        iv: this.arrayBufferToBase64(iv.buffer),
        data: this.arrayBufferToBase64(encryptedBuffer)
      };
    } catch (error) {
      console.warn('Encryption failed:', error);
      return data;
    }
  }

  private async decryptData(encryptedData: any): Promise<any> {
    if (!encryptedData.encrypted || !this.encryptionKey) {
      return encryptedData;
    }

    try {
      const iv = this.base64ToArrayBuffer(encryptedData.iv);
      const dataBuffer = this.base64ToArrayBuffer(encryptedData.data);
      
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        dataBuffer
      );

      const dataString = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(dataString);
    } catch (error) {
      console.warn('Decryption failed:', error);
      throw error;
    }
  }

  // Persistence
  private async loadPersistedCache(): Promise<void> {
    if ('indexedDB' in window) {
      try {
        // Implementation would load from IndexedDB
        // For now, just load from localStorage as fallback
        const cached = localStorage.getItem('mobileCache');
        if (cached) {
          const entries = JSON.parse(cached);
          entries.forEach((entry: CacheEntry) => {
            this.cache.set(entry.key, entry);
          });
        }
      } catch (error) {
        console.warn('Failed to load persisted cache:', error);
      }
    }
  }

  private async persistEntry(__entry: CacheEntry): Promise<void> {
    // Implementation would persist to IndexedDB
    // For now, just use localStorage as fallback
    try {
      const entries = Array.from(this.cache.values());
      localStorage.setItem('mobileCache', JSON.stringify(entries));
    } catch (error) {
      console.warn('Failed to persist cache entry:', error);
    }
  }

  private async deletePersistedEntry(_key: string): Promise<void> {
    // Implementation would delete from IndexedDB
    try {
      const entries = Array.from(this.cache.values());
      localStorage.setItem('mobileCache', JSON.stringify(entries));
    } catch (error) {
      console.warn('Failed to delete persisted entry:', error);
    }
  }

  private async clearPersistedCache(): Promise<void> {
    try {
      localStorage.removeItem('mobileCache');
    } catch (error) {
      console.warn('Failed to clear persisted cache:', error);
    }
  }

  private async persistStatistics(): Promise<void> {
    try {
      localStorage.setItem('mobileCacheStats', JSON.stringify(this.statistics));
    } catch (error) {
      console.warn('Failed to persist statistics:', error);
    }
  }

  // Statistics
  private initializeStatistics(): CacheStatistics {
    const stored = localStorage.getItem('mobileCacheStats');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.warn('Failed to load cached statistics:', error);
      }
    }

    return {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      evictionCount: 0,
      compressionRatio: 0,
      averageAccessTime: 0
    };
  }

  private updateStatistics(operation: string, sizeChange?: number): void {
    switch (operation) {
      case 'set':
        this.statistics.totalEntries = this.cache.size;
        if (sizeChange) {
          this.statistics.totalSize += sizeChange;
        }
        break;
      case 'delete':
        this.statistics.totalEntries = this.cache.size;
        if (sizeChange) {
          this.statistics.totalSize += sizeChange;
        }
        break;
      case 'hit':
        this.updateHitRate(true);
        break;
      case 'miss':
        this.updateHitRate(false);
        break;
    }
  }

  private updateHitRate(isHit: boolean): void {
    const totalRequests = this.statistics.hitRate + this.statistics.missRate + 1;
    
    if (isHit) {
      this.statistics.hitRate = (this.statistics.hitRate + 1) / totalRequests;
      this.statistics.missRate = this.statistics.missRate / totalRequests;
    } else {
      this.statistics.hitRate = this.statistics.hitRate / totalRequests;
      this.statistics.missRate = (this.statistics.missRate + 1) / totalRequests;
    }
  }

  private recordAccessTime(key: string, accessTime: number): void {
    if (!this.accessTimes.has(key)) {
      this.accessTimes.set(key, []);
    }
    
    const times = this.accessTimes.get(key)!;
    times.push(accessTime);
    
    // Keep only last 10 access times
    if (times.length > 10) {
      times.shift();
    }
    
    // Update average access time
    const allTimes = Array.from(this.accessTimes.values()).flat();
    this.statistics.averageAccessTime = allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length;
  }

  // Utility Methods
  private getCurrentSize(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }

  private calculateSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  private getDefaultConfig(): CacheConfig {
    return {
      maxSize: 50 * 1024 * 1024, // 50MB
      maxEntries: 1000,
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      compressionEnabled: true,
      encryptionEnabled: false,
      persistToDisk: true
    };
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Public API
  getStatistics(): CacheStatistics {
    return { ...this.statistics };
  }

  getConfig(): CacheConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  // Cleanup
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
    }
    
    this.cache.clear();
  }
}