import { api } from './api';
import { WebSocketService, webSocketService } from './websocket.service';

export interface AnalyticsData {
  id: string;
  contentId?: string;
  userId?: string;
  workspaceId?: string;
  metric: string;
  value: number;
  timestamp: string;
  dimensions: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  type: MetricType;
  unit: string;
  category: MetricCategory;
  aggregation: AggregationType;
  formula?: string;
  isCustom: boolean;
}

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  RATE = 'rate',
  PERCENTAGE = 'percentage'
}

export enum MetricCategory {
  ENGAGEMENT = 'engagement',
  PERFORMANCE = 'performance',
  CONTENT = 'content',
  USER = 'user',
  REVENUE = 'revenue',
  SYSTEM = 'system'
}

export enum AggregationType {
  SUM = 'sum',
  AVERAGE = 'avg',
  COUNT = 'count',
  MIN = 'min',
  MAX = 'max',
  MEDIAN = 'median',
  PERCENTILE = 'percentile'
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: Widget[];
  layout: DashboardLayout;
  filters: DashboardFilter[];
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  metrics: string[];
  config: WidgetConfig;
  position: WidgetPosition;
  filters?: WidgetFilter[];
}

export enum WidgetType {
  LINE_CHART = 'line_chart',
  BAR_CHART = 'bar_chart',
  PIE_CHART = 'pie_chart',
  AREA_CHART = 'area_chart',
  SCATTER_PLOT = 'scatter_plot',
  HEATMAP = 'heatmap',
  TABLE = 'table',
  COUNTER = 'counter',
  GAUGE = 'gauge',
  FUNNEL = 'funnel'
}

export interface WidgetConfig {
  timeRange: TimeRange;
  aggregation: AggregationType;
  groupBy?: string[];
  colors?: string[];
  showLegend: boolean;
  showGrid: boolean;
  yAxisMin?: number;
  yAxisMax?: number;
  refreshInterval: number;
  [key: string]: any;
}

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WidgetFilter {
  field: string;
  operator: FilterOperator;
  value: any;
}

export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CONTAINS = 'contains',
  IN = 'in',
  NOT_IN = 'not_in'
}

export interface DashboardLayout {
  columns: number;
  rowHeight: number;
  margin: [number, number];
  containerPadding: [number, number];
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: FilterType;
  field: string;
  options?: FilterOption[];
  defaultValue?: any;
}

export enum FilterType {
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  DATE_RANGE = 'date_range',
  TEXT = 'text',
  NUMBER_RANGE = 'number_range'
}

export interface FilterOption {
  label: string;
  value: any;
}

export interface TimeRange {
  start: string;
  end: string;
  preset?: TimeRangePreset;
}

export enum TimeRangePreset {
  LAST_HOUR = 'last_hour',
  LAST_24_HOURS = 'last_24_hours',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_90_DAYS = 'last_90_days',
  LAST_YEAR = 'last_year',
  CUSTOM = 'custom'
}

export interface AnalyticsQuery {
  metrics: string[];
  dimensions?: string[];
  filters?: QueryFilter[];
  timeRange: TimeRange;
  aggregation?: AggregationType;
  groupBy?: string[];
  orderBy?: OrderBy[];
  limit?: number;
  offset?: number;
}

export interface QueryFilter {
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface OrderBy {
  field: string;
  direction: 'asc' | 'desc';
}

export interface AnalyticsResult {
  data: AnalyticsDataPoint[];
  metadata: ResultMetadata;
}

export interface AnalyticsDataPoint {
  timestamp: string;
  dimensions: Record<string, string>;
  metrics: Record<string, number>;
}

export interface ResultMetadata {
  totalRows: number;
  executionTime: number;
  cached: boolean;
  query: AnalyticsQuery;
}

export interface Report {
  id: string;
  name: string;
  description?: string;
  query: AnalyticsQuery;
  schedule?: ReportSchedule;
  format: ReportFormat;
  recipients: string[];
  createdBy: string;
  createdAt: string;
  lastRun?: string;
  nextRun?: string;
}

export interface ReportSchedule {
  frequency: ScheduleFrequency;
  time: string;
  timezone: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

export enum ScheduleFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly'
}

export enum ReportFormat {
  PDF = 'pdf',
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json'
}

export interface RealTimeSubscription {
  id: string;
  metrics: string[];
  filters?: QueryFilter[];
  interval: number;
  callback: (data: AnalyticsDataPoint[]) => void;
}

export class AnalyticsService {
  private wsService: WebSocketService;
  private subscriptions: Map<string, RealTimeSubscription> = new Map();
  private dashboards: Map<string, Dashboard> = new Map();
  private metrics: Map<string, MetricDefinition> = new Map();

  constructor(wsService: WebSocketService) {
    this.wsService = wsService;
    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners(): void {
    // React to analytics updates emitted by the websocket service
    this.wsService.on('analyticsUpdate', (payload: any) => {
      this.handleRealTimeData(payload.subscription_id, payload.data);
    });

    // Fallback: listen to generic messages and route by type
    this.wsService.on('message', (message: any) => {
      if (message?.type === 'dashboard_updated') {
        this.handleDashboardUpdate(message.payload?.dashboard);
      } else if (message?.type === 'metric_definition_updated') {
        this.handleMetricDefinitionUpdate(message.payload?.metric);
      }
    });
  }

  // Data Collection
  async trackEvent(
    event: string,
    properties?: Record<string, any>,
    userId?: string,
    contentId?: string
  ): Promise<void> {
    await api.post('/analytics/events', {
      event,
      properties,
      userId,
      contentId,
      timestamp: new Date().toISOString()
    });
  }

  async trackMetric(
    metric: string,
    value: number,
    dimensions?: Record<string, string>,
    timestamp?: string
  ): Promise<void> {
    await api.post('/analytics/metrics', {
      metric,
      value,
      dimensions,
      timestamp: timestamp || new Date().toISOString()
    });
  }

  async batchTrackEvents(events: any[]): Promise<void> {
    await api.post('/analytics/events/batch', { events });
  }

  // Data Querying
  async query(query: AnalyticsQuery): Promise<AnalyticsResult> {
    const response = await api.post('/analytics/query', query);
    return response.data;
  }

  // Compatibility wrapper for existing hooks expecting this API
  async getDashboardData(userId: number, filters: unknown): Promise<any> {
    // If you have a per-user dashboard, map userId/filters to an ID here.
    // For now, fall back to a default dashboard if available.
    try {
      const dashboards = await this.listDashboards();
      return dashboards[0] ?? (await this.getDashboard('default'));
    } catch {
      return await this.getDashboard('default');
    }
  }

  async getMetricData(
    metric: string,
    timeRange: TimeRange,
    dimensions?: string[],
    filters?: QueryFilter[]
  ): Promise<AnalyticsResult> {
    return this.query({
      metrics: [metric],
      dimensions,
      filters,
      timeRange
    });
  }

  async getMultiMetricData(
    metrics: string[],
    timeRange: TimeRange,
    dimensions?: string[],
    filters?: QueryFilter[]
  ): Promise<AnalyticsResult> {
    return this.query({
      metrics,
      dimensions,
      filters,
      timeRange
    });
  }

  // Real-time Analytics
  subscribeToRealTimeData(
    metrics: string[],
    filters?: QueryFilter[],
    interval = 5000,
    callback?: (data: AnalyticsDataPoint[]) => void
  ): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: RealTimeSubscription = {
      id: subscriptionId,
      metrics,
      filters,
      interval,
      callback: callback || (() => {})
    };

    this.subscriptions.set(subscriptionId, subscription);

    this.wsService.send({
      type: 'subscribe_analytics',
      payload: {
        subscription_id: subscriptionId,
        metrics,
        filters,
        interval
      }
    });

    return subscriptionId;
  }

  unsubscribeFromRealTimeData(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
    
    this.wsService.send({
      type: 'unsubscribe_analytics',
      payload: {
        subscription_id: subscriptionId
      }
    });
  }

  private handleRealTimeData(subscriptionId: string, data: AnalyticsDataPoint[]): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription && subscription.callback) {
      subscription.callback(data);
    }
  }

  // Dashboard Management
  async createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dashboard> {
    const response = await api.post('/analytics/dashboards', dashboard);
    const createdDashboard = response.data;
    this.dashboards.set(createdDashboard.id, createdDashboard);
    return createdDashboard;
  }

  async getDashboard(id: string): Promise<Dashboard> {
    const response = await api.get(`/analytics/dashboards/${id}`);
    const dashboard = response.data;
    this.dashboards.set(dashboard.id, dashboard);
    return dashboard;
  }

  async updateDashboard(id: string, updates: Partial<Dashboard>): Promise<Dashboard> {
    const response = await api.put(`/analytics/dashboards/${id}`, updates);
    const dashboard = response.data;
    this.dashboards.set(dashboard.id, dashboard);
    return dashboard;
  }

  async deleteDashboard(id: string): Promise<void> {
    await api.delete(`/analytics/dashboards/${id}`);
    this.dashboards.delete(id);
  }

  async listDashboards(): Promise<Dashboard[]> {
    const response = await api.get('/analytics/dashboards');
    const dashboards = response.data;
    dashboards.forEach((dashboard: Dashboard) => {
      this.dashboards.set(dashboard.id, dashboard);
    });
    return dashboards;
  }

  async duplicateDashboard(id: string, name: string): Promise<Dashboard> {
    const response = await api.post(`/analytics/dashboards/${id}/duplicate`, { name });
    const dashboard = response.data;
    this.dashboards.set(dashboard.id, dashboard);
    return dashboard;
  }

  private handleDashboardUpdate(dashboard: Dashboard): void {
    this.dashboards.set(dashboard.id, dashboard);
  }

  // Widget Management
  async addWidget(dashboardId: string, widget: Omit<Widget, 'id'>): Promise<Widget> {
    const response = await api.post(`/analytics/dashboards/${dashboardId}/widgets`, widget);
    return response.data;
  }

  async updateWidget(dashboardId: string, widgetId: string, updates: Partial<Widget>): Promise<Widget> {
    const response = await api.put(`/analytics/dashboards/${dashboardId}/widgets/${widgetId}`, updates);
    return response.data;
  }

  async deleteWidget(dashboardId: string, widgetId: string): Promise<void> {
    await api.delete(`/analytics/dashboards/${dashboardId}/widgets/${widgetId}`);
  }

  async getWidgetData(dashboardId: string, widgetId: string): Promise<AnalyticsResult> {
    const response = await api.get(`/analytics/dashboards/${dashboardId}/widgets/${widgetId}/data`);
    return response.data;
  }

  // Custom Metrics
  async createCustomMetric(metric: Omit<MetricDefinition, 'id' | 'isCustom'>): Promise<MetricDefinition> {
    const response = await api.post('/analytics/metrics/custom', {
      ...metric,
      isCustom: true
    });
    const createdMetric = response.data;
    this.metrics.set(createdMetric.id, createdMetric);
    return createdMetric;
  }

  async updateCustomMetric(id: string, updates: Partial<MetricDefinition>): Promise<MetricDefinition> {
    const response = await api.put(`/analytics/metrics/custom/${id}`, updates);
    const metric = response.data;
    this.metrics.set(metric.id, metric);
    return metric;
  }

  async deleteCustomMetric(id: string): Promise<void> {
    await api.delete(`/analytics/metrics/custom/${id}`);
    this.metrics.delete(id);
  }

  async listMetrics(): Promise<MetricDefinition[]> {
    const response = await api.get('/analytics/metrics');
    const metrics = response.data;
    metrics.forEach((metric: MetricDefinition) => {
      this.metrics.set(metric.id, metric);
    });
    return metrics;
  }

  private handleMetricDefinitionUpdate(metric: MetricDefinition): void {
    this.metrics.set(metric.id, metric);
  }

  // Reports and Export
  async createReport(report: Omit<Report, 'id' | 'createdAt' | 'lastRun' | 'nextRun'>): Promise<Report> {
    const response = await api.post('/analytics/reports', report);
    return response.data;
  }

  async getReport(id: string): Promise<Report> {
    const response = await api.get(`/analytics/reports/${id}`);
    return response.data;
  }

  async runReport(id: string): Promise<Blob> {
    const response = await api.post(`/analytics/reports/${id}/run`, {}, {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportData(
    query: AnalyticsQuery,
    format?: ReportFormat
  ): Promise<Blob>;
  async exportData(params: {
    userId: number;
    contentId: number | null;
    platform: string;
    startDate: Date;
    endDate: Date;
    format: 'excel' | 'pdf' | 'csv';
  }): Promise<void>;
  async exportData(
    arg1: AnalyticsQuery | {
      userId: number;
      contentId: number | null;
      platform: string;
      startDate: Date;
      endDate: Date;
      format: 'excel' | 'pdf' | 'csv';
    },
    format: ReportFormat = ReportFormat.CSV
  ): Promise<any> {
    // Legacy overload used by hooks
    if (typeof (arg1 as any).metrics === 'undefined') {
      const legacy = arg1 as {
        userId: number;
        contentId: number | null;
        platform: string;
        startDate: Date;
        endDate: Date;
        format: 'excel' | 'pdf' | 'csv';
      };
      // Best-effort: send a request to backend export endpoint; ignore response
      await api.post('/analytics/export/legacy', legacy);
      return;
    }

    // New typed version
    const query = arg1 as AnalyticsQuery;
    const response = await api.post('/analytics/export', {
      query,
      format
    }, {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportDashboard(
    dashboardId: string,
    format: ReportFormat = ReportFormat.PDF
  ): Promise<Blob> {
    const response = await api.get(`/analytics/dashboards/${dashboardId}/export/${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Content Analytics
  async getContentPerformance(
    contentId: string,
    timeRange?: TimeRange
  ): Promise<any> {
    const params = new URLSearchParams();
    if (timeRange) {
      params.append('start', timeRange.start);
      params.append('end', timeRange.end);
    }
    
    const response = await api.get(`/analytics/content/${contentId}/performance?${params.toString()}`);
    return response.data;
  }

  // ===== Compatibility methods for existing hooks =====
  async getEngagementMetrics(params: {
    contentId: number | null;
    platform: string;
    startDate: Date;
    endDate: Date;
  }): Promise<any> {
    if (params.contentId) {
      return this.getContentEngagement(String(params.contentId), params.platform);
    }
    return this.getRevenueMetrics();
  }

  async getContentList(userId: number, _filters: unknown): Promise<any[]> {
    // Proxy to top-performing content
    const list = await this.getTopPerformingContent('engagement_rate');
    return Array.isArray(list) ? list : [];
  }

  async compareContent(_params: any): Promise<any> {
    // Placeholder compare API
    const response = await api.post('/analytics/content/compare', _params);
    return response.data;
  }

  async getROIData(_userId: number, _filters: unknown): Promise<any> {
    const response = await api.get('/analytics/roi');
    return response.data;
  }

  async generateReport(_params: any): Promise<string> {
    const response = await api.post('/analytics/reports/generate', _params);
    return response.data?.url || '';
  }

  async getContentEngagement(
    contentId: string,
    platform?: string
  ): Promise<any> {
    const params = new URLSearchParams();
    if (platform) {
      params.append('platform', platform);
    }
    
    const response = await api.get(`/analytics/content/${contentId}/engagement?${params.toString()}`);
    return response.data;
  }

  async getTopPerformingContent(
    metric: string = 'engagement_rate',
    timeRange?: TimeRange,
    limit = 10
  ): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('metric', metric);
    params.append('limit', limit.toString());
    
    if (timeRange) {
      params.append('start', timeRange.start);
      params.append('end', timeRange.end);
    }
    
    const response = await api.get(`/analytics/content/top-performing?${params.toString()}`);
    return response.data;
  }

  // User Analytics
  async getUserEngagement(
    userId: string,
    timeRange?: TimeRange
  ): Promise<any> {
    const params = new URLSearchParams();
    if (timeRange) {
      params.append('start', timeRange.start);
      params.append('end', timeRange.end);
    }
    
    const response = await api.get(`/analytics/users/${userId}/engagement?${params.toString()}`);
    return response.data;
  }

  async getAudienceInsights(workspaceId?: string): Promise<any> {
    const params = new URLSearchParams();
    if (workspaceId) {
      params.append('workspaceId', workspaceId);
    }
    
    const response = await api.get(`/analytics/audience/insights?${params.toString()}`);
    return response.data;
  }

  // Revenue Analytics
  async getRevenueMetrics(timeRange?: TimeRange): Promise<any> {
    const params = new URLSearchParams();
    if (timeRange) {
      params.append('start', timeRange.start);
      params.append('end', timeRange.end);
    }
    
    const response = await api.get(`/analytics/revenue/metrics?${params.toString()}`);
    return response.data;
  }

  async getSubscriptionAnalytics(): Promise<any> {
    const response = await api.get('/analytics/subscriptions');
    return response.data;
  }

  // Funnel Analysis
  async createFunnel(
    name: string,
    steps: string[],
    timeRange: TimeRange
  ): Promise<any> {
    const response = await api.post('/analytics/funnels', {
      name,
      steps,
      timeRange
    });
    return response.data;
  }

  async getFunnelAnalysis(funnelId: string): Promise<any> {
    const response = await api.get(`/analytics/funnels/${funnelId}`);
    return response.data;
  }

  // Cohort Analysis
  async getCohortAnalysis(
    metric: string,
    timeRange: TimeRange,
    cohortType: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<any> {
    const response = await api.post('/analytics/cohorts', {
      metric,
      timeRange,
      cohortType
    });
    return response.data;
  }

  // A/B Testing Analytics
  async getExperimentResults(experimentId: string): Promise<any> {
    const response = await api.get(`/analytics/experiments/${experimentId}/results`);
    return response.data;
  }

  async getExperimentStatistics(experimentId: string): Promise<any> {
    const response = await api.get(`/analytics/experiments/${experimentId}/statistics`);
    return response.data;
  }

  // Utility Methods
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Helper methods for common time ranges
  static getTimeRange(preset: TimeRangePreset): TimeRange {
    const now = new Date();
    const start = new Date();

    switch (preset) {
      case TimeRangePreset.LAST_HOUR:
        start.setHours(now.getHours() - 1);
        break;
      case TimeRangePreset.LAST_24_HOURS:
        start.setDate(now.getDate() - 1);
        break;
      case TimeRangePreset.LAST_7_DAYS:
        start.setDate(now.getDate() - 7);
        break;
      case TimeRangePreset.LAST_30_DAYS:
        start.setDate(now.getDate() - 30);
        break;
      case TimeRangePreset.LAST_90_DAYS:
        start.setDate(now.getDate() - 90);
        break;
      case TimeRangePreset.LAST_YEAR:
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setDate(now.getDate() - 7);
    }

    return {
      start: start.toISOString(),
      end: now.toISOString(),
      preset
    };
  }
}

// Export a ready-to-use singleton instance for convenience
export const analyticsService = new AnalyticsService(webSocketService);