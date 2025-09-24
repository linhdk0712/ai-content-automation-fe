import { api } from './api';

const BASE_URL = '/analytics/advanced';

export const advancedAnalyticsService = {
  // Dashboard methods
  generateDashboard: (userId: string, workspaceId: string, startDate: string, endDate: string) =>
    api.get(`${BASE_URL}/dashboard`, {
      params: { userId, workspaceId, startDate, endDate }
    }),

  exportAnalytics: (userId: string, request: any) =>
    api.post(`${BASE_URL}/export`, request, {
      params: { userId },
      responseType: 'blob'
    }),

  // Predictive analytics methods
  generatePredictiveAnalytics: (userId: string, workspaceId: string, request: any) =>
    api.post(`${BASE_URL}/predictive`, request, {
      params: { userId, workspaceId }
    }),

  predictEngagement: (contentId: string, platforms: string[]) =>
    api.post(`${BASE_URL}/predictive/engagement`, platforms, {
      params: { contentId }
    }),

  predictOptimalTiming: (userId: string, workspaceId: string, contentType: string) =>
    api.get(`${BASE_URL}/predictive/timing`, {
      params: { userId, workspaceId, contentType }
    }),

  predictAudienceGrowth: (workspaceId: string, timeHorizonDays: number) =>
    api.get(`${BASE_URL}/predictive/audience-growth`, {
      params: { workspaceId, timeHorizonDays }
    }),

  predictRevenue: (workspaceId: string, timeHorizonDays: number) =>
    api.get(`${BASE_URL}/predictive/revenue`, {
      params: { workspaceId, timeHorizonDays }
    }),

  // Custom reporting methods
  buildCustomReport: (userId: string, request: any) =>
    api.post(`${BASE_URL}/reports/custom`, request, {
      params: { userId }
    }),

  // Competitive analysis methods
  getCompetitiveAnalysis: (workspaceId: string, startDate: string, endDate: string) =>
    api.get(`${BASE_URL}/competitive`, {
      params: { workspaceId, startDate, endDate }
    }),

  performSocialListening: (workspaceId: string, keywords: string[], startDate: string, endDate: string) =>
    api.post(`${BASE_URL}/competitive/social-listening`, keywords, {
      params: { workspaceId, startDate, endDate }
    }),

  generateBenchmarkingReport: (workspaceId: string, competitorIds: string[], startDate: string, endDate: string) =>
    api.post(`${BASE_URL}/competitive/benchmarking`, competitorIds, {
      params: { workspaceId, startDate, endDate }
    }),

  // Automated insights methods
  getAutomatedInsights: (userId: string, workspaceId: string, startDate: string, endDate: string) =>
    api.get(`${BASE_URL}/insights`, {
      params: { userId, workspaceId, startDate, endDate }
    }),

  getOptimizationRecommendations: (userId: string, workspaceId: string, startDate: string, endDate: string) =>
    api.get(`${BASE_URL}/insights/recommendations`, {
      params: { userId, workspaceId, startDate, endDate }
    }),

  analyzeTrends: (workspaceId: string, startDate: string, endDate: string) =>
    api.get(`${BASE_URL}/insights/trends`, {
      params: { workspaceId, startDate, endDate }
    }),

  getRealTimeInsights: (workspaceId: string) =>
    api.get(`${BASE_URL}/insights/realtime`, {
      params: { workspaceId }
    }),

  // ROI tracking methods
  getROITracking: (userId: string, workspaceId: string, startDate: string, endDate: string) =>
    api.get(`${BASE_URL}/roi`, {
      params: { userId, workspaceId, startDate, endDate }
    }),

  getMultiTouchAttribution: (workspaceId: string, startDate: string, endDate: string) =>
    api.get(`${BASE_URL}/roi/attribution`, {
      params: { workspaceId, startDate, endDate }
    }),

  getCustomerLifetimeValue: (workspaceId: string, startDate: string, endDate: string) =>
    api.get(`${BASE_URL}/roi/clv`, {
      params: { workspaceId, startDate, endDate }
    }),

  // Real-time analytics methods
  getRealTimeAnalyticsDashboard: (workspaceId: string) =>
    api.get(`${BASE_URL}/realtime/dashboard`, {
      params: { workspaceId }
    }),

  startRealTimeStreaming: (workspaceId: string, sessionId: string) =>
    api.post(`${BASE_URL}/realtime/start`, null, {
      params: { workspaceId, sessionId }
    }),

  stopRealTimeStreaming: (workspaceId: string, sessionId: string) =>
    api.post(`${BASE_URL}/realtime/stop`, null, {
      params: { workspaceId, sessionId }
    }),

  getLiveMetrics: (workspaceId: string) =>
    api.get(`${BASE_URL}/realtime/metrics`, {
      params: { workspaceId }
    }),

  getRealTimeEngagement: (workspaceId: string) =>
    api.get(`${BASE_URL}/realtime/engagement`, {
      params: { workspaceId }
    }),

  getActiveAlerts: (workspaceId: string) =>
    api.get(`${BASE_URL}/realtime/alerts`, {
      params: { workspaceId }
    })
};