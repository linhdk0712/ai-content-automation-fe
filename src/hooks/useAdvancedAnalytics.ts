import { useState, useCallback } from 'react';
import { advancedAnalyticsService } from '../services/advancedAnalytics.service';

interface AnalyticsTimeRange {
  startDate: string;
  endDate: string;
}

interface PredictiveAnalyticsRequest {
  contentType: string;
  platforms: string[];
  timeHorizon: number;
}

interface AnalyticsExportRequest {
  workspaceId: string;
  timeRange: AnalyticsTimeRange;
  format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON';
  configuration: {
    includeCharts: boolean;
    includePredictions: boolean;
    includeInsights: boolean;
  };
}

interface CustomReportRequest {
  workspaceId: string;
  configuration: {
    title: string;
    description: string;
    timeRange: AnalyticsTimeRange;
    components: any[];
    layout?: any;
  };
}

export const useAdvancedAnalytics = () => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [predictiveAnalytics, setPredictiveAnalytics] = useState<any>(null);
  const [competitiveAnalysis, setCompetitiveAnalysis] = useState<any>(null);
  const [automatedInsights, setAutomatedInsights] = useState<any>(null);
  const [roiTracking, setROITracking] = useState<any>(null);
  const [realTimeAnalytics, setRealTimeAnalytics] = useState<any>(null);
  const [customReports, setCustomReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Generate comprehensive analytics dashboard
  const generateDashboard = useCallback(async (
    userId: string,
    workspaceId: string,
    startDate: string,
    endDate: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await advancedAnalyticsService.generateDashboard(
        userId, workspaceId, startDate, endDate
      );
      setDashboard(response.data);
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate predictive analytics
  const generatePredictiveAnalytics = useCallback(async (
    userId: string,
    workspaceId: string,
    request: PredictiveAnalyticsRequest
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await advancedAnalyticsService.generatePredictiveAnalytics(
        userId, workspaceId, request
      );
      setPredictiveAnalytics(response.data);
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Predict content engagement
  const predictEngagement = useCallback(async (
    contentId: string,
    platforms: string[]
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await advancedAnalyticsService.predictEngagement(
        contentId, platforms
      );
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Predict optimal timing
  const predictOptimalTiming = useCallback(async (
    userId: string,
    workspaceId: string,
    contentType: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await advancedAnalyticsService.predictOptimalTiming(
        userId, workspaceId, contentType
      );
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Predict audience growth
  const predictAudienceGrowth = useCallback(async (
    workspaceId: string,
    timeHorizonDays: number
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await advancedAnalyticsService.predictAudienceGrowth(
        workspaceId, timeHorizonDays
      );
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Predict revenue
  const predictRevenue = useCallback(async (
    workspaceId: string,
    timeHorizonDays: number
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await advancedAnalyticsService.predictRevenue(
        workspaceId, timeHorizonDays
      );
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Build custom report
  const buildCustomReport = useCallback(async (
    userId: string,
    request: CustomReportRequest
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await advancedAnalyticsService.buildCustomReport(
        userId, request
      );
      setCustomReports(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Export analytics data
  const exportAnalytics = useCallback(async (
    userId: string,
    request: AnalyticsExportRequest
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await advancedAnalyticsService.exportAnalytics(
        userId, request
      );
      
      // Create download link
      const blob = new Blob([response.data], {
        type: response.headers['content-type']
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics_export_${Date.now()}.${request.format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get competitive analysis
  const getCompetitiveAnalysis = useCallback(async (
    workspaceId: string,
    startDate: string,
    endDate: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await advancedAnalyticsService.getCompetitiveAnalysis(
        workspaceId, startDate, endDate
      );
      setCompetitiveAnalysis(response.data);
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Perform social listening
  const performSocialListening = useCallback(async (
    workspaceId: string,
    keywords: string[],
    startDate: string,
    endDate: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await advancedAnalyticsService.performSocialListening(
        workspaceId, keywords, startDate, endDate
      );
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate benchmarking report
  const generateBenchmarkingReport = useCallback(async (
    workspaceId: string,
    competitorIds: string[],
    startDate: string,
    endDate: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await advancedAnalyticsService.generateBenchmarkingReport(
        workspaceId, competitorIds, startDate, endDate
      );
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get automated insights
  const getAutomatedInsights = useCallback(async (
    userId: string,
    workspaceId: string,
    startDate: string,
    endDate: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await advancedAnalyticsService.getAutomatedInsights(
        userId, workspaceId, startDate, endDate
      );
      setAutomatedInsights(response.data);
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get optimization recommendations
  const getOptimizationRecommendations = useCallback(async (
    userId: string,
    workspaceId: string,
    startDate: string,
    endDate: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await advancedAnalyticsService.getOptimizationRecommendations(
        userId, workspaceId, startDate, endDate
      );
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Analyze trends
  const analyzeTrends = useCallback(async (
    workspaceId: string,
    startDate: string,
    endDate: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await advancedAnalyticsService.analyzeTrends(
        workspaceId, startDate, endDate
      );
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get real-time insights
  const getRealTimeInsights = useCallback(async (workspaceId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await advancedAnalyticsService.getRealTimeInsights(workspaceId);
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get ROI tracking
  const getROITracking = useCallback(async (
    userId: string,
    workspaceId: string,
    startDate: string,
    endDate: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await advancedAnalyticsService.getROITracking(
        userId, workspaceId, startDate, endDate
      );
      setROITracking(response.data);
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get multi-touch attribution
  const getMultiTouchAttribution = useCallback(async (
    workspaceId: string,
    startDate: string,
    endDate: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await advancedAnalyticsService.getMultiTouchAttribution(
        workspaceId, startDate, endDate
      );
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get customer lifetime value
  const getCustomerLifetimeValue = useCallback(async (
    workspaceId: string,
    startDate: string,
    endDate: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await advancedAnalyticsService.getCustomerLifetimeValue(
        workspaceId, startDate, endDate
      );
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get real-time analytics dashboard
  const getRealTimeAnalyticsDashboard = useCallback(async (workspaceId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await advancedAnalyticsService.getRealTimeAnalyticsDashboard(workspaceId);
      setRealTimeAnalytics(response.data);
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Start real-time streaming
  const startRealTimeStreaming = useCallback(async (
    workspaceId: string,
    sessionId: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await advancedAnalyticsService.startRealTimeStreaming(
        workspaceId, sessionId
      );
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Stop real-time streaming
  const stopRealTimeStreaming = useCallback(async (
    workspaceId: string,
    sessionId: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await advancedAnalyticsService.stopRealTimeStreaming(
        workspaceId, sessionId
      );
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get live metrics
  const getLiveMetrics = useCallback(async (workspaceId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await advancedAnalyticsService.getLiveMetrics(workspaceId);
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get real-time engagement
  const getRealTimeEngagement = useCallback(async (workspaceId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await advancedAnalyticsService.getRealTimeEngagement(workspaceId);
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get active alerts
  const getActiveAlerts = useCallback(async (workspaceId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await advancedAnalyticsService.getActiveAlerts(workspaceId);
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    dashboard,
    predictiveAnalytics,
    competitiveAnalysis,
    automatedInsights,
    roiTracking,
    realTimeAnalytics,
    customReports,
    loading,
    error,

    // Dashboard methods
    generateDashboard,
    exportAnalytics,

    // Predictive analytics methods
    generatePredictiveAnalytics,
    predictEngagement,
    predictOptimalTiming,
    predictAudienceGrowth,
    predictRevenue,

    // Custom reporting methods
    buildCustomReport,

    // Competitive analysis methods
    getCompetitiveAnalysis,
    performSocialListening,
    generateBenchmarkingReport,

    // Automated insights methods
    getAutomatedInsights,
    getOptimizationRecommendations,
    analyzeTrends,
    getRealTimeInsights,

    // ROI tracking methods
    getROITracking,
    getMultiTouchAttribution,
    getCustomerLifetimeValue,

    // Real-time analytics methods
    getRealTimeAnalyticsDashboard,
    startRealTimeStreaming,
    stopRealTimeStreaming,
    getLiveMetrics,
    getRealTimeEngagement,
    getActiveAlerts
  };
};