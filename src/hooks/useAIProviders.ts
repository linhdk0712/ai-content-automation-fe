import { useCallback, useState } from 'react';
import { aiProviderService } from '../services/aiProvider.service';

interface AIProvider {
  name: string;
  qualityScore: number;
  costPer1KTokens: number;
  averageResponseTime: number;
  supportsContentTypes: string[];
}

interface ProviderStatus {
  provider: string;
  available: boolean;
  status: string;
  lastChecked: string;
  responseTimeMs?: number;
  errorMessage?: string;
  healthScore?: number;
  currentLoad?: number;
  rateLimitRemaining?: number;
  rateLimitResetTime?: string;
}

interface ProviderRecommendation {
  providerName: string;
  score: number;
  qualityScore: number;
  costPer1KTokens: number;
  averageResponseTime: number;
  reason: string;
}

export const useAIProviders = () => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [providerStatuses, setProviderStatuses] = useState<Record<string, ProviderStatus>>({});
  const [recommendations, setRecommendations] = useState<ProviderRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProviders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [providersData, statusesData] = await Promise.all([
        aiProviderService.getAllProviders(),
        aiProviderService.getAllProviderStatuses()
      ]);

      setProviders(providersData);
      setProviderStatuses(statusesData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load AI providers';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getProviderRecommendations = useCallback(async (optimizationCriteria: string) => {
    try {
      const recommendationsData = await aiProviderService.getProviderRecommendations({
        optimizationCriteria,
        contentType: 'TEXT' // Default content type
      });
      // Ensure we always store an array to avoid runtime errors when rendering
      const safeRecommendations = Array.isArray(recommendationsData)
        ? recommendationsData
        : (recommendationsData?.items ?? recommendationsData?.data ?? []);
      setRecommendations(Array.isArray(safeRecommendations) ? safeRecommendations : []);
    } catch (err: any) {
      console.error('Failed to get provider recommendations:', err);
      // Don't set error for recommendations as it's not critical
    }
  }, []);

  const checkProviderStatus = useCallback(async (providerName: string) => {
    try {
      const status = await aiProviderService.checkProviderStatus(providerName);
      setProviderStatuses(prev => ({
        ...prev,
        [providerName]: status
      }));
      return status;
    } catch (err: any) {
      console.error(`Failed to check status for ${providerName}:`, err);
      return null;
    }
  }, []);

  const estimateCost = useCallback(async (request: {
    prompt: string;
    maxTokens?: number;
    contentType?: string;
    provider?: string;
  }) => {
    try {
      return await aiProviderService.estimateCost(request);
    } catch (err: any) {
      console.error('Failed to estimate cost:', err);
      return null;
    }
  }, []);

  return {
    providers,
    providerStatuses,
    recommendations,
    isLoading,
    error,
    loadProviders,
    getProviderRecommendations,
    checkProviderStatus,
    estimateCost
  };
};