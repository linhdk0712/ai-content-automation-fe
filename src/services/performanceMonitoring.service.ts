// Enhanced Performance Monitoring Service with Real-time Metrics
export interface PerformanceMetric {
  id?: string;
  type: 'navigation' | 'resource' | 'paint' | 'layout' | 'custom';
  name: string;
  value: number;
  timestamp: number;
  url?: string;
  userAgent?: string;
  connectionType?: string;
  deviceMemory?: number;
  metadata?: any;
}

export interface WebVitalsMetric {
  name: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

export interface PerformanceReport {
  pageLoadTime: number;
  resourceLoadTime: number;
  renderTime: number;
  interactionTime: number;
  webVitals: WebVitalsMetric[];
  customMetrics: PerformanceMetric[];
  timestamp: number;
}

class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private webVitals: WebVitalsMetric[] = [];
  private observer: PerformanceObserver | null = null;
  private isMonitoring = false;
  private reportInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Initialize performance observer
    this.setupPerformanceObserver();
    
    // Monitor Web Vitals
    this.setupWebVitalsMonitoring();
    
    // Monitor custom metrics
    this.setupCustomMetrics();
    
    // Setup periodic reporting
    this.setupPeriodicReporting();
    
    // Monitor service worker performance
    this.setupServiceWorkerMonitoring();

    this.isMonitoring = true;
  }

  private setupPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          this.processPerformanceEntry(entry);
        });
      });

      // Observe different types of performance entries
      const entryTypes = ['navigation', 'resource', 'paint', 'layout-shift', 'first-input'];
      
      entryTypes.forEach((type) => {
        try {
          this.observer!.observe({ entryTypes: [type] });
        } catch (error) {
          console.warn(`Performance observer type '${type}' not supported:`, error);
        }
      });

    } catch (error) {
      console.error('Failed to setup performance observer:', error);
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    const metric: PerformanceMetric = {
      type: this.getMetricType(entry),
      name: entry.name,
      value: entry.duration || (entry as any).value || 0,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
      deviceMemory: this.getDeviceMemory(),
      metadata: this.extractMetadata(entry)
    };

    this.addMetric(metric);
  }

  private getMetricType(entry: PerformanceEntry): PerformanceMetric['type'] {
    if (entry.entryType === 'navigation') return 'navigation';
    if (entry.entryType === 'resource') return 'resource';
    if (entry.entryType === 'paint') return 'paint';
    if (entry.entryType === 'layout-shift') return 'layout';
    return 'custom';
  }

  private getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection ? connection.effectiveType || 'unknown' : 'unknown';
  }

  private getDeviceMemory(): number {
    return (navigator as any).deviceMemory || 0;
  }

  private extractMetadata(entry: PerformanceEntry): any {
    const metadata: any = {
      entryType: entry.entryType,
      startTime: entry.startTime
    };

    // Add specific metadata based on entry type
    if (entry.entryType === 'navigation') {
      const navEntry = entry as PerformanceNavigationTiming;
      metadata.domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart;
      metadata.loadComplete = navEntry.loadEventEnd - navEntry.loadEventStart;
      metadata.redirectCount = navEntry.redirectCount;
      metadata.transferSize = navEntry.transferSize;
    }

    if (entry.entryType === 'resource') {
      const resourceEntry = entry as PerformanceResourceTiming;
      metadata.transferSize = resourceEntry.transferSize;
      metadata.encodedBodySize = resourceEntry.encodedBodySize;
      metadata.decodedBodySize = resourceEntry.decodedBodySize;
    }

    if (entry.entryType === 'layout-shift') {
      const layoutEntry = entry as any;
      metadata.value = layoutEntry.value;
      metadata.hadRecentInput = layoutEntry.hadRecentInput;
    }

    return metadata;
  }

  private setupWebVitalsMonitoring(): void {
    // Monitor Largest Contentful Paint (LCP)
    this.observeWebVital('largest-contentful-paint', (entry: any) => {
      this.addWebVital({
        name: 'LCP',
        value: entry.startTime,
        rating: this.rateLCP(entry.startTime),
        timestamp: Date.now()
      });
    });

    // Monitor First Input Delay (FID)
    this.observeWebVital('first-input', (entry: any) => {
      this.addWebVital({
        name: 'FID',
        value: entry.processingStart - entry.startTime,
        rating: this.rateFID(entry.processingStart - entry.startTime),
        timestamp: Date.now()
      });
    });

    // Monitor Cumulative Layout Shift (CLS)
    let clsValue = 0;
    this.observeWebVital('layout-shift', (entry: any) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
        this.addWebVital({
          name: 'CLS',
          value: clsValue,
          rating: this.rateCLS(clsValue),
          timestamp: Date.now()
        });
      }
    });

    // Monitor First Contentful Paint (FCP)
    this.observeWebVital('paint', (entry: any) => {
      if (entry.name === 'first-contentful-paint') {
        this.addWebVital({
          name: 'FCP',
          value: entry.startTime,
          rating: this.rateFCP(entry.startTime),
          timestamp: Date.now()
        });
      }
    });

    // Monitor Time to First Byte (TTFB)
    if ('navigation' in performance.getEntriesByType('navigation')[0]) {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const ttfb = navEntry.responseStart - navEntry.requestStart;
      
      this.addWebVital({
        name: 'TTFB',
        value: ttfb,
        rating: this.rateTTFB(ttfb),
        timestamp: Date.now()
      });
    }
  }

  private observeWebVital(entryType: string, callback: (entry: any) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(callback);
      });
      
      observer.observe({ entryTypes: [entryType] });
    } catch (error) {
      console.warn(`Web vital observer '${entryType}' not supported:`, error);
    }
  }

  // Web Vitals rating functions
  private rateLCP(value: number): WebVitalsMetric['rating'] {
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'needs-improvement';
    return 'poor';
  }

  private rateFID(value: number): WebVitalsMetric['rating'] {
    if (value <= 100) return 'good';
    if (value <= 300) return 'needs-improvement';
    return 'poor';
  }

  private rateCLS(value: number): WebVitalsMetric['rating'] {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  private rateFCP(value: number): WebVitalsMetric['rating'] {
    if (value <= 1800) return 'good';
    if (value <= 3000) return 'needs-improvement';
    return 'poor';
  }

  private rateTTFB(value: number): WebVitalsMetric['rating'] {
    if (value <= 800) return 'good';
    if (value <= 1800) return 'needs-improvement';
    return 'poor';
  }

  private setupCustomMetrics(): void {
    // Monitor React component render times
    this.monitorReactPerformance();
    
    // Monitor API response times
    this.monitorAPIPerformance();
    
    // Monitor user interactions
    this.monitorUserInteractions();
    
    // Monitor memory usage
    this.monitorMemoryUsage();
  }

  private monitorReactPerformance(): void {
    // This would integrate with React DevTools Profiler
    // For now, we'll add a simple component render tracker
    const originalConsoleTime = console.time;
    const originalConsoleTimeEnd = console.timeEnd;

    console.time = (label?: string) => {
      if (label && label.startsWith('React')) {
        this.startCustomTimer(label);
      }
      return originalConsoleTime.call(console, label);
    };

    console.timeEnd = (label?: string) => {
      if (label && label.startsWith('React')) {
        this.endCustomTimer(label);
      }
      return originalConsoleTimeEnd.call(console, label);
    };
  }

  private monitorAPIPerformance(): void {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        this.addMetric({
          type: 'custom',
          name: 'api-request',
          value: endTime - startTime,
          timestamp: Date.now(),
          url: window.location.href,
          metadata: {
            apiUrl: url,
            status: response.status,
            method: args[1]?.method || 'GET'
          }
        });
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        
        this.addMetric({
          type: 'custom',
          name: 'api-request-error',
          value: endTime - startTime,
          timestamp: Date.now(),
          url: window.location.href,
          metadata: {
            apiUrl: url,
            error: (error as Error).message,
            method: args[1]?.method || 'GET'
          }
        });
        
        throw error;
      }
    };
  }

  private monitorUserInteractions(): void {
    // Monitor click interactions
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const startTime = performance.now();
      
      // Use requestIdleCallback to measure interaction response time
      requestIdleCallback(() => {
        const endTime = performance.now();
        
        this.addMetric({
          type: 'custom',
          name: 'user-interaction',
          value: endTime - startTime,
          timestamp: Date.now(),
          url: window.location.href,
          metadata: {
            interactionType: 'click',
            targetTag: target.tagName,
            targetClass: target.className,
            targetId: target.id
          }
        });
      });
    });

    // Monitor scroll performance
    let scrollStartTime = 0;
    let scrollTimeout: NodeJS.Timeout;

    document.addEventListener('scroll', () => {
      if (scrollStartTime === 0) {
        scrollStartTime = performance.now();
      }

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const endTime = performance.now();
        
        this.addMetric({
          type: 'custom',
          name: 'scroll-performance',
          value: endTime - scrollStartTime,
          timestamp: Date.now(),
          url: window.location.href,
          metadata: {
            scrollY: window.scrollY,
            scrollHeight: document.documentElement.scrollHeight
          }
        });
        
        scrollStartTime = 0;
      }, 100);
    });
  }

  private monitorMemoryUsage(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        
        this.addMetric({
          type: 'custom',
          name: 'memory-usage',
          value: memory.usedJSHeapSize,
          timestamp: Date.now(),
          url: window.location.href,
          metadata: {
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
            usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
          }
        });
      }, 30000); // Every 30 seconds
    }
  }

  private setupServiceWorkerMonitoring(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SW_PERFORMANCE') {
          this.addMetric({
            type: 'custom',
            name: `sw-${event.data.event}`,
            value: event.data.duration,
            timestamp: event.data.timestamp,
            url: window.location.href,
            metadata: {
              serviceWorker: true,
              event: event.data.event
            }
          });
        }
      });
    }
  }

  private setupPeriodicReporting(): void {
    // Report metrics every 5 minutes
    this.reportInterval = setInterval(() => {
      this.sendMetricsToServer();
    }, 300000);

    // Report on page unload
    window.addEventListener('beforeunload', () => {
      this.sendMetricsToServer(true);
    });

    // Report on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.sendMetricsToServer();
      }
    });
  }

  // Custom timer methods
  private customTimers = new Map<string, number>();

  startCustomTimer(name: string): void {
    this.customTimers.set(name, performance.now());
  }

  endCustomTimer(name: string): number {
    const startTime = this.customTimers.get(name);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.customTimers.delete(name);
      
      this.addMetric({
        type: 'custom',
        name: name,
        value: duration,
        timestamp: Date.now(),
        url: window.location.href
      });
      
      return duration;
    }
    return 0;
  }

  // Add metrics
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private addWebVital(vital: WebVitalsMetric): void {
    this.webVitals.push(vital);
    
    // Keep only last 100 web vitals in memory
    if (this.webVitals.length > 100) {
      this.webVitals = this.webVitals.slice(-100);
    }
  }

  // Public API methods
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getWebVitals(): WebVitalsMetric[] {
    return [...this.webVitals];
  }

  generateReport(): PerformanceReport {
    const navigationMetrics = this.metrics.filter(m => m.type === 'navigation');
    const resourceMetrics = this.metrics.filter(m => m.type === 'resource');
    const paintMetrics = this.metrics.filter(m => m.type === 'paint');
    const customMetrics = this.metrics.filter(m => m.type === 'custom');

    return {
      pageLoadTime: navigationMetrics.reduce((sum, m) => sum + m.value, 0) / navigationMetrics.length || 0,
      resourceLoadTime: resourceMetrics.reduce((sum, m) => sum + m.value, 0) / resourceMetrics.length || 0,
      renderTime: paintMetrics.reduce((sum, m) => sum + m.value, 0) / paintMetrics.length || 0,
      interactionTime: customMetrics.filter(m => m.name.includes('interaction')).reduce((sum, m) => sum + m.value, 0) / customMetrics.length || 0,
      webVitals: [...this.webVitals],
      customMetrics: [...customMetrics],
      timestamp: Date.now()
    };
  }

  // Send metrics to server
  private async sendMetricsToServer(isBeacon = false): Promise<void> {
    if (this.metrics.length === 0 && this.webVitals.length === 0) return;

    const payload = {
      metrics: this.metrics.splice(0), // Clear metrics after getting them
      webVitals: this.webVitals.splice(0), // Clear web vitals after getting them
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    };

    try {
      if (isBeacon && 'sendBeacon' in navigator) {
        // Use sendBeacon for reliable delivery on page unload
        navigator.sendBeacon('/api/v1/analytics/performance', JSON.stringify(payload));
      } else {
        // Use fetch for regular reporting
        await fetch('/api/v1/analytics/performance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify(payload)
        });
      }
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
      // Re-add metrics to queue for retry
      this.metrics.unshift(...payload.metrics);
      this.webVitals.unshift(...payload.webVitals);
    }
  }

  // Manual metric recording
  recordCustomMetric(name: string, value: number, metadata?: any): void {
    this.addMetric({
      type: 'custom',
      name: name,
      value: value,
      timestamp: Date.now(),
      url: window.location.href,
      metadata: metadata
    });
  }

  // Cleanup
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }
    
    this.isMonitoring = false;
  }
}

export const performanceMonitoringService = new PerformanceMonitoringService();