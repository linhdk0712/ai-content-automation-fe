import { useCallback, useState } from 'react';
import { contentService } from '../services/content.service';

// Generation history interfaces matching API response
interface GenerationHistoryEntry {
  id: number;
  requestId: string;
  generatedContent: string;
  generatedTitle: string;
  aiProvider: string;
  industry: string;
  contentType: string;
  generationCost: number;
  tokensUsed: number;
  qualityScore: number;
  readabilityScore: number;
  responseTimeMs: number;
  createdAt: string;
  success: boolean;
  errorMessage?: string;
  prompt?: string;
  // Additional fields from API
  language?: string;
  tone?: string;
  targetAudience?: string;
  aiModel?: string;
  sentimentScore?: number;
  templateName?: string;
  updatedAt?: string;
  workspaceId?: number;
  workspaceName?: string;
  contentId?: number;
  contentTitle?: string;
  templateId?: number;
}

interface MonthlyUsageStats {
  totalGenerations: number;
  totalTokensUsed: number;
  totalCost: number;
  remainingQuota?: number;
  averageQualityScore: number;
  averageResponseTime: number;
  mostUsedProvider: string;
  mostUsedIndustry?: string;
  mostUsedContentType?: string;
  successfulGenerations: number;
  failedGenerations: number;
  successRate: number;
  usageByProvider?: {
    [key: string]: {
      count: number;
      tokensUsed: number;
      cost: number;
      averageResponseTime: number;
      successRate: number;
      averageQualityScore: number;
    };
  };
  usageByContentType?: any;
  usageByIndustry?: any;
}

// Mock data removed - now using real API



export const useGenerationHistory = () => {
  const [history, setHistory] = useState<GenerationHistoryEntry[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyUsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async (page: number = 0, size: number = 10) => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the real API
      const historyData = await contentService.getGenerationHistory(page, size);

      if (page === 0) {
        setHistory(historyData);
      } else {
        setHistory(prev => [...prev, ...historyData]);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load generation history';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMonthlyStats = useCallback(async () => {
    try {
      // Call the real API
      const stats = await contentService.getMonthlyUsageStats();
      setMonthlyStats(stats);
    } catch (err: any) {
      console.error('Failed to load monthly stats:', err);
    }
  }, []);

  const regenerateContent = useCallback(async (originalRequestId: string) => {
    try {
      // Find the original entry
      const originalEntry = history.find(entry => entry.requestId === originalRequestId);

      if (!originalEntry) {
        throw new Error('Original generation not found');
      }

      // Create regeneration request
      const regenerateRequest = {
        prompt: originalEntry.content, // This would be the original prompt
        aiProvider: originalEntry.provider.split(' ')[0], // Extract provider name
        parameters: {
          industry: originalEntry.industry,
          contentType: originalEntry.contentType
        }
      };

      const result = await contentService.regenerateContent(0, regenerateRequest);

      // Add new entry to history
      if (result.content) {
        const newEntry: GenerationHistoryEntry = {
          id: result.id || 0,
          requestId: result.requestId || '',
          generatedContent: result.content || '',
          generatedTitle: result.title || '',
          aiProvider: result.provider || '',
          industry: originalEntry.industry,
          contentType: originalEntry.contentType,
          generationCost: result.cost || 0,
          tokensUsed: result.tokensUsed || 0,
          qualityScore: result.qualityScore || 0,
          readabilityScore: result.qualityScore || 0,
          responseTimeMs: result.processingTime || 0,
          createdAt: result.generatedAt || new Date().toISOString(),
          success: true
        };

        setHistory(prev => [newEntry, ...prev]);
      }

      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to regenerate content';
      throw new Error(errorMessage);
    }
  }, [history]);

  const deleteHistoryEntry = useCallback(async (requestId: string) => {
    try {
      // Call the real API
      await contentService.deleteGenerationHistory(requestId);
      setHistory(prev => prev.filter(entry => entry.requestId !== requestId));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete history entry';
      throw new Error(errorMessage);
    }
  }, []);

  const exportHistory = useCallback(async (format: string = 'csv') => {
    try {
      // Call the real API
      const blob = await contentService.exportGenerationHistory(format);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `generation-history.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to export history';
      throw new Error(errorMessage);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setMonthlyStats(null);
    setError(null);
  }, []);

  return {
    history,
    monthlyStats,
    isLoading,
    error,
    loadHistory,
    loadMonthlyStats,
    regenerateContent,
    deleteHistoryEntry,
    exportHistory,
    clearHistory
  };
};