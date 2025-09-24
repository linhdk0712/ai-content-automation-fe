import api from './api';

interface ProviderRecommendationRequest {
  optimizationCriteria: string;
  contentType?: string;
  industry?: string;
  language?: string;
}

interface CostEstimateRequest {
  prompt: string;
  maxTokens?: number;
  contentType?: string;
  provider?: string;
}

class AIProviderService {
  async getAllProviders() {
    const response = await api.get('/ai/providers');
    return response.data;
  }

  async getAllProviderStatuses() {
    const response = await api.get('/ai/providers/status');
    return response.data;
  }

  async checkProviderStatus(providerName: string) {
    const response = await api.get(`/ai/providers/${providerName}/status`);
    return response.data;
  }

  async getProviderRecommendations(request: ProviderRecommendationRequest) {
    const response = await api.post('/ai/providers/recommendations', request);
    return response.data;
  }

  async estimateCost(request: CostEstimateRequest) {
    const response = await api.post('/ai/providers/estimate-cost', request);
    return response.data;
  }

  async getProviderMetrics(providerName: string, days: number = 30) {
    const response = await api.get(`/ai/providers/${providerName}/metrics`, {
      params: { days }
    });
    return response.data;
  }

  async getProviderUsageStats(days: number = 30) {
    const response = await api.get('/ai/providers/usage-stats', {
      params: { days }
    });
    return response.data;
  }

  async getProviderComparison(providers: string[], criteria: string) {
    const response = await api.post('/ai/providers/compare', {
      providers,
      criteria
    });
    return response.data;
  }

  // Provider configuration (admin only)
  async updateProviderConfig(providerName: string, config: any) {
    const response = await api.put(`/ai/providers/${providerName}/config`, config);
    return response.data;
  }

  async enableProvider(providerName: string) {
    const response = await api.post(`/ai/providers/${providerName}/enable`);
    return response.data;
  }

  async disableProvider(providerName: string) {
    const response = await api.post(`/ai/providers/${providerName}/disable`);
    return response.data;
  }

  // Rate limiting info
  async getRateLimitInfo(providerName: string) {
    const response = await api.get(`/ai/providers/${providerName}/rate-limit`);
    return response.data;
  }

  // Provider health monitoring
  async getProviderHealthHistory(providerName: string, hours: number = 24) {
    const response = await api.get(`/ai/providers/${providerName}/health-history`, {
      params: { hours }
    });
    return response.data;
  }
}

export const aiProviderService = new AIProviderService();