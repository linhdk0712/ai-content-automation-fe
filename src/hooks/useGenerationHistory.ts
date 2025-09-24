import { useCallback, useState } from 'react';
import { contentService } from '../services/content.service';

// Mock methods until they're implemented in ContentService
const mockContentService = {
  ...contentService,
  getGenerationHistory: async (page: number, size: number) => {
    console.log('Getting generation history:', { page, size });
    return [];
  },
  getMonthlyUsageStats: async () => {
    console.log('Getting monthly usage stats');
    return {
      totalGenerations: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      remainingQuota: 1000,
      averageQualityScore: 0,
      averageResponseTime: 0,
      mostUsedProvider: '',
      mostUsedIndustry: '',
      mostUsedContentType: '',
      successfulGenerations: 0,
      failedGenerations: 0,
      successRate: 0
    };
  },
  deleteGenerationHistory: async (requestId: string) => {
    console.log('Deleting generation history:', requestId);
  },
  exportGenerationHistory: async (format: string) => {
    console.log('Exporting generation history:', format);
    return new Blob([''], { type: 'text/csv' });
  }
};

interface GenerationHistoryEntry {
  requestId: string;
  content: string;
  title: string;
  provider: string;
  industry: string;
  contentType: string;
  cost: number;
  tokensUsed: number;
  qualityScore: number;
  readabilityScore: number;
  responseTimeMs: number;
  generatedAt: string;
  success: boolean;
  errorMessage?: string;
}

interface MonthlyUsageStats {
  totalGenerations: number;
  totalTokensUsed: number;
  totalCost: number;
  remainingQuota: number;
  averageQualityScore: number;
  averageResponseTime: number;
  mostUsedProvider: string;
  mostUsedIndustry: string;
  mostUsedContentType: string;
  successfulGenerations: number;
  failedGenerations: number;
  successRate: number;
}

export const useGenerationHistory = () => {
  const [history, setHistory] = useState<GenerationHistoryEntry[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyUsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async (page: number = 0, size: number = 10) => {
    setIsLoading(true);
    setError(null);

    try {
      const historyData = await mockContentService.getGenerationHistory(page, size);
      
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
      const stats = await mockContentService.getMonthlyUsageStats();
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
          requestId: result.id || '',
          content: result.content || '',
          title: result.title || '',
          provider: result.provider || '',
          industry: originalEntry.industry,
          contentType: originalEntry.contentType,
          cost: result.cost || 0,
          tokensUsed: result.tokensUsed || 0,
          qualityScore: result.qualityScore || 0,
          readabilityScore: result.qualityScore || 0,
          responseTimeMs: result.processingTime || 0,
          generatedAt: result.generatedAt || new Date().toISOString(),
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
      await mockContentService.deleteGenerationHistory(requestId);
      setHistory(prev => prev.filter(entry => entry.requestId !== requestId));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete history entry';
      throw new Error(errorMessage);
    }
  }, []);

  const exportHistory = useCallback(async (format: string = 'csv') => {
    try {
      const blob = await mockContentService.exportGenerationHistory(format);
      
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