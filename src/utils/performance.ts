// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Core Web Vitals monitoring
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.set('LCP', lastEntry.startTime);
        this.reportMetric('LCP', lastEntry.startTime);
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const firstInput = entry as PerformanceEventTiming;
          const fid = firstInput.processingStart - firstInput.startTime;
          this.metrics.set('FID', fid);
          this.reportMetric('FID', fid);
        });
      });

      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.metrics.set('CLS', clsValue);
        this.reportMetric('CLS', clsValue);
      });

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }

      // Time to First Byte (TTFB)
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const ttfb = entry.responseStart - entry.requestStart;
          this.metrics.set('TTFB', ttfb);
          this.reportMetric('TTFB', ttfb);
        });
      });

      try {
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (e) {
        console.warn('Navigation observer not supported');
      }
    }
  }

  // Measure custom performance metrics
  startMeasure(name: string): void {
    performance.mark(`${name}-start`);
  }

  endMeasure(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    const duration = measure.duration;
    
    this.metrics.set(name, duration);
    this.reportMetric(name, duration);
    
    // Clean up marks and measures
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(name);
    
    return duration;
  }

  // Report metric to analytics service
  private reportMetric(name: string, value: number): void {
    // In production, send to analytics service
    if (import.meta.env.PROD) {
      // Example: Send to Google Analytics, DataDog, etc.
      console.log(`Performance metric: ${name} = ${value}ms`);
    } else {
      console.log(`[Performance] ${name}: ${value}ms`);
    }
  }

  // Get all collected metrics
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // Memory usage monitoring
  getMemoryUsage(): any {
    if ('memory' in performance) {
      return {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  // Network information
  getNetworkInfo(): any {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    return null;
  }

  // Cleanup observers
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    startMeasure: monitor.startMeasure.bind(monitor),
    endMeasure: monitor.endMeasure.bind(monitor),
    getMetrics: monitor.getMetrics.bind(monitor),
    getMemoryUsage: monitor.getMemoryUsage.bind(monitor),
    getNetworkInfo: monitor.getNetworkInfo.bind(monitor)
  };
};

// Performance timing decorator
export function measurePerformance(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  
  descriptor.value = function (...args: any[]) {
    const monitor = PerformanceMonitor.getInstance();
    const measureName = `${target.constructor.name}.${propertyName}`;
    
    monitor.startMeasure(measureName);
    const result = method.apply(this, args);
    
    if (result instanceof Promise) {
      return result.finally(() => {
        monitor.endMeasure(measureName);
      });
    } else {
      monitor.endMeasure(measureName);
      return result;
    }
  };
  
  return descriptor;
}

// Image optimization utilities
export const ImageOptimizer = {
  // Convert image to WebP format
  convertToWebP(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image'));
          }
        }, 'image/webp', 0.8);
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  },

  // Generate responsive image sizes
  generateResponsiveSizes(file: File, sizes: number[]): Promise<Blob[]> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = async () => {
        const results: Blob[] = [];
        
        for (const size of sizes) {
          const ratio = size / Math.max(img.width, img.height);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to generate size'));
            }, 'image/webp', 0.8);
          });
          
          results.push(blob);
        }
        
        resolve(results);
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
};

// Bundle size analyzer
export const BundleAnalyzer = {
  // Analyze loaded chunks
  getLoadedChunks(): string[] {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    return scripts.map(script => (script as HTMLScriptElement).src);
  },

  // Calculate total bundle size
  async calculateBundleSize(): Promise<number> {
    const chunks = this.getLoadedChunks();
    let totalSize = 0;
    
    for (const chunk of chunks) {
      try {
        const response = await fetch(chunk, { method: 'HEAD' });
        const size = response.headers.get('content-length');
        if (size) {
          totalSize += parseInt(size, 10);
        }
      } catch (e) {
        console.warn(`Failed to get size for chunk: ${chunk}`);
      }
    }
    
    return totalSize;
  }
};