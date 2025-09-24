import { useCallback, useEffect, useRef, useState } from 'react';
import { AnalyticsChart, AnalyticsFilter, AnalyticsMetric, liveAnalyticsService } from '../services/liveAnalytics.service';

export interface UseLiveAnalyticsOptions {
  filter?: AnalyticsFilter;
  autoSubscribe?: boolean;
  updateInterval?: number;
}

export interface LiveAnalyticsState {
  metrics: AnalyticsMetric[];
  charts: AnalyticsChart[];
  isLoading: boolean;
  error: Error | null;
  lastUpdated: number;
}

export function useLiveAnalytics(options: UseLiveAnalyticsOptions = {}) {
  const { filter, autoSubscribe = true, updateInterval = 5000 } = options;
  
  const [state, setState] = useState<LiveAnalyticsState>({
    metrics: [],
    charts: [],
    isLoading: false,
    error: null,
    lastUpdated: 0
  });

  const filterRef = useRef(filter);
  filterRef.current = filter;

  const subscribeToMetrics = useCallback((analyticsFilter: AnalyticsFilter) => {
    liveAnalyticsService.subscribeToMetrics(analyticsFilter);
  }, []);

  const unsubscribeFromMetrics = useCallback((analyticsFilter: AnalyticsFilter) => {
    liveAnalyticsService.unsubscribeFromMetrics(analyticsFilter);
  }, []);

  const createChart = useCallback((config: {
    id: string;
    title: string;
    type: AnalyticsChart['type'];
    metrics: string[];
    timeRange: string;
  }) => {
    return liveAnalyticsService.createChart(config);
  }, []);

  const removeChart = useCallback((chartId: string) => {
    liveAnalyticsService.removeChart(chartId);
  }, []);

  const getMetric = useCallback((metricId: string) => {
    return liveAnalyticsService.getMetric(metricId);
  }, []);

  const getMetricsByCategory = useCallback((category: string) => {
    return liveAnalyticsService.getMetrics(category);
  }, []);

  const calculateTrend = useCallback((metricId: string, timeRange?: number) => {
    return liveAnalyticsService.calculateTrend(metricId, timeRange);
  }, []);

  const exportData = useCallback((exportFilter?: AnalyticsFilter) => {
    return liveAnalyticsService.exportData(exportFilter);
  }, []);

  const refreshData = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const metrics = liveAnalyticsService.getMetrics();
      const charts = liveAnalyticsService.getCharts();
      
      setState(prev => ({
        ...prev,
        metrics,
        charts,
        isLoading: false,
        lastUpdated: Date.now()
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
        isLoading: false
      }));
    }
  }, []);

  useEffect(() => {
    const handleMetricsUpdated = (updatedMetrics: unknown) => {
      const metrics = updatedMetrics as AnalyticsMetric[];
      setState(prev => {
        const metricsMap = new Map(prev.metrics.map(m => [m.id, m]));
        
        metrics.forEach(metric => {
          metricsMap.set(metric.id, metric);
        });
        
        return {
          ...prev,
          metrics: Array.from(metricsMap.values()),
          lastUpdated: Date.now()
        };
      });
    };

    const handleChartUpdated = (updatedChart: unknown) => {
      const chart = updatedChart as AnalyticsChart;
      setState(prev => ({
        ...prev,
        charts: prev.charts.map(c => 
          c.id === chart.id ? chart : c
        ),
        lastUpdated: Date.now()
      }));
    };

    const handleChartRemoved = (chartId: unknown) => {
      const id = chartId as string;
      setState(prev => ({
        ...prev,
        charts: prev.charts.filter(chart => chart.id !== id)
      }));
    };

    const handleBatchUpdated = () => {
      refreshData();
    };

    liveAnalyticsService.on('metricsUpdated', handleMetricsUpdated);
    liveAnalyticsService.on('chartUpdated', handleChartUpdated);
    liveAnalyticsService.on('chartRemoved', handleChartRemoved);
    liveAnalyticsService.on('batchUpdated', handleBatchUpdated);

    // Initial data load
    refreshData();

    // Auto-subscribe if enabled
    if (autoSubscribe && filter) {
      subscribeToMetrics(filter);
    }

    return () => {
      liveAnalyticsService.off('metricsUpdated', handleMetricsUpdated);
      liveAnalyticsService.off('chartUpdated', handleChartUpdated);
      liveAnalyticsService.off('chartRemoved', handleChartRemoved);
      liveAnalyticsService.off('batchUpdated', handleBatchUpdated);
      
      // Unsubscribe on cleanup
      if (filterRef.current) {
        unsubscribeFromMetrics(filterRef.current);
      }
    };
  }, [autoSubscribe, filter, subscribeToMetrics, unsubscribeFromMetrics, refreshData]);

  // Set up periodic refresh
  useEffect(() => {
    if (updateInterval > 0) {
      const interval = setInterval(refreshData, updateInterval);
      return () => clearInterval(interval);
    }
  }, [updateInterval, refreshData]);

  return {
    ...state,
    subscribeToMetrics,
    unsubscribeFromMetrics,
    createChart,
    removeChart,
    getMetric,
    getMetricsByCategory,
    calculateTrend,
    exportData,
    refreshData
  };
}