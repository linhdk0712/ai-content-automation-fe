import { webSocketService } from './websocket.service';
import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';

export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  timestamp: number;
  unit?: string;
  category: 'engagement' | 'performance' | 'revenue' | 'usage' | 'system';
}

export interface AnalyticsUpdate {
  metrics: AnalyticsMetric[];
  timestamp: number;
  source: string;
  workspaceId?: string;
  contentId?: string;
}

export interface ChartDataPoint {
  timestamp: number;
  value: number;
  label?: string;
}

export interface AnalyticsChart {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'gauge';
  data: ChartDataPoint[];
  metrics: string[];
  timeRange: string;
  lastUpdated: number;
}

export interface AnalyticsFilter {
  timeRange?: '1h' | '24h' | '7d' | '30d' | '90d';
  contentIds?: string[];
  platforms?: string[];
  metrics?: string[];
  workspaceId?: string;
}

export class LiveAnalyticsService extends BrowserEventEmitter {
  private metrics: Map<string, AnalyticsMetric> = new Map();
  private charts: Map<string, AnalyticsChart> = new Map();
  private subscriptions: Set<string> = new Set();
  private updateBuffer: AnalyticsUpdate[] = [];
  private bufferFlushInterval = 1000; // 1 second
  private bufferTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super();
    this.setupWebSocketListeners();
    this.startBufferFlush();
  }

  private setupWebSocketListeners(): void {
    webSocketService.on('analyticsUpdate', (update: AnalyticsUpdate) => {
      this.handleAnalyticsUpdate(update);
    });

    webSocketService.on('connected', () => {
      // Re-subscribe to all analytics channels
      this.subscriptions.forEach(subscription => {
        webSocketService.subscribe(subscription);
      });
    });
  }

  private startBufferFlush(): void {
    this.bufferTimer = setInterval(() => {
      this.flushUpdateBuffer();
    }, this.bufferFlushInterval);
  }

  private handleAnalyticsUpdate(update: AnalyticsUpdate): void {
    // Add to buffer for batch processing
    this.updateBuffer.push(update);

    // Process immediately if buffer is full
    if (this.updateBuffer.length >= 10) {
      this.flushUpdateBuffer();
    }
  }

  private flushUpdateBuffer(): void {
    if (this.updateBuffer.length === 0) return;

    const updates = [...this.updateBuffer];
    this.updateBuffer = [];

    // Process all updates
    updates.forEach(update => {
      this.processAnalyticsUpdate(update);
    });

    this.emit('batchUpdated', updates);
  }

  private processAnalyticsUpdate(update: AnalyticsUpdate): void {
    update.metrics.forEach(metric => {
      const existingMetric = this.metrics.get(metric.id);
      
      if (existingMetric) {
        // Calculate change
        metric.previousValue = existingMetric.value;
        metric.change = metric.value - existingMetric.value;
        metric.changePercent = existingMetric.value !== 0 
          ? ((metric.change / existingMetric.value) * 100) 
          : 0;
      }

      this.metrics.set(metric.id, metric);
    });

    // Update relevant charts
    this.updateCharts(update);

    this.emit('metricsUpdated', update.metrics);
  }

  private updateCharts(update: AnalyticsUpdate): void {
    this.charts.forEach((chart, chartId) => {
      const relevantMetrics = update.metrics.filter(metric => 
        chart.metrics.includes(metric.id)
      );

      if (relevantMetrics.length > 0) {
        relevantMetrics.forEach(metric => {
          chart.data.push({
            timestamp: metric.timestamp,
            value: metric.value,
            label: metric.name
          });
        });

        // Keep only recent data points (last 100 points)
        chart.data = chart.data
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-100);

        chart.lastUpdated = Date.now();
        this.emit('chartUpdated', chart);
      }
    });
  }

  subscribeToMetrics(filter: AnalyticsFilter): void {
    const subscription = this.createSubscriptionKey(filter);
    this.subscriptions.add(subscription);
    
    webSocketService.subscribe(`analytics:${subscription}`);
    
    // Request initial data
    webSocketService.send({
      type: 'analytics_subscribe',
      payload: {
        filter,
        subscription
      }
    });
  }

  unsubscribeFromMetrics(filter: AnalyticsFilter): void {
    const subscription = this.createSubscriptionKey(filter);
    this.subscriptions.delete(subscription);
    
    webSocketService.unsubscribe(`analytics:${subscription}`);
  }

  private createSubscriptionKey(filter: AnalyticsFilter): string {
    const parts = [
      filter.timeRange || 'all',
      filter.workspaceId || 'all',
      (filter.contentIds || []).join(',') || 'all',
      (filter.platforms || []).join(',') || 'all',
      (filter.metrics || []).join(',') || 'all'
    ];
    
    return parts.join('|');
  }

  getMetric(metricId: string): AnalyticsMetric | undefined {
    return this.metrics.get(metricId);
  }

  getMetrics(category?: string): AnalyticsMetric[] {
    const metrics = Array.from(this.metrics.values());
    
    if (category) {
      return metrics.filter(m => m.category === category);
    }
    
    return metrics.sort((a, b) => b.timestamp - a.timestamp);
  }

  createChart(config: {
    id: string;
    title: string;
    type: AnalyticsChart['type'];
    metrics: string[];
    timeRange: string;
  }): AnalyticsChart {
    const chart: AnalyticsChart = {
      ...config,
      data: [],
      lastUpdated: Date.now()
    };

    this.charts.set(config.id, chart);
    
    // Subscribe to metrics for this chart
    this.subscribeToMetrics({
      metrics: config.metrics,
      timeRange: config.timeRange as any
    });

    return chart;
  }

  getChart(chartId: string): AnalyticsChart | undefined {
    return this.charts.get(chartId);
  }

  getCharts(): AnalyticsChart[] {
    return Array.from(this.charts.values());
  }

  removeChart(chartId: string): void {
    const chart = this.charts.get(chartId);
    if (chart) {
      // Unsubscribe from metrics if no other charts use them
      const otherCharts = Array.from(this.charts.values())
        .filter(c => c.id !== chartId);
      
      const unusedMetrics = chart.metrics.filter(metricId => 
        !otherCharts.some(c => c.metrics.includes(metricId))
      );

      if (unusedMetrics.length > 0) {
        this.unsubscribeFromMetrics({ metrics: unusedMetrics });
      }

      this.charts.delete(chartId);
      this.emit('chartRemoved', chartId);
    }
  }

  getEngagementMetrics(contentId?: string): AnalyticsMetric[] {
    return this.getMetrics('engagement').filter(metric => 
      !contentId || metric.id.includes(contentId)
    );
  }

  getPerformanceMetrics(): AnalyticsMetric[] {
    return this.getMetrics('performance');
  }

  getRevenueMetrics(): AnalyticsMetric[] {
    return this.getMetrics('revenue');
  }

  getUsageMetrics(): AnalyticsMetric[] {
    return this.getMetrics('usage');
  }

  getSystemMetrics(): AnalyticsMetric[] {
    return this.getMetrics('system');
  }

  calculateTrend(metricId: string, timeRange: number = 24 * 60 * 60 * 1000): {
    trend: 'up' | 'down' | 'stable';
    change: number;
    changePercent: number;
  } {
    const metric = this.metrics.get(metricId);
    if (!metric || !metric.previousValue) {
      return { trend: 'stable', change: 0, changePercent: 0 };
    }

    const change = metric.change || 0;
    const changePercent = metric.changePercent || 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(changePercent) > 5) { // 5% threshold
      trend = changePercent > 0 ? 'up' : 'down';
    }

    return { trend, change, changePercent };
  }

  exportData(filter?: AnalyticsFilter): {
    metrics: AnalyticsMetric[];
    charts: AnalyticsChart[];
    exportedAt: number;
  } {
    let metrics = this.getMetrics();
    
    if (filter) {
      if (filter.metrics) {
        metrics = metrics.filter(m => filter.metrics!.includes(m.id));
      }
      if (filter.timeRange) {
        const timeRangeMs = this.parseTimeRange(filter.timeRange);
        const cutoff = Date.now() - timeRangeMs;
        metrics = metrics.filter(m => m.timestamp >= cutoff);
      }
    }

    return {
      metrics,
      charts: this.getCharts(),
      exportedAt: Date.now()
    };
  }

  private parseTimeRange(timeRange: string): number {
    const ranges: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    };
    
    return ranges[timeRange] || ranges['24h'];
  }

  destroy(): void {
    if (this.bufferTimer) {
      clearInterval(this.bufferTimer as unknown as number);
      this.bufferTimer = null;
    }
    
    this.subscriptions.clear();
    this.metrics.clear();
    this.charts.clear();
    this.removeAllListeners();
  }
}

export const liveAnalyticsService = new LiveAnalyticsService();