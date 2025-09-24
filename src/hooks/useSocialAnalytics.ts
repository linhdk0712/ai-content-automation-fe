import { useCallback, useState } from 'react';

export interface PlatformMetrics {
  platform: 'facebook' | 'twitter' | 'instagram' | 'youtube' | 'linkedin' | 'tiktok';
  accountName: string;
  followers: number;
  followersChange: number;
  posts: number;
  postsChange: number;
  engagement: number;
  engagementChange: number;
  reach: number;
  reachChange: number;
  impressions: number;
  impressionsChange: number;
  clicks: number;
  clicksChange: number;
  conversions: number;
  conversionsChange: number;
  revenue: number;
  revenueChange: number;
}

export interface TimeSeriesData {
  date: string;
  facebook: number;
  twitter: number;
  instagram: number;
  youtube: number;
  linkedin: number;
  tiktok: number;
  total: number;
}

export interface TopContent {
  id: number;
  title: string;
  platform: string;
  publishedAt: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  engagementRate: number;
  reach: number;
  thumbnail?: string;
}

export interface AudienceInsights {
  ageGroups: Array<{ age: string; percentage: number }>;
  genders: Array<{ gender: string; percentage: number }>;
  locations: Array<{ country: string; followers: number; percentage: number; engagementRate: number }>;
}

export interface UseSocialAnalyticsReturn {
  platformMetrics: PlatformMetrics[];
  timeSeriesData: TimeSeriesData[];
  topContent: TopContent[];
  audienceInsights: AudienceInsights | null;
  loading: boolean;
  error: string | null;
  loadAnalytics: (params: { dateRange: string; platforms: string[]; includeComparison: boolean }) => Promise<void>;
  exportReport: (params: { dateRange: string; platforms: string[]; format: string; includeCharts: boolean }) => Promise<void>;
  compareMetrics: (platforms: string[], metrics: string[]) => Promise<any>;
}

export const useSocialAnalytics = (): UseSocialAnalyticsReturn => {
  const [platformMetrics] = useState<PlatformMetrics[]>([]);
  const [timeSeriesData] = useState<TimeSeriesData[]>([]);
  const [topContent] = useState<TopContent[]>([]);
  const [audienceInsights] = useState<AudienceInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async (params: { dateRange: string; platforms: string[]; includeComparison: boolean }) => {
    console.log('Loading analytics:', params);
  }, []);

  const exportReport = useCallback(async (params: { dateRange: string; platforms: string[]; format: string; includeCharts: boolean }) => {
    console.log('Exporting report:', params);
  }, []);

  const compareMetrics = useCallback(async (platforms: string[], metrics: string[]) => {
    console.log('Comparing metrics:', platforms, metrics);
    return {};
  }, []);

  return {
    platformMetrics,
    timeSeriesData,
    topContent,
    audienceInsights,
    loading,
    error,
    loadAnalytics,
    exportReport,
    compareMetrics
  };
};
