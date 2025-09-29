import { AIGenerationRequest } from '@/types/api.types';
import { useCallback, useState } from 'react';
import { contentService } from '../services/content.service';

interface ContentGenerationRequest {
  prompt: string;
  aiProvider?: string;
  contentType: string;
  industry?: string;
  language?: string;
  maxTokens?: number;
  temperature?: number;
  workspaceId?: string;
  optimizationCriteria?: string;
  templateId?: string;
}

interface ContentGenerationResult {
  success: boolean;
  content?: string;
  title?: string;
  provider?: string;
  cost?: number;
  tokensUsed?: number;
  responseTimeMs?: number;
  generatedAt?: string;
  requestId?: string;
  qualityScore?: number;
  readabilityScore?: number;
  seoScore?: number;
  engagementPrediction?: number;
  wordCount?: number;
  suggestedHashtags?: string[];
  keywords?: string[];
  errorMessage?: string;
  errorCode?: string;
}

export const useContentGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<ContentGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateContent = useCallback(async (request: ContentGenerationRequest) => {
    setIsGenerating(true);
    setError(null);
    setGenerationResult(null);

    try {
      const result = await contentService.generateWithAI(request as AIGenerationRequest);
      console.log('AI generation result:', result);
      console.log('Result type:', typeof result);
      console.log('Result content:', result?.content);
      
      setGenerationResult(result as unknown as ContentGenerationResult);
      
      if (!result?.content) {
        console.error('Content generation failed - no content received. Result:', result);
        setError('Content generation failed - no content received');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An unexpected error occurred';
      setError(errorMessage);
      setGenerationResult({
        success: false,
        errorMessage,
        errorCode: err.response?.data?.error?.code || 'UNKNOWN_ERROR'
      });
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResult = useCallback(() => {
    setGenerationResult(null);
  }, []);

  return {
    isGenerating,
    generationResult,
    error,
    generateContent,
    clearError,
    clearResult
  };
};