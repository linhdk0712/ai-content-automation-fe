import { useCallback, useState } from 'react';
import { contentService } from '../services/content.service';

interface ContentPreviewData {
  wordCount: number;
  characterCount: number;
  readabilityScore: number;
  seoScore: number;
  engagementPrediction: number;
  suggestedHashtags: string[];
  keywords: string[];
  estimatedReadingTime: number;
}

export const useContentPreview = () => {
  const [previewData, setPreviewData] = useState<ContentPreviewData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeContent = useCallback(async (content: string) => {
    if (!content || content.trim().length === 0) {
      setPreviewData(null);
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const analysis = await contentService.analyzeText(content);
      setPreviewData(analysis as unknown as ContentPreviewData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to analyze content';
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const exportContent = useCallback(async (content: string, format: string, title?: string) => {
    try {
      const blob = await contentService.exportContent(content as unknown as number, format as 'html' | 'pdf' | 'docx' | 'markdown');
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title || 'content'}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to export content';
      throw new Error(errorMessage);
    }
  }, []);

  const shareContent = useCallback(async (content: string, title?: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: title || 'Generated Content',
          text: content
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(content);
        // Show success message
      }
    } catch (err: any) {
      console.error('Failed to share content:', err);
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(content);
      } catch (clipboardErr) {
        throw new Error('Failed to share or copy content');
      }
    }
  }, []);

  const clearPreviewData = useCallback(() => {
    setPreviewData(null);
    setError(null);
  }, []);

  return {
    previewData,
    isAnalyzing,
    error,
    analyzeContent,
    exportContent,
    shareContent,
    clearPreviewData
  };
};