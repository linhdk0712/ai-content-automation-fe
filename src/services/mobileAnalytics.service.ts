export interface AnalyticsEvent {
  id: string;
  type: EventType;
  name: string;
  properties: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
  deviceInfo: DeviceInfo;
  networkInfo: NetworkInfo;
  performanceInfo?: PerformanceInfo;
  synced: boolean;
}

export enum EventType {
  PAGE_VIEW = 'page_view',
  USER_ACTION = 'user_action',
  PERFORMANCE = 'performance',
  ERROR = 'error',
  CUSTOM = 'custom',
  ENGAGEMENT = 'engagement',
  CONVERSION = 'conversion'
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  orientation: 'portrait' | 'landscape';
  touchSupport: boolean;
  language: string;
  timezone: string;
}

export interface NetworkInfo {
  type: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  isOnline: boolean;
}

export interface PerformanceInfo {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  memoryUsage?: number;
  batteryLevel?: number;
}

export interface SessionInfo {
  id: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  pageViews: number;
  events: number;
  isActive: boolean;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface AnalyticsConfig {
  enabled: boolean;
  batchSize: number;
  batchTimeout: number;
  maxRetries: number;
  offlineStorage: boolean;
  performanceTracking: boolean;
  errorTracking: boolean;
  userTracking: boolean;
  sessionTimeout: number;
  samplingRate: number;
}

export interface OfflineBatch {
  id: string;
  events: AnalyticsEvent[];
  timestamp: number;
  retryCount: number;
  size: number;
}

export interface AnalyticsMetrics {
  totalEvents: number;
  syncedEvents: number;
  pendingEvents: number;
  failedEvents: number;
  batchesSent: number;
  averageBatchSize: number;
  syncSuccessRate: number;
  lastSyncTime: number;
}

export class MobileAnalyticsService {
  private config: AnalyticsConfig;
  private currentSession: SessionInfo;
  private eventQueue: AnalyticsEvent[] = [];
  private sessionTimer?: NodeJS.Timeout;
  private performanceObserver?: PerformanceObserver;
  private isInitialized = false;
  private metrics: AnalyticsMetrics;

  // Event callbacks
  private eventCallbacks: ((event: AnalyticsEvent) => void)[] = [];
  private batchCallbacks: ((batch: OfflineBatch) => void)[] = [];
  private errorCallbacks: ((error: Error) => void)[] = [];
  batchTimer: any;

  constructor(config?: Partial<AnalyticsConfig>) {
    this.config = { ...this.getDefaultConfig(), ...config };
    this.currentSession = this.createSession();
    this.metrics = this.initializeMetrics();
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load offline data
      if (this.config.offlineStorage) {
        await this.loadOfflineData();
      }

      // Setup performance tracking
      if (this.config.performanceTracking) {
        this.setupPerformanceTracking();
      }

      // Setup error tracking
      if (this.config.errorTracking) {
        this.setupErrorTracking();
      }

      // Setup session management
      this.setupSessionManagement();

      // Setup batch processing
      this.setupBatchProcessing();

      // Setup network monitoring
      this.setupNetworkMonitoring();

      // Track initial page view
      this.trackPageView();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize mobile analytics:', error);
      this.notifyErrorCallbacks(error as Error);
    }
  }

  // Event Tracking
  track(
    eventName: string,
    properties?: Record<string, any>,
    type: EventType = EventType.CUSTOM
  ): void {
    if (!this.config.enabled) return;

    // Apply sampling
    if (Math.random() > this.config.samplingRate) return;

    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      type,
      name: eventName,
      properties: properties || {},
      timestamp: Date.now(),
      sessionId: this.currentSession.id,
      userId: this.getCurrentUserId(),
      deviceInfo: this.getDeviceInfo(),
      networkInfo: this.getNetworkInfo(),
      synced: false
    };

    // Add performance info for certain events
    if (this.config.performanceTracking && this.shouldIncludePerformance(type)) {
      event.performanceInfo = this.getPerformanceInfo();
    }

    this.addEvent(event);
  }

  trackPageView(page?: string, title?: string): void {
    const properties = {
      page: page || window.location.pathname,
      title: title || document.title,
      referrer: document.referrer,
      url: window.location.href,
      search: window.location.search,
      hash: window.location.hash
    };

    // Extract UTM parameters
    const urlParams = new URLSearchParams(window.location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
      const value = urlParams.get(param);
      if (value) {
        properties[param as keyof typeof properties] = value;
      }
    });

    this.track('page_view', properties, EventType.PAGE_VIEW);
    this.currentSession.pageViews++;
  }

  trackUserAction(action: string, element?: string, properties?: Record<string, any>): void {
    const actionProperties = {
      action,
      element,
      ...properties
    };

    this.track('user_action', actionProperties, EventType.USER_ACTION);
  }

  trackEngagement(type: string, value?: number, properties?: Record<string, any>): void {
    const engagementProperties = {
      type,
      value,
      ...properties
    };

    this.track('engagement', engagementProperties, EventType.ENGAGEMENT);
  }

  trackConversion(event: string, value?: number, currency?: string, properties?: Record<string, any>): void {
    const conversionProperties = {
      event,
      value,
      currency,
      ...properties
    };

    this.track('conversion', conversionProperties, EventType.CONVERSION);
  }

  trackError(error: Error, context?: Record<string, any>): void {
    const errorProperties = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.track('error', errorProperties, EventType.ERROR);
  }

  // Performance Tracking
  private setupPerformanceTracking(): void {
    // Track Core Web Vitals
    this.trackCoreWebVitals();

    // Setup performance observer
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handlePerformanceEntry(entry);
        }
      });

      try {
        this.performanceObserver.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
      } catch (error) {
        console.warn('Performance observer setup failed:', error);
      }
    }

    // Track resource loading
    this.trackResourcePerformance();
  }

  private trackCoreWebVitals(): void {
    // First Contentful Paint
    this.whenMetricAvailable('first-contentful-paint', (value) => {
      this.track('performance_metric', { metric: 'fcp', value }, EventType.PERFORMANCE);
    });

    // Largest Contentful Paint
    this.whenMetricAvailable('largest-contentful-paint', (value) => {
      this.track('performance_metric', { metric: 'lcp', value }, EventType.PERFORMANCE);
    });

    // First Input Delay
    this.whenMetricAvailable('first-input-delay', (value) => {
      this.track('performance_metric', { metric: 'fid', value }, EventType.PERFORMANCE);
    });

    // Cumulative Layout Shift
    this.whenMetricAvailable('cumulative-layout-shift', (value) => {
      this.track('performance_metric', { metric: 'cls', value }, EventType.PERFORMANCE);
    });
  }

  private whenMetricAvailable(metricName: string, callback: (value: number) => void): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === metricName) {
            callback((entry as any).value || entry.startTime);
            observer.disconnect();
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
      } catch (error) {
        console.warn(`Failed to observe ${metricName}:`, error);
      }
    }
  }

  private handlePerformanceEntry(entry: PerformanceEntry): void {
    const properties = {
      name: entry.name,
      entryType: entry.entryType,
      startTime: entry.startTime,
      duration: entry.duration
    };

    // Add specific properties based on entry type
    if (entry.entryType === 'navigation') {
      const navEntry = entry as PerformanceNavigationTiming;
      Object.assign(properties, {
        domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
        loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
        transferSize: navEntry.transferSize,
        encodedBodySize: navEntry.encodedBodySize
      });
    }

    this.track('performance_entry', properties, EventType.PERFORMANCE);
  }

  private trackResourcePerformance(): void {
    // Track slow resources
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resourceEntry = entry as PerformanceResourceTiming;
        
        // Track resources that take longer than 1 second
        if (resourceEntry.duration > 1000) {
          this.track('slow_resource', {
            name: resourceEntry.name,
            duration: resourceEntry.duration,
            transferSize: resourceEntry.transferSize,
            initiatorType: resourceEntry.initiatorType
          }, EventType.PERFORMANCE);
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Resource performance tracking failed:', error);
    }
  }

  // Error Tracking
  private setupErrorTracking(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), {
        type: 'unhandled_promise_rejection'
      });
    });
  }

  // Session Management
  private setupSessionManagement(): void {
    // Update session activity
    ['click', 'scroll', 'keypress', 'mousemove', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        this.updateSessionActivity();
      }, { passive: true });
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseSession();
      } else {
        this.resumeSession();
      }
    });

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });

    // Start session timeout timer
    this.resetSessionTimer();
  }

  private createSession(): SessionInfo {
    const urlParams = new URLSearchParams(window.location.search);
    
    return {
      id: this.generateSessionId(),
      startTime: Date.now(),
      pageViews: 0,
      events: 0,
      isActive: true,
      referrer: document.referrer,
      utmSource: urlParams.get('utm_source') || undefined,
      utmMedium: urlParams.get('utm_medium') || undefined,
      utmCampaign: urlParams.get('utm_campaign') || undefined
    };
  }

  private updateSessionActivity(): void {
    this.currentSession.isActive = true;
    this.resetSessionTimer();
  }

  private resetSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    this.sessionTimer = setTimeout(() => {
      this.pauseSession();
    }, this.config.sessionTimeout);
  }

  private pauseSession(): void {
    this.currentSession.isActive = false;
  }

  private resumeSession(): void {
    if (!this.currentSession.isActive) {
      // If session was paused for too long, create a new session
      const pauseDuration = Date.now() - (this.currentSession.endTime || Date.now());
      if (pauseDuration > this.config.sessionTimeout) {
        this.endSession();
        this.currentSession = this.createSession();
      } else {
        this.currentSession.isActive = true;
        this.resetSessionTimer();
      }
    }
  }

  private endSession(): void {
    this.currentSession.endTime = Date.now();
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
    this.currentSession.isActive = false;

    // Track session end
    this.track('session_end', {
      duration: this.currentSession.duration,
      pageViews: this.currentSession.pageViews,
      events: this.currentSession.events
    }, EventType.ENGAGEMENT);

    // Force sync remaining events
    this.forceBatchSync();
  }

  // Batch Processing
  private setupBatchProcessing(): void {
  }

  private addEvent(event: AnalyticsEvent): void {
    this.eventQueue.push(event);
    this.currentSession.events++;
    this.metrics.totalEvents++;

    // Notify callbacks
    this.notifyEventCallbacks(event);

    // Process batch if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      this.processBatch();
    }
  }

  private async processBatch(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const batch: OfflineBatch = {
      id: this.generateBatchId(),
      events: [...this.eventQueue],
      timestamp: Date.now(),
      retryCount: 0,
      size: this.calculateBatchSize(this.eventQueue)
    };

    this.eventQueue = [];

    try {
      if (navigator.onLine) {
        await this.sendBatch(batch);
      } else {
        await this.storeBatchOffline(batch);
      }
    } catch (error) {
      console.error('Batch processing failed:', error);
      await this.storeBatchOffline(batch);
      this.notifyErrorCallbacks(error as Error);
    }
  }

  private async sendBatch(batch: OfflineBatch): Promise<void> {
    try {
      // This would normally send to your analytics endpoint
      const response = await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batch_id: batch.id,
          events: batch.events,
          timestamp: batch.timestamp
        })
      });

      if (response.ok) {
        // Mark events as synced
        batch.events.forEach(event => {
          event.synced = true;
          this.metrics.syncedEvents++;
        });

        this.metrics.batchesSent++;
        this.metrics.lastSyncTime = Date.now();
        this.updateSyncSuccessRate(true);
        
        this.notifyBatchCallbacks(batch);
      } else {
        throw new Error(`Batch sync failed: ${response.status}`);
      }
    } catch (error) {
      batch.retryCount++;
      
      if (batch.retryCount < this.config.maxRetries) {
        // Retry later
        setTimeout(() => {
          this.sendBatch(batch);
        }, Math.pow(2, batch.retryCount) * 1000);
      } else {
        // Store offline after max retries
        await this.storeBatchOffline(batch);
        this.updateSyncSuccessRate(false);
      }
      
      throw error;
    }
  }

  private async storeBatchOffline(batch: OfflineBatch): Promise<void> {
    if (!this.config.offlineStorage) return;

    try {
      // Store in IndexedDB or localStorage
      const stored = localStorage.getItem('analyticsOfflineBatches') || '[]';
      const batches = JSON.parse(stored);
      batches.push(batch);
      
      // Limit offline storage
      if (batches.length > 50) {
        batches.shift();
      }
      
      localStorage.setItem('analyticsOfflineBatches', JSON.stringify(batches));
      this.metrics.pendingEvents += batch.events.length;
    } catch (error) {
      console.error('Failed to store batch offline:', error);
      this.metrics.failedEvents += batch.events.length;
    }
  }

  private async loadOfflineData(): Promise<void> {
    try {
      const stored = localStorage.getItem('analyticsOfflineBatches');
      if (stored) {
        const batches: OfflineBatch[] = JSON.parse(stored);
        
        // Try to sync offline batches
        for (const batch of batches) {
          if (navigator.onLine) {
            try {
              await this.sendBatch(batch);
            } catch (error) {
              // Keep in offline storage
              continue;
            }
          }
        }
        
        // Remove synced batches
        const remainingBatches = batches.filter(batch => 
          batch.events.some(event => !event.synced)
        );
        
        localStorage.setItem('analyticsOfflineBatches', JSON.stringify(remainingBatches));
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  }

  private forceBatchSync(): void {
    if (this.eventQueue.length > 0) {
      this.processBatch();
    }
  }

  // Network Monitoring
  private setupNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      this.loadOfflineData();
    });

    window.addEventListener('offline', () => {
      // Events will be stored offline automatically
    });
  }

  // Data Collection Helpers
  private getDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenWidth: screen.width,
      screenHeight: screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      touchSupport: 'ontouchstart' in window,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  private getNetworkInfo(): NetworkInfo {
    const connection = (navigator as any).connection;
    
    return {
      type: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false,
      isOnline: navigator.onLine
    };
  }

  private getPerformanceInfo(): PerformanceInfo {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    const info: PerformanceInfo = {
      loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
      firstPaint: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0
    };

    // Get paint timings
    paint.forEach(entry => {
      if (entry.name === 'first-paint') {
        info.firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        info.firstContentfulPaint = entry.startTime;
      }
    });

    // Get memory usage if available
    if ('memory' in performance) {
      info.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }

    // Get battery level if available
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        info.batteryLevel = battery.level;
      });
    }

    return info;
  }

  // Utility Methods
  private shouldIncludePerformance(type: EventType): boolean {
    return type === EventType.PAGE_VIEW || type === EventType.PERFORMANCE;
  }

  private calculateBatchSize(events: AnalyticsEvent[]): number {
    return new Blob([JSON.stringify(events)]).size;
  }

  private updateSyncSuccessRate(success: boolean): void {
    const total = this.metrics.batchesSent + (success ? 0 : 1);
    const successful = success ? this.metrics.batchesSent : this.metrics.batchesSent - 1;
    this.metrics.syncSuccessRate = total > 0 ? (successful / total) * 100 : 0;
  }

  private initializeMetrics(): AnalyticsMetrics {
    return {
      totalEvents: 0,
      syncedEvents: 0,
      pendingEvents: 0,
      failedEvents: 0,
      batchesSent: 0,
      averageBatchSize: 0,
      syncSuccessRate: 0,
      lastSyncTime: 0
    };
  }

  private getDefaultConfig(): AnalyticsConfig {
    return {
      enabled: true,
      batchSize: 20,
      batchTimeout: 30000, // 30 seconds
      maxRetries: 3,
      offlineStorage: true,
      performanceTracking: true,
      errorTracking: true,
      userTracking: true,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      samplingRate: 1.0 // 100%
    };
  }

  private getCurrentUserId(): string | undefined {
    // This should be retrieved from your auth service
    return undefined; // Placeholder
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Event Listeners
  onEvent(callback: (event: AnalyticsEvent) => void): () => void {
    this.eventCallbacks.push(callback);
    return () => {
      const index = this.eventCallbacks.indexOf(callback);
      if (index > -1) {
        this.eventCallbacks.splice(index, 1);
      }
    };
  }

  onBatch(callback: (batch: OfflineBatch) => void): () => void {
    this.batchCallbacks.push(callback);
    return () => {
      const index = this.batchCallbacks.indexOf(callback);
      if (index > -1) {
        this.batchCallbacks.splice(index, 1);
      }
    };
  }

  onError(callback: (error: Error) => void): () => void {
    this.errorCallbacks.push(callback);
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  // Public API
  getMetrics(): AnalyticsMetrics {
    return { ...this.metrics };
  }

  getSession(): SessionInfo {
    return { ...this.currentSession };
  }

  getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  // Event notification methods
  private notifyEventCallbacks(event: AnalyticsEvent): void {
    this.eventCallbacks.forEach(callback => callback(event));
  }

  private notifyBatchCallbacks(batch: OfflineBatch): void {
    this.batchCallbacks.forEach(callback => callback(batch));
  }

  private notifyErrorCallbacks(error: Error): void {
    this.errorCallbacks.forEach(callback => callback(error));
  }

  // Cleanup
  destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    this.endSession();
  }
}