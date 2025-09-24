import React, { useState, useEffect } from 'react';
import { useLiveAnalytics } from '../../hooks/useLiveAnalytics';
import { AnalyticsMetric, AnalyticsChart } from '../../services/liveAnalytics.service';

interface LiveAnalyticsDashboardProps {
  workspaceId?: string;
  contentId?: string;
  className?: string;
}

export const LiveAnalyticsDashboard: React.FC<LiveAnalyticsDashboardProps> = ({
  workspaceId,
  contentId,
  className = ''
}) => {
  const {
    metrics,
    charts,
    isLoading,
    error,
    lastUpdated,
    createChart,
    removeChart,
    getMetricsByCategory,
    calculateTrend,
    refreshData
  } = useLiveAnalytics({
    filter: {
      workspaceId,
      contentIds: contentId ? [contentId] : undefined,
      timeRange: '24h'
    },
    autoSubscribe: true,
    updateInterval: 5000
  });

  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'engagement' | 'performance' | 'revenue'>('all');

  const filteredMetrics = selectedCategory === 'all' 
    ? metrics 
    : getMetricsByCategory(selectedCategory);

  const formatValue = (value: number, unit?: string) => {
    if (unit === '%') return `${value.toFixed(1)}%`;
    if (unit === '$') return `$${value.toFixed(2)}`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <span className="text-green-500">↗️</span>;
      case 'down':
        return <span className="text-red-500">↘️</span>;
      default:
        return <span className="text-gray-500">→</span>;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const renderMetricCard = (metric: AnalyticsMetric) => {
    const trend = calculateTrend(metric.id);
    
    return (
      <div key={metric.id} className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{metric.name}</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatValue(metric.value, metric.unit)}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-1">
              {getTrendIcon(trend.trend)}
              <span className={`text-sm font-medium ${getTrendColor(trend.trend)}`}>
                {Math.abs(trend.changePercent).toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              vs previous period
            </p>
          </div>
        </div>
        
        {metric.previousValue !== undefined && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Previous: {formatValue(metric.previousValue, metric.unit)}</span>
              <span>Change: {trend.change > 0 ? '+' : ''}{formatValue(trend.change, metric.unit)}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderChart = (chart: AnalyticsChart) => {
    const latestData = chart.data.slice(-20); // Show last 20 data points
    
    return (
      <div key={chart.id} className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{chart.title}</h3>
          <button
            onClick={() => removeChart(chart.id)}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Remove chart"
            title="Remove chart"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="h-64 flex items-end space-x-1">
          {latestData.map((point, index) => {
            const maxValue = Math.max(...latestData.map(p => p.value));
            const height = maxValue > 0 ? (point.value / maxValue) * 100 : 0;
            
            return (
              <div
                key={index}
                className="flex-1 bg-blue-500 rounded-t"
                style={{ height: `${height}%` }}
                title={`${point.label || 'Value'}: ${formatValue(point.value)}`}
              />
            );
          })}
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>Last updated: {new Date(chart.lastUpdated).toLocaleTimeString()}</p>
          <p>Data points: {chart.data.length}</p>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Live Analytics</h2>
          <p className="text-sm text-gray-600">
            Real-time performance metrics and insights
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'}`} />
            <span className="text-sm text-gray-600">
              {error ? 'Disconnected' : 'Live'}
            </span>
          </div>
          
          {/* Last Updated */}
          <span className="text-sm text-gray-500">
            Updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}
          </span>
          
          {/* Refresh Button */}
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div>
          <label htmlFor="time-range" className="text-sm font-medium text-gray-700 mr-2">Time Range:</label>
          <select
            id="time-range"
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="category-select" className="text-sm font-medium text-gray-700 mr-2">Category:</label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value="all">All Metrics</option>
            <option value="engagement">Engagement</option>
            <option value="performance">Performance</option>
            <option value="revenue">Revenue</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800">
              Failed to load analytics data: {error.message}
            </span>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredMetrics.map(renderMetricCard)}
      </div>

      {/* Charts */}
      {charts.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Charts</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {charts.map(renderChart)}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredMetrics.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
          <p className="text-gray-600">
            Analytics data will appear here once your content starts generating engagement.
          </p>
        </div>
      )}
    </div>
  );
};