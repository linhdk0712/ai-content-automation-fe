import { useCallback, useState } from 'react';
import { analyticsService } from '../services/analytics.service';

interface DashboardFilters {
  startDate: Date;
  endDate: Date;
  platforms: string[];
  timeGranularity: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
  timezone: string;
}

interface EngagementOverview {
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  totalEngagements: number;
  averageEngagementRate: number;
}

interface PerformanceTrend {
  date: string;
  totalViews: number;
  totalEngagements: number;
  engagementRate: number;
}

interface PlatformComparison {
  platform: string;
  totalViews: number;
  totalEngagements: number;
  engagementRate: number;
}

interface TopPerformingContent {
  contentId: number;
  title: string;
  platform: string;
  contentType: string;
  views: number;
  engagementRate: number;
  publishedAt: string;
}

interface DashboardData {
  engagementOverview: EngagementOverview;
  performanceTrends: PerformanceTrend[];
  platformComparison: PlatformComparison[];
  topPerformingContent: TopPerformingContent[];
}

interface EngagementData {
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  totalEngagements: number;
  engagementRate: number;
  timeline: Array<{
    timestamp: string;
    engagements: number;
    views: number;
    engagementRate: number;
  }>;
}

interface ContentItem {
  id: number;
  title: string;
  platform: string;
  contentType: string;
  publishedAt: string;
  thumbnailUrl?: string;
  metrics: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    engagementRate: number;
    roi: number;
  };
  rank: number;
  score: number;
}

interface ComparisonData {
  contentPerformances: Array<{
    contentId: number;
    contentTitle: string;
    metrics: Record<string, number>;
  }>;
}

interface AudienceData {
  demographics: {
    ageGroups: Array<{ age: string; percentage: number }>;
    genderDistribution: Array<{ gender: string; percentage: number }>;
    locationDistribution: Array<{ location: string; percentage: number }>;
  };
  behaviorPatterns: {
    peakEngagementHours: Array<{ hour: number; engagementRate: number }>;
    contentPreferences: Array<{ type: string; preference: number }>;
  };
  growthMetrics: {
    followerGrowth: Array<{ date: string; followers: number }>;
    engagementGrowth: Array<{ date: string; engagementRate: number }>;
  };
}

interface ROIData {
  totalInvestment: number;
  totalRevenue: number;
  roi: number;
  costBreakdown: Array<{ category: string; amount: number }>;
  revenueBreakdown: Array<{ source: string; amount: number }>;
  profitabilityTrends: Array<{ date: string; profit: number; roi: number }>;
}

export const useAnalytics = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [engagementData, setEngagementData] = useState<EngagementData | null>(null);
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [audienceData, setAudienceData] = useState<AudienceData | null>(null);
  const [roiData, setROIData] = useState<ROIData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (userId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the dashboard API endpoint
      const response = await fetch(`/api/v1/dashboard?userId=${userId}&timeRange=30d`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      
      // Transform the data to match expected format
      const transformedData: DashboardData = {
        engagementOverview: {
          totalViews: data.totalContent || 0,
          totalLikes: 0,
          totalShares: 0,
          totalComments: 0,
          totalEngagements: 0,
          averageEngagementRate: 0
        },
        performanceTrends: data.performanceData || [],
        platformComparison: [],
        topPerformingContent: []
      };
      
      setDashboardData(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEngagementMetrics = useCallback(async (
    contentId: number | null,
    platform: string,
    startDate: Date,
    endDate: Date
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        platform,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      if (contentId) {
        params.append('contentId', contentId.toString());
      }
      
      const response = await fetch(`/api/v1/analytics/engagement?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch engagement metrics');
      }
      
      const data = await response.json();
      setEngagementData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch engagement metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchContentList = useCallback(async (userId: number, filters: DashboardFilters) => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getContentList(userId, filters);
      setContentList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch content list');
    } finally {
      setLoading(false);
    }
  }, []);

  const compareContent = useCallback(async (params: {
    contentIds: number[];
    platforms: string[];
    startDate: Date;
    endDate: Date;
    metrics: string[];
    comparisonType: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.compareContent(params);
      setComparisonData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare content');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAudienceInsights = useCallback(async (userId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getAudienceInsights(String(userId));
      setAudienceData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audience insights');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchROIData = useCallback(async (userId: number, filters: DashboardFilters) => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getROIData(userId, filters);
      setROIData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ROI data');
    } finally {
      setLoading(false);
    }
  }, []);

  const exportEngagementData = useCallback(async (params: {
    userId: number;
    contentId: number | null;
    platform: string;
    startDate: Date;
    endDate: Date;
    format: 'excel' | 'pdf' | 'csv';
  }) => {
    try {
      setLoading(true);
      setError(null);
      await analyticsService.exportData(params);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
    } finally {
      setLoading(false);
    }
  }, []);

  const generateReport = useCallback(async (params: {
    userId: number;
    reportType: string;
    filters: DashboardFilters;
    format: 'pdf' | 'excel';
    includeCharts: boolean;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const reportUrl = await analyticsService.generateReport(params);
      return reportUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(() => {
    setError(null);
    // Trigger refresh of current data
  }, []);

  return {
    // Data
    dashboardData,
    engagementData,
    contentList,
    comparisonData,
    audienceData,
    roiData,
    
    // State
    loading,
    error,
    
    // Actions
    fetchDashboard,
    fetchEngagementMetrics,
    fetchContentList,
    compareContent,
    fetchAudienceInsights,
    fetchROIData,
    exportEngagementData,
    generateReport,
    refreshData
  };
};