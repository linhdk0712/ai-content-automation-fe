export interface OptimizationSettings {
  dataSaver: boolean;
  imageQuality: 'low' | 'medium' | 'high';
  videoQuality: 'low' | 'medium' | 'high';
  lazyLoading: boolean;
  prefetchEnabled: boolean;
  compressionLevel: number;
  maxCacheSize: number; // in MB
  offlineMode: boolean;
}

export interface BandwidthInfo {
  downlink: number; // Mbps
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  rtt: number; // ms
  saveData: boolean;
}

export interface OptimizationMetrics {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  loadTime: number;
  bandwidth: number;
  cacheHitRate: number;
}

export interface LazyLoadConfig {
  rootMargin: string;
  threshold: number;
  enableIntersectionObserver: boolean;
  fallbackToScroll: boolean;
}

export interface CompressionConfig {
  images: {
    quality: number;
    format: 'webp' | 'jpeg' | 'png';
    maxWidth: number;
    maxHeight: number;
  };
  videos: {
    quality: number;
    bitrate: number;
    resolution: string;
  };
  text: {
    gzip: boolean;
    brotli: boolean;
  };
}

export class MobileOptimizationService {
  private settings: OptimizationSettings;
  private bandwidthInfo: BandwidthInfo;
  private compressionConfig: CompressionConfig;
  private lazyLoadConfig: LazyLoadConfig;
  private intersectionObserver?: IntersectionObserver;
  private loadedImages: Set<string> = new Set();
  private prefetchQueue: string[] = [];
  private compressionWorker?: Worker;

  constructor() {
    this.settings = this.getDefaultSettings();
    this.bandwidthInfo = this.getBandwidthInfo();
    this.compressionConfig = this.getCompressionConfig();
    this.lazyLoadConfig = this.getLazyLoadConfig();
    
    this.initializeOptimization();
    this.setupBandwidthMonitoring();
    this.initializeCompressionWorker();
  }

  private initializeOptimization(): void {
    this.setupLazyLoading();
    this.optimizeForConnection();
    this.setupPrefetching();
  }

  private setupBandwidthMonitoring(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      connection.addEventListener('change', () => {
        this.bandwidthInfo = this.getBandwidthInfo();
        this.optimizeForConnection();
      });
    }

    // Monitor data saver preference
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection.saveData !== this.settings.dataSaver) {
        this.updateSettings({ dataSaver: connection.saveData });
      }
    }
  }

  private getBandwidthInfo(): BandwidthInfo {
    const connection = (navigator as any).connection;
    
    return {
      downlink: connection?.downlink || 10,
      effectiveType: connection?.effectiveType || '4g',
      rtt: connection?.rtt || 100,
      saveData: connection?.saveData || false
    };
  }

  private optimizeForConnection(): void {
    const { effectiveType, saveData, downlink } = this.bandwidthInfo;
    
    // Adjust settings based on connection quality
    if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
      this.updateSettings({
        imageQuality: 'low',
        videoQuality: 'low',
        prefetchEnabled: false,
        compressionLevel: 9
      });
    } else if (effectiveType === '3g' || downlink < 1.5) {
      this.updateSettings({
        imageQuality: 'medium',
        videoQuality: 'medium',
        prefetchEnabled: true,
        compressionLevel: 7
      });
    } else {
      this.updateSettings({
        imageQuality: 'high',
        videoQuality: 'high',
        prefetchEnabled: true,
        compressionLevel: 5
      });
    }
  }

  // Image Optimization
  async optimizeImage(
    imageUrl: string,
    options?: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png';
    }
  ): Promise<string> {
    const config = this.compressionConfig.images;
    const finalOptions = {
      width: options?.width || config.maxWidth,
      height: options?.height || config.maxHeight,
      quality: options?.quality || config.quality,
      format: options?.format || config.format
    };

    // Check if browser supports WebP
    if (finalOptions.format === 'webp' && !this.supportsWebP()) {
      finalOptions.format = 'jpeg';
    }

    try {
      const optimizedUrl = await this.processImageWithWorker(imageUrl, finalOptions);
      return optimizedUrl;
    } catch (error) {
      console.warn('Image optimization failed, using original:', error);
      return imageUrl;
    }
  }

  private async processImageWithWorker(
    imageUrl: string,
    options: any
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.compressionWorker) {
        reject(new Error('Compression worker not available'));
        return;
      }

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

      this.compressionWorker.addEventListener('message', handleMessage);
      this.compressionWorker.postMessage({
        id: messageId,
        type: 'compress_image',
        imageUrl,
        options
      });
    });
  }

  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  // Lazy Loading
  private setupLazyLoading(): void {
    if (!this.settings.lazyLoading) return;

    if ('IntersectionObserver' in window && this.lazyLoadConfig.enableIntersectionObserver) {
      this.intersectionObserver = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          rootMargin: this.lazyLoadConfig.rootMargin,
          threshold: this.lazyLoadConfig.threshold
        }
      );
    } else if (this.lazyLoadConfig.fallbackToScroll) {
      this.setupScrollBasedLazyLoading();
    }
  }

  observeElement(element: HTMLElement): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(element);
    }
  }

  unobserveElement(element: HTMLElement): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(element);
    }
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target as HTMLElement;
        this.loadElement(element);
        this.intersectionObserver?.unobserve(element);
      }
    });
  }

  private setupScrollBasedLazyLoading(): void {
    let ticking = false;

    const checkElements = () => {
      const lazyElements = document.querySelectorAll('[data-lazy]');
      
      lazyElements.forEach(element => {
        if (this.isElementInViewport(element as HTMLElement)) {
          this.loadElement(element as HTMLElement);
        }
      });
      
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(checkElements);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  }

  private isElementInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    return (
      rect.top >= -100 && // Load 100px before entering viewport
      rect.left >= 0 &&
      rect.bottom <= windowHeight + 100 && // Load 100px after leaving viewport
      rect.right <= windowWidth
    );
  }

  private async loadElement(element: HTMLElement): Promise<void> {
    const src = element.getAttribute('data-lazy');
    if (!src || this.loadedImages.has(src)) return;

    try {
      // Optimize image before loading
      const optimizedSrc = await this.optimizeImage(src);
      
      if (element.tagName === 'IMG') {
        const img = element as HTMLImageElement;
        img.src = optimizedSrc;
        img.removeAttribute('data-lazy');
      } else {
        element.style.backgroundImage = `url(${optimizedSrc})`;
        element.removeAttribute('data-lazy');
      }

      this.loadedImages.add(src);
    } catch (error) {
      console.error('Failed to load lazy element:', error);
    }
  }

  // Prefetching
  private setupPrefetching(): void {
    if (!this.settings.prefetchEnabled) return;

    // Prefetch critical resources
    this.prefetchCriticalResources();
    
    // Setup link prefetching
    this.setupLinkPrefetching();
  }

  private prefetchCriticalResources(): void {
    const criticalResources = [
      '/api/user/preferences',
      '/api/workspaces/current',
      '/api/notifications/unread'
    ];

    criticalResources.forEach(url => {
      this.prefetchResource(url);
    });
  }

  private setupLinkPrefetching(): void {
    // Prefetch links on hover (desktop) or touch start (mobile)
    document.addEventListener('mouseover', this.handleLinkHover.bind(this), { passive: true });
    document.addEventListener('touchstart', this.handleLinkTouch.bind(this), { passive: true });
  }

  private handleLinkHover(event: MouseEvent): void {
    const link = (event.target as HTMLElement).closest('a');
    if (link && this.shouldPrefetchLink(link)) {
      this.prefetchResource(link.href);
    }
  }

  private handleLinkTouch(event: TouchEvent): void {
    const link = (event.target as HTMLElement).closest('a');
    if (link && this.shouldPrefetchLink(link)) {
      this.prefetchResource(link.href);
    }
  }

  private shouldPrefetchLink(link: HTMLAnchorElement): boolean {
    // Don't prefetch external links
    if (link.hostname !== window.location.hostname) return false;
    
    // Don't prefetch if data saver is enabled
    if (this.settings.dataSaver) return false;
    
    // Don't prefetch large files
    const href = link.href.toLowerCase();
    if (href.includes('.pdf') || href.includes('.zip') || href.includes('.exe')) {
      return false;
    }
    
    return true;
  }

  async prefetchResource(url: string): Promise<void> {
    if (this.prefetchQueue.includes(url)) return;
    
    this.prefetchQueue.push(url);
    
    try {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
      
      // Remove after a delay to clean up
      setTimeout(() => {
        document.head.removeChild(link);
        const index = this.prefetchQueue.indexOf(url);
        if (index > -1) {
          this.prefetchQueue.splice(index, 1);
        }
      }, 30000);
    } catch (error) {
      console.warn('Prefetch failed for:', url, error);
    }
  }

  // Data Compression
  async compressText(text: string): Promise<string> {
    if (!this.settings.dataSaver) return text;

    try {
      // Use compression stream if available
      if ('CompressionStream' in window) {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(new TextEncoder().encode(text));
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }
        
        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          compressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        return btoa(String.fromCharCode(...compressed));
      }
      
      // Fallback to simple compression
      return this.simpleCompress(text);
    } catch (error) {
      console.warn('Text compression failed:', error);
      return text;
    }
  }

  private simpleCompress(text: string): string {
    // Simple run-length encoding for repeated characters
    return text.replace(/(.)\1{2,}/g, (match, char) => {
      return `${char}${match.length}`;
    });
  }

  // Cache Management
  async manageCacheSize(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }
      
      const maxSizeBytes = this.settings.maxCacheSize * 1024 * 1024;
      
      if (totalSize > maxSizeBytes) {
        await this.cleanupOldCache();
      }
    }
  }

  private async cleanupOldCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      
      // Remove oldest caches first
      const sortedCaches = cacheNames.sort();
      const cachesToDelete = sortedCaches.slice(0, Math.floor(sortedCaches.length / 2));
      
      for (const cacheName of cachesToDelete) {
        await caches.delete(cacheName);
      }
    }
  }

  // Settings Management
  updateSettings(updates: Partial<OptimizationSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.persistSettings();
    this.applySettings();
  }

  getSettings(): OptimizationSettings {
    return { ...this.settings };
  }

  private applySettings(): void {
    if (this.settings.lazyLoading && !this.intersectionObserver) {
      this.setupLazyLoading();
    } else if (!this.settings.lazyLoading && this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = undefined;
    }

    this.optimizeForConnection();
  }

  private getDefaultSettings(): OptimizationSettings {
    const stored = localStorage.getItem('mobileOptimizationSettings');
    if (stored) {
      try {
        return { ...this.getBaseSettings(), ...JSON.parse(stored) };
      } catch (error) {
        console.error('Failed to load optimization settings:', error);
      }
    }
    
    return this.getBaseSettings();
  }

  private getBaseSettings(): OptimizationSettings {
    return {
      dataSaver: false,
      imageQuality: 'medium',
      videoQuality: 'medium',
      lazyLoading: true,
      prefetchEnabled: true,
      compressionLevel: 5,
      maxCacheSize: 50, // 50MB
      offlineMode: false
    };
  }

  private persistSettings(): void {
    try {
      localStorage.setItem('mobileOptimizationSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to persist optimization settings:', error);
    }
  }

  private getCompressionConfig(): CompressionConfig {
    return {
      images: {
        quality: 0.8,
        format: 'webp',
        maxWidth: 1920,
        maxHeight: 1080
      },
      videos: {
        quality: 0.7,
        bitrate: 1000000, // 1Mbps
        resolution: '720p'
      },
      text: {
        gzip: true,
        brotli: true
      }
    };
  }

  private getLazyLoadConfig(): LazyLoadConfig {
    return {
      rootMargin: '50px',
      threshold: 0.1,
      enableIntersectionObserver: true,
      fallbackToScroll: true
    };
  }

  private initializeCompressionWorker(): void {
    if ('Worker' in window) {
      try {
        this.compressionWorker = new Worker('/workers/compression-worker.js');
      } catch (error) {
        console.warn('Failed to initialize compression worker:', error);
      }
    }
  }

  // Metrics
  getOptimizationMetrics(): OptimizationMetrics {
    // This would normally track real metrics
    return {
      originalSize: 0,
      compressedSize: 0,
      compressionRatio: 0,
      loadTime: 0,
      bandwidth: this.bandwidthInfo.downlink,
      cacheHitRate: 0
    };
  }

  // Cleanup
  destroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
    }
  }
}